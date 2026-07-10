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
import type { SubmissionFormat } from "#/generated/prisma/enums"
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Textarea } from "../ui/textarea"
import { Spinner } from "../ui/spinner"
import { DropZone } from "../drop-zone"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createSubmission, deleteSubmission } from "#/server/submissions"
import { toast } from "sonner"
import { uploadAttachments } from "#/lib/attachments/upload"
import { createSubmissionAttachments } from "#/server/attachments"

const formSchema = z.object({
  note: z.string().optional(),
  attachments: z.array(z.file()).min(1, "At least one attachment is required"),
})

function SubmitPanel({
  open,
  onOpenChange,
  format,
  assignmentId,
}: {
  open: boolean
  onOpenChange: (val: boolean) => void
  format: SubmissionFormat[]
  assignmentId: string
}) {
  const queryClient = useQueryClient()

  const [error, setError] = useState("")

  const form = useForm({
    defaultValues: {
      note: "",
      attachments: [] as File[],
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = formSchema.safeParse(value)
        if (!result.success) {
          return result.error.issues.map((i) => i.message).join(", ")
        }
      },
    },
    onSubmit: async ({ value }) => {
      setError("")
      toast.loading("Submitting...", { id: "upload-toast" })
      let submissionId: string | undefined

      try {
        // First I'll create the submission
        const submission = await createSubmission({
          data: { assignmentId, note: value.note },
        })
        submissionId = submission.id

        // Then I'll upload the attachments to supabase storage
        const attachments = await uploadAttachments(
          "submission",
          value.attachments,
          submissionId,
          0,
          (uploaded, total) => {
            toast.loading(`Uploading files... (${uploaded}/${total}) `, {
              id: "upload-toast",
            })
          },
        )

        // then I'm saving the attachment records to DB
        await createSubmissionAttachments({
          data: { submissionId, attachments },
        })

        toast.success("Submission was successful", { id: "upload-toast" })
        queryClient.invalidateQueries({
          queryKey: ["submissions"],
        })
        queryClient.invalidateQueries({
          queryKey: ["assignments", assignmentId],
        })

        form.reset()
        onOpenChange(false)
      } catch (err) {
        setError("Failed to create submission. Please try again.")
        console.error(err)
        if (submissionId) {
          try {
            await deleteSubmission({ data: { submissionId } })
          } catch (e) {
            console.error("Rollback failed", e)
          } // Rollback should never crash the error handler.
        }
        toast.error("Failed to create submission", { id: "upload-toast" })
      }
    },
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full! max-w-lg! gap-2!">
        <SheetHeader>
          <SheetTitle>Submission</SheetTitle>
          <SheetDescription>
            Upload your work and optionally add a note for your teacher. Once
            submitted, your teacher will be notified and can review and grade
            your submission.
          </SheetDescription>
        </SheetHeader>

        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="no-scrollbar flex-1 overflow-y-auto">
            <FieldGroup className="gap-5 px-4">
              <form.Field
                name="attachments"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Attachments (max 20MB)
                      </FieldLabel>
                      <DropZone
                        onFiles={(files) => field.handleChange(files)}
                        format={format}
                        multiple
                      />
                    </Field>
                  )
                }}
              />

              <form.Field
                name="note"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Note (optional)
                      </FieldLabel>
                      <Textarea
                        placeholder="Add a note for your teacher..."
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="h-[6lh]"
                      />
                    </Field>
                  )
                }}
              />

              {error.length > 0 && (
                <Field>
                  <FieldError className="text-center">{error}</FieldError>
                </Field>
              )}
            </FieldGroup>
          </div>
        </form>

        <SheetFooter>
          <SheetClose
            render={
              <Button type="button" variant="secondary" className="h-10" />
            }
          >
            Cancel
          </SheetClose>
          <Button
            type="button"
            className="h-10"
            onClick={() => form.handleSubmit()}
          >
            {form.state.isSubmitting ? (
              <>
                <Spinner />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { SubmitPanel }
