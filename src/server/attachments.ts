import { createServerFn } from "@tanstack/react-start"
import { prisma } from "#/db"
import { getSession } from "#/lib/auth-session"

const createAssignmentAttachments = createServerFn({ method: "POST" })
  .validator(
    (data: {
      assignmentId: string
      attachments: {
        url: string
        position: number
      }[]
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    const { assignmentId, attachments } = data

    await prisma.assignmentAttachment.createMany({
      data: attachments.map(({ url, position }) => ({
        assignmentId,
        url,
        position,
      })),
    })
  })

export { createAssignmentAttachments }
