import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  description?: string;
  children: ReactNode;
}

export function FilterSheet({ open, onClose, onApply, onReset, description, children }: FilterSheetProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="sheet"
      title="Filters"
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onReset}>
            Reset
          </Button>
          <Button
            onClick={() => {
              onApply();
              onClose();
            }}
          >
            Show results
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-7">{children}</div>
    </Dialog>
  );
}
