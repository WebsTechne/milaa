import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { Spinner } from "#/components/ui/spinner"
import { Sidebar, SidebarInset, SidebarProvider } from "#/components/ui/sidebar"
import { Header } from "#/components/sections/header"

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  pendingComponent: () => (
    <div className="flex-center h-dvh">
      <Spinner className="size-6" />
    </div>
  ),
  // pendingMs: 300, // only show pending if it takes more than 300ms
  beforeLoad: async ({ context, location }) => {
    if (!context.session)
      throw redirect({
        to: "/auth/sign-in",
        search: { redirect: location.href },
      })
  },
})

function AppLayout() {
  return (
    <SidebarProvider>
      <Sidebar variant="inset" />
      <SidebarInset className="">
        <Header />
        <main className="py-4 [&>section]:px-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
