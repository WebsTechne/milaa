import { cn } from "#/lib/utils"
import { useSpacemanTheme } from "@space-man/react-theme-animation"
import { Button } from "./ui/button"

const ThemeToggle = ({ className }: { className?: string }) => {
  const { ref, toggleTheme } = useSpacemanTheme()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon-lg"
      className={cn("rounded-full", className)}
      onClick={() => toggleTheme()}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-6!"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
        <path d="M12 3l0 18" />
        <path d="M12 9l4.65 -4.65" />
        <path d="M12 14.3l7.37 -7.37" />
        <path d="M12 19.6l8.85 -8.85" />
      </svg>
    </Button>
  )
}

export { ThemeToggle }
