import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Escape hatch for stale JWT cookies (e.g. user deleted from DB but cookie
 * still validates). Server components can't modify cookies, so the layout
 * redirects bad-state users here.
 *
 * IMPORTANT: we delete the session cookie directly via `cookies().delete()`
 * rather than calling `signOut()`. signOut on a still-valid JWT re-issues
 * the cookie before clearing it, producing two Set-Cookie headers — and
 * some browsers apply the re-issued one, perpetuating the redirect loop.
 */
export async function GET(request: Request) {
  const jar = cookies();
  // Cookie name differs in production (Secure prefix) vs dev.
  jar.delete("authjs.session-token");
  jar.delete("__Secure-authjs.session-token");
  return NextResponse.redirect(new URL("/login", request.url));
}
