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
    nextUrl.pathname.startsWith("/api/auth");

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
