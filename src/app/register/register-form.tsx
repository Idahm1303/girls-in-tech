"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { registerAction } from "./actions";
import {
  registrationSchema,
  type FormActionState,
} from "@/lib/account-validation";

const initialState: FormActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="account-submit" disabled={pending} type="submit">
      {pending ? "Creating your account…" : "Join Girls in Tech"}
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const errors = { ...state.errors, ...clientErrors };

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = registrationSchema.safeParse({
      name: formData.get("name"),
      surname: formData.get("surname"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      consent: formData.get("consent") === "on",
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
    <form action={formAction} className="account-form" noValidate onSubmit={validateBeforeSubmit}>
      {state.message && (
        <p className="form-message" role="alert">
          {state.message}
        </p>
      )}
      {(["name", "surname", "email"] as const).map((field) => {
        const label =
          field === "name" ? "Name" : field === "surname" ? "Surname" : "Email";
        const type = field === "email" ? "email" : "text";
        return (
          <div className="form-field" key={field}>
            <label htmlFor={`register-${field}`}>{label}</label>
            <input
              autoComplete={
                field === "email" ? "email" : field === "name" ? "given-name" : "family-name"
              }
              id={`register-${field}`}
              name={field}
              type={type}
              required
              aria-invalid={Boolean(errors[field])}
              aria-describedby={errors[field] ? `register-${field}-error` : undefined}
            />
            {errors[field] && (
              <p className="field-error" id={`register-${field}-error`}>
                {errors[field]}
              </p>
            )}
          </div>
        );
      })}

      <div className="form-field">
        <label htmlFor="register-password">Password</label>
        <div className="password-input-wrap">
          <input
            autoComplete="new-password"
            id="register-password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            minLength={8}
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "register-password-error" : undefined}
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
        {errors.password ? (
          <p className="field-error" id="register-password-error">
            {errors.password}
          </p>
        ) : (
          <p className="field-hint">Use at least 8 characters.</p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="register-confirm-password">Confirm password</label>
        <div className="password-input-wrap">
          <input
            autoComplete="new-password"
            id="register-confirm-password"
            name="confirmPassword"
            type={confirmVisible ? "text" : "password"}
            required
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "register-confirm-password-error" : undefined
            }
          />
          <button
            aria-label={confirmVisible ? "Hide confirmation password" : "Show confirmation password"}
            aria-pressed={confirmVisible}
            className="password-toggle"
            onClick={() => setConfirmVisible(!confirmVisible)}
            type="button"
          >
            {confirmVisible ? "Hide" : "Show"}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="field-error" id="register-confirm-password-error">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <div className="consent-field">
        <input
          aria-invalid={Boolean(errors.consent)}
          aria-describedby={errors.consent ? "register-consent-error" : undefined}
          id="register-consent"
          name="consent"
          type="checkbox"
          required
        />
        <label htmlFor="register-consent">
          I agree to GiT storing my details for programme purposes (POPIA)
        </label>
      </div>
      {errors.consent && (
        <p className="field-error" id="register-consent-error">
          {errors.consent}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
