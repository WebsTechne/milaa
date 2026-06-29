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
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "#/components/ui/input-group"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { Spinner } from "#/components/ui/spinner"
import { useFooterStore, useHeaderStore } from "#/lib/store"
import { copyToClipboard } from "#/lib/copy-to-clipboard"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Button } from "#/components/ui/button"
import { cn } from "#/lib/utils"
import { Separator } from "#/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import getInitials from "#/lib/name"

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
  const setFooterSlot = useFooterStore((s) => s.setFooterSlot)

  const { data: assignment, isPending } = useQuery({
    queryKey: ["assignments", assignmentId],
    queryFn: () => getAssignmentById({ data: { assignmentId } }),
    enabled: !!session && !authPending,

    staleTime: Infinity,
  })

  const teacherID = assignment?.teacherId
  const isStudent = !!session && teacherID !== session.user.id

  useEffect(() => {
    if (!isStudent) {
      setFooterSlot(null)
      return
    }

    setFooterSlot(
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
        <Button
          size="lg"
          className="hover:bg-primary! pointer-events-auto h-11 w-9/10 max-w-90 shadow-(--shadow-sm)"
        >
          Submit
        </Button>
      </div>,
    )

    return () => setFooterSlot(null)
  }, [isStudent, setFooterSlot])

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
    allowedFormats,
    assignmentCode,
    attachments,
    course,
    description,
    dueAt,
    maxScore,
    status,
    teacher,
    title,
  } = assignment

  const handleCopyCode = async () => {
    const success = await copyToClipboard(assignmentCode)

    if (success) {
      setIsCopying(true)
      setTimeout(() => setIsCopying(false), 2000)
    } else {
      toast.error("Failed to copy code")
    }
  }

  const { initials } = getInitials(`${teacher.firstName} ${teacher.lastName}`)

  return (
    <>
      <section
        className={cn(
          "mx-auto mb-4 flex max-w-4xl flex-col gap-4 pt-4",
          isStudent && "mb-19",
        )}
      >
        <section className="bg-card flex flex-col gap-2 rounded-xl border p-4">
          <h1 className="font-heading text-lg font-bold duration-200 sm:text-xl md:text-2xl">
            {title}
          </h1>

          <div className="flex items-center gap-1.5 text-sm">
            <Link
              to="/courses/$courseId"
              params={{ courseId: course.id }}
              className="bg-muted text-muted-foreground rounded-full border px-3 py-1"
            >
              {course.name}
            </Link>

            <span className="rounded-full border border-green-700/50 bg-green-500/10 px-3 py-1 text-green-500">
              {status === "ACTIVE" ? "Open" : "Closed"}
            </span>
          </div>

          <Separator className="bg-background" />

          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              {teacher.image && (
                <AvatarImage
                  src={teacher.image}
                  alt={`${teacher.firstName} ${teacher.lastName}`}
                />
              )}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{`${teacher.firstName} ${teacher.lastName}`}</span>
          </div>
        </section>

        {description && (
          <>
            <div className="flex flex-col gap-2">
              <h3 className="text-muted-foreground font-heading text-sm font-semibold tracking-wide">
                DESCRIPTION
              </h3>
              <p className="wrap-break-word whitespace-pre-wrap">
                {description}
              </p>
            </div>

            <Separator />
          </>
        )}

        {attachments.length > 0 && (
          <>
            <div className="flex flex-col gap-2">
              <h3 className="text-muted-foreground font-heading text-sm font-semibold tracking-wide">
                ATTACHMENTS ({attachments.length})
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="relative overflow-clip rounded-md border"
                  >
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
            </div>

            <Separator />
          </>
        )}

        <div className="bg-muted space-y-1 rounded-lg border p-3 not-md:text-sm">
          <p className="">Max Score: {maxScore}</p>
          <p className="">Allowed Formats: {allowedFormats.join(", ")}</p>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground font-heading text-sm font-semibold tracking-wide">
            ASSIGNMENT CODE
          </h3>

          <div className="max-w-120">
            <InputGroup className="bg-muted h-11 dark:bg-black/60!">
              <InputGroupInput readOnly value={assignmentCode} />
              <InputGroupAddon align="block-end">
                <InputGroupText>Code</InputGroupText>
                <InputGroupButton
                  title={isCopying ? "Copied!" : "Copy"}
                  onClick={handleCopyCode}
                  className="ml-auto"
                >
                  {isCopying ? <IconCheck /> : <IconCopy />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </section>
    </>
  )
}
