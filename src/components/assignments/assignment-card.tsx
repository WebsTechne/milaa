import type { ServerSession } from "#/lib/types"
import type { AssignmentListData } from "#/server/assignments"
import { Link } from "@tanstack/react-router"
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { cn } from "#/lib/utils"
import { getDueLabel } from "#/lib/due-time"
import { Button } from "../ui/button"
import {
  IconCheck,
  IconClock,
  IconCopy,
  IconDotsVertical,
  IconEdit,
  IconFileCheck,
  IconTrash,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { copyToClipboard } from "#/lib/copy-to-clipboard"
import { useState } from "react"
import { toast } from "sonner"
import { Skeleton } from "../ui/skeleton"

function AssignmentCardSkeleton() {
  return (
    <div className="bg-card ring-foreground/10 relative h-46.5 w-full rounded-xl ring-1">
      <Skeleton className="size-full"></Skeleton>
      <div className="bg-muted absolute right-4 bottom-4 z-2 h-7.5 w-23.5 rounded-full border" />
    </div>
  )
}

function AssignmentCard({
  assignment,
  session,
}: {
  assignment: AssignmentListData
  session: ServerSession
}) {
  if (!session) return null

  const [isCopying, setIsCopying] = useState(false)

  const {
    id,
    title,
    description,
    course,
    dueAt,
    maxScore,
    teacher,
    assignmentCode,
  } = assignment

  const dueLabel = getDueLabel(dueAt)
  const isStudent = teacher.id !== session.user.id

  const handleCopyCode = async () => {
    const success = await copyToClipboard(assignmentCode)

    if (success) {
      toast.success("Code copied to clipboard")
      setIsCopying(true)
      setTimeout(() => setIsCopying(false), 2000)
    } else {
      toast.error("Failed to copy code")
    }
  }

  return (
    <Link to="/assignments/$assignmentId" params={{ assignmentId: id }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex-between items-start gap-1">
            <span className="line-clamp-2">{title}</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  />
                }
              >
                <IconDotsVertical className="size-5!" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-max min-w-45">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleCopyCode()
                  }}
                >
                  {isCopying ? <IconCheck /> : <IconCopy />} Copy code
                </DropdownMenuItem>

                {!isStudent && (
                  <>
                    <DropdownMenuItem>
                      <IconEdit />
                      Edit assignment
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      <IconFileCheck />
                      View submissions
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem variant="destructive">
                      <IconTrash />
                      Delete assignment
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
          {description && (
            <CardDescription className="line-clamp-3">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <div className="flex-between px-4">
          <span className="">
            {course.name} •{" "}
            <span className="font-bold">
              {maxScore} mark{maxScore !== 1 && "s"}
            </span>
          </span>

          <span
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-1 text-sm",
              dueLabel.urgency === "urgent"
                ? "border-red-700/50 bg-red-500/10 text-red-500"
                : dueLabel.urgency === "soon"
                  ? "border-amber-700/50 bg-amber-500/10 text-amber-500"
                  : "text-muted-foreground bg-muted",
            )}
          >
            <IconClock size={16} />
            {dueLabel.heading}
          </span>
        </div>
      </Card>
    </Link>
  )
}

export { AssignmentCardSkeleton, AssignmentCard }
