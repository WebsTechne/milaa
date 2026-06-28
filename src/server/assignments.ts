import { createServerFn } from "@tanstack/react-start"
import { prisma } from "#/db"
import { getSession } from "#/lib/auth-session"
import type { Prisma, SubmissionFormat } from "#/generated/prisma/client"
import { generateCode } from "#/lib/generate-code"

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

const createAssignment = createServerFn({ method: "POST" })
  .validator(
    (data: {
      title: string
      description?: string
      course: { id: string; code: string; name: string }
      maxScore: number
      dueAt: Date
      allowedFormats: SubmissionFormat[]
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    try {
      const assignmentCode = await generateCode({
        data: { course: data.course.name },
      })
      if (!assignmentCode)
        throw new Error("Failed to generate assignment code. Try again")

      const assignment = await prisma.assignment.create({
        data: {
          title: data.title,
          description: data.description,
          assignmentCode,
          courseId: data.course.id,
          maxScore: data.maxScore,
          allowedFormats: data.allowedFormats,
          dueAt: data.dueAt,
          teacherId: session.user.id,
        },
      })

      return assignment
    } catch (err) {
      throw new Error(err)
    }
  })

export type { AssignmentListData }
export { getTeacherAssignments, createAssignment }
