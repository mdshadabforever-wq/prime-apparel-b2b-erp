import { NextResponse } from "next/server";
import { requireStaffRole } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    let caller;
    try {
      caller = await requireStaffRole(request);
    } catch (r) {
      return r as NextResponse;
    }

    const nda = await db.employeeNda.findUnique({
      where: { staff_id: caller.userId }
    });

    return NextResponse.json({
      signed: !!nda?.nda_signed,
      nda: nda || null
    });
  } catch (error: any) {
    console.error("GET NDA error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch NDA signature state" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let caller;
    try {
      caller = await requireStaffRole(request);
    } catch (r) {
      return r as NextResponse;
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const body = await request.json().catch(() => ({}));
    const { signatureName } = body;

    if (!signatureName || signatureName.trim().length === 0) {
      return NextResponse.json(
        { error: "Signature name is required for verification." },
        { status: 400 }
      );
    }

    // Upsert employee NDA record
    const nda = await db.employeeNda.upsert({
      where: { staff_id: caller.userId },
      update: {
        nda_signed: true,
        staff_name: signatureName.trim(),
        ip_address: ip,
        user_agent: userAgent,
        timestamp: new Date()
      },
      create: {
        staff_id: caller.userId,
        nda_signed: true,
        staff_name: signatureName.trim(),
        ip_address: ip,
        user_agent: userAgent,
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      signed: true,
      nda
    });
  } catch (error: any) {
    console.error("POST NDA error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sign NDA" },
      { status: 500 }
    );
  }
}
