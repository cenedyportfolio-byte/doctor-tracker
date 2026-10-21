"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav-items";

interface NavLinksProps {
  /** Called after a link is chosen, e.g. to close the mobile drawer. */
  onNavigate?: () => void;
}

/**
 * Main navigation. The pathname is request data on dynamic routes (/doctors/[id]), so the
 * active state streams in behind a Suspense boundary instead of blocking the static shell.
 */
export function NavLinks({ onNavigate }: NavLinksProps) {
  return (
    <Suspense fallback={<NavList pathname={null} onNavigate={onNavigate} />}>
      <ActiveNavList onNavigate={onNavigate} />
    </Suspense>
  );
}

function ActiveNavList({ onNavigate }: NavLinksProps) {
  return <NavList pathname={usePathname()} onNavigate={onNavigate} />;
}

function NavList({ pathname, onNavigate }: NavLinksProps & { pathname: string | null }) {
  return (
    <ul className="space-y-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                active
                  ? "bg-primary-soft font-medium text-primary-soft-foreground"
                  : "text-muted hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
