"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, fieldMessageId } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError, errorMessage } from "@/lib/api-client";
import { authKeys, useLogin } from "./api";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof loginSchema>;

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login")
    ? value
    : "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const expired = searchParams.get("expired") === "1";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: (response) => {
        queryClient.setQueryData(authKeys.session, response);
        router.replace(safeNext(searchParams.get("next")));
      },
    });
  });

  const formError =
    login.error instanceof ApiError && login.error.status === 429
      ? login.error.message
      : login.error
        ? errorMessage(login.error)
        : null;

  return (
    <div className="w-full">
      {expired && !login.error && (
        <p role="status" className="mb-4 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted">
          Your session has expired. Please sign in again.
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? fieldMessageId("email") : undefined}
            {...register("email")}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message} required>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="pr-10"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? fieldMessageId("password") : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-subtle hover:bg-surface-2 hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        {formError && (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" loading={login.isPending || login.isSuccess} className="mt-1 w-full">
          {login.isPending || login.isSuccess ? "Signing in…" : "Sign in"}
        </Button>
      </form>

    </div>
  );
}
