import { createServerFn } from "@tanstack/react-start"
import { prisma } from "#/db"

const updateUserProfile = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      userId: string
      firstName: string
      lastName: string
      image?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    return prisma.user.update({
      where: { id: data.userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        image: data.image,
      },
    })
  })

const deleteUser = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    return prisma.user.delete({
      where: { id: data.userId },
    })
  })

export { updateUserProfile, deleteUser }
