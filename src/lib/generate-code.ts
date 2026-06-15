import { prisma } from "#/db"
import { getSession } from "#/lib/auth-session"
import { createServerFn } from "@tanstack/react-start"

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

export const generateCode = createServerFn({ method: "GET" })
  .validator((data: { course: string; length?: number }) => data)
  .handler(async ({ data }) => {
    const session = await getSession()

    if (!session) {
      throw new Error("Unauthorized")
    }

    const { course, length = 6 } = data

    while (true) {
      const code = Array.from(
        { length },
        () => CHARS[Math.floor(Math.random() * CHARS.length)],
      ).join("")

      const assignmentCode = `${course.toUpperCase()}-${code}`

      const existing = await prisma.assignment.findUnique({
        where: {
          assignmentCode,
        },
        select: {
          id: true,
        },
      })

      if (!existing) {
        return assignmentCode
      }
    }
  })
