import "server-only";
import { NextResponse } from "next/server";
import { ReviewError } from "./server";
export function reviewResponse(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function reviewFailure(error: unknown) {
  if (error instanceof ReviewError)
    return reviewResponse({ error: error.message }, error.status);
  console.error(
    "Review request failed",
    error instanceof Error ? error.message : "Unknown error",
  );
  return reviewResponse(
    { error: "Reviews are temporarily unavailable. Please try again." },
    503,
  );
}
export function checkReviewOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    throw new ReviewError("Invalid request origin.", 403);
}
export async function reviewJson(req: Request): Promise<unknown> {
  if (Number(req.headers.get("content-length")) > 16000)
    throw new ReviewError("Review request is too large.", 413);
  const text = await req.text();
  if (text.length > 16000)
    throw new ReviewError("Review request is too large.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new ReviewError("Invalid request.", 400);
  }
}
