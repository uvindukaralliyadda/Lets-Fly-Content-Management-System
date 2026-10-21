# Let's Fly Management Portal

Next.js App Router application with TypeScript and Tailwind CSS v4.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. The demo sign-in accepts any non-empty username
and password. This is intentionally not production authentication. Passwords
are not stored; the demo issues a signed, HTTP-only cookie for route gating.
Use a real identity provider and server-side authorization before deployment.
Set a strong `DEMO_SESSION_SECRET` in the production environment; production
demo sign-in is disabled when this value is absent.

## Routes and structure

- `/` routes to the login page or CMS based on the signed demo cookie.
- `/login` contains the React login form and preserves the original portal
  design and validation interactions.
- `/cms` is protected by the Next.js proxy and server-side cookie verification.
  Its Home tab is the React component in `components/cms/home-tab.tsx`; the
  hero-slider editor preserves its existing browser-storage format and image
  validation. The Inquiries tab is `components/cms/inquiries-tab.tsx`; it reads
  and updates inquiry records from same-origin browser storage. Other tabs
  continue to load from the same-origin legacy CMS iframe until migrated.
- `/api/cms-demo` serves the original CMS HTML only to a valid demo session.
  The legacy page remains the compatibility implementation and behavioral
  reference for tabs not yet migrated. The original source files remain
  untouched.
- `/api/demo-session` creates and clears the demo cookie.

The preserved CMS currently includes Home, Projects, Outbound Travels, Travel
Sri Lanka, Hotel Bookings, Trains, Cruises, Gallery, and Rental. The source
already marks Hotel Bookings as coming soon. Accounts and HR URLs in the login
page are the example domains from the original source and must be configured.

## Migration boundary

The login, application/session routing, and Home tab are React/TypeScript. The
Home and Inquiries are React/TypeScript; the remaining CMS tabs still use the
original standalone HTML/JavaScript inside a protected same-origin iframe as a
compatibility bridge. Inquiries use the `lf_inquiries` local-storage key, with
records shaped as `{ id, createdAt, customerName, email?, phone?, category,
message, status?, comments? }`. Categories are Outbound Travel, Travel Sri
Lanka, Hotel Bookings, Trains, and Cruises. Missing status defaults to New;
comments default to an empty list. A small set of demo inquiries is written
when the `lf_inquiries` key is absent; these records can be cleared by removing
that browser-storage key. Website contact forms are not present in this
repository, so connecting their submissions to the inquiry store remains
necessary for live inquiries to populate this tab.
The legacy page is not a production CMS backend: demo records remain
browser-local, and selected photos/videos are previews only—not permanent
uploads.
"# Lets-Fly-Content-Management-System" 
