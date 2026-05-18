import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/groups",
  "/projects",
  "/students",
  "/tasks",
  "/sessions",
  "/inventory",
  "/attendance",
  "/files",
  "/notifications",
];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const hasSupabaseSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (isProtectedRoute && !hasSupabaseSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoginPage && hasSupabaseSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/groups/:path*",
    "/projects/:path*",
    "/students/:path*",
    "/tasks/:path*",
    "/sessions/:path*",
    "/inventory/:path*",
    "/attendance/:path*",
    "/files/:path*",
    "/notifications/:path*",
    "/login",
  ],
};
