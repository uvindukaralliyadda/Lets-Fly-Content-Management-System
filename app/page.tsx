import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE, isValidDemoSession } from "@/lib/demo-session";

export default async function HomePage() {
  const token = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
  redirect(isValidDemoSession(token) ? "/cms" : "/login");
}
