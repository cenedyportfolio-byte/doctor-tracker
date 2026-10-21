"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/features/auth/api";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav-items";
import { RoleBadge } from "./user-card";

/** Top bar for small screens: logo + account menu. */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/85 px-4 backdrop-blur-md lg:hidden">
      <Link href="/dashboard" aria-label="Doctor Tracker home">
        <Logo />
      </Link>
      <AccountMenu />
    </header>
  );
}

function AccountMenu() {
  const user = useCurrentUser();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Account menu"
        className="flex cursor-pointer rounded-full ring-offset-2 ring-offset-surface"
      >
        <Avatar name={user?.name ?? "?"} size="sm" />
      </button>

      {open && (
        <div className="absolute top-11 right-0 w-64 animate-scale-in rounded-2xl border border-border bg-surface p-3 shadow-overlay">
          {user && (
            <div className="mb-3 flex items-center gap-3 px-1">
              <Avatar name={user.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
                <div className="mt-1">
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start"
            onClick={() => logout.mutate()}
            loading={logout.isPending}
          >
            {!logout.isPending && <LogOut className="size-4" />}
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
}

/** Bottom tab bar for small screens. */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <Suspense fallback={<TabList pathname={null} />}>
        <ActiveTabList />
      </Suspense>
    </nav>
  );
}

function ActiveTabList() {
  return <TabList pathname={usePathname()} />;
}

function TabList({ pathname }: { pathname: string | null }) {
  return (
    <ul className="grid grid-cols-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                active ? "text-primary" : "text-subtle hover:text-foreground",
              )}
            >
              <span
                className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-primary-soft")}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
