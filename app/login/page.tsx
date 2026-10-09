import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE, isValidDemoSession } from "@/lib/demo-session";
import LoginForm from "@/components/auth/login-form";
import "./login.css";

export default async function LoginPage() {
  const token = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
  if (isValidDemoSession(token)) {
    redirect("/cms");
  }

  return <LoginForm />;
}
