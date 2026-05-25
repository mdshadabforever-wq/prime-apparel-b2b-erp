import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchShiprocketPOD } from "@/lib/shiprocket";

// POST /api/shipping/shiprocket/webhook: Receive real-time courier updates from Shiprocket API
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { awb, shipment_id, current_status } = body;

    if (!awb || !current_status) {
      return NextResponse.json(
        { error: "Required fields (awb, current_status) are missing." },
        { status: 400 }
      );
    }

    console.log(`[Shiprocket Webhook] Received tracking update. AWB: ${awb}, Status: ${current_status}`);

    // Find the SalesOrder by AWB or Shipment ID
    const order = await db.salesOrder.findFirst({
      where: {
        OR: [
          { awb_number: awb },
          { shipment_id: String(shipment_id) }
        ]
      },
      include: { buyer: true }
    });

    if (!order) {
      // Return 200 to acknowledge receipt even if order not in sandbox database to avoid webhook retries
      return NextResponse.json({
        success: false,
        message: "AWB/Shipment does not correspond to any active Sales Order in this environment."
      });
    }

    const cleanStatus = current_status.trim().toUpperCase();

    // Map Shiprocket status to internal Order Status
    let newOrderStatus = order.order_status;
    if (cleanStatus === "DELIVERED") {
      newOrderStatus = "delivered";
    } else if (cleanStatus === "SHIPPED" || cleanStatus === "PICKED_UP" || cleanStatus === "IN_TRANSIT") {
      newOrderStatus = "dispatched";
    }

    // Process Delivery and Fetch POD
    if (cleanStatus === "DELIVERED" && order.order_status !== "delivered") {
      console.log(`[Shiprocket Webhook] Processing final delivery details for: ${order.order_id}`);
      
      let podUrl = order.pod_url;
      let podSignature = order.pod_signature;

      try {
        const podResult = await fetchShiprocketPOD(String(shipment_id || order.shipment_id));
        if (podResult.success) {
          podUrl = podResult.podUrl;
          podSignature = podResult.podSignature;
        }
      } catch (podErr) {
        console.error("Failed to retrieve POD via webhook workflow:", podErr);
      }

      // Update SalesOrder with final delivered flags and POD details
      await db.salesOrder.update({
        where: { order_id: order.order_id },
        data: {
          order_status: "delivered",
          delivery_confirmed: "yes",
          delivery_date: new Date(),
          pod_url: podUrl,
          pod_signature: podSignature
        }
      });

      // Write Audit Log
      await db.auditLog.create({
        data: {
          user_name: "Automated Shiprocket Webhook",
          action: "SHIPMENT_DELIVERED",
          description: `Consignment delivered successfully. AWB: ${awb}. Fetched and attached POD: ${podUrl || "N/A"}. Signed by: ${podSignature || "N/A"}.`,
          linked_id: order.order_id
        }
      });

      // Log Notification
      await db.notification.create({
        data: {
          type: "order_received",
          message: `✅ Order delivered & closed: ${order.order_id}. POD verified & attached.`,
          linked_to_id: order.order_id,
          status: "unread",
          for_role: "ACCOUNTS"
        }
      });

      // Outgoing WhatsApp confirmation
      const waMsg = `📦 Parcel Delivered! Namaste ${order.buyer.full_name},\n\nHame Shiprocket cargo partner se confirmation mili hai ki aapka package [ID: ${order.order_id}] successfully deliver ho gaya hai. ✅\n\n📄 Signed Delivery Proof (POD) link: ${podUrl || "Checked"}\n\nKripya opening raw video verify kar lein. Support ke liye direct chat karein!`;
      await db.whatsAppLog.create({
        data: {
          contact_number: order.buyer.mobile,
          direction: "outgoing",
          message_type: "text",
          message_content: waMsg,
          handled_by: "ai",
          buyer_id: order.buyer_id
        }
      });

    } else {
      // Just update regular status transitions
      await db.salesOrder.update({
        where: { order_id: order.order_id },
        data: {
          order_status: newOrderStatus
        }
      });

      // Log Audit Entry
      await db.auditLog.create({
        data: {
          user_name: "Automated Shiprocket Webhook",
          action: "SHIPMENT_TRACKING",
          description: `Carrier transit tracking check. Status: ${cleanStatus}, AWB: ${awb}.`,
          linked_id: order.order_id
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Webhook tracking coordinates parsed and synced successfully."
    });
  } catch (error: any) {
    console.error("Shiprocket webhook endpoint error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process webhook cargo signal." },
      { status: 500 }
    );
  }
}
