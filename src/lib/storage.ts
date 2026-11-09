import "server-only";
import sharp from "sharp";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;
const MAX_STORED_SIZE = 200 * 1024;

export class StorageValidationError extends Error {}

function detectImageMimeType(bytes: Buffer) {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function storeMentorPhoto(
  transaction: Prisma.TransactionClient,
  ownerId: string,
  file: File,
) {
  if (file.size === 0 || file.size > MAX_UPLOAD_SIZE) {
    throw new StorageValidationError("Choose an image smaller than 2 MB.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const mimeType = detectImageMimeType(input);
  if (!mimeType) {
    throw new StorageValidationError("Upload a valid JPG, PNG, or WebP image.");
  }

  const image = sharp(input, { limitInputPixels: 25_000_000 });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new StorageValidationError("The uploaded image could not be read.");
  }
  if (
    (mimeType === "image/jpeg" && metadata.format !== "jpeg") ||
    (mimeType === "image/png" && metadata.format !== "png") ||
    (mimeType === "image/webp" && metadata.format !== "webp")
  ) {
    throw new StorageValidationError("The image content does not match its file type.");
  }

  let optimized: Buffer | undefined;
  for (const quality of [82, 72, 62, 52, 42, 32]) {
    optimized = await sharp(input, { limitInputPixels: 25_000_000 })
      .rotate()
      .resize({ width: 600, withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toBuffer();
    if (optimized.byteLength <= MAX_STORED_SIZE) break;
  }
  if (!optimized || optimized.byteLength > MAX_STORED_SIZE) {
    throw new StorageValidationError(
      "This image cannot be compressed to 200 KB. Choose a simpler image.",
    );
  }

  const stored = await transaction.storedFile.create({
    data: {
      ownerId,
      kind: "MENTOR_PROFILE_PHOTO",
      mimeType: "image/webp",
      size: optimized.byteLength,
      data: Uint8Array.from(optimized),
    },
    select: { id: true },
  });
  return stored.id;
}

export async function getStoredFile(id: string) {
  return prisma.storedFile.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      kind: true,
      mimeType: true,
      size: true,
      data: true,
      owner: {
        select: {
          role: true,
          mentorProfile: { select: { status: true } },
        },
      },
    },
  });
}

export async function deleteStoredFile(
  transaction: Prisma.TransactionClient,
  id: string,
  ownerId: string,
) {
  await transaction.storedFile.deleteMany({ where: { id, ownerId } });
}
