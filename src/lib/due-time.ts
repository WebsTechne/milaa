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

  if (isSameDay(date, today)) return { label: "Due today", urgent: true }
  if (isSameDay(date, tomorrow)) return { label: "Due tomorrow", urgent: true }

  // if () return { label: "", urgent: false }

  if (date.getFullYear() === today.getFullYear())
    if (date.getDate() < today.getDate() + 7)
      return { label: "Due this week", urgent: false }
}

export { isDueIn, getDueLabel }
