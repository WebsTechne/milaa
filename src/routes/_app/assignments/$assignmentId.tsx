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
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconCopy,
} from "@tabler/icons-react"
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
import { getDueLabel } from "#/lib/due-time"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog"
import { enrollInCourse } from "#/server/courses"
import { SubmitPanel } from "#/components/assignments/submit-panel"
import { SubmissionPanel } from "#/components/assignments/submission-panel"

export const Route = createFileRoute("/_app/assignments/$assignmentId")({
  component: AssignmentPage,
})

function AssignmentPage() {
  const routerState = useRouterState()
  const queryClient = useQueryClient()

  const [isCopying, setIsCopying] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [joinCourseDialog, setJoinCourseDialog] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submissionOpen, setSubmissionOpen] = useState(false)

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
  const isStudent = !!session && !!assignment && teacherID !== session.user.id

  useEffect(() => {
    if (authPending) return
    if (!isStudent) {
      setFooterSlot(null)
      return
    }

    const notEnrolled = !assignment.isEnrolled
    if (notEnrolled) setJoinCourseDialog(true)
    const hasSubmitted = assignment.submissions.length > 0

    setFooterSlot(
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
        <Button
          size="lg"
          className="hover:bg-primary! pointer-events-auto h-11 w-9/10 max-w-90 shadow-(--shadow-sm)"
          onClick={() =>
            notEnrolled
              ? setJoinCourseDialog(true)
              : hasSubmitted
                ? setSubmissionOpen(true)
                : setSubmitOpen(true)
          }
        >
          {notEnrolled
            ? "Join Course"
            : hasSubmitted
              ? "View Submission"
              : "Submit"}
        </Button>
      </div>,
    )

    return () => setFooterSlot(null)
  }, [
    authPending,
    isStudent,
    assignment?.isEnrolled,
    assignment?.submissions.length,
    setFooterSlot,
  ])

  useEffect(() => {
    if (lightboxIndex === null || !attachments.length) return

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          setLightboxIndex(null)
          break

        case "ArrowLeft":
          setLightboxIndex((prev) =>
            prev !== null
              ? (prev - 1 + attachments.length) % attachments.length
              : null,
          )
          break

        case "ArrowRight":
          setLightboxIndex((prev) =>
            prev !== null ? (prev + 1) % attachments.length : null,
          )
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [lightboxIndex])

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
    isEnrolled,
    maxScore,
    status,
    teacher,
    title,
    submissions,
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

  const dueLabel = getDueLabel(dueAt)

  const handleJoinCourse = async () => {
    try {
      toast.loading("Joining course...", { id: "join-course" })
      await enrollInCourse({
        data: { courseId: course.id },
      })
      toast.success("Successfully joined course", { id: "join-course" })
      queryClient.invalidateQueries({ queryKey: ["assignments", assignmentId] })
    } catch (err) {
      toast.error("Failed to join course, please try again.", {
        id: "join-course",
      })
      console.log(err)
    }
  }

  return (
    <>
      <section
        className={cn(
          "mx-auto mb-4 flex max-w-4xl flex-col gap-5 pt-4",
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
              {submissions.length > 0
                ? "Submitted"
                : status === "ACTIVE"
                  ? "Open"
                  : "Closed"}
            </span>

            <span
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-1",
                dueLabel.urgency === "urgent"
                  ? "border-red-700/50 bg-red-500/10 text-red-500"
                  : dueLabel.urgency === "soon"
                    ? "border-amber-700/50 bg-amber-500/10 text-amber-500"
                    : "text-muted-foreground bg-muted",
                submissions.length > 0 && "opacity-50",
              )}
            >
              <IconClock size={16} />
              {dueLabel.label}
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
                {attachments.map((att, i) => (
                  <div
                    key={att.id}
                    className="relative overflow-clip rounded-md border"
                  >
                    <img
                      src={att.url}
                      alt={`Attachment ${i + 1}. ${title}`}
                      onClick={() => setLightboxIndex(i)}
                      className="aspect-auto w-full cursor-pointer"
                    />
                    <span className="font-heading pointer-events-none absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-white">
                      {i < 9 && "0"}
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />
          </>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground font-heading text-sm font-semibold tracking-wide">
            DETAILS
          </h3>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted space-y-1 rounded-lg border p-3">
                <p className="text-muted-foreground text-sm">Max score</p>
                <p className="font-heading text-lg font-semibold">{maxScore}</p>
              </div>

              <div
                className={cn(
                  "space-y-1 rounded-lg border p-3",
                  dueLabel.urgency === "urgent"
                    ? "border-red-700/50 bg-red-500/10 text-red-500"
                    : dueLabel.urgency === "soon"
                      ? "border-amber-700/50 bg-amber-500/10 text-amber-500"
                      : "text-foreground bg-muted",
                  submissions.length > 0 && "opacity-50",
                )}
              >
                <p
                  className={cn(
                    "flex items-center gap-1 text-sm",
                    dueLabel.urgency === "urgent"
                      ? "text-red-500/80"
                      : dueLabel.urgency === "soon"
                        ? "text-amber-500/80"
                        : "text-muted-foreground",
                  )}
                >
                  <IconClock size={16} />
                  Due date
                </p>
                <p className="font-heading text-lg font-semibold">
                  {dueLabel.heading}
                </p>
                <p className="-mt-1 text-sm">
                  {format(dueAt, "MMM d · h:mm a")}
                </p>
              </div>
            </div>

            <div className="bg-muted space-y-1 rounded-lg border p-3">
              <p className="text-muted-foreground text-sm">Allowed Formats</p>
              <p className="font-heading text-lg font-semibold">
                {allowedFormats.join(", ")}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground font-heading text-sm font-semibold tracking-wide">
            ASSIGNMENT CODE
          </h3>

          <div className="">
            {/* max-w-120 */}
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

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxIndex(null)}
        >
          <img
            src={attachments[lightboxIndex].url}
            alt={`page ${lightboxIndex + 1}`}
            className="max-h-[90dvh] max-w-[calc(100dvw-16px)] rounded-lg object-contain"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
          />
          {/* prev/next */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-1 left-1 disabled:pointer-events-auto! md:top-1/2 md:left-4 md:-translate-y-1/2"
            disabled={!(lightboxIndex > 0)}
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex(lightboxIndex - 1)
            }}
          >
            <IconArrowLeft className="size-5!" strokeWidth={2} />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="absolute right-1 bottom-1 disabled:pointer-events-auto! md:top-1/2 md:right-4 md:-translate-y-1/2"
            disabled={!(lightboxIndex < attachments.length - 1)}
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex(lightboxIndex + 1)
            }}
          >
            <IconArrowRight className="size-5!" strokeWidth={2} />
          </Button>
          <span className="flex-center absolute bottom-0 h-10 text-sm text-white">
            {lightboxIndex + 1} / {attachments.length}
          </span>
        </div>
      )}

      {isStudent && !isEnrolled && (
        <AlertDialog open={joinCourseDialog} onOpenChange={setJoinCourseDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Join {course.name} to view this assignment
              </AlertDialogTitle>
              <AlertDialogDescription>
                This assignment is part of {course.name}. Join the course to
                access it and all future assignments from this course.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="px-3" onClick={handleJoinCourse}>
                Join Course
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <SubmitPanel
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        format={allowedFormats}
        assignmentId={assignmentId}
      />

      <SubmissionPanel
        open={submissionOpen}
        onOpenChange={setSubmissionOpen}
        submissionId={submissions[0]?.id ?? ""}
      />
    </>
  )
}
