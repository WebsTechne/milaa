import type { ServerSession } from "#/lib/types"
import type { AssignmentListData } from "#/server/assignments"
import { Link } from "@tanstack/react-router"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"

function TeacherAssignmentCard({
  assignment,
  session,
}: {
  assignment: AssignmentListData
  session: ServerSession
}) {
  return (
    <Link
      to="/assignments/$assignmentId"
      params={{ assignmentId: assignment.id }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="truncate">{assignment.title}</CardTitle>
          {assignment.description && (
            <CardDescription className="line-clamp-3">
              {assignment.description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </Link>
  )
}

export { TeacherAssignmentCard }
