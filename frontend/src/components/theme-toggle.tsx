import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/store";

export function ThemeToggle() {
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-lg border border-border bg-surface hover:bg-surface-2 transition-colors"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon className="h-[1.1rem] w-[1.1rem] text-foreground" />
      ) : (
        <Sun className="h-[1.1rem] w-[1.1rem] text-foreground" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
