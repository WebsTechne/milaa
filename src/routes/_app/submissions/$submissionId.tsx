import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/submissions/$submissionId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/submissions/$submissionId"!</div>
}
