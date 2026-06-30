import { getStudentAssignments } from "#/server/assignments"
import { useQuery } from "@tanstack/react-query"
import { AssignmentCardSkeleton, AssignmentCard } from "./teacher-card"
import { authClient } from "#/lib/auth-client"
import { Button } from "../ui/button"

import { useState } from "react"
import { useHeaderStore } from "#/lib/store"
import { Link, useParams, useRouterState } from "@tanstack/react-router"
import { Spinner } from "../ui/spinner"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"
import { IconSearch } from "@tabler/icons-react"

function StudentAssignmentsPage() {
  const routerState = useRouterState()

  const { data: session, isPending: authPending } = authClient.useSession()

  const setTitleSlot = useHeaderStore((s) => s.setTitleSlot)

  const { data: assignments = [], isPending } = useQuery({
    queryKey: ["assignments", "list"],
    queryFn: () => getStudentAssignments(),
  })

  if (authPending)
    return (
      <div className="flex-center h-[calc(100dvh-16px-48px)]">
        <Spinner className="size-7" />
      </div>
    )

  if (!session) {
    setTitleSlot("Sign in required")

    return (
      <div className="flex-center h-[calc(100dvh-48px-56px)] px-5">
        <div>
          <h1 className="font-heading mb-2 text-4xl font-bold">
            Sign in required
          </h1>
          <p className="text-muted-foreground max-w-prose text-base md:text-lg">
            Sign in to continue. Once you're signed in, you'll be able to access
            this page and everything it contains. Sign in at the{" "}
            <Link
              to="/auth/sign-in"
              search={{ redirect: routerState.location.href }}
              className="text-foreground! whitespace-nowrap underline underline-offset-4"
            >
              Sign in
            </Link>{" "}
            page
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <section className="mt-4">
        <form className="flex-between mx-auto w-full max-w-2xl gap-4">
          <InputGroup className="h-10">
            <InputGroupAddon>
              <IconSearch />
            </InputGroupAddon>
            <InputGroupInput placeholder="Assignment Code" />
          </InputGroup>
          <Button className="h-10 px-4">Search</Button>
        </form>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {isPending ? (
          Array.from({ length: 3 }).map((_, i) => (
            <AssignmentCardSkeleton key={i} />
          ))
        ) : assignments.length < 1 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed bg-transparent p-4 shadow-none">
            <p className="py-4 text-center">No assignments found.</p>
          </div>
        ) : (
          <>
            {assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                session={session}
              />
            ))}
          </>
        )}
      </section>
    </>
  )
}

export { StudentAssignmentsPage }
