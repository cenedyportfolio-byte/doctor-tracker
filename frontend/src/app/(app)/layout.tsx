import { MobileHeader, MobileTabBar } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

/** Authenticated app shell. Access is enforced by `src/proxy.ts` before this renders. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <MobileHeader />
      <div className="lg:pl-64">
        <main id="main" className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
