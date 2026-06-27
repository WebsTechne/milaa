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

    setHour(String(hours))
    setMinute(String(minutes))
  }, [selectedDate])

  function emit(date: Date | undefined, h = hour, m = minute, p = period) {
    if (!date) {
      onChange(undefined)
      return
    }

    const next = new Date(date)

    const hourValue = Number(h || 12)
    const minutes = Number(m || 0)

    let hours = hourValue

    if (p === "PM" && hours < 12) hours += 12
    if (p === "AM" && hours === 12) hours = 0

    next.setHours(hours)
    next.setMinutes(minutes)
    next.setSeconds(0)
    next.setMilliseconds(0)

    onChange(next)
  }

  return (
    <div className={cn("rounded-lg border", className)}>
      <Calendar
        mode="single"
        month={month}
        onMonthChange={onMonthChange}
        selected={selectedDate}
        onSelect={(date) => {
          emit(date)
        }}
        className="w-full rounded-t-lg"
      />

      <div className="flex h-max items-center gap-1 border-t">
        <Input
          value={hour}
          maxLength={2}
          type="tel"
          inputMode="numeric"
          placeholder="HH"
          className="flex-1 rounded-tl-none border-none! bg-transparent! text-center"
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 2)
            if (value !== "" && Number(value) > 12) return

            setHour(value)

            if (value.length === 2) {
              minuteRef.current?.focus()
            }

            emit(selectedDate, value)
          }}
          onBlur={() => {
            if (!hour) return

            const padded = hour.length === 1 ? `0${hour}` : hour
            setHour(padded)
            emit(selectedDate, padded)
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
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 2)
            if (value !== "" && Number(value) > 59) return

            setMinute(value)
            emit(selectedDate, hour, value)
          }}
          onBlur={() => {
            if (!minute) return

            const padded = minute.length === 1 ? `0${minute}` : minute
            setMinute(padded)
            emit(selectedDate, padded)
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
          <SelectTrigger className="flex-1 rounded-tr-none border-none! bg-transparent!">
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
