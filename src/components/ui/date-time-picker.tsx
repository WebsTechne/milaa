import { useEffect, useRef, useState } from "react"
import { Calendar } from "#/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select"
import { Input } from "#/components/ui/input"
import { cn } from "#/lib/utils"

type DateTimePickerProps = {
  value?: Date
  onChange: (date: Date | undefined) => void
  className?: string
  month: Date
  onMonthChange: (month: Date) => void
}

export function DateTimePicker({
  value: selectedDate,
  onChange,
  className,
  month,
  onMonthChange,
}: DateTimePickerProps) {
  const [hour, setHour] = useState("")
  const [minute, setMinute] = useState("")
  const [period, setPeriod] = useState<"AM" | "PM">("PM")

  const minuteRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!selectedDate) return

    let hours = selectedDate.getHours()
    const minutes = selectedDate.getMinutes()

    const isPm = hours >= 12
    setPeriod(isPm ? "PM" : "AM")

    hours = hours % 12
    if (hours === 0) hours = 12

    const nextHour = String(hours).padStart(2, "0")
    const nextMinute = String(minutes).padStart(2, "0")

    setHour((prev) => (prev === nextHour ? prev : nextHour))
    setMinute((prev) => (prev === nextMinute ? prev : nextMinute))
  }, [selectedDate])

  function emit(date: Date | undefined, h = hour, m = minute, p = period) {
    if (!date) {
      onChange(undefined)
      return
    }

    const next = new Date(date)

    const hourValue = Math.max(1, Number(h || 12))
    const minutes = Math.min(59, Number(m || 0))

    let hours = hourValue

    if (p === "PM" && hours < 12) hours += 12
    if (p === "AM" && hours === 12) hours = 0

    next.setHours(hours)
    next.setMinutes(minutes)
    next.setSeconds(0)
    next.setMilliseconds(0)

    onChange(next)
  }

  function handleNumberInput(
    value: string,
    max: number,
    setter: (value: string) => void,
    next?: () => void,
  ) {
    const digits = value.replace(/\D/g, "").slice(0, 2)

    if (digits.length === 2 && Number(digits) > max) return

    setter(digits)

    if (digits.length === 2) {
      next?.()
    }
  }

  return (
    <div className={cn("rounded-lg border", className)}>
      <Calendar
        mode="single"
        month={month}
        onMonthChange={onMonthChange}
        selected={selectedDate}
        onSelect={(date) => {
          emit(date, hour, minute, period)
        }}
        className="w-full rounded-t-lg"
      />

      <div className="flex h-max items-center gap-1 border-t p-1">
        <Input
          value={hour}
          maxLength={2}
          type="tel"
          inputMode="numeric"
          placeholder="HH"
          className="flex-1 border-none! bg-transparent! text-center"
          onFocus={(e) => {
            e.target.select()
          }}
          onChange={(e) =>
            handleNumberInput(e.target.value, 12, setHour, () => {
              requestAnimationFrame(() => {
                minuteRef.current?.focus()
              })
            })
          }
          onBlur={() => {
            const padded = hour === "" ? "12" : hour.padStart(2, "0")

            setHour(padded)
            emit(selectedDate, padded, minute)
          }}
        />
        :
        <Input
          ref={minuteRef}
          value={minute}
          maxLength={2}
          type="tel"
          inputMode="numeric"
          placeholder="MM"
          className="flex-1 border-none! bg-transparent! text-center"
          onFocus={(e) => {
            e.target.select()
          }}
          onChange={(e) => handleNumberInput(e.target.value, 59, setMinute)}
          onBlur={() => {
            const padded = minute === "" ? "00" : minute.padStart(2, "0")

            setMinute(padded)
            emit(selectedDate, hour, padded)
          }}
        />
        <div className="bg-border h-4 w-px" />
        <Select
          value={period}
          onValueChange={(value) => {
            const next = value as "AM" | "PM"
            setPeriod(next)
            emit(selectedDate, hour, minute, next)
          }}
        >
          <SelectTrigger className="flex-1 border-none! bg-transparent!">
            <SelectValue />
          </SelectTrigger>

          <SelectContent className="min-w-0!">
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
