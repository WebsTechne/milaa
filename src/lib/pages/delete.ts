import { supabase } from "../supabase"

function getStoragePath(url: string) {
  const marker = "/storage/v1/object/public/pages/"
  const index = url.indexOf(marker)

  if (index === -1) {
    throw new Error(`Invalid Supabase URL: ${url}`)
  }

  return url.slice(index + marker.length)
}

async function deleteSupabasePages(raw: string[], collectionId: string) {
  const filePaths = raw.map(getStoragePath)

  const { error } = await supabase.storage.from("pages").remove(filePaths)

  if (error) {
    console.error("Page delete failed:", { raw, collectionId, error })
    throw error
  }
  return { data: `${raw.length} pages deleted successfully` }
}

export { deleteSupabasePages }
