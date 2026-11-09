"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";
import { loginSchema, type FormActionState } from "@/lib/account-validation";

const initialState: FormActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="account-submit" disabled={pending} type="submit">
      {pending ? "Logging in…" : "Log in"}
    </button>
  );
}

export function LoginForm({
  initialEmail,
  showRegisterLink = true,
}: {
  initialEmail: string;
  showRegisterLink?: boolean;
}) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const errors = { ...state.errors, ...clientErrors };

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      event.preventDefault();
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "form");
        nextErrors[field] ??= issue.message;
      }
      setClientErrors(nextErrors);
      return;
    }

    setClientErrors({});
  }

  return (
    <>
      <form action={formAction} className="account-form" noValidate onSubmit={validateBeforeSubmit}>
        {state.message && (
          <p className="form-message" role="alert">
            {state.message}
          </p>
        )}
        <div className="form-field">
          <label htmlFor="login-email">Email</label>
          <input
            autoComplete="username"
            defaultValue={initialEmail}
            id="login-email"
            name="email"
            type="email"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
          />
          {errors.email && (
            <p className="field-error" id="login-email-error">
              {errors.email}
            </p>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="login-password">Password</label>
          <div className="password-input-wrap">
            <input
              autoComplete="current-password"
              id="login-password"
              name="password"
              type={passwordVisible ? "text" : "password"}
              required
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
            />
            <button
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              aria-pressed={passwordVisible}
              className="password-toggle"
              onClick={() => setPasswordVisible(!passwordVisible)}
              type="button"
            >
              {passwordVisible ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <p className="field-error" id="login-password-error">
              {errors.password}
            </p>
          )}
        </div>
        <div className="forgot-link-row">
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
        <SubmitButton />
      </form>
      {showRegisterLink && (
        <p className="account-switch">
          New here? <Link href="/register">Join GiT</Link>
        </p>
      )}
    </>
  );
}
