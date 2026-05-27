import { NextResponse } from "next/server";
import { requireStaffRole } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    let caller;
    try { caller = await requireStaffRole(request, "SALES", "MARKETING"); } catch (r) { return r as NextResponse; }
    const buyerId = Number(params.id);
    const body = await request.json();
    const { action, status, creditLimit, creditDays, note } = body;

    const buyer = await db.buyer.findUnique({
      where: { buyer_id: buyerId }
    });

    if (!buyer) {
      return NextResponse.json({ error: "Buyer profile nahi mili." }, { status: 404 });
    }

    let updatedBuyer = buyer;

    if (action === "status_update" && status) {
      updatedBuyer = await db.buyer.update({
        where: { buyer_id: buyerId },
        data: {
          account_status: status,
          approved_on: status === "APPROVED" ? new Date() : buyer.approved_on,
          notes: note ? `${buyer.notes || ""}\n[Note Added]: ${note}` : buyer.notes
        }
      });

      // If approved, trigger automated WhatsApp login notification credentials!
      if (status === "APPROVED") {
        const waMsg = `Namaste ${buyer.full_name} ji! 🙏\n\n🎉 Khushkhabri! Prime Apparel Exports mein aapka B2B wholesale buyer account verify aur APPROVED ho gaya hai!\n\nAb aap pure cambric cottons, rayon sets aur festive silk catalogs ke actual standard rates double-check kar sakte hain:\n🔗 Catalog link: http://localhost:3000/catalog\n\nLogin Credentials:\n👤 Username (Mobile): ${buyer.mobile}\n🔑 Password: (Aapka configured registration password)\n\nHappy wholesale sourcing with Mumbai QC discipline!`;

        await db.whatsAppLog.create({
          data: {
            contact_number: buyer.mobile,
            direction: "outgoing",
            message_type: "text",
            message_content: waMsg,
            handled_by: "ai",
            buyer_id: buyerId
          }
        });
      }
    } else if (action === "credit_update") {
      updatedBuyer = await db.buyer.update({
        where: { buyer_id: buyerId },
        data: {
          credit_limit: Number(creditLimit),
          credit_days: Number(creditDays),
          notes: note ? `${buyer.notes || ""}\n[Credit Configured]: Limit ₹${creditLimit}, ${creditDays} Days.` : buyer.notes
        }
      });
    }

    return NextResponse.json({ success: true, buyer: updatedBuyer });
  } catch (error) {
    console.error("Update Buyer Profile Error: ", error);
    return NextResponse.json({ error: "Failed to update buyer profile." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    let caller;
    try { caller = await requireStaffRole(request, "ADMIN", "FOUNDER"); } catch (r) { return r as NextResponse; }
    
    const buyerId = Number(params.id);
    
    // Enforce B2B compliance checks: Check for active B2B orders or invoices
    const associatedOrders = await db.salesOrder.findMany({
      where: { buyer_id: buyerId }
    });

    if (associatedOrders.length > 0) {
      return NextResponse.json({
        error: "COMPLIANCE BLOCKED: B2B Data Retention and GST/Arbitration laws require keeping active transaction invoices for at least 8 years. Buyer profile deletion is strictly prohibited."
      }, { status: 400 });
    }

    // Delete CRM Customer if exists
    const customer = await db.customer.findUnique({
      where: { buyer_id: buyerId }
    });
    if (customer) {
      await db.customer.delete({
        where: { id: customer.id }
      });
    }

    // Safe to delete buyer
    await db.buyer.delete({
      where: { buyer_id: buyerId }
    });

    return NextResponse.json({ success: true, message: "Buyer profile successfully removed from ERP directory." });
  } catch (error: any) {
    console.error("Delete Buyer Error: ", error);
    return NextResponse.json({ error: "Failed to delete buyer profile." }, { status: 500 });
  }
}
