"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * `modal` is centered; `sheet` slides in from the right (bottom on small screens);
   * `drawer` slides in from the left at full height (navigation on small screens).
   */
  variant?: "modal" | "sheet" | "drawer";
  size?: "sm" | "md" | "lg";
  /** Blocks closing via Escape / backdrop, e.g. while a request is in flight. */
  dismissible?: boolean;
}

const MODAL_SIZES = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" } as const;

/**
 * Accessible dialog built on the native <dialog> element: the browser provides the focus
 * trap, inert background, Escape handling and top-layer stacking.
 * Content is only mounted while open, so forms inside start fresh every time.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "modal",
  size = "md",
  dismissible = true,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const pointerDownOnBackdrop = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const requestClose = () => {
    if (dismissible) onClose();
  };

  const isSheet = variant === "sheet";
  const isDrawer = variant === "drawer";

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault(); // keep React state as the source of truth
        requestClose();
      }}
      onPointerDown={(event) => {
        pointerDownOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        // Only close when the whole click happened on the backdrop (not a text-selection drag).
        if (pointerDownOnBackdrop.current && event.target === event.currentTarget) requestClose();
      }}
      className={cn(
        "m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 text-foreground",
        "backdrop:bg-black/40 open:flex",
        isDrawer
          ? "items-stretch justify-start"
          : isSheet
            ? "items-end justify-end sm:items-stretch"
            : "items-end justify-center sm:items-center sm:p-6",
      )}
    >
      {open && (
        <div
          className={cn(
            "flex max-h-[92dvh] w-full flex-col bg-surface shadow-overlay",
            isDrawer
              ? "h-dvh max-h-none max-w-72 animate-slide-in-left"
              : isSheet
                ? "animate-slide-in-up rounded-t-lg sm:h-dvh sm:max-h-none sm:max-w-md sm:animate-slide-in-right sm:rounded-none"
                : cn("animate-slide-in-up rounded-t-lg sm:animate-scale-in sm:rounded-lg", MODAL_SIZES[size]),
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-0.5 text-sm text-muted">
                  {description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={requestClose}
              disabled={!dismissible}
              aria-label="Close dialog"
              className="-mr-2"
            >
              <X className="size-4.5" />
            </Button>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <footer className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6 [&>button]:w-full sm:[&>button]:w-auto">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
