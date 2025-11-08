/**
 * THEME TOGGLE COMPONENT
 * 
 * A simple toggle button for switching between light and dark themes.
 * Uses next-themes for theme management.
 * 
 * @module components/common/ThemeToggle
 */

"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
        <span className="sr-only">Loading theme</span>
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="transition-all duration-200"
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-5 w-5 text-yellow-500" />
                <span className="sr-only">Switch to light mode</span>
              </>
            ) : (
              <>
                <Moon className="h-5 w-5 text-blue-600" />
                <span className="sr-only">Switch to dark mode</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
