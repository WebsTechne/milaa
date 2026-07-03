import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { prisma } from "#/db"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      role: {
        type: ["STUDENT", "TEACHER", "ADMIN"],
        required: false,
        defaultValue: "STUDENT",
        input: false,
      },
      firstName: {
        type: "string",
        required: true,
        input: true,
      },
      lastName: {
        type: "string",
        required: true,
        input: true,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
  },

  trustedOrigins: [
    "mila://*",
    "http://localhost:3001",
    "http://10.146.147.24:3000",
  ],

  plugins: [tanstackStartCookies()],
})
