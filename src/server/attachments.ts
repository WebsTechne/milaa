import { createServerFn } from "@tanstack/react-start"
import { prisma } from "#/db"
import { getSession } from "#/lib/auth-session"

const createAssignmentAttachments = createServerFn({ method: "POST" })
  .validator(
    (data: {
      assignmentId: string
      attachments: {
        fileType: string
        fileName: string
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
        fileName: string
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
      data: attachments.map(({ fileType, fileName, url, position }) => ({
        submissionId,
        fileType,
        fileName,
        url,
        position,
      })),
    })
  })

const deleteAssignmentAttachments = createServerFn({ method: "POST" })
	.validator((data: { attachmentIds: string[] }) => data)
	.handler(async ({ data }) => {
		const session = await getSession()
		if (!session) throw new Error("Unauthorized")

		try {
			await prisma.assignmentAttachment.deleteMany({
				where: {
					id: {
						in: data.attachmentIds,
					},
				},
			})
		} catch (err) {
      console.error(err)
      throw new Error("Failed to delete")
    }
	})

const deleteSubmissionAttachments = createServerFn({ method: "POST" })
	.validator((data: { attachmentIds: string[] }) => data)
	.handler(async ({ data }) => {
		const session = await getSession()
		if (!session) throw new Error("Unauthorized")

		try {
			await prisma.submissionAttachment.deleteMany({
				where: {
					id: {
						in: data.attachmentIds,
					},
				},
			})
		} catch (err) {
      console.error(err)
      throw new Error("Failed to delete")
    }
	})

export { createAssignmentAttachments, createSubmissionAttachments, deleteAssignmentAttachments, deleteSubmissionAttachments }
