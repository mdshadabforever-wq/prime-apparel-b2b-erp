import { getAuthTokenFromHeader, verifyToken, TokenPayload } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Extract and verify auth token from request cookies.
 * Returns the decoded payload or null if not authenticated or session expired in database.
 */
export async function getAuthFromRequest(request: Request): Promise<TokenPayload | null> {
  const token = getAuthTokenFromHeader(request.headers.get("cookie"));
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;

  // Enforce session expiry controls: validate against active database sessions in the UserSession table
  if (payload.role !== "BUYER") {
    const session = await db.userSession.findFirst({
      where: { staff_id: payload.userId, is_active: true },
      orderBy: { created_at: "desc" }
    });

    if (!session || session.expires_at < new Date()) {
      return null;
    }
  }

  return payload;
}

/**
 * Require authentication. Returns decoded token payload.
 * Throws a NextResponse error if not authenticated.
 */
export async function requireAuth(request: Request): Promise<TokenPayload> {
  const user = await getAuthFromRequest(request);
  if (!user) {
    throw NextResponse.json(
      { error: "Session expired or unauthorized. Please login." },
      { status: 401 }
    );
  }
  return user;
}

/**
 * Require specific staff roles. Returns decoded token payload.
 * Throws a NextResponse error if role not allowed.
 */
export async function requireStaffRole(request: Request, ...allowedRoles: string[]): Promise<TokenPayload> {
  const user = await requireAuth(request);
  // FOUNDER and ADMIN always have access
  if (user.role === "FOUNDER" || user.role === "ADMIN") return user;
  if (user.role === "BUYER") {
    throw NextResponse.json(
      { error: "Access denied. Staff role required." },
      { status: 403 }
    );
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw NextResponse.json(
      { error: "Access denied. Insufficient role permissions." },
      { status: 403 }
    );
  }
  return user;
}

/**
 * Verify a cron/webhook secret from query params or headers.
 * For cron jobs that should only be called by Vercel Cron or authorized systems.
 */
export function verifyCronSecret(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") || request.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  // If no CRON_SECRET is configured, fall back to auth check
  if (!expected) return false;
  return secret === expected;
}
