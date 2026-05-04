'use client'

import { useEffect, useRef, useState, useTransition, type ChangeEvent, type DragEvent } from 'react'
import { Film, ImageIcon, Upload, X } from 'lucide-react'
import { upscaleAction } from '@/app/actions/upscale'

const RESOLUTIONS = ['1080p', '2K', '4K'] as const
const MAX_BYTES = 100 * 1024 * 1024
const ACCEPT = 'image/*,video/*'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadPlaceholder() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resolutionIdx, setResolutionIdx] = useState(2)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

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
  }

  const onUpscale = () => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('resolution', RESOLUTIONS[resolutionIdx])
    startTransition(async () => {
      const result = await upscaleAction(fd)
      if (!result.ok) {
        setError(result.error)
      }
    })
  }

  const isVideo = file?.type.startsWith('video/')
  const resolution = RESOLUTIONS[resolutionIdx]

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
              disabled={!file}
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
              disabled={!file || isPending}
              className="btn btn-primary"
            >
              {isPending ? 'Upscaling…' : 'Upscale'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
