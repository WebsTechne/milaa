import {
  getAssignmentByCode,
  getStudentAssignments,
} from "#/server/assignments"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "#/lib/auth-client"
import { Button } from "../ui/button"

import { useState } from "react"
import { useHeaderStore } from "#/lib/store"
import { Link, useParams, useRouterState } from "@tanstack/react-router"
import { Spinner } from "../ui/spinner"
import { getStudentEnrollments } from "#/server/enrollments"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import getInitials from "#/lib/name"

function StudentCoursesPage() {
  const routerState = useRouterState()

  const { data: session, isPending: authPending } = authClient.useSession()

  const setTitleSlot = useHeaderStore((s) => s.setTitleSlot)

  const { data: enrollments = [], isPending } = useQuery({
    queryKey: ["enrollments", "list"],
    queryFn: () => getStudentEnrollments(),
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

  if (enrollments.length === 0) {
    return (
      <div className="flex-center h-[calc(100dvh-48px-56px)] px-5">
        <div>
          <h1 className="font-heading mb-2 text-4xl font-bold">
            No courses yet
          </h1>
          <p className="text-muted-foreground max-w-prose text-base md:text-lg">
            You haven't enrolled in any courses yet. Search for an assignment
            code from your teacher to join a course.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <section className="mt-4">
        <p>
          {enrollments.length} course{enrollments.length !== 1 ? "s" : ""}
        </p>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {enrollments.map(({ id, course }) => {
          const { initials } = getInitials(
            `${course.teacher.firstName} ${course.teacher.lastName}`,
          )

          return (
            <Link
              key={id}
              to="/courses/$courseId"
              params={{ courseId: course.id }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{course.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {course.description ?? (
                    <span className="text-muted-foreground">
                      No description
                    </span>
                  )}
                </CardContent>
                <div className="flex items-center gap-2 px-4">
                  <Avatar className="size-7">
                    {course.teacher.image && (
                      <AvatarImage
                        src={course.teacher.image}
                        alt={`${course.teacher.firstName} ${course.teacher.lastName}`}
                      />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{`${course.teacher.firstName} ${course.teacher.lastName}`}</span>
                </div>
              </Card>
            </Link>
          )
        })}
      </section>
    </>
  )
}

export { StudentCoursesPage }
