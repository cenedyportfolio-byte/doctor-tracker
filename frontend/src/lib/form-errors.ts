import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { ApiError, errorMessage } from "./api-client";

/**
 * Maps API validation/conflict errors onto form fields (e.g. 409 "email already in use"
 * appears under the email input). Anything that can't be attached to a field becomes a toast.
 */
export function handleFormError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: ReadonlyArray<Path<T>>,
  fallbackTitle = "Couldn't save changes",
) {
  if (error instanceof ApiError && error.details.length > 0) {
    let mapped = false;
    for (const detail of error.details) {
      const field = fields.find((f) => f === detail.path);
      if (field) {
        setError(field, { type: "server", message: detail.message }, { shouldFocus: !mapped });
        mapped = true;
      }
    }
    if (mapped) return;
  }
  toast.error(fallbackTitle, { description: errorMessage(error) });
}
