import { NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  createDemoSession,
  hasDemoSessionSecret,
} from "@/lib/demo-session";

interface DemoLoginBody {
  username: string;
  password: string;
  remember: boolean;
}

function isDemoLoginBody(value: unknown): value is DemoLoginBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "username" in value &&
    typeof value.username === "string" &&
    "password" in value &&
    typeof value.password === "string" &&
    "remember" in value &&
    typeof value.remember === "boolean"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The sign-in request was invalid. Please try again." },
      { status: 400 },
    );
  }

  const remember = isDemoLoginBody(body) ? body.remember : false;

  if (!hasDemoSessionSecret()) {
    return NextResponse.json(
      {
        error:
          "Demo sign-in is disabled in production until DEMO_SESSION_SECRET is configured.",
      },
      { status: 503 },
    );
  }

  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(DEMO_SESSION_COOKIE, createDemoSession(maxAge), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(DEMO_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
