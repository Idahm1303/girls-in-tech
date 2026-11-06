"use server";

import { hash } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DUPLICATE_EMAIL_ERROR,
  registrationSchema,
  welcomeFlashSchema,
  type FormActionState,
} from "@/lib/account-validation";
import { prisma } from "@/lib/prisma";
import { registerStudent } from "@/lib/member-service";

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

export async function registerAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = registrationSchema.safeParse({
    name: formData.get("name"),
    surname: formData.get("surname"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    consent: formData.get("consent") === "on",
  });

  if (!parsed.success) return { errors: firstFieldErrors(parsed.error) };

  const passwordHash = await hash(parsed.data.password, 12);
  const result = await registerStudent(parsed.data, passwordHash, {
    async emailExists(email) {
      return Boolean(
        await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: { id: true },
        }),
      );
    },
    async createStudent(input) {
      await prisma.user.create({
        data: {
          name: input.name,
          surname: input.surname,
          email: input.email,
          passwordHash: input.passwordHash,
          role: "STUDENT",
          consentAt: new Date(),
          studentProfile: { create: {} },
        },
        select: { id: true },
      });
    },
  });

  if (!result.ok) {
    return {
      errors: { email: result.message ?? DUPLICATE_EMAIL_ERROR },
    };
  }

  const flash = welcomeFlashSchema.parse({
    name: parsed.data.name,
    surname: parsed.data.surname,
    email: parsed.data.email,
  });
  (await cookies()).set("git-welcome", JSON.stringify(flash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/login",
    maxAge: 120,
  });

  redirect("/login");
}
