import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { mobile } = await request.json();
    if (!mobile) {
      return NextResponse.json({ error: "Mobile number is required." }, { status: 400 });
    }

    const cleanMobile = mobile.replace(/\D/g, "");
    
    // In a real system, we would trigger an SMS gateway or WhatsApp template here.
    // For this simulation, we log the OTP "123456" in the OtpLog table.
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await db.otpLog.create({
      data: {
        mobile: cleanMobile,
        otp_code: "123456", // Standardized simulated OTP code
        status: "SENT",
        ip_address: ip,
        user_agent: userAgent
      }
    });

    // We also log simulated WhatsApp log entry
    await db.whatsAppLog.create({
      data: {
        contact_number: cleanMobile,
        direction: "outgoing",
        message_type: "text",
        message_content: `[PRIME ERP COMPLIANCE] Aapka wholesale catalog activation OTP code hai: 123456. Is code ko share na karein. Valid for 10 minutes.`,
        handled_by: "ai"
      }
    });

    return NextResponse.json({ success: true, message: "OTP sent successfully." });
  } catch (error: any) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send OTP verification." }, { status: 500 });
  }
}
