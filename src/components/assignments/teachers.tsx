import { getTeacherAssignments } from "#/server/assignments"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { TeacherAssignmentCard } from "./teacher-card"
import { authClient } from "#/lib/auth-client"
import { Button } from "../ui/button"

import { useState } from "react"
import { NewAssignmentSheet } from "./new-assignment"
import { IconPlus } from "@tabler/icons-react"
import { useHeaderStore } from "#/lib/store"
import { Link, useParams, useRouterState } from "@tanstack/react-router"
import { Spinner } from "../ui/spinner"

function TeacherAssignmentsPage() {
  const routerState = useRouterState()

  const { data: session, isPending: authPending } = authClient.useSession()
  const queryClient = useQueryClient()
  const [newOpen, setNewOpen] = useState<boolean>(false)

  const setTitleSlot = useHeaderStore((s) => s.setTitleSlot)

  const { data: assignments = [], isPending } = useQuery({
    queryKey: ["assignments", "list"],
    queryFn: () => getTeacherAssignments(),
  })

  if (authPending || (!!session && isPending))
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
      <section className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {isPending ? (
          /* {Array.from({ length: 3 }).map((_, i) => (
          <CollectionCardSkeleton key={i} />
        ))} */
          <></>
        ) : assignments.length < 1 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed bg-transparent p-4 shadow-none">
            <p className="py-4 text-center">No assignments found.</p>
            <Button onClick={() => setNewOpen(true)}>Create assignment</Button>
          </div>
        ) : (
          <>
            {assignments.map((assignment) => (
              <TeacherAssignmentCard
                key={assignment.id}
                assignment={assignment}
                session={session}
              />
            ))}
          </>
        )}
      </section>

      <Button
        size="icon-lg"
        className="fixed right-4 bottom-4 size-12 rounded-full"
        onClick={() => setNewOpen(true)}
      >
        <IconPlus strokeWidth={2.5} className="size-6!" />
      </Button>

      <NewAssignmentSheet open={newOpen} onOpenChange={setNewOpen} />
    </>
  )
}
export { TeacherAssignmentsPage }
