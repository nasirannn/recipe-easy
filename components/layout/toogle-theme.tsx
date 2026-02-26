import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import { Moon, Sun } from "lucide-react";

export const ToggleTheme = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = resolvedTheme === "light" ? "light" : "dark";
  const nextTheme = currentTheme === "light" ? "dark" : "light";
  return (
    <Button
      onClick={() => setTheme(nextTheme)}
      size="icon"
      variant="ghost"
      className="h-10 w-10 cursor-pointer rounded-full transition-colors duration-200 hover:bg-transparent"
      style={{ transform: 'translateZ(0)', willChange: 'transform' }}
    >
      {mounted ? (
        currentTheme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />
      ) : (
        <Sun className="size-5 opacity-0" aria-hidden="true" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
