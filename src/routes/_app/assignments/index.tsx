import { StudentAssignmentsPage } from "#/components/assignments/students"
import { TeacherAssignmentsPage } from "#/components/assignments/teachers"
import { NoSession } from "#/components/sections/no-session"
import { getSession } from "#/lib/auth-session"
import { useHeaderStore } from "#/lib/header-store"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/_app/assignments/")({
  loader: async () => {
    return await getSession()
  },
  component: AttendancePage,
})

function AttendancePage() {
  const session = Route.useLoaderData()
  const setTitleSlot = useHeaderStore((s) => s.setTitleSlot)

  useEffect(() => {
    setTitleSlot("Assignments")
    // cleanup
    return () => {
      setTitleSlot(null)
    }
  }, [setTitleSlot])

  if (!session) return <NoSession />

  const { role } = session.user

  if (role === "STUDENT") return <StudentAssignmentsPage />

  return <TeacherAssignmentsPage />
}
