"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Skeleton className="size-9 rounded-md" aria-hidden="true" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle color theme">
          <Sun className="size-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")} aria-checked={theme === "light"}>
          <Sun /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} aria-checked={theme === "dark"}>
          <Moon /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} aria-checked={theme === "system"}>
          <Monitor /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
