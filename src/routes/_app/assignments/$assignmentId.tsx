import { authClient } from "#/lib/auth-client"
import {
  createFileRoute,
  Link,
  useParams,
  useRouterState,
} from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getAssignmentById } from "#/server/assignments"
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "#/components/ui/input-group"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { Spinner } from "#/components/ui/spinner"
import { useHeaderStore } from "#/lib/header-store"
import { copyToClipboard } from "#/lib/copy-to-clipboard"
import { toast } from "sonner"
import { useState } from "react"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/assignments/$assignmentId")({
  component: RouteComponent,
})

function RouteComponent() {
  const routerState = useRouterState()

  const [isCopying, setIsCopying] = useState(false)

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

  setTitleSlot(assignment.title)

  const {
    title,
    description,
    assignmentCode,
    attachments,
    allowedFormats,
    dueAt,
    maxScore,
    teacherId,
  } = assignment

  const isStudent = teacherId !== session.user.id

  const handleCopyCode = async () => {
    const success = await copyToClipboard(assignmentCode)

    if (success) {
      setIsCopying(true)
      setTimeout(() => setIsCopying(false), 2000)
    } else {
      toast.error("Failed to copy code")
    }
  }

  return (
    <>
      <section className="mx-auto mb-4 flex max-w-4xl flex-col gap-4 overflow-y-auto">
        <h1 className="font-heading text-xl font-bold sm:text-2xl">{title}</h1>

        <div className="max-w-120">
          <InputGroup className="bg-muted h-10 dark:bg-black/60!">
            <InputGroupInput readOnly value={assignmentCode} />
            <InputGroupButton
              title={isCopying ? "Copied!" : "Copy"}
              onClick={handleCopyCode}
            >
              {isCopying ? <IconCheck /> : <IconCopy />}
            </InputGroupButton>
          </InputGroup>
        </div>

        {description && (
          <p className="wrap-break-word whitespace-pre-wrap">{description}</p>
        )}

        {attachments.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {attachments.map((att) => (
              <div className="relative">
                <img
                  src={att.url}
                  alt={`Image ${att.position}. ${title}`}
                  className="aspect-auto w-full"
                />
                <span className="font-heading pointer-events-none absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-white">
                  {att.position < 9 && "0"}
                  {att.position + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {isStudent && (
        <Button
          size="lg"
          className="border-border! absolute bottom-4 left-1/2 h-11 w-[calc(100%-32px)] max-w-90 -translate-x-1/2 border! shadow-[0_25px_-12px_var(--tw-shadow-color,rgb(0,0,0,0.7))]"
        >
          Submit
        </Button>
      )}
    </>
  )
}
