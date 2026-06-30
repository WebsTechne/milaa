import { useState } from "react"
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
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
import { IconEye, IconEyeOff } from "@tabler/icons-react"
import { Spinner } from "#/components/ui/spinner"

export const Route = createFileRoute("/auth/sign-in/")({
  component: SigninPage,
})

const formSchema = z.object({
  email: z.string().email("Invalid email").min(1, "Email is required"),
  password: z.string().min(6, "Password is at least 6 characters"),
})

function SigninPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()

  const [view, setView] = useState(false)
  const [error, setError] = useState("")

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
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
      toast.loading("Signing in...", { id: "sign-in-toast" })

      try {
        const res = await authClient.signIn.email({
          email: value.email,
          password: value.password,
          rememberMe: true,
        })

        if (res.error) {
          toast.dismiss("sign-in-toast")
          toast.error(res.error.message ?? "Failed to sign in")
          switch (res.error.code) {
            case "INVALID_EMAIL_OR_PASSWORD":
              setError("Incorrect email or password.")
              return
            default:
              setError(res.error.message ?? "Failed to sign in.")
              return
          }
        }

        toast.dismiss("sign-in-toast")
        toast.success("Welcome back!")
        navigate({ to: search.redirect ?? "/" })
      } catch (err) {
        console.error(err)
        toast.dismiss("sign-in-toast")
        toast.error("Sign in failed, please try again")
      }
    },
  })

  return (
    <div className="fixed top-1/2 left-0 w-full -translate-y-1/2 px-4 *:mx-auto">
      <Card className="relative z-1000 mt-15 py-6! sm:max-w-md">
        <CardHeader>
          <CardTitle className="text-lg! font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to access your courses, assignments, and submissions.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <FieldGroup className="gap-5">
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="gap-1">
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name="email"
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder=""
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
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="gap-1">
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
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
                          type={!view ? "password" : "text"}
                        />
                        <InputGroupButton onClick={() => setView(!view)}>
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

              {error && (
                <Field>
                  <FieldError className="text-center">{error}</FieldError>
                </Field>
              )}

              <Field>
                <Button
                  type="button"
                  className="h-10"
                  onClick={() => form.handleSubmit()}
                >
                  {form.state.isSubmitting ? (
                    <>
                      <Spinner />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div className="w-full py-4 sm:max-w-md">
        <p className="text-muted-foreground text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            to="/auth/sign-up"
            search={{ redirect: search.redirect ?? "/" }}
            className="text-foreground underline underline-offset-4"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
