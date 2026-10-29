import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "orcha_discord_template_visitor";
const ONE_YEAR = 60 * 60 * 24 * 365;
const VISITOR_PATTERN = /^[0-9a-f-]{36}\.[0-9a-f]{64}$/i;

function cookieValue(header: string | null): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === COOKIE_NAME) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

function secret(): string {
  const value = process.env.VISITOR_COOKIE_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) {
    throw new Error(
      "VISITOR_COOKIE_SECRET must be at least 32 characters in production.",
    );
  }
  return value || "local-development-only";
}

function signature(id: string): string {
  return createHmac("sha256", secret()).update(id).digest("hex");
}

function verify(value: string): string | undefined {
  if (!VISITOR_PATTERN.test(value)) return undefined;
  const [id, supplied] = value.split(".");
  const expected = signature(id);
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    ? id
    : undefined;
}

export function resolveVisitor(request: Request): {
  id: string;
  setCookie?: string;
} {
  const existing = cookieValue(request.headers.get("cookie"));
  const verified = existing ? verify(existing) : undefined;
  if (verified) return { id: verified };

  const id = randomUUID();
  const value = `${id}.${signature(id)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return {
    id,
    setCookie: `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ONE_YEAR}${secure}`,
  };
}

export function responseHeaders(setCookie?: string): Headers {
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (setCookie) headers.set("Set-Cookie", setCookie);
  return headers;
}
