import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  const isStaffRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  if (isStaffRoute) {
    if (!token) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callback", pathname);
      return NextResponse.redirect(url);
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      const role = payload.role as string;

      const staffRoles = [
        "ADMIN", "FOUNDER", "PURCHASE", "INVENTORY", "PRICING",
        "CONTENT", "MARKETING", "BUYER_HUNTING", "SALES",
        "LOGISTICS", "ACCOUNTS", "TECHNICAL", "FIELD_BOY"
      ];

      if (!staffRoles.includes(role)) {
        return NextResponse.redirect(new URL("/catalog", request.url));
      }

      const roleAllowedPaths: Record<string, string[]> = {
        PURCHASE: ["/admin/stock", "/admin/orders"],
        INVENTORY: ["/admin/stock", "/admin/orders"],
        PRICING: ["/admin/stock"],
        CONTENT: ["/admin/stock", "/admin/whatsapp"],
        MARKETING: ["/admin/leads", "/admin/whatsapp", "/admin/buyers"],
        BUYER_HUNTING: ["/admin/leads", "/admin/whatsapp"],
        SALES: ["/admin/orders", "/admin/buyers", "/admin/leads", "/admin/whatsapp"],
        LOGISTICS: ["/admin/orders", "/admin/stock"],
        ACCOUNTS: ["/admin/cashflow", "/admin/orders"],
        TECHNICAL: ["/admin/whatsapp", "/admin/stock"],
        FIELD_BOY: ["/admin/orders"]
      };

      if (role !== "FOUNDER" && role !== "ADMIN") {
        const allowedRoutes = roleAllowedPaths[role] || [];
        const isOverviewAllowed = role === "PRICING" || role === "TECHNICAL";
        
        if (pathname === "/admin" && !isOverviewAllowed) {
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
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
  }

  if (isAuthRoute && token) {
    try {
      const { payload } = await jwtVerify(token, secret);

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
