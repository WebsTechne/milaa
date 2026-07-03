import { StudentCoursesPage } from "#/components/courses/students"
import { TeacherCoursesPage } from "#/components/courses/teachers"
import { NoSession } from "#/components/sections/no-session"
import { getSession } from "#/lib/auth-session"
import { useHeaderStore } from "#/lib/store"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/_app/courses/")({
  loader: async () => {
    return await getSession()
  },
  component: AttendancePage,
})

function AttendancePage() {
  const session = Route.useLoaderData()
  const setTitleSlot = useHeaderStore((s) => s.setTitleSlot)

  useEffect(() => {
    setTitleSlot("Courses")
    // cleanup
    return () => {
      setTitleSlot(null)
    }
  }, [setTitleSlot])

  if (!session) return <NoSession />

  const { role } = session.user

  if (role === "STUDENT") return <StudentCoursesPage />

  return <TeacherCoursesPage />
}
