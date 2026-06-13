import { Link, useRouterState } from "@tanstack/react-router"

export function NoSession({ className }: { className?: string }) {
  const routerState = useRouterState()

  return (
    <div className="flex-center h-[calc(100dvh-48px)] px-5">
      <div>
        <h1 className="font-heading mb-2 text-4xl font-bold">
          You aren&apos;t signed in :(
        </h1>
        <p className="text-muted-foreground max-w-prose text-base md:text-lg">
          This page is only available to signed-in users. Sign in to continue.
          Sign in at the{" "}
          <Link
            to="/auth/sign-in"
            search={{ redirect: routerState.location.href }}
            className="text-foreground! whitespace-nowrap underline underline-offset-4"
          >
            Sign in
          </Link>{" "}
          page
        </p>
      </div>
    </div>
  )
}
