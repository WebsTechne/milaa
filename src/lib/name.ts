export default function getInitials(name: string) {
  const nameParts = name.split(" ")
  const firstName = nameParts[0] ?? ""
  const lastName = nameParts.at(-1) ?? ""
  const initials = nameParts
    .filter(Boolean)
    .map((n) => n.charAt(0).toUpperCase())
    .join("")

  return { firstName, lastName, initials }
}
