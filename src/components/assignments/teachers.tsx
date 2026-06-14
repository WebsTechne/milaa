import { getTeacherAssignments } from "#/server/assignments"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { TeacherAssignmentCard } from "./teacher-card"
import { authClient } from "#/lib/auth-client"
import { Card, CardAction, CardFooter } from "../ui/card"
import { Button } from "../ui/button"

import { useState } from "react"
import { NewAssignmentSheet } from "./new-assignment"

function TeacherAssignmentsPage() {
  const { data: session, isPending: authPending } = authClient.useSession()
  const queryClient = useQueryClient()
  const [newOpen, setNewOpen] = useState<boolean>(false)

  const { data: assignments = [], isPending } = useQuery({
    queryKey: ["assignments", "list"],
    queryFn: () => getTeacherAssignments(),
  })

  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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

      <NewAssignmentSheet open={newOpen} onOpenChange={setNewOpen} />
    </>
  )
}
export { TeacherAssignmentsPage }
