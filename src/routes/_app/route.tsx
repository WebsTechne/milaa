import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { Spinner } from "#/components/ui/spinner"
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar"
import { AppHeader } from "#/components/sections/app-header"
import { AppSidebar } from "#/components/sections/app-sidebar"

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  pendingComponent: () => (
    <div className="flex-center h-dvh">
      <Spinner className="size-6" />
    </div>
  ),
  pendingMs: 300, // only show pending if it takes more than 300ms
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
      <AppSidebar />
      <SidebarInset className="">
        <AppHeader />
        <main className="[&>section]:px-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
