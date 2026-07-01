import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { UserRole, UserStatus } from "@prisma/client";
import { authConfig } from "@/lib/auth/auth.config";

type RouteAccess = {
  prefix: string;
  roles: UserRole[];
};

const PROTECTED_ROUTES: RouteAccess[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/instructor", roles: ["INSTRUCTOR", "ADMIN"] },
  { prefix: "/dashboard", roles: ["STUDENT", "INSTRUCTOR", "ADMIN"] },
];

const BLOCKED_STATUSES: UserStatus[] = ["SUSPENDED", "PENDING_VERIFICATION"];

/** Edge-safe middleware — بدون Prisma. التحقق الكامل من DB في layouts عبر requireAuth. */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  const matchedRoute = PROTECTED_ROUTES.find((route) =>
    pathname.startsWith(route.prefix),
  );

  if (!matchedRoute) {
    return NextResponse.next();
  }

  if (!user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (BLOCKED_STATUSES.includes(user.status)) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("error", "account_blocked");
    return NextResponse.redirect(loginUrl);
  }

  if (user.status === "PENDING" && user.role === "INSTRUCTOR") {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("error", "pending_instructor");
    return NextResponse.redirect(loginUrl);
  }

  if (!matchedRoute.roles.includes(user.role)) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/instructor/:path*", "/admin/:path*"],
};
