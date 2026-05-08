'use server'

const RESOLUTIONS = ['1080p', '2K', '4K'] as const
type Resolution = (typeof RESOLUTIONS)[number]

export type UpscaleResult =
  | { ok: true; received: { name: string; type: string; size: number; resolution: Resolution } }
  | { ok: false; error: string }

export async function upscaleAction(formData: FormData): Promise<UpscaleResult> {
  const file = formData.get('file')
  const resolution = formData.get('resolution')

  if (!(file instanceof File)) {
    return { ok: false, error: 'Missing file.' }
  }
  if (typeof resolution !== 'string' || !RESOLUTIONS.includes(resolution as Resolution)) {
    return { ok: false, error: 'Invalid resolution.' }
  }

  console.log('[Upscale] submit', {
    name: file.name,
    type: file.type,
    size: file.size,
    resolution,
  })

  return {
    ok: true,
    received: {
      name: file.name,
      type: file.type,
      size: file.size,
      resolution: resolution as Resolution,
    },
  }
}
