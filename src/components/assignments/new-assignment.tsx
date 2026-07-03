import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createCourse, getCourses } from "#/server/courses"
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
  FieldDescription,
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
import { isDueIn } from "#/lib/due-time"
import { createAssignment, deleteAssignment } from "#/server/assignments"
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
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { copyToClipboard } from "#/lib/copy-to-clipboard"
import { uploadAttachments } from "#/lib/attachments/upload"
import { createAssignmentAttachments } from "#/server/attachments"

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
    queryKey: ["courses", "dropdown"],
    queryFn: getCourses,
  })

  type Course = (typeof courses)[number]

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [month, setMonth] = useState(new Date())
  const [error, setError] = useState("")

  const [createdAssignment, setCreatedAssignment] = useState<{
    id: string
    assignmentCode: string
  } | null>(null)

  const [isCopying, setIsCopying] = useState(false)

  const formSchema = z
    .object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      images: z.array(z.file()).optional(),
      courseId: z.string().min(1, "Select a course"),
      maxScore: z.number().min(1, "Max score is required"),
      submissionFormat: z
        .array(z.nativeEnum(PrismaSubmissionFormat))
        .min(1, "Select at least one submission format"),
      dueAt: z.date({
        error: "Due date is required",
      }),
    })
    .refine(
      (data) => data.description?.trim() || (data.images?.length ?? 0) > 0,
      {
        message: "Provide a description or at least one attachment.",
        path: ["description"],
      },
    )

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
    onSubmit: async ({ value }) => {
      const {
        title,
        description,
        maxScore,
        submissionFormat: allowedFormats,
        dueAt,
        images,
      } = value

      // if (!description.trim() && images.length === 0) {
      //   setError("Provide a description or at least one attachment.")
      //   return
      // }

      setError("")
      let assignmentId: string | undefined
      if (!selectedCourse || !dueAt) return
      const course = selectedCourse
      try {
        // 1 create assignment
        const assignment = await createAssignment({
          data: { title, description, course, maxScore, dueAt, allowedFormats },
        })

        assignmentId = assignment.id

        // 2 upload attachments (with progress) to supabase storage
        const attachments = await uploadAttachments(
          "assignment",
          images,
          assignmentId,
          0,
          (uploaded, total) => {
            toast.loading(`Uploading files... (${uploaded}/${total}) `, {
              id: "upload-toast",
            })
          },
        )

        // 3 save attachment records to DB
        await createAssignmentAttachments({
          data: { assignmentId, attachments },
        })

        toast.dismiss("upload-toast")

        setCreatedAssignment({
          id: assignmentId,
          assignmentCode: assignment.assignmentCode,
        })
        queryClient.invalidateQueries({
          queryKey: ["assignments"],
        })
      } catch (err) {
        setError("Failed to create assignment. Please try again.")
        console.error(err)
        if (assignmentId) {
          try {
            await deleteAssignment({ data: { assignmentId } })
          } catch (e) {
            console.error("Rollback failed", e)
          } // Rollback should never crash the error handler.
        }
        toast.error("Failed to create assignment", { id: "upload-toast" })
      }
    },
  })

  const comboboxChipsInputRef = useRef<HTMLInputElement | null>(null)

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

  const handleCopyCode = async () => {
    if (!createdAssignment) return
    const success = await copyToClipboard(createdAssignment.assignmentCode)

    if (success) {
      setIsCopying(true)
      setTimeout(() => setIsCopying(false), 2000)
    } else {
      toast.error("Failed to copy code")
    }
  }

  const resetForm = () => {
    setCreatedAssignment(null)
    onOpenChange(false)
    setSelectedCourse(null)
    setError("")
    setMonth(new Date())
    setIsCopying(false)
    form.reset()
  }

  return (
    <>
      <AlertDialog
        open={createdAssignment !== null}
        onOpenChange={(open) => {
          if (!open) resetForm()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🎉 Assignment published</AlertDialogTitle>
            <AlertDialogDescription>
              Students already enrolled have been notified. Share this code with
              students who join later so they can access the assignment.
            </AlertDialogDescription>

            <Field>
              <InputGroup className="bg-background! h-10">
                <InputGroupInput
                  readOnly
                  value={createdAssignment?.assignmentCode ?? ""}
                />
                <InputGroupButton
                  title={isCopying ? "Copied!" : "Copy"}
                  onClick={handleCopyCode}
                >
                  {isCopying ? <IconCheck /> : <IconCopy />}
                </InputGroupButton>
              </InputGroup>
            </Field>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="px-5" onClick={() => resetForm()}>
              Close
            </AlertDialogCancel>
            <AlertDialogAction
              render={
                <Link
                  to="/assignments/$assignmentId"
                  params={{ assignmentId: createdAssignment?.id ?? "" }}
                />
              }
            >
              View Assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  validators={{
                    onSubmit: z.string().min(1, "Title is required"),
                  }}
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
                  validators={{
                    onSubmit: z.string().min(1, "Select a course"),
                  }}
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
                            // handleCreateCourse(selected.code)
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
                                    <ComboboxItem
                                      key={course.id}
                                      value={course}
                                    >
                                      {course.name}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </>
                            )}
                          </ComboboxContent>
                        </Combobox>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />

                <form.Field
                  name="maxScore"
                  validators={{
                    onSubmit: z.number().min(1, "Max score is required"),
                  }}
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid} className="gap-2">
                        <FieldLabel htmlFor={field.name}>Max Score</FieldLabel>
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
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />

                <form.Field
                  name="submissionFormat"
                  validators={{
                    onSubmit: z
                      .array(z.nativeEnum(PrismaSubmissionFormat))
                      .min(1, "Select at least one submission format"),
                  }}
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid} className="gap-2">
                        <FieldLabel htmlFor={field.name}>
                          Submission Format
                        </FieldLabel>
                        <Select
                          items={SubmissionFormat}
                          multiple
                          value={field.state.value}
                          onValueChange={field.handleChange}
                        >
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
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />

                <form.Field
                  name="dueAt"
                  validators={{
                    onSubmit: z.date({
                      error: "Due date is required",
                    }),
                  }}
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    const setDueIn = (
                      amount: number,
                      unit: "days" | "weeks" | "months",
                    ) => {
                      const existing = field.state.value

                      let date: Date

                      switch (unit) {
                        case "days":
                          date = addDays(new Date(), amount)
                          break
                        case "weeks":
                          date = addWeeks(new Date(), amount)
                          break
                        case "months":
                          date = addMonths(new Date(), amount)
                          break
                      }

                      if (existing) {
                        date.setHours(
                          existing.getHours(),
                          existing.getMinutes(),
                          0,
                          0,
                        )
                      } else {
                        date.setHours(23, 59, 0, 0)
                      }

                      field.handleChange(date)
                      setMonth(date)
                    }

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
                              onClick={() => setDueIn(1, "days")}
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
                              onClick={() => setDueIn(3, "days")}
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
                              onClick={() => setDueIn(1, "weeks")}
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
                              onClick={() => setDueIn(2, "weeks")}
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
                              onClick={() => setDueIn(1, "months")}
                            >
                              1 month
                            </Button>
                          </div>
                        </section>
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
                  onClick={() => form.reset()}
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
