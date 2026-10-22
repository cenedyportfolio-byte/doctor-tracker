import Link from "next/link";
import { Logo } from "./logo";
import { NavLinks } from "./nav";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-12 items-center border-b border-border px-4">
        <Link href="/dashboard" className="rounded-lg">
          <Logo />
        </Link>
      </div>
      <nav aria-label="Main" className="flex-1 p-2">
        <NavLinks />
      </nav>
    </aside>
  );
}
