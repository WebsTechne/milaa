import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/assignments/$assignmentId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/assignments/$assignmentId"!</div>
}
