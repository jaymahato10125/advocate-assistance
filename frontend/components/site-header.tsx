"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Scale, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [{ href: "/dashboard", label: "Dashboard" }];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          aria-label="Advocate Contracts — home"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scale className="size-4.5" aria-hidden="true" />
          </span>
          <span className="font-display text-lg leading-none font-semibold tracking-tight">
            Advocate
            <span className="ml-1.5 font-sans text-sm font-medium text-muted-foreground">
              Contracts
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <Show when="signed-in">
            {NAV_LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </Show>
          <div className="ml-2 flex items-center gap-2">
            <ModeToggle />
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button size="sm">Sign in</Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Button asChild size="sm">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
              <UserButton />
            </Show>
          </div>
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.nav
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-border/60 md:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              <Show when="signed-in">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <Button className="mt-1">Sign in</Button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <Button asChild className="mt-1">
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
                <div className="mt-2 flex items-center gap-2 px-1">
                  <UserButton />
                  <span className="text-sm text-muted-foreground">Account</span>
                </div>
              </Show>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
