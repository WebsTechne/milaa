import type { JSX } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import type { ServerSession } from "#/lib/types"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { authClient } from "#/lib/auth-client"
import { toast } from "sonner"
import { ThemeToggle } from "../theme-toggle"
import { Skeleton } from "../ui/skeleton"
import { IconLogout, IconUser } from "@tabler/icons-react"
import getInitials from "#/lib/name"
import { SidebarTrigger } from "../ui/sidebar"
import { Separator } from "../ui/separator"
import { useHeaderStore } from "#/lib/header-store"

function AvatarBtn({
  session,
  authPending,
}: {
  session: ServerSession
  authPending: boolean
}) {
  const navigate = useNavigate()
  const routerState = useRouterState()

  if (authPending) return <Skeleton className="size-8 rounded-full"></Skeleton>

  if (!session)
    return (
      <Button
        size="sm"
        nativeButton={false}
        render={
          <Link
            to="/auth/sign-in"
            search={{ redirect: routerState.location.href }}
          />
        }
      >
        Sign in
      </Button>
    )

  const handleSignout = async () => {
    try {
      const res = await authClient.signOut()
      if (res.error) {
        toast.error("Failed to sign out")
        // throw new Error(res.error.message)
      }
      navigate({
        to: "/auth/sign-in",
        search: { redirect: routerState.location.href },
      })
    } catch (err) {
      toast.error("Failed to sign out")
    }
  }

  const { name, image } = session.user
  const { initials } = getInitials(name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={false}
        render={<Avatar className="cursor-pointer" />}
      >
        <AvatarFallback>{initials}</AvatarFallback>
        {image && <AvatarImage src={image} alt={name} />}
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={10} className="min-w-37.5">
        <DropdownMenuItem
          nativeButton={false}
          render={<Link to="/profile" className="cursor-pointer" />}
        >
          <IconUser strokeWidth={2} />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={handleSignout}
        >
          <IconLogout strokeWidth={2} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppHeader(): JSX.Element {
  const { data: session, isPending: authPending } = authClient.useSession()
	const { titleSlot } = useHeaderStore()
  console.log(titleSlot)

  return (
    <header className="flex-between bg-background sticky top-0 z-1000 h-12 shrink-0 rounded-t-xl border-b px-4 py-2">
      {/* <span className="font-logo text-primary text-2xl font-extrabold lg:text-3xl">
        mìlà
      </span> */}
      <div className="flex h-full items-center">
        <SidebarTrigger size="icon" className="-ml-1 [&>svg]:size-5!" />
        <Separator orientation="vertical" className="mx-2 my-auto h-8/10" />
        <span>{titleSlot}</span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle className="[&>svg]:size-6" />
        <AvatarBtn session={session} authPending={authPending} />
      </div>
    </header>
  )
}
