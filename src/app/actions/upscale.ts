'use server'

import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { imageSize } from 'image-size'
import { createClient } from '@/util/supabase/server'
import { createServiceClient } from '@/util/supabase/service'
import { getUserCreditBalance } from '@/util/credits'
import { getProvider } from '@/lib/upscale/providers'
import { RESOLUTIONS, resolveRunpodImageJob, type Resolution } from '@/lib/upscale/pricing'

const ALLOWED_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

export type UpscaleResult =
  | { ok: true; jobId: string }
  | { ok: false; error: UpscaleError }

export type UpscaleError =
  | 'unauthorized'
  | 'missing_file'
  | 'invalid_resolution'
  | 'unsupported_mime'
  | 'cannot_read_image'
  | 'source_already_exceeds_target'
  | 'no_credits'
  | 'webhook_base_url_missing'
  | 'storage_upload_failed'
  | 'provider_submit_failed'
  | 'unknown_error'

export async function upscaleAction(formData: FormData): Promise<UpscaleResult> {
  const file = formData.get('file')
  const resolution = formData.get('resolution')

  if (!(file instanceof File)) return { ok: false, error: 'missing_file' }
  if (typeof resolution !== 'string' || !RESOLUTIONS.includes(resolution as Resolution)) {
    return { ok: false, error: 'invalid_resolution' }
  }
  if (!ALLOWED_IMAGE_MIMES.has(file.type)) {
    return { ok: false, error: 'unsupported_mime' }
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const buf = Buffer.from(await file.arrayBuffer())

  let dims: { width?: number; height?: number }
  try {
    dims = imageSize(buf)
  } catch {
    return { ok: false, error: 'cannot_read_image' }
  }
  if (!dims.width || !dims.height) {
    return { ok: false, error: 'cannot_read_image' }
  }

  const resolved = resolveRunpodImageJob(dims.width, dims.height, resolution as Resolution)
  if (!resolved.ok) return { ok: false, error: resolved.error }

  const balance = await getUserCreditBalance(supabase, user.id)
  if (balance < resolved.costCredits) return { ok: false, error: 'no_credits' }

  const webhookBase = process.env.WEBHOOK_BASE_URL
  if (!webhookBase) return { ok: false, error: 'webhook_base_url_missing' }

  const jobId = crypto.randomUUID()
  const webhookToken = crypto.randomBytes(32).toString('hex')
  const ext = MIME_TO_EXT[file.type] ?? 'png'
  const inputPath = `${user.id}/images/inputs/${jobId}.${ext}`

  const service = createServiceClient()

  const upload = await service.storage
    .from('user-media')
    .upload(inputPath, buf, { contentType: file.type, upsert: false })
  if (upload.error) {
    return { ok: false, error: 'storage_upload_failed' }
  }

  const reserveErr = await service.rpc('reserve_upscale_credits', {
    p_user_id: user.id,
    p_job_id: jobId,
    p_amount: resolved.costCredits,
    p_provider: 'runpod',
    p_kind: 'image',
    p_resolution: resolution,
    p_scale: resolved.scale,
    p_model: resolved.model,
    p_input_path: inputPath,
    p_input_mime: file.type,
    p_webhook_token: webhookToken,
  })
  if (reserveErr.error) {
    await service.storage.from('user-media').remove([inputPath])
    if (reserveErr.error.message.includes('insufficient_credits')) {
      return { ok: false, error: 'no_credits' }
    }
    return { ok: false, error: 'unknown_error' }
  }

  const webhookUrl = `${webhookBase.replace(/\/$/, '')}/functions/v1/runpod-webhook?job_id=${jobId}&token=${webhookToken}`

  try {
    const provider = getProvider('runpod')
    const { providerJobId } = await provider.submit({
      jobId,
      kind: 'image',
      inputBytes: buf,
      inputMime: file.type,
      scale: resolved.scale,
      model: resolved.model,
      webhookUrl,
    })
    await service.rpc('mark_upscale_job_processing', {
      p_job_id: jobId,
      p_provider_job_id: providerJobId,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'submit_failed'
    console.error('[upscale] provider submit failed', { jobId, detail })
    await service.rpc('refund_upscale_credits', {
      p_job_id: jobId,
      p_error: detail.slice(0, 500),
    })
    return { ok: false, error: 'provider_submit_failed' }
  }

  return { ok: true, jobId }
}
