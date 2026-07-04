import { authClient } from "#/lib/auth-client"
import getInitials from "#/lib/name"
import { useHeaderStore } from "#/lib/store"
import { getCourseById } from "#/server/courses"
import { useQuery } from "@tanstack/react-query"
import {
  createFileRoute,
  Link,
  useParams,
  useRouterState,
} from "@tanstack/react-router"
import { Spinner } from "#/components/ui/spinner"
import { Button } from "#/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import { IconClipboardText, IconUsers } from "@tabler/icons-react"
import { Separator } from "#/components/ui/separator"
import {
  AssignmentCard,
  AssignmentCardSkeleton,
} from "#/components/assignments/assignment-card"

export const Route = createFileRoute("/_app/courses/$courseId")({
  component: CoursePage,
})

function CoursePage() {
  const { courseId } = useParams({ from: "/_app/courses/$courseId" })
  const routerState = useRouterState()

  const { data: session, isPending: authPending } = authClient.useSession()

  const setTitleSlot = useHeaderStore((s) => s.setTitleSlot)

  const { data: course, isPending } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById({ data: { courseId } }),
    enabled: !!session && !authPending,
  })

  if (authPending)
    return (
      <div className="flex-center h-[calc(100dvh-16px-48px)]">
        <Spinner className="size-7" />
      </div>
    )

  if (!session) {
    setTitleSlot("Sign in required")

    return (
      <div className="flex-center h-[calc(100dvh-48px-56px)] px-5">
        <div>
          <h1 className="font-heading mb-2 text-4xl font-bold">
            Sign in required
          </h1>
          <p className="text-muted-foreground max-w-prose text-base md:text-lg">
            Sign in to continue. Once you're signed in, you'll be able to access
            this page and everything it contains. Sign in at the{" "}
            <Link
              to="/auth/sign-in"
              search={{ redirect: routerState.location.href }}
              className="text-foreground! whitespace-nowrap underline underline-offset-4"
            >
              Sign in
            </Link>{" "}
            page
          </p>
        </div>
      </div>
    )
  }

  if (!course) {
    setTitleSlot("Course not found")

    return (
      <div className="flex-center h-[calc(100dvh-48px-56px)] px-5">
        <div>
          <h1 className="font-heading mb-2 text-4xl font-bold">
            Course not found
          </h1>
          <p className="text-muted-foreground max-w-prose text-base md:text-lg">
            We couldn't find this course. It may have been deleted, or the link
            may be incorrect.
            <br />
            <Link
              to="/courses"
              className="text-foreground! whitespace-nowrap underline underline-offset-4"
            >
              All courses
            </Link>
          </p>
        </div>
      </div>
    )
  }

  setTitleSlot(course.description)

  const { code, name, description, teacher, assignments, _count } = course

  const { initials } = getInitials(`${teacher.firstName} ${teacher.lastName}`)

  const isTeacher = session.user.id === teacher.id

  return (
    <section className="mb-4 flex flex-col gap-5 pt-4">
      {/* max-w-4xl */}
      <section className="bg-card mx-auto flex w-full max-w-4xl flex-col gap-2 rounded-xl border p-4">
        <div>
          <h1 className="font-heading text-lg font-bold duration-200 sm:text-xl md:text-2xl">
            {name}
          </h1>
          <p className="text-lg">{description}</p>
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          {isTeacher && (
            <span className="flex-center bg-muted text-muted-foreground gap-1 rounded-full border px-3 py-1">
              <IconUsers size={16} />
              {_count.enrollments} student{_count.enrollments !== 1 && "s"}
            </span>
          )}
          <span className="flex-center bg-muted text-muted-foreground gap-1 rounded-full border px-3 py-1">
            <IconClipboardText size={16} />
            {_count.assignments} assignment{_count.assignments !== 1 && "s"}
          </span>
        </div>

        <Separator className="bg-background" />

        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            {teacher.image && (
              <AvatarImage
                src={teacher.image}
                alt={`${teacher.firstName} ${teacher.lastName}`}
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{`${teacher.firstName} ${teacher.lastName}`}</span>
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <h3 className="text-muted-foreground font-heading text-sm font-semibold tracking-wide">
          ASSIGNMENTS ({_count.assignments})
        </h3>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {isPending ? (
            Array.from({ length: 2 }).map((_, i) => (
              <AssignmentCardSkeleton key={i} />
            ))
          ) : assignments.length < 1 ? (
            <div className="col-span-full flex flex-col items-center rounded-xl border border-dashed bg-transparent p-4 shadow-none">
              <p className="py-4 text-center">No assignments yet.</p>
              {isTeacher && (
                <Button render={<Link to="/assignments" />}>
                  Create assignment
                </Button>
              )}
            </div>
          ) : (
            assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                session={session}
              />
            ))
          )}
        </section>
      </div>
    </section>
  )
}
