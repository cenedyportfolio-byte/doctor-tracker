import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, fieldMessageId } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SPECIALIZATIONS } from "@/lib/constants";
import { handleFormError } from "@/lib/form-errors";
import { useCreateDoctor, useDoctorFacets, useUpdateDoctor } from "./api";
import type { Doctor } from "./types";

const doctorSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
  specialization: z.enum(SPECIALIZATIONS, { error: "Choose a specialization" }),
  hospital: z.string().trim().min(2, "Hospital is required").max(120, "Hospital name is too long"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-().]{7,20}$/, "Enter a valid phone number"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
});
type DoctorFormValues = z.infer<typeof doctorSchema>;
const FIELDS = ["name", "specialization", "hospital", "phone", "email"] as const;

export type DoctorFormState = { mode: "create" } | { mode: "edit"; doctor: Doctor } | null;

interface DoctorFormDialogProps {
  state: DoctorFormState;
  onClose: () => void;
}

export function DoctorFormDialog({ state, onClose }: DoctorFormDialogProps) {
  const editing = state?.mode === "edit" ? state.doctor : null;
  return (
    <Dialog
      open={state !== null}
      onClose={onClose}
      title={editing ? "Edit doctor" : "Add doctor"}
      description={editing ? `Update ${editing.name}'s details.` : "Add a doctor to the directory."}
    >
      {state && <DoctorForm key={editing?.id ?? "new"} doctor={editing} onDone={onClose} />}
    </Dialog>
  );
}

function DoctorForm({ doctor, onDone }: { doctor: Doctor | null; onDone: () => void }) {
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor(doctor?.id ?? "");
  const { data: facets } = useDoctorFacets();
  const pending = createDoctor.isPending || updateDoctor.isPending;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: doctor
      ? {
          name: doctor.name,
          specialization: doctor.specialization,
          hospital: doctor.hospital,
          phone: doctor.phone,
          email: doctor.email,
        }
      : { name: "", hospital: "", phone: "", email: "" },
  });

  const onSubmit = handleSubmit((values) => {
    const onError = (error: unknown) => handleFormError(error, setError, FIELDS);

    if (!doctor) {
      createDoctor.mutate(values, {
        onSuccess: (created) => {
          toast.success("Doctor added", { description: `${created.name} is now in the directory.` });
          onDone();
        },
        onError,
      });
      return;
    }

    // PATCH only what changed.
    const changes = Object.fromEntries(
      FIELDS.filter((field) => dirtyFields[field]).map((field) => [field, values[field]]),
    );
    if (Object.keys(changes).length === 0) {
      onDone();
      return;
    }
    updateDoctor.mutate(changes, {
      onSuccess: (updated) => {
        toast.success("Changes saved", { description: `${updated.name}'s profile was updated.` });
        onDone();
      },
      onError,
    });
  });

  const describedBy = (field: keyof DoctorFormValues) => (errors[field] ? fieldMessageId(field) : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Full name" htmlFor="name" error={errors.name?.message} required>
        <Input
          id="name"
          autoComplete="off"
          placeholder="e.g. Sarah Chen"
          autoFocus
          aria-invalid={!!errors.name}
          aria-describedby={describedBy("name")}
          {...register("name")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Specialization" htmlFor="specialization" error={errors.specialization?.message} required>
          <Select
            id="specialization"
            aria-invalid={!!errors.specialization}
            aria-describedby={describedBy("specialization")}
            {...register("specialization")}
          >
            <option value="">Select…</option>
            {SPECIALIZATIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Hospital" htmlFor="hospital" error={errors.hospital?.message} required>
          <Input
            id="hospital"
            list="hospital-suggestions"
            autoComplete="off"
            placeholder="e.g. Riverside General"
            aria-invalid={!!errors.hospital}
            aria-describedby={describedBy("hospital")}
            {...register("hospital")}
          />
          <datalist id="hospital-suggestions">
            {facets?.hospitals.map((h) => <option key={h} value={h} />)}
          </datalist>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="off"
            placeholder="name@hospital.com"
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email")}
            {...register("email")}
          />
        </Field>

        <Field label="Phone" htmlFor="phone" error={errors.phone?.message} required>
          <Input
            id="phone"
            type="tel"
            autoComplete="off"
            placeholder="+1 (555) 000-0000"
            aria-invalid={!!errors.phone}
            aria-describedby={describedBy("phone")}
            {...register("phone")}
          />
        </Field>
      </div>

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {doctor ? "Save changes" : "Add doctor"}
        </Button>
      </div>
    </form>
  );
}
