import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { z } from "zod"

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: async ({ context, search }) => {
    const session = context.session
    if (session) throw redirect({ to: search.redirect || "/" })
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="px-4 pb-4">
      <Outlet />
    </main>
  )
}
