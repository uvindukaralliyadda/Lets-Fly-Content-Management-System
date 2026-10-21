"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import HomeTab from "@/components/cms/home/home-tab";
import InquiriesTab from "@/components/cms/inquiries/inquiries-tab";

const sections = [
  { id: "home", title: "Home" },
  { id: "projects", title: "Projects" },
  { id: "outbound", title: "Outbound Travels" },
  { id: "srilanka", title: "Travel Sri Lanka" },
  { id: "hotels", title: "Hotel Bookings" },
  { id: "trains", title: "Trains" },
  { id: "cruises", title: "Cruises" },
  { id: "gallery", title: "Gallery" },
  { id: "rental", title: "Rental" },
  { id: "inquiries", title: "Inquiries" },
];

const navigationIcons: Record<string, ReactNode> = {
  home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  projects: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  outbound: <><path d="M2 22h20" /><path d="M6.4 17.4 3 13l2-1 3 2 4-2.5L6 6l2.5-1 8 4 3.6-2a2 2 0 0 1 2 3.4L9 17.4z" /></>,
  srilanka: <><path d="M12 3c2.5 0 5 2.6 5 7 0 5-2.7 11-5 11s-5-6-5-11c0-4.4 2.5-7 5-7z" /><circle cx="12" cy="10" r="2" /></>,
  hotels: <><path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4" /></>,
  trains: <><rect height="14" rx="3" width="14" x="5" y="3" /><path d="M5 11h14M9 21l-2-4M15 21l2-4M9 7h6" /></>,
  cruises: <><path d="M2 20c2 1 4 1 6 0s4-1 6 0 4 1 6 0" /><path d="M4 17 3 12h18l-2 5M6 12V8h12v4M12 8V4" /></>,
  gallery: <><rect height="18" rx="2" width="18" x="3" y="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
  rental: <><path d="M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0" /><path d="M3 17v-5l2-5h11l3 5h2v5M5 12h16" /></>,
  inquiries: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /><path d="M8 12h8M8 9h5" /></>,
};

function getSectionFromHash() {
  const section = window.location.hash.slice(1).split("/")[0];
  return sections.some((item) => item.id === section) ? section : "home";
}

function getRouteFromHash() {
  const route = window.location.hash.slice(1);
  return sections.some((item) => item.id === route.split("/")[0]) ? route : "home";
}

export default function CmsFrame() {
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [activeRoute, setActiveRoute] = useState("home");

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
    const syncRoute = () => {
      const route = getRouteFromHash();
      setActiveRoute(route);
      setActiveSection(getSectionFromHash());
    };
    syncRoute();
    const handleHashChange = () => syncRoute();
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

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
      window.removeEventListener("message", handleMessage);
    };
  }, [signOut]);

  function navigate(section: string) {
    if (!sections.some((item) => item.id === section)) return;
    if (activeSection === section && activeRoute === section) return;
    setActiveSection(section);
    setActiveRoute(section);
    const hash = section === "home" ? "" : `#${section}`;
    window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  }

  const currentTitle = sections.find((section) => section.id === activeSection)?.title ?? "Home";

  return (
    <main className="cms-app">
      <div className="cms-home-shell">
        <aside aria-label="CMS navigation" className="cms-sidebar">
        <a className="cms-app-brand" href="/cms" onClick={(event) => {
          event.preventDefault();
          navigate("home");
        }}>
          <span aria-hidden="true">LF</span>
          <b>Let&apos;s Fly <small>CMS</small></b>
        </a>
        <div className="cms-sidebar-caption">Menu</div>
        <nav aria-label="CMS sections" className="cms-app-nav">
          {sections.map((section) => (
            <button
              aria-current={activeSection === section.id ? "page" : undefined}
              className={activeSection === section.id ? "cms-app-nav-item active" : "cms-app-nav-item"}
              key={section.id}
              onClick={() => navigate(section.id)}
              type="button"
            >
              <svg aria-hidden="true" className="cms-nav-icon" fill="none" height="20" viewBox="0 0 24 24" width="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">{navigationIcons[section.id]}</svg>
              {section.title}
            </button>
          ))}
        </nav>
        <button className="cms-app-signout" disabled={loggingOut} onClick={() => void signOut()} type="button">
          <span aria-hidden="true">↪</span>{loggingOut ? "Signing out…" : "Sign out"}
        </button>
        </aside>
        <section className="cms-main" hidden={activeSection !== "home" && activeSection !== "inquiries"}>
          <header className="cms-app-header">
            <div className="cms-app-page-heading">
              <span>CMS / {currentTitle}</span>
              <h1>{currentTitle}</h1>
            </div>
          </header>
          <div className="cms-app-content">
            {activeSection === "home" ? (
              <HomeTab onNavigate={navigate} />
            ) : (
              <InquiriesTab />
            )}
          </div>
        </section>
      </div>
      {activeSection !== "home" && activeSection !== "inquiries" && (
        <>
          <iframe
            className="cms-app-legacy"
            key={activeSection}
            src={`/api/cms-demo#${activeRoute}`}
            title={`Let's Fly CMS — ${currentTitle}`}
          />
          <div className="cms-legacy-controls">
            <button onClick={() => navigate("home")} type="button">Return to React Home</button>
            <button disabled={loggingOut} onClick={() => void signOut()} type="button">
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </>
      )}
      {logoutError && (
        <div className="cms-logout-error" role="alert">
          <span>{logoutError}</span>
          <button disabled={loggingOut} onClick={() => void signOut()} type="button">Retry</button>
        </div>
      )}
    </main>
  );
}
