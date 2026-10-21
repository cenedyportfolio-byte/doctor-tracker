"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useCurrentUser } from "@/features/auth/api";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav-items";
import { RoleBadge, UserCard } from "./user-card";

export function Sidebar() {
  const user = useCurrentUser();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" aria-label="Doctor Tracker home">
          <Logo />
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-subtle uppercase">Menu</p>
        {/* The pathname is request data on dynamic routes, so the active state streams in. */}
        <Suspense fallback={<NavList pathname={null} />}>
          <ActiveNavList />
        </Suspense>
      </nav>

      <div className="space-y-3 border-t border-border p-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted">Access</span>
          {user && <RoleBadge role={user.role} />}
        </div>
        <UserCard />
      </div>
    </aside>
  );
}

function ActiveNavList() {
  return <NavList pathname={usePathname()} />;
}

function NavList({ pathname }: { pathname: string | null }) {
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                active ? "bg-primary-soft text-primary-soft-foreground" : "text-muted hover:bg-surface-3 hover:text-foreground",
              )}
            >
              <Icon
                className={cn("size-[18px]", active ? "" : "text-subtle group-hover:text-foreground")}
                aria-hidden="true"
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
