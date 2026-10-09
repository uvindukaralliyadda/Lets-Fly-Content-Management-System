import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE, isValidDemoSession } from "@/lib/demo-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  if (!isValidDemoSession(token)) {
    return new NextResponse("Authentication required.", { status: 401 });
  }

  try {
    const html = await readFile(
      path.join(process.cwd(), "legacy", "cms-dashboard.html"),
      "utf8",
    );
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "Content-Security-Policy": "frame-ancestors 'self'",
      },
    });
  } catch (error) {
    console.error("Could not read the preserved CMS demo page.", error);
    return new NextResponse("The CMS demo page could not be loaded.", {
      status: 500,
    });
  }
}
