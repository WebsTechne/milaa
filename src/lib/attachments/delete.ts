import { supabase } from "../supabase"
import type { Attachment, AttachmentBucket } from "./upload"

function getStoragePath(url: string, bucket: AttachmentBucket) {
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = url.indexOf(marker)

  if (index === -1) {
    throw new Error(`Invalid Supabase URL: ${url}`)
  }

  return url.slice(index + marker.length)
}

async function deleteSupabaseAttachments(
  raw: string[],
  type: Attachment,
  assignmentOrSubmissionId: string,
) {
  const bucket =
    type === "assignment" ? "assignment-attachments" : "submission-attachments"

  const filePaths = raw.map((r) => getStoragePath(r, bucket))

  const { error } = await supabase.storage.from(bucket).remove(filePaths)

  if (error) {
    console.error("Attachment delete failed:", { raw, assignmentOrSubmissionId, error })
    throw error
  }
  return { data: `${raw.length} attachments deleted successfully` }
}

export { deleteSupabaseAttachments }
