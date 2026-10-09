import { NextRequest, NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  isValidDemoSession,
} from "@/lib/demo-session";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  if (!isValidDemoSession(token)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cms/:path*"],
};
