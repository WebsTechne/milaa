import { createServerFn } from "@tanstack/react-start"
import { prisma } from "#/db"
import { getSession } from "#/lib/auth-session"

const createCourse = createServerFn({ method: "POST" })
  .validator(
    (data: { code: string; name: string; description?: string }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    try {
      const course = await prisma.course.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          teacherId: session.user.id,
        },
      })
      return course
    } catch (err) {
      console.error("❌ createCourse error:", err)
      throw err
    }
  })

const deleteCourse = createServerFn({ method: "POST" })
  .validator((data: { courseId: string }) => data)
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")
    const { courseId } = data

    try {
      await prisma.course.delete({ where: { id: courseId } })
      return
    } catch (err) {
      console.error("❌ deleteCourse error:", err)
      throw err
    }
  })

const getCourses = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await prisma.course.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    })
    // console.table(data)
    return data
  } catch (err) {
    console.error("❌ getCourses error:", err)
    throw err
  }
})

const getCourseById = createServerFn({ method: "GET" })
  .validator((data: { courseId: string }) => data)
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    const { courseId: id } = data

    try {
      const course = await prisma.course.findFirst({
        where: { id },
        select: {
          code: true,
          name: true,
          description: true,
          teacher: { select: { id:true,firstName: true, lastName: true, image: true } },
          assignments: {
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
          },

          _count: {
            select: { assignments: true, enrollments: true },
          },
        },
      })
      return course
    } catch (err) {
      console.error("❌ getCourses error:", err)
      throw err
    }
  })

const enrollInCourse = createServerFn({ method: "POST" })
  .validator((data: { courseId: string }) => data)
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    const { courseId } = data

    try {
      const enrollment = await prisma.enrollment.create({
        data: { courseId, studentId: session.user.id },
      })
      return enrollment
    } catch (err) {
      console.error("❌ enrollInCourse error:", err)
      throw err
    }
  })

const getStudentEnrollments = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: session.user.id,
      },
      select: {
        id: true,
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            teacher: {
              select: { firstName: true, lastName: true, image: true },
            },
            _count: { select: { assignments: true } },
          },
        },
      },
      orderBy: { course: { name: "asc" } },
    })

    return enrollments
  },
)

const getTeacherCourses = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    const courses = await prisma.course.findMany({
      where: {
        teacherId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        teacher: {
          select: { id: true, firstName: true, lastName: true, image: true },
        },
        _count: { select: { assignments: true, enrollments: true } },
      },
      orderBy: { name: "asc" },
    })

    return courses
  },
)

export {
  createCourse,
  deleteCourse,
  getCourses,
  getCourseById,
  getStudentEnrollments,
  getTeacherCourses,
  enrollInCourse,
}
