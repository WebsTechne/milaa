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

export { isDueIn }
