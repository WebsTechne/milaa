import { createServerFn } from "@tanstack/react-start"
import { prisma } from "#/db"
import { getSession } from "#/lib/auth-session"

const createSubmission = createServerFn({ method: "POST" })
  .validator((data: { assignmentId: string; note?: string }) => data)
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    try {
      const submission = await prisma.submission.create({
        data: {
          studentId: session.user.id,
          assignmentId: data.assignmentId,
          note: data.note,
        },
      })
      return submission
    } catch (err) {
      console.error("❌ createSubmission error:", err)
      throw err
    }
  })

const deleteSubmission = createServerFn({ method: "POST" })
  .validator((data: { submissionId: string }) => data)
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    await prisma.submission.delete({
      where: {
        id: data.submissionId,
        studentId: session.user.id, // only creator can delete
      },
    })
  })

export { createSubmission, deleteSubmission }
