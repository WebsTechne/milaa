import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet"
import { Button } from "../ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field"
import { z } from "zod"
import { Textarea } from "../ui/textarea"
import { Spinner } from "../ui/spinner"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getSubmissionById } from "#/server/submissions"
import { toast } from "sonner"
import { IconTrash } from "@tabler/icons-react"
import { format } from "date-fns"
import { Link } from "@tanstack/react-router"

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

  const { data: submission, isPending } = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => getSubmissionById({ data: { submissionId } }),
    enabled: open && !!submissionId,
  })

  if (!submission) return

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full! max-w-lg! gap-2!">
        {isPending ? (
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
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {submission.attachments.map(({ id, url, fileType }) => (
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
                            className="bg-muted flex h-full max-w-40 min-w-32 flex-col items-center justify-center gap-1 rounded-lg border p-2"
                          >
                            <span className="text-muted-foreground w-full truncate text-center text-xs">
                              {id}
                            </span>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </Field>
              </FieldGroup>
            </div>

            <SheetFooter>
              <Button variant="destructive" className="h-10 w-full">
                <IconTrash />
                Delete
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export { SubmissionPanel }
