import Link from "next/link";
import { NavLinks } from "./nav";

/** Fixed sidebar on large screens; on smaller screens the top bar opens the same links in a drawer. */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-12 items-center border-b border-border px-4">
        <Link href="/dashboard" className="text-sm font-semibold text-foreground">
          Doctor Tracker
        </Link>
      </div>
      <nav aria-label="Main" className="flex-1 p-2">
        <NavLinks />
      </nav>
    </aside>
  );
}
