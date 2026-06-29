import { useHeaderStore } from "#/lib/store"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/_app/")({ component: App })

function App() {
  const setTitleSlot = useHeaderStore((s) => s.setTitleSlot)

  useEffect(() => {
    setTitleSlot("Overview")
    // cleanup
    return () => {
      setTitleSlot(null)
    }
  }, [setTitleSlot])

  return <section>Overview Page...</section>
}
