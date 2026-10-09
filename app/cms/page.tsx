import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE, isValidDemoSession } from "@/lib/demo-session";
import CmsFrame from "@/components/cms/cms-frame";

export const metadata = {
  title: "CMS | Let's Fly.lk",
};

export default async function CmsPage() {
  const token = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
  if (!isValidDemoSession(token)) {
    redirect("/login");
  }

  return <CmsFrame />;
}
