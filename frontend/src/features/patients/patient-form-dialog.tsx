import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type DefaultValues } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, fieldMessageId } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DoctorPicker, type PickedDoctor } from "@/features/doctors/doctor-picker";
import { CONDITION_META, CONDITIONS, CONDITIONS_BY_SEVERITY, GENDER_LABEL, GENDERS } from "@/lib/constants";
import { handleFormError } from "@/lib/form-errors";
import { toDateInputValue } from "@/lib/utils";
import { useCreatePatient, useUpdatePatient } from "./api";
import type { Patient, PatientInput } from "./types";

const patientSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
  age: z
    .number({ error: "Enter an age" })
    .int("Whole numbers only")
    .min(0, "Can't be negative")
    .max(120, "Must be 120 or less"),
  gender: z.enum(GENDERS, { error: "Choose a gender" }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-().]{7,20}$/, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.union([z.literal(""), z.email("Enter a valid email address")])),
  diagnosis: z.string().trim().min(2, "Diagnosis is required").max(120, "Diagnosis is too long"),
  condition: z.enum(CONDITIONS, { error: "Choose a condition" }),
  admissionDate: z
    .string()
    .min(1, "Choose the admission date")
    .refine((day) => day <= toDateInputValue(), "Admission date can't be in the future"),
  notes: z.string().trim().max(1000, "Keep notes under 1,000 characters"),
  doctor: z
    .object({ id: z.string(), name: z.string() })
    .nullable()
    .refine((doctor) => doctor !== null, "Choose a doctor"),
});

type PatientFormValues = z.input<typeof patientSchema>;
type PatientFormOutput = z.output<typeof patientSchema>;

const FIELDS = [
  "name",
  "age",
  "gender",
  "phone",
  "email",
  "diagnosis",
  "condition",
  "admissionDate",
  "notes",
  "doctor",
] as const;

export type PatientFormState = { mode: "create"; doctor?: PickedDoctor } | { mode: "edit"; patient: Patient } | null;

interface PatientFormDialogProps {
  state: PatientFormState;
  onClose: () => void;
}

export function PatientFormDialog({ state, onClose }: PatientFormDialogProps) {
  const patient = state?.mode === "edit" ? state.patient : null;
  const fixedDoctor = state?.mode === "create" ? state.doctor : undefined;

  return (
    <Dialog
      open={state !== null}
      onClose={onClose}
      size="lg"
      title={patient ? "Edit patient" : "Add patient"}
      description={
        patient
          ? `Update ${patient.name}'s record.`
          : fixedDoctor
            ? `New patient under ${fixedDoctor.name}.`
            : "Register a new patient and assign a doctor."
      }
    >
      {state && (
        <PatientForm key={patient?.id ?? "new"} patient={patient} fixedDoctor={fixedDoctor} onDone={onClose} />
      )}
    </Dialog>
  );
}

function defaultsFor(patient: Patient | null, fixedDoctor?: PickedDoctor): DefaultValues<PatientFormValues> {
  if (patient) {
    return {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email ?? "",
      diagnosis: patient.diagnosis,
      condition: patient.condition,
      admissionDate: toDateInputValue(patient.admissionDate),
      notes: patient.notes ?? "",
      doctor: patient.doctor,
    };
  }
  return {
    name: "",
    phone: "",
    email: "",
    diagnosis: "",
    condition: "stable",
    admissionDate: toDateInputValue(),
    notes: "",
    doctor: fixedDoctor ?? null,
  };
}

function PatientForm({
  patient,
  fixedDoctor,
  onDone,
}: {
  patient: Patient | null;
  fixedDoctor?: PickedDoctor;
  onDone: () => void;
}) {
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const pending = createPatient.isPending || updatePatient.isPending;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<PatientFormValues, unknown, PatientFormOutput>({
    resolver: zodResolver(patientSchema),
    defaultValues: defaultsFor(patient, fixedDoctor),
  });

  const onSubmit = handleSubmit((values) => {
    const input: PatientInput = { ...values, doctor: values.doctor!.id };
    const onError = (error: unknown) => handleFormError(error, setError, FIELDS);

    if (!patient) {
      createPatient.mutate(input, {
        onSuccess: (created) => {
          toast.success("Patient added", {
            description: `${created.name} was added under ${created.doctor?.name ?? "the doctor"}.`,
          });
          onDone();
        },
        onError,
      });
      return;
    }

    const changes: Partial<PatientInput> = Object.fromEntries(
      FIELDS.filter((field) => dirtyFields[field]).map((field) => [field, input[field]]),
    );
    if (Object.keys(changes).length === 0) {
      onDone();
      return;
    }
    updatePatient.mutate(
      { id: patient.id, input: changes },
      {
        onSuccess: (updated) => {
          toast.success("Changes saved", { description: `${updated.name}'s record was updated.` });
          onDone();
        },
        onError,
      },
    );
  });

  const a11y = (field: (typeof FIELDS)[number]) => ({
    "aria-invalid": !!errors[field],
    "aria-describedby": errors[field] ? fieldMessageId(field) : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_7rem_9rem]">
        <Field label="Full name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" autoComplete="off" placeholder="e.g. Maya Patel" autoFocus {...a11y("name")} {...register("name")} />
        </Field>
        <Field label="Age" htmlFor="age" error={errors.age?.message} required>
          <Input
            id="age"
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            {...a11y("age")}
            {...register("age", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Gender" htmlFor="gender" error={errors.gender?.message} required>
          <Select id="gender" {...a11y("gender")} {...register("gender")}>
            <option value="">Select…</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {GENDER_LABEL[g]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" htmlFor="phone" error={errors.phone?.message} required>
          <Input id="phone" type="tel" autoComplete="off" placeholder="+1 (555) 000-0000" {...a11y("phone")} {...register("phone")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="off" placeholder="patient@example.com" {...a11y("email")} {...register("email")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Diagnosis" htmlFor="diagnosis" error={errors.diagnosis?.message} required>
          <Input id="diagnosis" autoComplete="off" placeholder="e.g. Hypertension" {...a11y("diagnosis")} {...register("diagnosis")} />
        </Field>
        <Field label="Condition" htmlFor="condition" error={errors.condition?.message} required>
          <Select id="condition" {...a11y("condition")} {...register("condition")}>
            {CONDITIONS_BY_SEVERITY.map((c) => (
              <option key={c} value={c}>
                {CONDITION_META[c].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Admission date" htmlFor="admissionDate" error={errors.admissionDate?.message} required>
          <Input
            id="admissionDate"
            type="date"
            max={toDateInputValue()}
            {...a11y("admissionDate")}
            {...register("admissionDate")}
          />
        </Field>
        {!fixedDoctor && (
          <Field label="Doctor" htmlFor="doctor" error={errors.doctor?.message} required>
            <Controller
              control={control}
              name="doctor"
              render={({ field }) => (
                <DoctorPicker
                  id="doctor"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  invalid={!!errors.doctor}
                  describedBy={errors.doctor ? fieldMessageId("doctor") : undefined}
                />
              )}
            />
          </Field>
        )}
      </div>

      <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
        <Textarea id="notes" rows={3} placeholder="Allergies, follow-ups, anything the team should know…" {...a11y("notes")} {...register("notes")} />
      </Field>

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {patient ? "Save changes" : "Add patient"}
        </Button>
      </div>
    </form>
  );
}
