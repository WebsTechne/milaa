import { Separator } from "#/components/ui/separator"
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
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import getInitials from "#/lib/name"
import { authClient } from "#/lib/auth-client"
import { useFooterStore, useHeaderStore } from "#/lib/store"
import { cn } from "#/lib/utils"
import { deleteSubmission, getSubmissionById } from "#/server/submissions"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createFileRoute,
  Link,
  useParams,
  useRouterState,
} from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { getFileLabel } from "#/lib/file-label"
import { toast } from "sonner"
import { deleteSupabaseAttachments } from "#/lib/attachments/delete"
import { IconTrash } from "@tabler/icons-react"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/submissions/$submissionId")({
  component: RouteComponent,
})

function RouteComponent() {
  const routerState = useRouterState()
  const queryClient = useQueryClient()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const { data: session, isPending: authPending } = authClient.useSession()

  const setTitleSlot = useHeaderStore((s) => s.setTitleSlot)
  const setFooterSlot = useFooterStore((s) => s.setFooterSlot)

  const { submissionId } = useParams({
    from: "/_app/submissions/$submissionId",
  })

  const { data: submission, isPending } = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => getSubmissionById({ data: { submissionId } }),
    enabled: !!session && !authPending,
  })

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

  if (!submission) {
    setTitleSlot("Submission not found")

    return (
      <div className="flex-center h-[calc(100dvh-48px-56px)] px-5">
        <div>
          <h1 className="font-heading mb-2 text-4xl font-bold">
            Submission not found
          </h1>
          <p className="text-muted-foreground max-w-prose text-base md:text-lg">
            We couldn't find the submission you're looking for. It may have been
            deleted, or the link may be incorrect.
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

  const {
    attachments,
    assignmentId,
    assignment: { title, course, teacherId, teacher },
    feedback,
    grade,
    note,
    submittedAt,
    studentId,
  } = submission

  const isTeacher = teacherId === session.user.id
  const isMine = studentId === session.user.id

  const { initials } = isTeacher
    ? getInitials(`${teacher.firstName} ${teacher.lastName}`)
    : getInitials(session.user.name)

  setTitleSlot(note ?? "Submission")

  const handleDeleteSubmission = async () => {
    toast.loading("Deleting submission...", { id: "delete-submission-toast" })
    const urls = attachments.map((att) => att.url)

    try {
      await deleteSupabaseAttachments(urls, "submission", submissionId)
      await deleteSubmission({ data: { submissionId } })
      toast.success("Submission deleted", { id: "delete-submission-toast" })
      queryClient.invalidateQueries({ queryKey: ["assignments"] })
      setConfirmOpen(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete submission", {
        id: "delete-submission-toast",
      })
    }
  }

  return (
    <>
      <section className="mx-auto mb-4 flex w-full max-w-4xl flex-col gap-5 pt-4">
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
          </div>

          <Separator className="bg-background" />

          <div className="flex items-center gap-2">
            {isTeacher && (
              <>
                <Avatar className="size-7">
                  {teacher.image && (
                    <AvatarImage
                      src={teacher.image}
                      alt={`${teacher.firstName} ${teacher.lastName}`}
                    />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="">
                  {`${teacher.firstName} ${teacher.lastName}`}'s assignment
                </span>
              </>
            )}

            {isMine && (
              <>
                <Avatar className="size-7">
                  {session.user.image && (
                    <AvatarImage
                      src={session.user.image}
                      alt={session.user.name}
                    />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="">{session.user.name}'s submission</span>
              </>
            )}
          </div>
        </section>

        {note && (
          <>
            <div className="flex flex-col gap-2">
              <h3 className="text-muted-foreground font-heading text-sm font-semibold tracking-wide">
                NOTE
              </h3>
              <p className="wrap-break-word whitespace-pre-wrap">{note}</p>
            </div>

            <Separator />
          </>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground font-heading text-sm font-semibold tracking-wide">
            ATTACHMENTS ({attachments.length})
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {attachments.map(({ id, fileName, url, fileType }) => (
              <div className="min-h-40">
                {fileType.startsWith("image/") ? (
                  <img
                    key={id}
                    src={url}
                    alt={"submission attachment"}
                    className="h-full w-auto rounded-lg object-cover"
                    // draggable={false}
                  />
                ) : (
                  <Link
                    to={url}
                    target="_blank"
                    className="bg-muted relative flex h-full min-w-32 flex-col items-center justify-center gap-1 rounded-lg border p-2"
                  >
                    <span className="bg-muted text-muted-foreground absolute top-2 right-2 rounded border px-2 py-1 text-xs font-semibold">
                      {getFileLabel(fileName)}
                    </span>

                    <p className="text-muted-foreground w-full text-center text-xs">
                      {fileName}
                    </p>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="pointer-events-none inset-x-0 flex justify-center px-4">
          <Button
            size="lg"
            variant="destructive"
            className="pointer-events-auto h-11 w-9/10 max-w-90"
            onClick={handleDeleteSubmission}
          >
            <IconTrash />
            Delete Submission
          </Button>
        </div>
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete submission?</AlertDialogTitle>
            <AlertDialogDescription>
              Your submission and all attached files will be permanently
              deleted. You can submit again after, but this can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteSubmission}
            >
              <IconTrash />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
