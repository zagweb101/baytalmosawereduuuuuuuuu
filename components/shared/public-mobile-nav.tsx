"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PublicMobileNavProps = {
  links: { href: string; label: string }[];
};

export function PublicMobileNav({ links }: PublicMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-white/5 backdrop-blur-sm transition-colors duration-300 hover:bg-white/10"
        aria-expanded={open}
        aria-controls="public-mobile-menu"
        aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div
        className={cn(
          "fixed inset-0 top-16 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />

      <nav
        id="public-mobile-menu"
        className={cn(
          "absolute top-16 inset-x-0 z-50 border-b border-border/50 bg-[#07070f]/95 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
          open
            ? "translate-y-0 opacity-100"
            : "-translate-y-2 pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
      >
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-lg px-3 py-3 text-sm transition-colors duration-300 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
