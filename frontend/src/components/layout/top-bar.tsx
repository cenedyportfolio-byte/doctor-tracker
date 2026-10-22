"use client";

import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useCurrentUser, useLogout } from "@/features/auth/api";
import { Logo } from "./logo";
import { NavLinks } from "./nav";

/** Slim bar above the content: the signed-in user and logout (plus the menu button on small screens). */
export function TopBar() {
  const user = useCurrentUser();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between gap-3 border-b border-border bg-surface px-3 sm:px-4 lg:px-6">
      <div className="flex items-center gap-1 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
        <Link href="/dashboard" className="rounded-lg">
          <Logo />
        </Link>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {user && (
          <p className="hidden text-sm sm:block">
            <span className="font-medium text-foreground">{user.name}</span>
            <span className="text-muted"> · {user.role === "admin" ? "Admin" : "Viewer (read-only)"}</span>
          </p>
        )}
        <Button variant="secondary" size="sm" onClick={() => logout.mutate()} loading={logout.isPending}>
          {!logout.isPending && <LogOut className="size-3.5" />}
          Log out
        </Button>
      </div>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} variant="drawer" title="Doctor Tracker">
        <nav aria-label="Main" className="-mx-2">
          <NavLinks onNavigate={() => setMenuOpen(false)} />
        </nav>
        {user && (
          <p className="mt-6 border-t border-border pt-4 text-sm">
            <span className="block font-medium text-foreground">{user.name}</span>
            <span className="text-muted">{user.role === "admin" ? "Admin" : "Viewer (read-only)"}</span>
          </p>
        )}
      </Dialog>
    </header>
  );
}
