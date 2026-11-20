import "server-only";
import { connection, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  QR_ATTRIBUTION_COOKIE,
  QR_ATTRIBUTION_MAX_AGE_SECONDS,
  signQrAttribution,
} from "@/lib/qr-attribution";
import { getQrSiteOrigin } from "@/lib/qr-public-url";
import {
  getClientIp,
  getQrDeviceType,
  hashQrVisitor,
  shouldIgnoreQrRequest,
} from "@/lib/qr-utils";
import { recordQrScan } from "@/lib/qr-tracking";

function homeUrl(request: Request, siteOrigin?: URL) {
  return new URL("/", siteOrigin ?? request.url);
}

function getDestinationUrl(destinationPath: string, siteOrigin: URL) {
  try {
    const destination = new URL(destinationPath, siteOrigin);
    return destination.origin === siteOrigin.origin
      ? destination
      : new URL("/", siteOrigin);
  } catch {
    return new URL("/", siteOrigin);
  }
}

export async function redirectForQrSlug(request: Request, slug: string) {
  await connection();
  let siteOrigin: URL;
  try {
    siteOrigin = getQrSiteOrigin();
  } catch (error) {
    console.error("QR redirect cannot use NEXT_PUBLIC_SITE_URL.", error);
    return NextResponse.redirect(homeUrl(request), 302);
  }

  let qrCode;
  try {
    qrCode = await prisma.qrCode.findUnique({
      where: { slug },
      select: { id: true, destinationPath: true, isActive: true },
    });
  } catch (error) {
    console.error("Could not load QR code for redirect.", error);
    return NextResponse.redirect(homeUrl(request, siteOrigin), 302);
  }

  if (!qrCode?.isActive) {
    return NextResponse.redirect(homeUrl(request, siteOrigin), 302);
  }

  const response = NextResponse.redirect(
    getDestinationUrl(qrCode.destinationPath, siteOrigin),
    302,
  );
  if (request.method !== "GET" || shouldIgnoreQrRequest(request.headers)) {
    return response;
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const visitorHash = hashQrVisitor(
    getClientIp(request.headers),
    userAgent,
  );
  try {
    await recordQrScan(
      qrCode.id,
      visitorHash,
      getQrDeviceType(userAgent),
    );
  } catch (error) {
    console.error("Could not record QR scan; redirecting without tracking.", error);
  }

  const signedAttribution = signQrAttribution(qrCode.id, new Date());
  if (signedAttribution) {
    response.cookies.set(QR_ATTRIBUTION_COOKIE, signedAttribution, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: QR_ATTRIBUTION_MAX_AGE_SECONDS,
    });
  } else {
    console.error("QR registration attribution requires AUTH_SECRET.");
  }

  return response;
}
