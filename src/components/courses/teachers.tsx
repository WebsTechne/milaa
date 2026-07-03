import { useQuery } from "@tanstack/react-query"
import { authClient } from "#/lib/auth-client"
import { Button } from "../ui/button"

import { useState } from "react"
import { useHeaderStore } from "#/lib/store"
import { Link, useParams, useRouterState } from "@tanstack/react-router"
import { Spinner } from "../ui/spinner"
import { getTeacherCourses } from "#/server/courses"
import { CourseCard } from "./course-card"
import { IconPlus } from "@tabler/icons-react"
import { NewCourseSheet } from "./new-course"

function TeacherCoursesPage() {
  const routerState = useRouterState()

  const { data: session, isPending: authPending } = authClient.useSession()
  const [newOpen, setNewOpen] = useState(false)

  const setTitleSlot = useHeaderStore((s) => s.setTitleSlot)

  const { data: courses = [], isPending } = useQuery({
    queryKey: ["courses", "list"],
    queryFn: () => getTeacherCourses(),
  })

  if (authPending || (!!session && isPending))
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

  if (courses.length === 0) {
    return (
      <div className="flex-center h-[calc(100dvh-48px-56px)] px-5">
        <div>
          <h1 className="font-heading mb-2 text-4xl font-bold">
            No courses yet
          </h1>
          <p className="text-muted-foreground max-w-prose text-base md:text-lg">
            You haven't created any courses yet. Create a course to get started
            — students can join by submitting an assignment code.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <section className="mt-4">
        <p>
          {courses.length} course{courses.length !== 1 ? "s" : ""}
        </p>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            userId={session.user.id}
          />
        ))}
      </section>

      <Button
        size="icon-lg"
        className="fixed right-4 bottom-4 size-12 rounded-full"
        onClick={() => setNewOpen(true)}
      >
        <IconPlus strokeWidth={2.5} className="size-6!" />
      </Button>

      <NewCourseSheet open={newOpen} onOpenChange={setNewOpen} />
    </>
  )
}

export { TeacherCoursesPage }
