import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet"
import { Button, buttonVariants } from "../ui/button"
import { Field, FieldGroup, FieldLabel } from "../ui/field"
import { Spinner } from "../ui/spinner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { deleteSubmission, getSubmissionById } from "#/server/submissions"
import { toast } from "sonner"
import { IconArrowRight, IconTrash } from "@tabler/icons-react"
import { format } from "date-fns"
import { Link } from "@tanstack/react-router"
import { getFileLabel } from "#/lib/file-label"
import { deleteSupabaseAttachments } from "#/lib/attachments/delete"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { useState } from "react"

function SubmissionPanel({
  open,
  onOpenChange,
  submissionId,
}: {
  open: boolean
  onOpenChange: (val: boolean) => void
  submissionId: string
}) {
  const queryClient = useQueryClient()

  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: submission, isPending } = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => getSubmissionById({ data: { submissionId } }),
    enabled: open && !!submissionId,
  })

  // if (!submission) return

  const handleDeleteSubmission = async () => {
    toast.loading("Deleting submission...", { id: "delete-submission-toast" })
    const urls = submission?.attachments.map((att) => att.url)

    try {
      await deleteSupabaseAttachments(urls ?? [], "submission", submissionId)
      await deleteSubmission({ data: { submissionId } })
      toast.success("Submission deleted", { id: "delete-submission-toast" })
      queryClient.invalidateQueries({ queryKey: ["assignments"] })
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete submission", {
        id: "delete-submission-toast",
      })
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full! max-w-lg! gap-2!">
          {isPending || !submission ? (
            <div className="flex-center h-full">
              <Spinner className="size-6!" />
            </div>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>Submission</SheetTitle>
                {/* <SheetDescription>
                Upload your work and optionally add a note for your teacher.
                Once submitted, your teacher will be notified and can review and
                grade your submission.
              </SheetDescription> */}
                <SheetDescription>
                  {format(submission.submittedAt, "MMM d y, h:mm a")}
                </SheetDescription>
              </SheetHeader>

              <div className="no-scrollbar flex-1 overflow-y-auto">
                <FieldGroup className="gap-7 px-4">
                  {submission.note && (
                    <Field className="gap-1">
                      <FieldLabel className="text-muted-foreground font-semibold tracking-wide">
                        Note
                      </FieldLabel>
                      <p className="wrap-break-word whitespace-pre-wrap">
                        {submission.note}
                      </p>
                    </Field>
                  )}

                  <Field className="gap-1">
                    <FieldLabel className="text-muted-foreground font-semibold tracking-wide">
                      Attachments
                    </FieldLabel>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {submission.attachments.map(
                        ({ id, fileName, url, fileType }) => (
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
                        ),
                      )}
                    </div>
                  </Field>
                </FieldGroup>
              </div>

              <SheetFooter className="flex-row">
                <Link
                  to="/submissions/$submissionId"
                  params={{ submissionId }}
                  className={buttonVariants({
                    variant: "secondary",
                    className: "h-10 flex-1",
                  })}
                >
                  View submission
                  <IconArrowRight />
                </Link>

                <Button
                  variant="destructive"
                  className="h-10 flex-1"
                  onClick={() => setConfirmOpen(true)}
                >
                  <IconTrash />
                  Delete
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

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

export { SubmissionPanel }
