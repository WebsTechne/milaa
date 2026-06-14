import { createServerFn } from "@tanstack/react-start"
import { prisma } from "#/db"
import { getSession } from "#/lib/auth-session"
import type { Prisma } from "#/generated/prisma/client"

const getTeacherAssignments = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    try {
      const assignments = await prisma.assignment.findMany({
        where: { teacherId: session.user.id },
        select: {
          id: true,
          title: true,
          dueAt: true,
          course: { select: { name: true } },
          _count: { select: { submissions: true } },
        },
      })
      return assignments
    } catch (err) {}
  },
)
type AssignmentListData = Prisma.AssignmentGetPayload<{
  select: {
    id: true
    title: true
    dueAt: true
    course: { select: { name: true } }
    _count: { select: { submissions: true } }
  }
}>

export type { AssignmentListData }
export { getTeacherAssignments }
