import { NextRequest, NextResponse } from "next/server";

const PROTECTED_MATCHERS = [
  "/dashboard",
  "/employees",
  "/jobs",
  "/schedule",
  "/attendance",
  "/requests",
  "/payroll",
  "/settings",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PROTECTED_MATCHERS.some((path) => pathname.startsWith(path))) {
    const token = req.cookies.get("hr_admin_auth")?.value;

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employees/:path*",
    "/jobs/:path*",
    "/schedule/:path*",
    "/attendance/:path*",
    "/requests/:path*",
    "/payroll/:path*",
    "/settings/:path*",
  ],
};
