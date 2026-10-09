"use client";

import { useCallback, useEffect, useState } from "react";

export default function CmsFrame() {
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const signOut = useCallback(async () => {
    setLoggingOut(true);
    setLogoutError(null);

    try {
      const response = await fetch("/api/demo-session", { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`The session endpoint returned ${response.status}.`);
      }
      window.location.replace("/login");
    } catch (error) {
      console.error("Could not end the demo session.", error);
      setLogoutError("The demo session could not be ended. Please try again.");
      setLoggingOut(false);
    }
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent<unknown>) {
      if (
        event.origin !== window.location.origin ||
        typeof event.data !== "object" ||
        event.data === null ||
        !("type" in event.data) ||
        event.data.type !== "letsfly-cms-logout"
      ) {
        return;
      }

      void signOut();
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [signOut]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#f6f6fb]">
      <iframe
        className="h-full w-full border-0"
        src="/api/cms-demo"
        title="Let's Fly CMS"
      />
      {logoutError && (
        <div
          className="absolute inset-x-4 top-4 z-50 mx-auto flex max-w-lg items-center justify-between gap-4 rounded-lg bg-white p-4 text-sm text-red-800 shadow-xl"
          role="alert"
        >
          <span>{logoutError}</span>
          <button
            className="rounded bg-red-700 px-3 py-2 font-semibold text-white disabled:opacity-60"
            disabled={loggingOut}
            onClick={() => void signOut()}
            type="button"
          >
            Retry
          </button>
        </div>
      )}
    </main>
  );
}
