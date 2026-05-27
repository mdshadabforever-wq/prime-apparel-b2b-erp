import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: WhatsApp Webhook Handshake verification (Required by Meta)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Retrieve configured webhook verification token
    const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "PRIME_APPAREL_CRM_TOKEN";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("🟢 WhatsApp Webhook handshake successful!");
      return new Response(challenge, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid handshake verification token." }, { status: 403 });
  } catch (error) {
    console.error("WhatsApp GET Webhook error:", error);
    return NextResponse.json({ error: "Failed webhook handshake verification." }, { status: 500 });
  }
}

// POST: Ingest incoming WhatsApp Cloud API messages and append to Customer Memory
export async function POST(request: Request) {
  try {
    // Verify webhook origin via shared token header (Meta sends X-Hub-Signature-256)
    const hubSignature = request.headers.get("x-hub-signature-256");
    // In production, verify HMAC signature. For now, log if missing.
    if (!hubSignature) {
      console.warn("⚠️ WhatsApp webhook received without X-Hub-Signature-256 header");
    }
    const body = await request.json();
    console.log("📨 Received WhatsApp Webhook payload:", JSON.stringify(body));

    // Meta WhatsApp Cloud API JSON structure: entry -> changes -> value -> messages
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (message) {
      const fromNumber = message.from; // Sender WhatsApp number (e.g. 919876543210)
      const textContent = message.text?.body || "[Media/Document Attachment]";
      const messageId = message.id;

      // Extract raw 10-digit number for Indian country code mapping (e.g. 919876543210 -> 9876543210)
      const cleanNumber = fromNumber.replace(/^91/, "");

      // 1. Check if corresponding Buyer exists in ERP
      const buyer = await db.buyer.findFirst({
        where: {
          OR: [
            { mobile: cleanNumber },
            { mobile: fromNumber }
          ]
        }
      });

      if (buyer) {
        // 2. Locate or lazy-create Customer profile
        let customer = await db.customer.findUnique({
          where: { buyer_id: buyer.buyer_id }
        });

        if (!customer) {
          customer = await db.customer.create({
            data: {
              buyer_id: buyer.buyer_id,
              company_name: buyer.business_name,
              trade_name: buyer.gst_legal_name || buyer.business_name,
              gstin: buyer.gst_number,
              mobile: buyer.mobile,
              whatsapp_number: buyer.mobile,
              city: buyer.city,
              state: buyer.state,
              assigned_salesperson: "WhatsApp Automation Agent"
            }
          });
        }

        // 3. Find or create WhatsApp conversation
        let conversation = await db.conversation.findFirst({
          where: { customer_id: customer.id, channel: "WHATSAPP" }
        });

        if (!conversation) {
          conversation = await db.conversation.create({
            data: {
              customer_id: customer.id,
              channel: "WHATSAPP",
              title: "Primary WhatsApp Sync"
            }
          });
        }

        // 4. Log the message into CRM database memory
        await db.message.create({
          data: {
            conversation_id: conversation.conversation_id,
            sender: contact?.profile?.name || "customer",
            content: textContent,
            direction: "incoming",
            message_type: "text",
            status: "delivered"
          }
        });

        // 5. Log the timeline activity event
        await db.customerTimeline.create({
          data: {
            customer_id: customer.id,
            event_type: "WHATSAPP_RECEIVED",
            title: `Incoming WhatsApp from ${contact?.profile?.name || 'Buyer'}`,
            description: textContent.substring(0, 150),
            operator_name: "WhatsApp Bot"
          }
        });

        // 6. Update last message timestamp
        await db.conversation.update({
          where: { conversation_id: conversation.conversation_id },
          data: { last_message_at: new Date() }
        });

        // 7. Update Buyer last contact date
        await db.buyer.update({
          where: { buyer_id: buyer.buyer_id },
          data: { last_contact_date: new Date() }
        });

        console.log(`✅ Ingested WhatsApp message from B2B buyer ${buyer.business_name}: "${textContent}"`);
      } else {
        // Safe fallback: Log as default Lead activity or standalone raw log
        console.log(`⚠️ WhatsApp clean contact number +${cleanNumber} does not match any registered B2B Buyer.`);
      }
    }

    return NextResponse.json({ success: true, message: "Webhook payload processed." });
  } catch (error) {
    console.error("WhatsApp POST Webhook error:", error);
    return NextResponse.json({ error: "Failed to process webhook payload." }, { status: 500 });
  }
}
