import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

// Use the edge-safe config so middleware runs in the Edge runtime without
// pulling in Prisma / Node-only deps.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthed = !!req.auth;
  const isPublic =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname.startsWith("/api/clear-session") ||
    nextUrl.pathname.startsWith("/api/cron");

  if (!isAuthed && !isPublic) {
    const url = new URL("/login", nextUrl);
    if (nextUrl.pathname !== "/") {
      url.searchParams.set("from", nextUrl.pathname);
    }
    return NextResponse.redirect(url);
  }

  if (isAuthed && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Exclude /api/clear-session so the middleware's auth() doesn't re-sign
  // the JWT cookie before the route handler can delete it (the resulting
  // double Set-Cookie causes some browsers to keep the re-issued cookie).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/clear-session|.*\\.png$).*)",
  ],
};
