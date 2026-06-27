import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createCourse, getCourses } from "#/server/courses"
import { generateCode } from "#/lib/generate-code"
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
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "#/components/ui/combobox"
import { Input } from "#/components/ui/input"
import { Textarea } from "../ui/textarea"
import { Button } from "#/components/ui/button"
import { Spinner } from "#/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { DropZone } from "../drop-zone"
import { toast } from "sonner"
import { addDays, addWeeks, addMonths } from "date-fns"

import { SubmissionFormat as PrismaSubmissionFormat } from "#/generated/prisma/enums"
import { DateTimePicker } from "../ui/date-time-picker"
import { isDueIn } from "#/lib/due-in"

const SubmissionFormat = Object.values(PrismaSubmissionFormat).map(
  (format) => ({ label: format, value: format }),
)

export function NewAssignmentSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { data: courses = [], isPending: isPendingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
  })

  type Course = (typeof courses)[number]

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [month, setMonth] = useState(new Date())

  const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    images: z.array(z.file()).min(1, "Add at least one image").optional(),
    courseId: z.string().min(1, "Select a course"),
    maxScore: z.number().min(1, "Max score is required"),
    submissionFormat: z
      .array(z.nativeEnum(PrismaSubmissionFormat))
      .min(1, "Select at least one submission format"),
    dueAt: z.date({
      error: "Due date is required",
    }),
  })

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      images: [] as File[],
      courseId: "",
      maxScore: 100,
      submissionFormat: [] as PrismaSubmissionFormat[],
      dueAt: undefined as Date | undefined,
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

  const comboboxChipsInputRef = useRef<HTMLInputElement | null>(null)

  const setDueIn = (
    field: ReturnType<typeof form.Field>, // or just use field directly
    amount: number,
    unit: "days" | "weeks" | "months",
  ) => {
    const now = new Date()
    let date = now

    switch (unit) {
      case "days":
        date = addDays(now, amount)
        break
      case "weeks":
        date = addWeeks(now, amount)
        break
      case "months":
        date = addMonths(now, amount)
        break
    }

    // Optional: default due time
    date.setHours(23, 59, 0, 0)

    field.handleChange(date)
    setMonth(date)
  }

  const handleCreateCourse = async () => {
    toast.loading("Creating course...", { id: "create-course-toast" })
    const input = comboboxChipsInputRef.current?.value.trim() ?? ""
    try {
      await createCourse({
        data: { code: input.toLowerCase(), name: input.toUpperCase() },
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

  const handleCreateCode = async (course: string) => {
    try {
      const code = await generateCode({ data: { course } })
    } catch (error) {
      console.error(error)
      toast.error("Failed to generate code")
    }
  }

  //   onClick={async () => {
  //     const success = await copyToClipboard(assignmentCode)

  //     if (success) {
  //       toast.success("Code copied", {
  //         description:
  //           "Students with this code can view and submit this assignment",
  //       })
  //     } else {
  //       toast.error("Failed to copy code")
  //     }
  // 	}
  // }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent className="w-full! max-w-lg! gap-0!">
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
                        className="min-h-20 resize-none"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name="images"
                children={(field) => (
                  <Field className="gap-2">
                    <FieldLabel htmlFor={field.name}>
                      Assignment Images
                    </FieldLabel>
                    <DropZone
                      onFiles={(files) => field.handleChange(files)}
                      multiple
                    />
                  </Field>
                )}
              />

              <form.Field
                name="courseId"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="gap-2">
                      <FieldLabel htmlFor={field.name}>Course</FieldLabel>
                      <Combobox
                        items={courses}
                        value={selectedCourse}
                        itemToStringLabel={(course) => course.name}
                        autoHighlight
                        onValueChange={(selected) => {
                          setSelectedCourse(selected)
                          field.handleChange(selected?.id ?? "")
                          if (!selected) return
                          handleCreateCode(selected.code)
                        }}
                      >
                        <ComboboxInput
                          ref={comboboxChipsInputRef}
                          className="h-10"
                          uppercase
                        />
                        <ComboboxContent>
                          {isPendingCourses ? (
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

              <form.Field
                name="maxScore"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="gap-2">
                      <FieldLabel htmlFor={field.name}>Max score</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(e.target.valueAsNumber)
                        }
                        aria-invalid={isInvalid}
                        placeholder="Max score"
                        autoComplete="off"
                        className="h-10"
                      />
                    </Field>
                  )
                }}
              />

              <form.Field
                name="submissionFormat"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="gap-2">
                      <FieldLabel htmlFor={field.name}>
                        Submission Format
                      </FieldLabel>
                      <Select items={SubmissionFormat} multiple>
                        <SelectTrigger className="h-10!">
                          <SelectValue placeholder="Select submission format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {SubmissionFormat.map((sf) => (
                              <SelectItem key={sf.value} value={sf.value}>
                                {sf.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )
                }}
              />

              <form.Field
                name="dueAt"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field aria-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Due In</FieldLabel>
                      <section className="flex flex-row flex-wrap items-center gap-2">
                        <DateTimePicker
                          value={field.state.value}
                          onChange={field.handleChange}
                          month={month}
                          onMonthChange={setMonth}
                          className="bg-primary/5 max-w-70 grow rounded-lg border"
                        />
                        <div className="flex flex-1 flex-wrap content-start items-center gap-2">
                          <Button
                            type="button"
                            variant={
                              isDueIn(field.state.value, 1, "days")
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setDueIn(field, 1, "days")}
                          >
                            Tomorrow
                          </Button>
                          <Button
                            type="button"
                            variant={
                              isDueIn(field.state.value, 3, "days")
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setDueIn(field, 3, "days")}
                          >
                            3 days
                          </Button>
                          <Button
                            type="button"
                            variant={
                              isDueIn(field.state.value, 1, "weeks")
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setDueIn(field, 1, "weeks")}
                          >
                            1 week
                          </Button>
                          <Button
                            type="button"
                            variant={
                              isDueIn(field.state.value, 2, "weeks")
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setDueIn(field, 2, "weeks")}
                          >
                            2 weeks
                          </Button>
                          <Button
                            type="button"
                            variant={
                              isDueIn(field.state.value, 1, "months")
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setDueIn(field, 1, "months")}
                          >
                            1 month
                          </Button>
                        </div>
                      </section>
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
          <Button
            type="button"
            className="h-10"
            onClick={() => form.handleSubmit()}
          >
            Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
