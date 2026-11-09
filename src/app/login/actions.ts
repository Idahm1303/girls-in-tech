"use server";

import { CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/../auth";
import {
  loginSchema,
  type FormActionState,
} from "@/lib/account-validation";

function firstFieldErrors(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}

export async function loginAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { errors: firstFieldErrors(parsed.error) };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/login/continue",
    });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { message: "Email or password is incorrect. Please try again." };
    }
    throw error;
  }

  redirect("/login/continue");
}
