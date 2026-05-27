import { NextResponse } from "next/server";
import { processIncomingWhatsApp } from "@/lib/whatsapp";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { contactNumber, messageContent } = await request.json();

    if (!contactNumber || !messageContent) {
      return NextResponse.json(
        { error: "Zaroori parameters (contactNumber, messageContent) missing hain." },
        { status: 400 }
      );
    }

    // Call chatbot state machine
    const result = await processIncomingWhatsApp(contactNumber, messageContent);

    return NextResponse.json({
      success: true,
      reply: result.reply,
      status: result.status,
      escalated: result.escalated
    });
  } catch (error) {
    console.error("WhatsApp Webhook Simulator Error: ", error);
    return NextResponse.json({ error: "Failed to process chat session." }, { status: 500 });
  }
}

// GET: Fetch all active chats conversation history log
export async function GET() {
  try {
    const logs = await db.whatsAppLog.findMany({
      orderBy: { timestamp: "asc" }
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chat logs." }, { status: 500 });
  }
}
