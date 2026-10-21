"use client";

import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser, useLogout } from "@/features/auth/api";

export function RoleBadge({ role }: { role: "admin" | "viewer" }) {
  return role === "admin" ? <Badge tone="primary">Admin</Badge> : <Badge tone="neutral">Read-only</Badge>;
}

export function UserCard() {
  const user = useCurrentUser();
  const logout = useLogout();

  if (!user) {
    return (
      <div className="flex items-center gap-3 p-2" aria-hidden="true">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl p-2">
      <Avatar name={user.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
        </div>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => logout.mutate()}
        loading={logout.isPending}
        aria-label="Sign out"
        title="Sign out"
      >
        {!logout.isPending && <LogOut className="size-4" />}
      </Button>
    </div>
  );
}
