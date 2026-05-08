'use client'

import { useEffect, useRef, useState, useTransition, type ChangeEvent, type DragEvent } from 'react'
import { Film, ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { upscaleAction, type UpscaleError } from '@/app/actions/upscale'
import { getUpscaleJob, type UpscaleJobStatus } from '@/app/actions/getUpscaleJob'

const RESOLUTIONS = ['1080p', '2K', '4K'] as const
const MAX_BYTES = 100 * 1024 * 1024
const ACCEPT = 'image/*,video/*'
const POLL_MS = 2000

const ERROR_MESSAGES: Record<UpscaleError, string> = {
  unauthorized: 'You must be signed in.',
  missing_file: 'Pick a file first.',
  invalid_resolution: 'Pick a target resolution.',
  unsupported_mime: 'Only PNG, JPEG, or WebP images are supported.',
  cannot_read_image: 'Could not read this image.',
  source_already_exceeds_target: 'Source image is already at or above the target resolution.',
  no_credits: 'Not enough credits. Top up to keep upscaling.',
  webhook_base_url_missing: 'Server is missing WEBHOOK_BASE_URL.',
  storage_upload_failed: 'Upload to storage failed.',
  provider_submit_failed: 'Could not reach the upscaler service.',
  unknown_error: 'Something went wrong.',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type JobState = {
  id: string
  status: UpscaleJobStatus
  outputUrl: string | null
  error: string | null
}

export function UploadPlaceholder() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resolutionIdx, setResolutionIdx] = useState(2)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<JobState | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed' || job.status === 'refunded') {
      return
    }
    let cancelled = false
    const tick = async () => {
      const result = await getUpscaleJob(job.id)
      if (cancelled) return
      if (!result.ok) {
        setJob((prev) => (prev ? { ...prev, status: 'failed', error: 'Lost track of job.' } : prev))
        return
      }
      setJob({
        id: result.job.id,
        status: result.job.status,
        outputUrl: result.outputUrl,
        error: result.job.error,
      })
    }
    const interval = setInterval(tick, POLL_MS)
    void tick()
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [job])

  const acceptFile = (next: File) => {
    const isImage = next.type.startsWith('image/')
    const isVideo = next.type.startsWith('video/')
    if (!isImage && !isVideo) {
      setError('Only image or video files are supported.')
      return
    }
    if (next.size > MAX_BYTES) {
      setError(`File too large. Max ${formatBytes(MAX_BYTES)}.`)
      return
    }
    setError(null)
    setJob(null)
    setFile(next)
    setPreviewUrl(URL.createObjectURL(next))
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    const next = e.dataTransfer.files?.[0]
    if (next) acceptFile(next)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0]
    if (next) acceptFile(next)
    e.target.value = ''
  }

  const clear = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setFile(null)
    setPreviewUrl(null)
    setError(null)
    setJob(null)
  }

  const onUpscale = () => {
    if (!file) return
    setError(null)
    setJob(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('resolution', RESOLUTIONS[resolutionIdx])
    startTransition(async () => {
      const result = await upscaleAction(fd)
      if (!result.ok) {
        setError(ERROR_MESSAGES[result.error] ?? 'Something went wrong.')
        return
      }
      setJob({ id: result.jobId, status: 'queued', outputUrl: null, error: null })
    })
  }

  const isVideo = file?.type.startsWith('video/')
  const resolution = RESOLUTIONS[resolutionIdx]
  const polling = !!job && job.status !== 'completed' && job.status !== 'failed' && job.status !== 'refunded'
  const buttonDisabled = !file || isPending || polling
  let buttonLabel = 'Upscale'
  if (isPending) buttonLabel = 'Submitting…'
  else if (polling) buttonLabel = job?.status === 'queued' ? 'Queued…' : 'Processing…'

  return (
    <section className="flex items-center justify-center min-h-screen w-full px-6">
      <div className="card card-border bg-base-200 w-full max-w-2xl">
        <div className="card-body gap-6">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setDragActive(false)
            }}
            onDrop={onDrop}
            className={`relative flex flex-col items-center justify-center h-72 rounded-[var(--radius-box)] border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
              dragActive
                ? 'border-primary bg-primary/10'
                : 'border-base-300 bg-base-100/40 hover:border-primary'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={onChange}
            />

            {file && previewUrl ? (
              <>
                {isVideo ? (
                  <video
                    src={previewUrl}
                    controls
                    muted
                    className="max-h-full max-w-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
                <button
                  type="button"
                  aria-label="Remove file"
                  onClick={clear}
                  className="btn btn-circle btn-sm absolute top-2 right-2"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs bg-base-100/70 backdrop-blur px-2 py-1 rounded-md">
                  {isVideo ? <Film size={14} /> : <ImageIcon size={14} />}
                  <span className="truncate max-w-[20rem]">{file.name}</span>
                  <span className="opacity-60">{formatBytes(file.size)}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <Upload size={32} className="opacity-70" />
                <p className="font-medium">Drop image or video here</p>
                <p className="text-sm opacity-60">
                  or click to browse — up to {formatBytes(MAX_BYTES)}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm opacity-70 shrink-0">Output resolution</span>
            <input
              type="range"
              min={0}
              max={RESOLUTIONS.length - 1}
              step={1}
              value={resolutionIdx}
              onChange={(e) => setResolutionIdx(Number(e.target.value))}
              disabled={!file || polling}
              className="range range-primary range-sm flex-1"
            />
            <span className="text-sm font-mono font-semibold w-12 text-right">
              {resolution}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-error text-sm break-words">{error}</p>
            <button
              type="button"
              onClick={onUpscale}
              disabled={buttonDisabled}
              className="btn btn-primary"
            >
              {polling ? <Loader2 size={16} className="animate-spin" /> : null}
              {buttonLabel}
            </button>
          </div>

          {job && job.status === 'completed' && job.outputUrl ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm opacity-70">Upscaled result</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={job.outputUrl}
                alt="Upscaled output"
                className="rounded-[var(--radius-box)] max-w-full"
              />
              <a
                href={job.outputUrl}
                download
                className="btn btn-outline btn-sm self-start"
              >
                Download
              </a>
            </div>
          ) : null}

          {job && (job.status === 'failed' || job.status === 'refunded') ? (
            <p className="text-error text-sm">
              Upscale failed{job.error ? `: ${job.error}` : ''}. Credits were refunded.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
