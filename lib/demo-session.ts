import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const DEMO_SESSION_COOKIE = "letsfly_demo_session";
const DEVELOPMENT_SECRET = "letsfly-local-demo-session-not-for-production";

function getSecret(): string | null {
  const configured = process.env.DEMO_SESSION_SECRET;
  if (configured) return configured;
  return DEVELOPMENT_SECRET;
}

export function hasDemoSessionSecret(): boolean {
  return getSecret() !== null;
}

export function createDemoSession(maxAgeSeconds: number): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error("DEMO_SESSION_SECRET must be configured in production.");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const payload = `${expiresAt}.${randomBytes(24).toString("base64url")}`;
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function isValidDemoSession(token: string | undefined): boolean {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  const [expiresAtValue, nonce, signature, ...extra] = token.split(".");
  if (!expiresAtValue || !nonce || !signature || extra.length > 0) {
    return false;
  }

  const expiresAt = Number(expiresAtValue);
  if (
    !Number.isInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${expiresAtValue}.${nonce}`)
    .digest();
  const supplied = Buffer.from(signature, "base64url");
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}
