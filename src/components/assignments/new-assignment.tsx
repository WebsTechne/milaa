import { useForm } from "@tanstack/react-form"
import { z } from "zod"
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
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "#/components/ui/combobox"
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group"
import { Input } from "#/components/ui/input"
import { Textarea } from "../ui/textarea"
import { Button } from "#/components/ui/button"
import { Spinner } from "#/components/ui/spinner"
import { toast } from "sonner"
import { authClient } from "#/lib/auth-client"
import { IconCopy } from "@tabler/icons-react"
import { useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createCourse, getCourses } from "#/server/ courses"

export function NewAssignmentSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses(),
  })

  type Course = (typeof courses)[number]

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    course: z.string().min(1, "Select a course"),
    maxScore: z.number().min(1, "Max score is required"),
  })

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      course: "",
      maxScore: 0,
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

  const anchor = useComboboxAnchor()
  const comboboxChipsInputRef = useRef<HTMLInputElement | null>(null)

  const handleCreateCourse = async () => {
    toast.loading("Creating course...", { id: "create-course-toast" })
    const input = comboboxChipsInputRef.current?.value.trim() ?? ""
    try {
      await createCourse({
        data: { code: input.toLowerCase(), name: input },
      })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      toast.dismiss("create-course-toast")
      toast.success("Course created")
    } catch (err) {
      toast.dismiss("create-course-toast")
      toast.error("Failed to create course.")
      console.error("❌ createCourse error:", err)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent className="w-full! gap-0! not-md:max-w-md!">
        <SheetHeader>
          <SheetTitle>Create Assignment</SheetTitle>
          <SheetDescription>
            Create a new assignment, set a due date and share the code
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
                name="title"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="text"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Assignment title"
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

              <form.Field
                name="description"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Description (optional)
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Assignment description..."
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

              <form.Field
                name="course"
                // validators={{
                //   onSubmit: ({ value }) =>
                //     value.length === 0
                //       ? "Select at least one course"
                //       : undefined,
                // }}
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="gap-1">
                      <FieldLabel htmlFor={field.name}>Course</FieldLabel>
                      <Combobox
                        items={courses}
                        value={selectedCourse}
                        itemToStringValue={(course) => course.name}
                        autoHighlight
                        onValueChange={(selected) => {
                          setSelectedCourse(selected)
                          field.handleChange(selected?.code ?? "")
                        }}
                      >
                        <ComboboxInput ref={comboboxChipsInputRef} />
                        <ComboboxContent anchor={anchor}>
                          {isLoadingCourses ? (
                            <ComboboxList>
                              <div className="flex-center h-25 w-full">
                                <Spinner />
                              </div>
                            </ComboboxList>
                          ) : (
                            <>
                              <ComboboxEmpty>
                                <Button
                                  variant="secondary"
                                  onClick={handleCreateCourse}
                                >
                                  Add course
                                </Button>
                              </ComboboxEmpty>
                              <ComboboxList>
                                {(course) => (
                                  <ComboboxItem key={course.id} value={course}>
                                    {course.name}
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </>
                          )}
                        </ComboboxContent>
                      </Combobox>
                    </Field>
                  )
                }}
              />

              <Field>
                <FieldLabel>Assignment Code</FieldLabel>
                <InputGroup className="h-10">
                  <InputGroupInput disabled />
                  <InputGroupButton>
                    <IconCopy strokeWidth={2} />
                  </InputGroupButton>
                </InputGroup>
              </Field>

              <form.Field
                name="maxScore"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="gap-1">
                      <FieldLabel htmlFor={field.name}>Max score</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Max score"
                        autoComplete="off"
                        className="h-10"
                      />
                    </Field>
                  )
                }}
              />
            </FieldGroup>
          </div>
        </form>

        <SheetFooter>
          <SheetClose render={<Button type="button" variant="secondary" />}>
            Cancel
          </SheetClose>
          <Button type="submit">Create</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
