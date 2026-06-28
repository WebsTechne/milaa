import { authClient } from "#/lib/auth-client"
import {
  createFileRoute,
  useParams,
  useRouter,
  useRouterState,
} from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getAssignmentById } from "#/server/assignments"
import { Spinner } from "#/components/ui/spinner"
import { useEffect } from "react"
import { useHeaderStore } from "#/lib/header-store"
import { Link } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/assignments/$assignmentId")({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const routerState = useRouterState()

  const { data: session, isPending: authPending } = authClient.useSession()

  const { assignmentId } = useParams({
    from: "/_app/assignments/$assignmentId",
  })

  const setTitleSlot = useHeaderStore((s) => s.setTitleSlot)

  const { data: assignment, isPending } = useQuery({
    queryKey: ["assignments", assignmentId],
    queryFn: () => getAssignmentById({ data: { assignmentId } }),
    enabled: !!session && !authPending,

    staleTime: Infinity,
  })

  if (authPending || (!!session && isPending))
    return (
      <div className="flex-center h-[calc(100dvh-16px-48px)]">
        <Spinner className="size-7" />
      </div>
    )

  if (!session) {
    setTitleSlot("Sign in required")

    return (
      <div className="flex-center h-[calc(100dvh-48px-56px)] px-5">
        <div>
          <h1 className="font-heading mb-2 text-4xl font-bold">
            Sign in required
          </h1>
          <p className="text-muted-foreground max-w-prose text-base md:text-lg">
            Sign in to continue. Once you're signed in, you'll be able to access
            this page and everything it contains. Sign in at the{" "}
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

  if (!assignment) {
    setTitleSlot("Assignment not found")

    return (
      <div className="flex-center h-[calc(100dvh-48px-56px)] px-5">
        <div>
          <h1 className="font-heading mb-2 text-4xl font-bold">
            Assignment not found
          </h1>
          <p className="text-muted-foreground max-w-prose text-base md:text-lg">
            We couldn't find the assignment you're looking for. It may have been
            deleted, or the link or code may be incorrect.
            <br />
            <Link
              to="/assignments"
              className="text-foreground! whitespace-nowrap underline underline-offset-4"
            >
              All Assignments
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // if (session.user.) {}

  setTitleSlot(assignment.title)

  const { title, description, attachments } = assignment

  return (
    <>
      <section className="mx-auto mb-4 flex max-w-4xl flex-col gap-4">
        <h1 className="font-heading text-2xl font-bold">{title}</h1>

        {description && (
          <p className="wrap-break-word whitespace-pre-wrap">{description}</p>
        )}

        {attachments && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {attachments.map((att) => (
              <div className="relative">
                <img src={att.url} alt={`Image ${att.position}. ${title}`} />
                <span className="font-heading pointer-events-none absolute right-2 bottom-2 rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-white">
                  {att.position < 9 && "0"}
                  {att.position + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
