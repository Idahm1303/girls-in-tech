import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/member-access";
import { createQrPng } from "@/lib/qr-image";
import { createQrSvg } from "@/lib/qr-svg";
import { prisma } from "@/lib/prisma";
import { getQrPublicUrl } from "@/lib/qr-public-url";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  await requireAdmin();
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") ?? "png";
  if (format !== "png" && format !== "svg") {
    return NextResponse.json({ error: "Unsupported QR image format." }, { status: 400 });
  }

  const qrCode = await prisma.qrCode.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!qrCode) {
    return NextResponse.json({ error: "QR code not found." }, { status: 404 });
  }

  let publicUrl: string;
  try {
    publicUrl = getQrPublicUrl(qrCode.slug);
  } catch (error) {
    console.error("Could not create the public QR link.", error);
    return NextResponse.json(
      { error: "Set NEXT_PUBLIC_SITE_URL to the public site origin." },
      { status: 503 },
    );
  }

  try {
    const body =
      format === "svg"
        ? createQrSvg(publicUrl)
        : new Uint8Array(await createQrPng(publicUrl));
    const filename = `${qrCode.slug}.${format}`;
    return new Response(body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition":
          request.nextUrl.searchParams.get("download") === "1"
            ? `attachment; filename="${filename}"`
            : `inline; filename="${filename}"`,
        "Content-Type": format === "svg" ? "image/svg+xml; charset=utf-8" : "image/png",
      },
    });
  } catch (error) {
    console.error("Could not generate QR image.", error);
    return NextResponse.json(
      { error: "The QR image could not be generated." },
      { status: 500 },
    );
  }
}
