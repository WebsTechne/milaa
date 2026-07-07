import { createServerFn } from "@tanstack/react-start"
import { prisma } from "#/db"
import { getSession } from "#/lib/auth-session"
import type { Prisma, SubmissionFormat } from "#/generated/prisma/client"
import { generateCode } from "#/lib/generate-code"

const getAssignmentById = createServerFn({ method: "GET" })
  .validator((data: { assignmentId: string }) => data)
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    try {
      const assignment = await prisma.assignment.findFirst({
        where: { id: data.assignmentId },
        include: {
          course: { select: { id: true, code: true, name: true } },
          attachments: { orderBy: { position: "asc" } },
          teacher: { select: { firstName: true, lastName: true, image: true } },
          _count: { select: { submissions: true } },
        },
      })

      if (!assignment) return null

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: assignment.courseId,
            studentId: session.user.id,
          },
        },
        select: { id: true },
      })

      return { ...assignment, isEnrolled: !!enrollment }
    } catch (err) {
      console.error("❌ getAssignmentById error:", err)
      throw err
    }
  })

const getAssignmentByCode = createServerFn({ method: "GET" })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    try {
      const assignments = await prisma.assignment.findUnique({
        where: { assignmentCode: data.code },
        select: {
          id: true,
          title: true,
          description: true,
          dueAt: true,
          maxScore: true,
          course: { select: { name: true } },
          teacher: { select: { id: true } },
          assignmentCode: true,
        },
      })
      return assignments
    } catch (err) {
      console.error("❌ getAssignmentByCode error:", err)
      throw err
    }
  })

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
          description: true,
          dueAt: true,
          maxScore: true,
          course: { select: { name: true } },
          teacher: { select: { id: true } },
          assignmentCode: true,
        },
        orderBy: { createdAt: "desc" },
      })
      return assignments
    } catch (err) {
      console.error("❌ getTeacherAssignments error:", err)
      throw err
    }
  },
)
type AssignmentListData = Prisma.AssignmentGetPayload<{
  select: {
    id: true
    title: true
    description: true
    dueAt: true
    maxScore: true
    course: { select: { name: true } }
    teacher: { select: { id: true } }
    assignmentCode: true
  }
}>

const getStudentAssignments = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    try {
      const assignments = await prisma.assignment.findMany({
        where: {
          course: { enrollments: { some: { studentId: session.user.id } } },
        },
        select: {
          id: true,
          title: true,
          description: true,
          dueAt: true,
          maxScore: true,
          course: { select: { name: true } },
          teacher: { select: { id: true } },
          assignmentCode: true,
        },
        orderBy: { dueAt: "asc" },
      })
      return assignments
    } catch (err) {
      console.error("❌ getStudentAssignments error:", err)
      throw err
    }
  },
)

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
      console.error("❌ createAssignment error:", err)
      throw err
    }
  })

const deleteAssignment = createServerFn({ method: "POST" })
  .validator((data: { assignmentId: string }) => data)
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    await prisma.assignment.delete({
      where: {
        id: data.assignmentId,
        teacherId: session.user.id, // only creator can delete
      },
    })
  })

export type { AssignmentListData }
export {
  getAssignmentById,
  getAssignmentByCode,
  getStudentAssignments,
  getTeacherAssignments,
  createAssignment,
  deleteAssignment,
}
