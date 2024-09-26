import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token"); // Example: Check for a JWT token in cookies

  // If the user is not authenticated, redirect them to the login page
  if (!token) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"], // Protect all routes under /dashboard
};
