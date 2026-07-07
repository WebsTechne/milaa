import { createServerFn } from "@tanstack/react-start"
import { prisma } from "#/db"
import { getSession } from "#/lib/auth-session"

const createAssignmentAttachments = createServerFn({ method: "POST" })
  .validator(
    (data: {
      assignmentId: string
      attachments: {
        fileType: string
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

const createSubmissionAttachments = createServerFn({ method: "POST" })
  .validator(
    (data: {
      submissionId: string
      attachments: {
        fileType: string
        url: string
        position: number
      }[]
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    const { submissionId, attachments } = data

    await prisma.submissionAttachment.createMany({
      data: attachments.map(({ fileType, url, position }) => ({
        submissionId,
        fileType,
        url,
        position,
      })),
    })
  })

export { createAssignmentAttachments, createSubmissionAttachments }
