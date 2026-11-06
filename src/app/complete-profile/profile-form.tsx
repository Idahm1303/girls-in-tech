"use client";

import { useActionState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import {
  CAMPUS_OPTIONS,
  studentProfileSchema,
  type FormActionState,
} from "@/lib/account-validation";
import { completeProfileAction } from "./actions";

const initialState: FormActionState = {};

const campusLabels = {
  SOSHANGUVE: "Soshanguve",
  EMALAHLENI: "Emalahleni",
  POLOKWANE: "Polokwane",
  GIYANE: "Giyane",
} as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="account-submit" disabled={pending} type="submit">
      {pending ? "Saving your details…" : "Save and continue"}
    </button>
  );
}

export function ProfileForm() {
  const [state, formAction] = useActionState(completeProfileAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const errors = { ...state.errors, ...clientErrors };

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = studentProfileSchema.safeParse({
      studentNumber: formData.get("studentNumber"),
      campus: formData.get("campus"),
      qualification: formData.get("qualification"),
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
      <div className="form-field">
        <label htmlFor="student-number">Student number</label>
        <input
          autoComplete="off"
          id="student-number"
          inputMode="numeric"
          maxLength={9}
          name="studentNumber"
          pattern="[0-9]{9}"
          required
          aria-invalid={Boolean(errors.studentNumber)}
          aria-describedby={
            errors.studentNumber ? "student-number-error" : "student-number-hint"
          }
        />
        {errors.studentNumber ? (
          <p className="field-error" id="student-number-error">
            {errors.studentNumber}
          </p>
        ) : (
          <p className="field-hint" id="student-number-hint">
            Enter exactly 9 digits.
          </p>
        )}
      </div>
      <div className="form-field">
        <label htmlFor="campus">Campus</label>
        <select
          defaultValue=""
          id="campus"
          name="campus"
          required
          aria-invalid={Boolean(errors.campus)}
          aria-describedby={errors.campus ? "campus-error" : undefined}
        >
          <option disabled value="">
            Select your campus
          </option>
          {CAMPUS_OPTIONS.map((campus) => (
            <option key={campus} value={campus}>
              {campusLabels[campus]}
            </option>
          ))}
        </select>
        {errors.campus && (
          <p className="field-error" id="campus-error">
            {errors.campus}
          </p>
        )}
      </div>
      <div className="form-field">
        <label htmlFor="qualification">Course / qualification you are studying</label>
        <input
          autoComplete="organization-title"
          id="qualification"
          name="qualification"
          required
          aria-invalid={Boolean(errors.qualification)}
          aria-describedby={errors.qualification ? "qualification-error" : undefined}
        />
        {errors.qualification && (
          <p className="field-error" id="qualification-error">
            {errors.qualification}
          </p>
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
