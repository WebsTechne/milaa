import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/$")({
  component: AppNotFound,
})

function AppNotFound() {
  return (
    <section>
      <div className="flex-center min-h-25 flex-col gap-1 rounded-xl border border-dashed text-lg">
        Page not found
      </div>
    </section>
  )
}
