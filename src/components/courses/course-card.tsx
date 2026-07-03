import getInitials from "#/lib/name"
import { Link } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import { IconClipboardText, IconTrash, IconUser } from "@tabler/icons-react"
import { Button } from "../ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { useState } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { deleteCourse } from "#/server/courses"

const CourseCard = ({
  userId,
  course,
}: {
  userId: string
  course: {
    id: string
    name: string
    description: string | null
    teacher: {
      id?: string
      firstName: string
      lastName: string
      image: string | null
    }
    _count: { assignments: number; enrollments?: number }
  }
}) => {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    toast.loading("Deleting course...", { id: "delete-course" })
    try {
      await deleteCourse({ data: { courseId: course.id } })
      toast.success("Course deleted successfully", { id: "delete-course" })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      setDeleteOpen(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete course", { id: "delete-course" })
      setDeleteOpen(false)
    }
  }
  const { initials } = getInitials(
    `${course.teacher.firstName} ${course.teacher.lastName}`,
  )
  const isTeacher = userId === course.teacher.id
  return (
    <>
      <Link to="/courses/$courseId" params={{ courseId: course.id }}>
        <Card>
          <CardHeader>
            <CardTitle>{course.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {course.description ?? (
              <span className="text-muted-foreground">No name set</span>
            )}
          </CardContent>
          <div className="flex-between gap-2 px-4">
            {!isTeacher ? (
              <>
                <div className="flex items-center gap-2">
                  <Avatar className="size-7">
                    {course.teacher.image && (
                      <AvatarImage
                        src={course.teacher.image}
                        alt={`${course.teacher.firstName} ${course.teacher.lastName}`}
                      />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{`${course.teacher.firstName} ${course.teacher.lastName}`}</span>
                </div>

                <span className="text-muted-foreground bg-muted flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
                  <IconClipboardText size={16} />
                  {course._count.assignments}
                </span>
              </>
            ) : (
              <>
                <div className="flex-center gap-2">
                  <span className="text-muted-foreground bg-muted flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
                    <IconUser size={16} />
                    {course._count.enrollments}
                  </span>

                  <span className="text-muted-foreground bg-muted flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
                    <IconClipboardText size={16} />
                    {course._count.assignments}
                  </span>
                </div>

                <Button
                  size="icon-sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDeleteOpen(true)
                  }}
                >
                  <IconTrash size={16} />
                </Button>
              </>
            )}
          </div>
        </Card>
      </Link>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {course.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {course.name}? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { CourseCard }
