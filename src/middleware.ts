import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  console.log('Middleware token:', token);
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
      console.log('Decoded payload:', payload);
      console.log('Payload role:', payload.role);

      // Check if user is staff (Role is not BUYER)
      const staffRoles = ["ADMIN", "FOUNDER", "SALES", "INVENTORY", "ACCOUNTS", "CONTENT", "FIELD_BOY"];
      if (!staffRoles.includes(payload.role)) {
        // Logged in but not staff -> redirect to buyer catalog
        return NextResponse.redirect(new URL("/catalog", request.url));
      }

      const role = payload.role;

      // 1. SALES: Allowed orders, buyers, and leads
      if (role === "SALES") {
        const allowedSales = ["/admin/orders", "/admin/buyers", "/admin/leads"];
        const isAllowed = allowedSales.some(path => pathname.startsWith(path));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/admin/orders", request.url));
        }
      }

      // 2. ACCOUNTS: Allowed cashflow (ledger) and orders
      if (role === "ACCOUNTS") {
        const allowedAccounts = ["/admin/cashflow", "/admin/orders"];
        const isAllowed = allowedAccounts.some(path => pathname.startsWith(path));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/admin/cashflow", request.url));
        }
      }

      // 3. INVENTORY & CONTENT: Allowed stock management
      if (role === "INVENTORY" || role === "CONTENT") {
        const allowedStock = ["/admin/stock"];
        const isAllowed = allowedStock.some(path => pathname.startsWith(path));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/admin/stock", request.url));
        }
      }

      // 4. FIELD_BOY: Allowed field-boy mobile portal
      if (role === "FIELD_BOY") {
        const allowedField = ["/admin/field-boy"];
        const isAllowed = allowedField.some(path => pathname.startsWith(path));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/admin/field-boy", request.url));
        }
      }

      // 5. Default redirect at /admin exactly
      if (pathname === "/admin") {
        if (role === "SALES") return NextResponse.redirect(new URL("/admin/orders", request.url));
        if (role === "ACCOUNTS") return NextResponse.redirect(new URL("/admin/cashflow", request.url));
        if (role === "INVENTORY" || role === "CONTENT") return NextResponse.redirect(new URL("/admin/stock", request.url));
        if (role === "FIELD_BOY") return NextResponse.redirect(new URL("/admin/field-boy", request.url));
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
        console.log('Redirecting buyer from auth route');
        return NextResponse.redirect(new URL("/catalog", request.url));
      } else {
        console.log('Redirecting staff from auth route, role:', payload.role);
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
