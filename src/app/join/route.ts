import { redirectForQrSlug } from "@/lib/qr-redirect";

export function GET(request: Request) {
  return redirectForQrSlug(request, "main");
}
