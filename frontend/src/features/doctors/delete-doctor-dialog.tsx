import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { errorMessage } from "@/lib/api-client";
import { pluralize } from "@/lib/utils";
import { useDeleteDoctor } from "./api";
import type { Doctor } from "./types";

interface DeleteDoctorDialogProps {
  doctor: Pick<Doctor, "id" | "name" | "patientCount"> | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteDoctorDialog({ doctor, onClose, onDeleted }: DeleteDoctorDialogProps) {
  const deleteDoctor = useDeleteDoctor();

  if (doctor && doctor.patientCount > 0) {
    return (
      <Dialog
        open
        onClose={onClose}
        title="Doctor still has patients"
        size="sm"
        footer={<Button onClick={onClose}>Got it</Button>}
      >
        <p className="text-sm leading-relaxed text-muted">
          <strong className="text-foreground">{doctor.name}</strong> has{" "}
          {pluralize(doctor.patientCount, "patient")}. Reassign or remove them before deleting this doctor.
        </p>
      </Dialog>
    );
  }

  return (
    <ConfirmDialog
      open={doctor !== null}
      onClose={onClose}
      title="Delete doctor?"
      confirmLabel="Delete doctor"
      loading={deleteDoctor.isPending}
      description={
        <>
          <strong className="text-foreground">{doctor?.name}</strong> will be permanently removed from the
          directory. This can&apos;t be undone.
        </>
      }
      onConfirm={() => {
        if (!doctor) return;
        deleteDoctor.mutate(doctor.id, {
          onSuccess: () => {
            toast.success("Doctor deleted", { description: `${doctor.name} was removed.` });
            onClose();
            onDeleted?.();
          },
          onError: (error) => toast.error("Couldn't delete doctor", { description: errorMessage(error) }),
        });
      }}
    />
  );
}
