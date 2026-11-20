"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/member-access";
import { isPrismaUniqueViolation } from "@/lib/member-service";
import { prisma } from "@/lib/prisma";
import { qrDestinationSchema, qrSlugSchema } from "@/lib/qr-public-url";

const qrCodeFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: qrSlugSchema,
  destinationPath: qrDestinationSchema,
  isActive: z.boolean(),
});

const qrIdSchema = z.string().trim().min(1).max(128);

function readQrForm(formData: FormData) {
  return qrCodeFormSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    destinationPath: formData.get("destinationPath"),
    isActive: formData.get("isActive") === "on",
  });
}

function refreshQrPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/qr-codes");
}

export async function createQrCodeAction(formData: FormData) {
  await requireAdmin();
  const parsed = readQrForm(formData);
  if (!parsed.success) redirect("/admin/qr-codes?error=invalid");

  let saveError: "slug-taken" | "save" | null = null;
  try {
    await prisma.qrCode.create({ data: parsed.data });
  } catch (error) {
    saveError = isPrismaUniqueViolation(error) ? "slug-taken" : "save";
    if (saveError === "save") console.error("Could not create QR code.", error);
  }
  if (saveError) redirect(`/admin/qr-codes?error=${saveError}`);

  refreshQrPages();
  redirect("/admin/qr-codes?created=1");
}

export async function updateQrCodeAction(formData: FormData) {
  await requireAdmin();
  const id = qrIdSchema.safeParse(formData.get("id"));
  const parsed = readQrForm(formData);
  if (!id.success || !parsed.success) {
    redirect("/admin/qr-codes?error=invalid");
  }

  let saveError: "slug-taken" | "save" | "not-found" | null = null;
  try {
    const result = await prisma.qrCode.updateMany({
      where: { id: id.data },
      data: parsed.data,
    });
    if (result.count === 0) saveError = "not-found";
  } catch (error) {
    saveError = isPrismaUniqueViolation(error) ? "slug-taken" : "save";
    if (saveError === "save") console.error("Could not update QR code.", error);
  }
  if (saveError) redirect(`/admin/qr-codes?error=${saveError}`);

  refreshQrPages();
  redirect("/admin/qr-codes?updated=1");
}

export async function setQrCodeActiveAction(formData: FormData) {
  await requireAdmin();
  const id = qrIdSchema.safeParse(formData.get("id"));
  const isActive = formData.get("isActive") === "true";
  if (!id.success) redirect("/admin/qr-codes?error=invalid");

  let updated = 0;
  let updateFailed = false;
  try {
    const result = await prisma.qrCode.updateMany({
      where: { id: id.data },
      data: { isActive },
    });
    updated = result.count;
  } catch (error) {
    console.error("Could not change QR code status.", error);
    updateFailed = true;
  }
  if (updateFailed) redirect("/admin/qr-codes?error=save");
  if (updated === 0) redirect("/admin/qr-codes?error=not-found");

  refreshQrPages();
  redirect("/admin/qr-codes?updated=1");
}

export async function deleteQrCodeAction(formData: FormData) {
  await requireAdmin();
  const id = qrIdSchema.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/qr-codes?error=invalid");

  let deleted = 0;
  let deleteFailed = false;
  try {
    const result = await prisma.qrCode.deleteMany({
      where: { id: id.data },
    });
    deleted = result.count;
  } catch (error) {
    console.error("Could not delete QR code.", error);
    deleteFailed = true;
  }
  if (deleteFailed) redirect("/admin/qr-codes?error=delete");
  if (deleted === 0) redirect("/admin/qr-codes?error=not-found");

  refreshQrPages();
  redirect("/admin/qr-codes?deleted=1");
}
