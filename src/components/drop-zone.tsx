import { cn } from "#/lib/utils"
import { useId, useMemo, useState } from "react"
import { ScrollArea, ScrollBar } from "./ui/scroll-area"
import { Button } from "./ui/button"
import { toast } from "sonner"
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react"
import type { SubmissionFormat } from "#/generated/prisma/enums"

const acceptMap: Record<SubmissionFormat, string> = {
  IMAGE: "image/*",
  PDF: "application/pdf",
  DOCUMENT: [
    ".doc,.docx", // Word
    ".pdf", // PDF (if not already in PDF format)
    ".txt", // Plain text
    ".zip,.rar", // Archives (source code bundles)
    ".html,.css,.js,.ts", // Web files
    ".java,.py,.c,.cpp,.cs", // Common languages
    ".ipynb", // Jupyter notebooks
  ].join(","),
}

function DropZone({
  onFiles,
  onClear,
  preview,
  multiple = false,
  startIndex = 0,
  format,
}: {
  onFiles: (files: File[]) => void
  onClear?: () => void
  preview?: File
  multiple?: boolean
  startIndex?: number
  format: SubmissionFormat[]
}) {
  const inputId = useId()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const HARD_LIMIT_MB = 20
  const HARD_LIMIT_BYTES = HARD_LIMIT_MB * 1024 * 1024

  const accept = format.map((f) => acceptMap[f]).join(",")
  const imagesAllowed = format.includes("IMAGE")
  const nonImageAllowed = format.some((f) => f !== "IMAGE")

  const previewUrl = useMemo(
    () => (preview ? URL.createObjectURL(preview) : null),
    [preview],
  )

  const fileUrls = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files],
  )

  const addFiles = (incoming: File[]) => {
    const wayTooLarge = incoming.filter((f) => f.size > HARD_LIMIT_BYTES)
    const validFiles = incoming.filter((f) => f.size <= HARD_LIMIT_BYTES)

    if (wayTooLarge.length > 0)
      toast.warning(
        `${wayTooLarge.length} file${wayTooLarge.length > 1 ? "s" : ""} skipped — max size is ${HARD_LIMIT_MB}MB per file`,
      )

    if (validFiles.length === 0) return

    const updated = multiple ? [...files, ...validFiles] : validFiles
    setFiles(updated)
    onFiles(updated)
  }

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onFiles(updated)
  }

  return (
    <section className="flex w-full flex-col gap-2">
      {/* Single preview */}
      {!multiple && previewUrl && (
        <div className="relative size-max">
          <img
            src={previewUrl}
            alt="preview"
            className="h-40 rounded-md object-contain"
            draggable={false}
            onClick={() => setLightboxIndex(0)}
          />
          <span
            onClick={(e) => {
              e.stopPropagation()
              onClear?.()
            }}
            className="flex-center bg-background hover:text-foreground text-muted-foreground absolute top-1 right-1 size-5 cursor-pointer rounded-full border"
          >
            <IconX size={16} />
          </span>
        </div>
      )}

      {/* Multiple preview grid */}
      {multiple && files.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex cursor-pointer gap-4">
            {files.map((file, i) => (
              <div
                key={fileUrls[i]}
                className="relative h-40 w-max shrink-0"
                onClick={() => setLightboxIndex(i)}
              >
                {file.type.startsWith("image/") ? (
                  <img
                    src={fileUrls[i]}
                    alt={`file ${i + 1}`}
                    className="h-full w-auto rounded-lg object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="bg-muted flex h-full max-w-40 min-w-32 flex-col items-center justify-center gap-1 rounded-lg border p-2">
                    <span className="text-muted-foreground w-full truncate text-center text-xs">
                      {file.name}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(i)
                  }}
                  className="flex-center absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white"
                >
                  <IconX size={12} />
                </button>
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-xs text-white">
                  {startIndex + i + 1}
                </span>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null &&
        files[lightboxIndex]?.type.startsWith("image/") && (
          <div
            className="fixed top-1/2 left-1/2 z-9999 flex h-dvh w-dvw -translate-1/2 items-center justify-center bg-black/80"
            onClick={() => setLightboxIndex(null)}
          >
            <img
              src={multiple ? fileUrls[lightboxIndex] : previewUrl!}
              alt={`page ${lightboxIndex + 1}`}
              className="max-h-[90dvh] max-w-[90dvw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
            {/* prev/next */}
            {multiple && (
              <Button
                variant="secondary"
                size="icon"
                className="fixed top-1/2 left-1 -translate-y-1/2 disabled:pointer-events-auto! md:left-4"
                disabled={!(lightboxIndex > 0)}
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(lightboxIndex - 1)
                }}
              >
                <IconChevronLeft className="size-5!" strokeWidth={2} />
              </Button>
            )}
            {multiple && (
              <Button
                variant="secondary"
                size="icon"
                className="fixed top-1/2 right-1 -translate-y-1/2 disabled:pointer-events-auto! md:right-4"
                disabled={!(lightboxIndex < files.length - 1)}
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(lightboxIndex + 1)
                }}
              >
                <IconChevronRight className="size-5!" strokeWidth={2} />
              </Button>
            )}
            <span className="fixed bottom-4 text-sm text-white">
              {lightboxIndex + 1} / {files.length}
            </span>
          </div>
        )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          addFiles(Array.from(e.dataTransfer.files))
        }}
        onClick={() => document.getElementById(inputId)?.click()}
        className={cn(
          "flex-center h-37.5 cursor-pointer rounded-xl border-2 border-dashed p-8 transition-colors",
          dragging
            ? "border-blue-500 bg-blue-500/10 text-blue-500"
            : "border-muted",
        )}
      >
        <p className="w-max text-center">
          {multiple
            ? files.length > 0
              ? `${files.length} file${files.length > 1 ? "s" : ""} selected — drop more or click to add`
              : `Drop ${imagesAllowed ? "images or files" : "files"} here or click to browse`
            : `Drop ${imagesAllowed ? "an image or file" : "a file"} here or click to browse`}
        </p>
        <input
          id={inputId}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
        />
      </div>
    </section>
  )
}

export { DropZone }
