import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createCourse } from "#/server/courses"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "#/components/ui/field"
import { Input } from "#/components/ui/input"
import { Button } from "#/components/ui/button"
import { Spinner } from "#/components/ui/spinner"
import { toast } from "sonner"

export function NewCourseSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()

  const [error, setError] = useState("")

  const formSchema = z.object({
    code: z.string().min(1, "Course code is required"),
    description: z.string().optional(),
  })

  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
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
      const { code, name } = value

      setError("")
      toast.loading("Creating course...", { id: "create-course" })

      try {
        await createCourse({
          data: {
            code: code.toLowerCase(),
            name: code.toUpperCase(),
            description: name,
          },
        })

        toast.success("Course created successfully", { id: "create-course" })

        queryClient.invalidateQueries({
          queryKey: ["courses"],
        })
      } catch (err) {
        setError("Failed to create course. Please try again.")
        console.error(err)
        toast.error("Failed to create course", { id: "create-course" })
      }
    },
  })

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full! max-w-lg! gap-0!"
          showCloseButton={false}
        >
          <SheetHeader>
            <SheetTitle>Create Course</SheetTitle>
            <SheetDescription>
              Create a new course with a code and full course name
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
                  name="code"
                  validators={{
                    onSubmit: z.string().min(1, "Code is required"),
                  }}
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Course Code
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Course code"
                          autoComplete="off"
                          className="h-10 uppercase"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />

                <form.Field
                  name="name"
                  validators={{
                    onSubmit: z.string().min(1, "Name is required"),
                  }}
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Course Name
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Course name"
                          autoComplete="off"
                          className="h-10"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
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
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10"
                  onClick={() => {
                    form.reset()
                    setError("")
                  }}
                />
              }
            >
              Cancel
            </SheetClose>
            <Button
              type="button"
              className="h-10"
              disabled={form.state.isSubmitting}
              onClick={() => {
                console.log(form.state.values)
                console.log(form.state.errors)
                console.log(form.state.errorMap)
                form.handleSubmit()
              }}
            >
              {form.state.isSubmitting ? (
                <>
                  <Spinner />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
