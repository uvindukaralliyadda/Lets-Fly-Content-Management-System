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
- `/api/cms-demo` serves the original CMS HTML only to a valid demo session;
  it is embedded same-origin so the CMS's existing JavaScript, media previews,
  browser-storage data, hash navigation, and editor interactions continue to
  work. The original root-level HTML files remain untouched.
- `/api/demo-session` creates and clears the demo cookie.

The preserved CMS currently includes Home, Projects, Outbound Travels, Travel
Sri Lanka, Hotel Bookings, Trains, Cruises, Gallery, and Rental. The source
already marks Hotel Bookings as coming soon. Accounts and HR URLs in the login
page are the example domains from the original source and must be configured.

## Migration boundary

The login and application/session routing are React/TypeScript. To avoid losing
the extensive CMS prototype behavior, the CMS itself remains the original
standalone HTML/JavaScript inside a protected same-origin iframe. It has not
yet been decomposed into React components or had its internal JavaScript
rewritten in TypeScript; the iframe is a compatibility bridge, not a production
CMS backend. Its demo records remain browser-local, and selected photos/videos
are previews only—not permanent uploads. A follow-up port can replace the
compatibility frame section-by-section while preserving its current source and
visual output as a reference.
"# Lets-Fly-Content-Management-System" 
