import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")
      ? parseCookie(request.headers.get("cookie")!, "auth_token")
      : null;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: decoded.userId,
        name: decoded.name,
        mobile: decoded.mobile,
        role: decoded.role,
        permissions: decoded.permissions || [],
        isStaff: decoded.role !== "BUYER"
      }
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: "Server error" }, { status: 500 });
  }
}

// Utility to parse cookies manually from raw header
function parseCookie(cookieString: string, name: string): string | null {
  const matches = cookieString.match(new RegExp(`(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`));
  return matches ? decodeURIComponent(matches[1]) : null;
}
