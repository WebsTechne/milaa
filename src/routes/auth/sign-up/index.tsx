import { useState } from "react"
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { cn } from "#/lib/utils"
import { z } from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "#/components/ui/field"
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "#/components/ui/input-group"
import { Input } from "#/components/ui/input"
import { Button } from "#/components/ui/button"
import { authClient } from "#/lib/auth-client"
import { toast } from "sonner"
import { uploadAvatar } from "#/lib/attachments/upload"
import { updateUserProfile, deleteUser } from "#/server/users"
import { IconChevronLeft, IconEye, IconEyeOff } from "@tabler/icons-react"
import { Spinner } from "#/components/ui/spinner"
import { DropZone } from "#/components/drop-zone"

export const Route = createFileRoute("/auth/sign-up/")({
  component: SignupPage,
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
})

const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    image: z.instanceof(File).optional().or(z.undefined()),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

function SignupPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()

  const [view, setView] = useState(false)
  const [confirmView, setConfirmView] = useState(false)
  const [step, setStep] = useState(1)

  const onNextAction = async () => {
    // touch all fields first so errors show even if untouched
    form.setFieldMeta("firstName", (prev) => ({ ...prev, isTouched: true }))
    form.setFieldMeta("lastName", (prev) => ({ ...prev, isTouched: true }))
    form.setFieldMeta("email", (prev) => ({ ...prev, isTouched: true }))
    form.setFieldMeta("password", (prev) => ({ ...prev, isTouched: true }))
    form.setFieldMeta("confirmPassword", (prev) => ({
      ...prev,
      isTouched: true,
    }))

    const results = await Promise.all([
      form.validateField("firstName", "submit"),
      form.validateField("lastName", "submit"),
      form.validateField("email", "submit"),
      form.validateField("password", "submit"),
      form.validateField("confirmPassword", "submit"),
    ])

    const isValid = results.every((errors) => errors.length === 0)
    if (isValid) setStep(2)
  }

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      image: undefined as File | undefined,
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
      toast.loading("Signing up...", { id: "sign-up-toast" })

      let userId: string | undefined

      try {
        // 1 Create user (better-auth)
        const res = await authClient.signUp.email({
          email: value.email,
          password: value.password,
          name: `${value.firstName} ${value.lastName}`,
          firstName: value.firstName,
          lastName: value.lastName,
        })

        if (!res.data?.user) {
          toast.dismiss("sign-up-toast")
          toast.error(res.error?.message ?? "Failed to create account") // 👈 show actual error
          return
        }

        userId = res.data.user.id
        if (!userId) throw new Error("Signup failed")

        // 2 Upload avatar if provided
        let avatarUrl: string | undefined
        if (value.image) {
          avatarUrl = await uploadAvatar(value.image, userId)
        }

        // 3 Update user profile (school, department, avatar)
        await updateUserProfile({
          data: {
            userId,
            firstName: value.firstName,
            lastName: value.lastName,
            image: avatarUrl,
          },
        })

        // 4 redirect
        toast.dismiss("sign-up-toast")
        toast.success("Sign up successful")
        navigate({ to: search.redirect ?? "/" })
      } catch (err) {
        console.error(err)
        // 5 cleanup — delete the created user
        if (userId) await deleteUser({ data: { userId } })

        toast.dismiss("sign-up-toast")
        toast.error("Sign up failed, please try again")
      }
    },
  })

  return (
    <div className="*:mx-auto">
      <Card className="relative z-1000 py-6! sm:max-w-md">
        <CardHeader>
          <CardTitle className="text-lg! font-bold">
            Create your account
          </CardTitle>
          <CardDescription>
            Join courses, submit assignments, and keep track of deadlines in one
            place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <FieldGroup className="gap-5">
              <div className={step === 1 ? "contents" : "hidden"}>
                <form.Field
                  name="firstName"
                  validators={{
                    onSubmit: z.string().min(1, "First name is required"),
                  }}
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid} className="gap-1">
                        <FieldLabel htmlFor={field.name}>
                          Your first name
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder=""
                          autoComplete="given-name"
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
                  name="lastName"
                  validators={{
                    onSubmit: z.string().min(1, "Last name is required"),
                  }}
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid} className="gap-1">
                        <FieldLabel htmlFor={field.name}>
                          Your last name
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder=""
                          autoComplete="family-name"
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
                  name="email"
                  validators={{
                    onSubmit: z.string().email("Invalid email"),
                  }}
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid} className="gap-1">
                        <FieldLabel htmlFor={field.name}>
                          Your school email
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="first.last@facul.uniben.edu"
                          autoComplete="email"
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
                  name="password"
                  validators={{
                    onSubmit: z
                      .string()
                      .min(6, "Password must be at least 6 characters"),
                  }}
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    if (isInvalid) console.log(field.state.meta.errors)
                    return (
                      <Field data-invalid={isInvalid} className="gap-1">
                        <FieldLabel htmlFor={field.name}>
                          Enter a password
                        </FieldLabel>
                        <InputGroup className="h-10">
                          <InputGroupInput
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="********"
                            autoComplete="new-password"
                            type={!view ? "password" : "text"}
                          />
                          <InputGroupButton
                            type="button"
                            onClick={() => setView((v) => !v)}
                          >
                            {view ? (
                              <IconEyeOff className="size-5! duration-300" />
                            ) : (
                              <IconEye className="size-5! duration-300" />
                            )}
                          </InputGroupButton>
                        </InputGroup>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />

                <form.Field
                  name="confirmPassword"
                  validators={{
                    onSubmit: ({ value, fieldApi }) => {
                      const password = fieldApi.form.getFieldValue("password")
                      if (value !== password)
                        return { message: "Passwords do not match" }
                    },
                  }}
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    if (isInvalid) console.log(field.state.meta.errors)
                    return (
                      <Field data-invalid={isInvalid} className="gap-1">
                        <FieldLabel htmlFor={field.name}>
                          Confirm password
                        </FieldLabel>
                        <InputGroup className="h-10">
                          <InputGroupInput
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="********"
                            autoComplete="current-password"
                            type={!confirmView ? "password" : "text"}
                          />
                          <InputGroupButton
                            type="button"
                            onClick={() => setConfirmView((v) => !v)}
                          >
                            {confirmView ? (
                              <IconEyeOff className="size-5! duration-300" />
                            ) : (
                              <IconEye className="size-5! duration-300" />
                            )}
                          </InputGroupButton>
                        </InputGroup>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />

                <Field>
                  <Button type="button" className="h-10" onClick={onNextAction}>
                    Next
                  </Button>
                </Field>
              </div>

              <div className={step === 2 ? "contents" : "hidden"}>
                <form.Field
                  name="image"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid} className="gap-1">
                        <DropZone
                          onFiles={(files) => field.handleChange(files[0])}
                          onClear={() => field.handleChange(undefined)}
                          preview={field.state.value}
                          format={["IMAGE"]}
                        />
                        <FieldDescription>
                          Optional. Use a clear photo of yourself. Lecturers may
                          use profile photos to identify students during
                          grading.
                        </FieldDescription>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />

                <Field orientation="horizontal" className="gap-5">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10 flex-1 justify-start"
                    onClick={() => setStep(1)}
                  >
                    <IconChevronLeft />
                    Back
                  </Button>

                  <Button
                    type="button"
                    className="h-10 flex-1"
                    onClick={() => form.handleSubmit()}
                  >
                    {form.state.isSubmitting ? (
                      <>
                        <Spinner />
                        Signing up...
                      </>
                    ) : (
                      "Sign up"
                    )}
                  </Button>
                </Field>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div className="mt-4 w-full sm:max-w-md">
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link
            to="/auth/sign-in"
            search={{ redirect: search.redirect ?? "/" }}
            className="text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
