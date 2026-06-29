import { addDays, addWeeks, addMonths, isSameDay } from "date-fns"

function isDueIn(
  date: Date | undefined,
  amount: number,
  unit: "days" | "weeks" | "months",
) {
  if (!date) return false

  const today = new Date()

  const target =
    unit === "days"
      ? addDays(today, amount)
      : unit === "weeks"
        ? addWeeks(today, amount)
        : addMonths(today, amount)

  return isSameDay(date, target)
}

type DueData = { label: string; urgent: boolean }

const getDueLabel = (date: Date): DueData => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (isSameDay(date, today)) return { label: "Due today", urgent: true }
  if (isSameDay(date, tomorrow)) return { label: "Due tomorrow", urgent: true }

  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  )
    return { label: "Due this month", urgent: false }
}

export { isDueIn, getDueLabel }
