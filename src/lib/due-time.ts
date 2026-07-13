import {
  addDays,
  addWeeks,
  addMonths,
  isSameDay,
  differenceInCalendarDays,
  format,
} from "date-fns"

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

type DueData = {
  label: string
  heading: string
  urgency: "urgent" | "soon" | "normal"
}

const getDueLabel = (date: Date): DueData => {
  const daysTill = differenceInCalendarDays(date, new Date())

  const weeksTill = Math.round(daysTill / 7)

  const monthsTill = Math.round(daysTill / 30)

  // overdue
  if (daysTill < 0) {
    if (daysTill >= -13)
      return {
        label: `Overdue (${Math.abs(daysTill)} day${daysTill === -1 && "s"})`,
        heading: "Overdue",
        urgency: "urgent",
      }
    return {
      label: `Overdue since ${format(date, "MMM d")}`,
      heading: `${format(date, "MMM d")}`,
      urgency: "urgent",
    }
  }

  // due today or tomorrow
  if (daysTill === 0)
    return { label: "Due today", heading: "Today", urgency: "urgent" }
  if (daysTill === 1)
    return { label: "Due tomorrow", heading: "Tomorrow", urgency: "urgent" }

  // this week
  if (daysTill < 3)
    return {
      label: `Due in ${daysTill} days`,
      heading: `${daysTill} days`,
      urgency: "soon",
    }
  if (daysTill < 7)
    return {
      label: `Due in ${daysTill} days`,
      heading: `${daysTill} days`,
      urgency: "soon",
    }
  if (daysTill === 7)
    return { label: `Due in 1 week`, heading: "1 week", urgency: "soon" }

  // next week
  if (daysTill < 14)
    return {
      label: `Due in ${daysTill} days`,
      heading: `${daysTill} days`,
      urgency: "normal",
    }

  // weeks
  if (daysTill < 28)
    return {
      label: `Due in ${weeksTill} week${weeksTill !== 1 ? "s" : ""}`,
      heading: `${weeksTill} week${weeksTill !== 1 ? "s" : ""}`,
      urgency: "normal",
    }

  // months
  if (daysTill < 90)
    return {
      label: `Due in ${monthsTill} month${monthsTill !== 1 ? "s" : ""}`,
      heading: `${monthsTill} month${monthsTill !== 1 ? "s" : ""}`,
      urgency: "normal",
    }

  // beyond 3 months
  return {
    label: `Due ${format(date, "MMM d")}`,
    heading: `${format(date, "MMM d")}`,
    urgency: "normal",
  }
}

export { isDueIn, getDueLabel }
