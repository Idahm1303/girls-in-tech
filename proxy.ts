import { NextResponse, type NextRequest } from "next/server";

const WELCOME_COOKIE = "git-welcome";
const WELCOME_HEADER = "x-git-welcome";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(WELCOME_HEADER);

  const welcomeCookie = request.cookies.get(WELCOME_COOKIE)?.value;
  if (!welcomeCookie) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  requestHeaders.set(WELCOME_HEADER, welcomeCookie);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(WELCOME_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/login",
    maxAge: 0,
  });
  return response;
}

export const config = {
  matcher: ["/login"],
};
