import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const leadId = Number(params.id);
    const body = await request.json();
    const { status, note, assignedTo } = body;

    const lead = await db.lead.findUnique({
      where: { lead_id: leadId }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead details not found." }, { status: 404 });
    }

    const updatedLead = await db.lead.update({
      where: { lead_id: leadId },
      data: {
        status: status || lead.status,
        notes: note ? `${lead.notes || ""}\n[Note]: ${note}` : lead.notes,
        assigned_to: assignedTo || lead.assigned_to,
        last_contact_date: new Date()
      }
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error("Update Lead Error: ", error);
    return NextResponse.json({ error: "Failed to update lead parameters." }, { status: 500 });
  }
}
