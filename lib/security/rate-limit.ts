import "server-only";

import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RateLimitOptions = {
  namespace: string;
  maxRequests: number;
  windowSeconds: number;
  identity?: string;
};

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  unavailable?: boolean;
};

function clientAddress(request: NextRequest): string {
  const forwarded = (
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for")
  )?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

function fingerprint(request: NextRequest, namespace: string, identity?: string): string {
  const secret = process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Rate limiting is not configured.");
  const source = `${namespace}\n${identity || clientAddress(request)}`;
  return `${namespace}:${createHmac("sha256", secret).update(source).digest("hex")}`;
}

export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
): Promise<RateLimitDecision> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_api_rate_limit", {
      p_rate_key: fingerprint(request, options.namespace, options.identity),
      p_max_requests: options.maxRequests,
      p_window_seconds: options.windowSeconds,
    });

    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result || typeof result.allowed !== "boolean") {
      throw new Error("Invalid rate-limit response.");
    }

    return {
      allowed: result.allowed,
      remaining: Number(result.remaining) || 0,
      retryAfterSeconds: Number(result.retry_after_seconds) || 0,
    };
  } catch (error) {
    console.error("Rate-limit check failed:", error instanceof Error ? error.message : "unknown error");
    // Cost-bearing and messaging endpoints fail closed if the shared limiter
    // is unavailable. This avoids silently losing protection in production.
    return { allowed: false, remaining: 0, retryAfterSeconds: 60, unavailable: true };
  }
}

export function rateLimitResponse(decision: RateLimitDecision): NextResponse {
  return NextResponse.json(
    {
      error: decision.unavailable
        ? "Service temporarily unavailable."
        : "Too many requests. Please try again shortly.",
    },
    {
      status: decision.unavailable ? 503 : 429,
      headers: {
        "Retry-After": String(Math.max(1, decision.retryAfterSeconds)),
        "Cache-Control": "no-store",
      },
    },
  );
}
