import { createServerFn } from "@tanstack/react-start"
import { prisma } from "#/db"
import { getSession } from "#/lib/auth-session"

const createCourse = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; name: string }) => data)
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    try {
      const course = await prisma.course.create({
        data: { code: data.code, name: data.name, teacherId: session.user.id },
      })
      return course
    } catch (err) {
      console.error("❌ createCourse error:", err)
      throw err
    }
  })

const getCourses = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await prisma.course.findMany({
      select: { code: true, name: true },
      orderBy: { name: "asc" },
    })
    return data
  } catch (err) {
    console.error("❌ getCourses error:", err)
    throw err
  }
})

export { createCourse, getCourses }
