"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Info, LogIn } from "lucide-react";
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

// Seeded by `npm run seed`; shown so reviewers can try both roles without looking anything up.
const DEMO_ACCOUNTS = [
  { label: "Admin", description: "Full access", email: "admin@doctortracker.dev", password: "Admin@12345" },
  { label: "Viewer", description: "Read-only", email: "viewer@doctortracker.dev", password: "Viewer@12345" },
] as const;

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
    setValue,
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

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
  };

  const formError =
    login.error instanceof ApiError && login.error.status === 429
      ? login.error.message
      : login.error
        ? errorMessage(login.error)
        : null;

  return (
    <div className="w-full">
      {expired && !login.error && (
        <p
          role="status"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary-soft px-3.5 py-3 text-sm text-primary-soft-foreground"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Your session has expired. Please sign in again.
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@hospital.com"
            className="h-10"
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
              placeholder="••••••••"
              className="h-10 pr-10"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? fieldMessageId("password") : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-subtle hover:bg-surface-2 hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger-soft-foreground"
          >
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" loading={login.isPending || login.isSuccess} className="mt-1 h-11 w-full rounded-lg">
          {!login.isPending && !login.isSuccess && <LogIn className="size-4" />}
          {login.isPending || login.isSuccess ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-8">
        <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-subtle uppercase">
          <span className="h-px flex-1 bg-border" />
          Demo accounts
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.label}
              type="button"
              onClick={() => fillDemo(account)}
              className="cursor-pointer rounded-lg border border-border bg-surface px-3.5 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft"
            >
              <span className="block text-sm font-semibold text-foreground">{account.label}</span>
              <span className="block text-xs text-muted">{account.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
