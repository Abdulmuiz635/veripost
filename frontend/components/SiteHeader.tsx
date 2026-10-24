"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";
import { LinkButton } from "./ui";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="VeriPost home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 sm:flex">
          <Link
            href="/demo"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            Live demo
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            Dashboard
          </Link>
          <LinkButton href="/demo" variant="primary" className="px-4 py-2">
            Try it
          </LinkButton>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-fg transition-colors hover:bg-card-raised sm:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <path d="M6 6l12 12M18 6 6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <nav
          id="mobile-menu"
          className="animate-fade-up border-t border-border bg-bg px-4 pb-4 pt-2 sm:hidden"
        >
          <Link
            href="/demo"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-3 text-base font-medium text-fg transition-colors hover:bg-card-raised"
          >
            Live demo
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-3 text-base font-medium text-fg transition-colors hover:bg-card-raised"
          >
            Dashboard
          </Link>
          <LinkButton href="/demo" variant="primary" className="mt-2 w-full">
            Try it
          </LinkButton>
        </nav>
      )}
    </header>
  );
}
