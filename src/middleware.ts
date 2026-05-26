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
      const staffRoles = [
        "ADMIN",
        "FOUNDER",
        "PURCHASE",
        "INVENTORY",
        "PRICING",
        "CONTENT",
        "MARKETING",
        "BUYER_HUNTING",
        "SALES",
        "LOGISTICS",
        "ACCOUNTS",
        "TECHNICAL",
        "FIELD_BOY"
      ];
      if (!staffRoles.includes(payload.role)) {
        // Logged in but not staff -> redirect to buyer catalog
        return NextResponse.redirect(new URL("/catalog", request.url));
      }

      const role = payload.role;

      // Define allowed sub-paths for each operational role
      const roleAllowedPaths: Record<string, string[]> = {
        PURCHASE: ["/admin/stock", "/admin/orders"],
        INVENTORY: ["/admin/stock", "/admin/orders"],
        PRICING: ["/admin/stock"], // Allowed stock + overview (exact /admin)
        CONTENT: ["/admin/stock", "/admin/whatsapp"],
        MARKETING: ["/admin/leads", "/admin/whatsapp", "/admin/buyers"],
        BUYER_HUNTING: ["/admin/leads", "/admin/whatsapp"],
        SALES: ["/admin/orders", "/admin/buyers", "/admin/leads", "/admin/whatsapp"],
        LOGISTICS: ["/admin/orders", "/admin/stock"],
        ACCOUNTS: ["/admin/cashflow", "/admin/orders"],
        TECHNICAL: ["/admin/whatsapp", "/admin/stock"],
        FIELD_BOY: ["/admin/orders"]
      };

      // FOUNDER and ADMIN have unrestricted full access
      if (role !== "FOUNDER" && role !== "ADMIN") {
        const allowedRoutes = roleAllowedPaths[role] || [];
        
        // Exact '/admin' overview check: only allowed if pricing or technical or admin
        const isOverviewAllowed = role === "PRICING" || role === "TECHNICAL";
        
        if (pathname === "/admin" && !isOverviewAllowed) {
          // Redirect to their first allowed dashboard tab
          const fallback = allowedRoutes[0] || "/catalog";
          return NextResponse.redirect(new URL(fallback, request.url));
        }

        if (pathname.startsWith("/admin") && pathname !== "/admin") {
          const isAllowed = allowedRoutes.some(route => pathname.startsWith(route));
          if (!isAllowed) {
            const fallback = allowedRoutes[0] || "/catalog";
            return NextResponse.redirect(new URL(fallback, request.url));
          }
        }
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
