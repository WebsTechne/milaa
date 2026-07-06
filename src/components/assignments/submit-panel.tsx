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
import { Field, FieldGroup, FieldLabel } from "../ui/field"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Textarea } from "../ui/textarea"
import { DropZone } from "../drop-zone"

const formSchema = z.object({
  note: z.string().optional(),
  attachment: z.array(z.file()),
})

function SubmitPanel({
  open,
  onOpenChange,
  format,
}: {
  open: boolean
  onOpenChange: (val: boolean) => void
  format: SubmissionFormat[]
}) {
  const form = useForm({
    defaultValues: {
      note: "",
      attachment: [],
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = formSchema.safeParse(value)
        if (!result.success) {
          return result.error.issues.map((i) => i.message).join(", ")
        }
      },
    },
    onSubmit: async ({ value }) => {},
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full! max-w-lg!">
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
                name="attachment"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Attachments</FieldLabel>
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
                      />
                    </Field>
                  )
                }}
              />
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
          <Button className="h-10">Submit</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { SubmitPanel }
