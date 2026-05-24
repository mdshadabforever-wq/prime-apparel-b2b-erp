import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Paths requiring staff authentication (Admin Dashboards)
  const isStaffRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isStaffRoute) {
    if (!token) {
      // Not logged in -> redirect to login
      const url = new URL("/login", request.url);
      url.searchParams.set("callback", pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Decode JWT base64 payload safely in Edge runtime
      const payloadPart = token.split(".")[1];
      if (!payloadPart) throw new Error("Invalid token format");
      
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = atob(base64);
      const payload = JSON.parse(jsonPayload);

      // Check if user is staff (Role is not BUYER)
      const staffRoles = ["ADMIN", "FOUNDER", "SALES", "INVENTORY", "ACCOUNTS", "CONTENT"];
      if (!staffRoles.includes(payload.role)) {
        // Logged in but not staff -> redirect to buyer catalog
        return NextResponse.redirect(new URL("/catalog", request.url));
      }
    } catch (e) {
      // Decoding failed or token corrupt -> clear and redirect
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
  }

  if (isAuthRoute && token) {
    try {
      const payloadPart = token.split(".")[1];
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = atob(base64);
      const payload = JSON.parse(jsonPayload);

      if (payload.role === "BUYER") {
        return NextResponse.redirect(new URL("/catalog", request.url));
      } else {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } catch (e) {
      // Ignore error, let user load page if token was invalid
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/register"],
};
