"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { makeQueryClient } from "@/lib/query-client";

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // A fresh client per server render keeps requests isolated; the browser reuses one.
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
      <Toaster
        position="top-right"
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "!rounded-md !border !border-border !bg-surface !text-foreground !shadow-overlay !font-sans",
            description: "!text-muted",
            closeButton: "!border-border !bg-surface !text-muted",
            success: "[&_[data-icon]]:!text-status-good",
            error: "[&_[data-icon]]:!text-status-critical",
          },
        }}
      />
    </QueryClientProvider>
  );
}
