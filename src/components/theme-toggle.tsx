import { cn } from "#/lib/utils"
import { useTanStackTheme } from "@space-man/react-theme-animation"
import { Button } from "./ui/button"
import { IconBrightness } from "@tabler/icons-react"

const ThemeToggle = ({ className }: { className?: string }) => {
  const { ref, toggleTheme } = useTanStackTheme()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon-lg"
      className={cn("rounded-full", className)}
      onClick={() => toggleTheme()}
    >
      <IconBrightness strokeWidth={2} className="size-5" />
    </Button>
  )
}

export { ThemeToggle }
