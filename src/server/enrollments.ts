import { createServerFn } from "@tanstack/react-start"
import { prisma } from "#/db"
import { getSession } from "#/lib/auth-session"
import type { Prisma } from "#/generated/prisma/client"

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
          },
        },
      },
      orderBy: { course: { name: "asc" } },
    })

    return enrollments
  },
)

export { getStudentEnrollments }
