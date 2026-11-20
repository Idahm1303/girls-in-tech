import "server-only";
import sharp from "sharp";
import { createQrSvg } from "@/lib/qr-svg";

export async function createQrPng(value: string) {
  return sharp(Buffer.from(createQrSvg(value))).png().toBuffer();
}
