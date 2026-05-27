import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { mobile, otp } = await request.json();
    if (!mobile || !otp) {
      return NextResponse.json({ error: "Mobile number and OTP code are required." }, { status: 400 });
    }

    const cleanMobile = mobile.replace(/\D/g, "");
    
    // In our simulation, we verify that the user enters "123456"
    // We then find the latest OtpLog entry for this mobile and update its status.
    const latestLog = await db.otpLog.findFirst({
      where: { mobile: cleanMobile },
      orderBy: { timestamp: "desc" }
    });

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (otp !== "123456" && (latestLog ? latestLog.otp_code !== otp : true)) {
      await db.otpLog.create({
        data: {
          mobile: cleanMobile,
          otp_code: otp,
          status: "FAILED",
          ip_address: ip,
          user_agent: userAgent
        }
      });
      return NextResponse.json({ error: "Incorrect verification code. Please enter 123456." }, { status: 400 });
    }

    // Mark as VERIFIED
    await db.otpLog.create({
      data: {
        mobile: cleanMobile,
        otp_code: otp,
        status: "VERIFIED",
        ip_address: ip,
        user_agent: userAgent
      }
    });

    return NextResponse.json({ success: true, message: "OTP verified successfully." });
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: "Failed to verify OTP." }, { status: 500 });
  }
}
