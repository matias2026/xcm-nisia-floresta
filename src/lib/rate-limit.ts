import { createAdminClient } from "@/lib/supabase/admin";

// Per-IP rate limit using Supabase's own Postgres (the check_rate_limit
// function, see supabase/migrations/0006_rate_limit_via_postgres.sql) — no
// new external service, runs on the same database the app already uses. An
// in-memory Map won't work because Vercel runs each request on a separate
// serverless instance; the database is the only shared state.
type LimiterName = "login" | "api" | "access_request";

const WINDOWS: Record<LimiterName, { windowSeconds: number; max: number }> = {
  // Login: 5 attempts every 5 minutes per IP — protects against brute
  // force without locking out someone who mistyped their password once or twice.
  login: { windowSeconds: 300, max: 5 },
  // Other API routes (e.g. AI feedback generation): 30 req/min per IP.
  api: { windowSeconds: 60, max: 30 },
  // Access request (public screen, no login): 3 per hour per IP — this is
  // the form most exposed to spam/bots on the site.
  access_request: { windowSeconds: 3600, max: 3 },
};

export interface RateLimitResult {
  success: boolean;
}

export async function checkRateLimit(name: LimiterName, identifier: string): Promise<RateLimitResult> {
  const { windowSeconds, max } = WINDOWS[name];
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: `${name}:${identifier}`,
    p_window_seconds: windowSeconds,
    p_max: max,
  });

  if (error) {
    // If the database is down, that's no reason to break login/API —
    // log it and let the request through (fail open); the auth check still applies.
    console.error("[rate-limit] falha ao checar limite, permitindo por padrão:", error.message);
    return { success: true };
  }

  return { success: data === true };
}

// Extracts the client's real IP from the headers Vercel injects
// (x-forwarded-for may carry a list "client, proxy1, proxy2" — the
// first item is the original client).
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
