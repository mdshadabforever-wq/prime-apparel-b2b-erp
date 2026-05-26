import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthTokenFromHeader, verifyToken } from "@/lib/auth";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// GET: Fetch full 360° customer memory profile, with auto-stats calculations and lazy-creation
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = getAuthTokenFromHeader(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access. No session token." }, { status: 401 });
    }
    const staff = verifyToken(token);
    if (!staff) {
      return NextResponse.json({ error: "Session expired. Re-login." }, { status: 401 });
    }

    const buyerId = Number(params.id);
    if (isNaN(buyerId)) {
      return NextResponse.json({ error: "Invalid Buyer ID parameter." }, { status: 400 });
    }

    // 1. Lazy-create CRM customer record if not exists
    let customer = await db.customer.findUnique({
      where: { buyer_id: buyerId },
      include: {
        conversations: { include: { messages: true } },
        followups: true,
        notes: true,
        tags: true,
        timeline: true,
        ai_insights: true,
        attachments: true,
        reminders: true,
        payments: true
      }
    });

    if (!customer) {
      // Find corresponding Buyer details
      const buyer = await db.buyer.findUnique({
        where: { buyer_id: buyerId }
      });

      if (!buyer) {
        return NextResponse.json({ error: "Buyer profile not found in ERP directory." }, { status: 404 });
      }

      // Create new CRM Customer memory block
      customer = await db.customer.create({
        data: {
          buyer_id: buyer.buyer_id,
          company_name: buyer.business_name,
          trade_name: buyer.gst_legal_name || buyer.business_name,
          gstin: buyer.gst_number,
          mobile: buyer.mobile,
          whatsapp_number: buyer.mobile,
          email: buyer.email || "",
          address: buyer.address || "",
          city: buyer.city,
          state: buyer.state,
          assigned_salesperson: staff.name || "System Automated",
          risk_level: "LOW",
          lead_stage: buyer.lead_status || "COLD",
          total_orders: buyer.total_orders_count,
          total_revenue: buyer.total_orders_value
        },
        include: {
          conversations: { include: { messages: true } },
          followups: true,
          notes: true,
          tags: true,
          timeline: true,
          ai_insights: true,
          attachments: true,
          reminders: true,
          payments: true
        }
      });

      // Initialize welcome log message
      const defaultConv = await db.conversation.create({
        data: {
          customer_id: customer.id,
          channel: "WHATSAPP",
          title: "Primary WhatsApp Synchronization"
        }
      });

      await db.message.create({
        data: {
          conversation_id: defaultConv.conversation_id,
          sender: "system",
          content: `🟢 CRM Memory Brain initialized. B2B profile for ${buyer.business_name} synced under Mumbai QC control. Ready for WhatsAppCloud integrations and automated summaries.`,
          direction: "incoming",
          message_type: "text",
          status: "read"
        }
      });

      // Log to timeline
      await db.customerTimeline.create({
        data: {
          customer_id: customer.id,
          event_type: "SYSTEM_ALERT",
          title: "Memory System Initialized",
          description: `Customer Memory & CRM space successfully initialized by ${staff.name}`,
          operator_name: staff.name
        }
      });

      // Re-fetch populated customer
      customer = await db.customer.findUnique({
        where: { buyer_id: buyerId },
        include: {
          conversations: { include: { messages: { orderBy: { timestamp: 'asc' } } } },
          followups: { orderBy: { scheduled_date: 'asc' } },
          notes: { orderBy: { is_pinned: 'desc' } },
          tags: true,
          timeline: { orderBy: { timestamp: 'desc' } },
          ai_insights: true,
          attachments: true,
          reminders: true,
          payments: { orderBy: { payment_date: 'desc' } }
        }
      }) as any;
    }

    if (!customer) {
      return NextResponse.json({ error: "Failed to initialize CRM profile." }, { status: 500 });
    }

    // 2. Perform Real-time B2B Statistics Calculations and update customer cache
    const salesOrders = await db.salesOrder.findMany({
      where: { buyer_id: buyerId }
    });

    const activeOrders = salesOrders.filter(o => o.order_status !== "cancelled");
    const totalOrdersCount = activeOrders.length;
    const totalRevValue = activeOrders.reduce((sum, o) => sum + o.invoice_amount, 0);
    const averageOrderVal = totalOrdersCount > 0 ? (totalRevValue / totalOrdersCount) : 0;
    
    // Pending Payments = total unpaid balance on uncancelled orders
    const pendingPayValue = activeOrders.reduce((sum, o) => {
      if (o.payment_status !== "paid") {
        return sum + (o.invoice_amount - o.payment_received_amount);
      }
      return sum;
    }, 0);

    // Last order date
    let lastOrderDate: Date | null = null;
    if (activeOrders.length > 0) {
      const dates = activeOrders.map(o => new Date(o.order_date).getTime());
      lastOrderDate = new Date(Math.max(...dates));
    }

    // Repeat Frequency description
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentOrdersCount = activeOrders.filter(o => new Date(o.order_date) >= ninetyDaysAgo).length;
    let repeatFreq = "LOW (New Buyer)";
    if (recentOrdersCount >= 3) repeatFreq = "HIGH (Frequent Sourcing)";
    else if (recentOrdersCount >= 1) repeatFreq = "MEDIUM (Regular Sourcing)";

    // Update Customer statistics in DB
    const updatedCustomer = await db.customer.update({
      where: { id: customer.id },
      data: {
        total_orders: totalOrdersCount,
        total_revenue: totalRevValue,
        pending_payments: pendingPayValue,
        last_order_date: lastOrderDate,
        average_order_value: averageOrderVal,
        repeat_frequency: repeatFreq
      },
      include: {
        conversations: { 
          include: { 
            messages: { orderBy: { timestamp: 'asc' } } 
          },
          orderBy: { last_message_at: 'desc' }
        },
        followups: { orderBy: { scheduled_date: 'asc' } },
        notes: { orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }] },
        tags: true,
        timeline: { orderBy: { timestamp: 'desc' } },
        ai_insights: { orderBy: { created_at: 'desc' } },
        attachments: true,
        reminders: { orderBy: { remind_at: 'asc' } },
        payments: { orderBy: { payment_date: 'desc' } }
      }
    });

    // Also fetch associated raw Buyer stats for side-by-side verification
    const rawBuyer = await db.buyer.findUnique({
      where: { buyer_id: buyerId }
    });

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      salesOrders,
      buyer: rawBuyer
    });

  } catch (error) {
    console.error("CRM GET Profile Error:", error);
    return NextResponse.json({ error: "Failed to load CRM Memory profile." }, { status: 500 });
  }
}

// POST/PUT: Perform operations based on 'action' in request body
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = getAuthTokenFromHeader(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }
    const staff = verifyToken(token);
    if (!staff) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    // Rate Limiter: Max 60 requests per minute per staff member
    const now = Date.now();
    const limiter = rateLimitMap.get(String(staff.userId)) || { count: 0, resetTime: now + 60000 };
    if (now > limiter.resetTime) {
      limiter.count = 1;
      limiter.resetTime = now + 60000;
    } else {
      limiter.count++;
    }
    rateLimitMap.set(String(staff.userId), limiter);

    if (limiter.count > 60) {
      return NextResponse.json(
        { error: "Too many actions logged. Please slow down (rate limit exceeded)." },
        { status: 429 }
      );
    }

    const buyerId = Number(params.id);
    if (isNaN(buyerId)) {
      return NextResponse.json({ error: "Invalid Buyer ID." }, { status: 400 });
    }

    const customer = await db.customer.findUnique({
      where: { buyer_id: buyerId }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer profile not initialized yet. View first." }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    let result: any = null;

    switch (action) {
      case "update_profile": {
        const { companyName, tradeName, riskLevel, leadStage, assignedSalesperson, whatsappNumber, email, address, city, state } = body;
        result = await db.customer.update({
          where: { id: customer.id },
          data: {
            company_name: companyName ?? customer.company_name,
            trade_name: tradeName ?? customer.trade_name,
            risk_level: riskLevel ?? customer.risk_level,
            lead_stage: leadStage ?? customer.lead_stage,
            assigned_salesperson: assignedSalesperson ?? customer.assigned_salesperson,
            whatsapp_number: whatsappNumber ?? customer.whatsapp_number,
            email: email ?? customer.email,
            address: address ?? customer.address,
            city: city ?? customer.city,
            state: state ?? customer.state
          }
        });

        await db.customerTimeline.create({
          data: {
            customer_id: customer.id,
            event_type: "SYSTEM_ALERT",
            title: "Profile Updated",
            description: `Basic parameters details edited by ${staff.name}`,
            operator_name: staff.name
          }
        });

        await db.auditLog.create({
          data: {
            user_name: staff.name,
            action: "CRM_UPDATE_PROFILE",
            description: `Updated customer parameters for ${customer.company_name}`,
            linked_id: String(buyerId)
          }
        });
        break;
      }

      case "add_note": {
        const { content, isPinned } = body;
        if (!content) return NextResponse.json({ error: "Note content is required." }, { status: 400 });

        result = await db.customerNote.create({
          data: {
            customer_id: customer.id,
            content,
            is_pinned: !!isPinned,
            created_by: staff.name
          }
        });

        await db.customerTimeline.create({
          data: {
            customer_id: customer.id,
            event_type: "FOLLOW_UP",
            title: "Manual Note Logged",
            description: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
            operator_name: staff.name
          }
        });
        break;
      }

      case "pin_note": {
        const { noteId, isPinned } = body;
        result = await db.customerNote.update({
          where: { note_id: Number(noteId) },
          data: { is_pinned: !!isPinned }
        });
        break;
      }

      case "delete_note": {
        const { noteId } = body;
        await db.customerNote.delete({
          where: { note_id: Number(noteId) }
        });
        result = { success: true };
        break;
      }

      case "add_followup": {
        const { taskDescription, scheduledDate } = body;
        if (!taskDescription || !scheduledDate) {
          return NextResponse.json({ error: "Description and date required." }, { status: 400 });
        }

        result = await db.followUp.create({
          data: {
            customer_id: customer.id,
            task_description: taskDescription,
            scheduled_date: new Date(scheduledDate),
            status: "PENDING",
            assigned_to: staff.name
          }
        });

        await db.customerTimeline.create({
          data: {
            customer_id: customer.id,
            event_type: "FOLLOW_UP",
            title: "Follow-up Scheduled",
            description: `Task: ${taskDescription} scheduled on ${new Date(scheduledDate).toLocaleDateString()}`,
            operator_name: staff.name
          }
        });
        break;
      }

      case "update_followup": {
        const { followupId, status } = body;
        result = await db.followUp.update({
          where: { followup_id: Number(followupId) },
          data: {
            status,
            completed_at: status === "COMPLETED" ? new Date() : null
          }
        });

        await db.customerTimeline.create({
          data: {
            customer_id: customer.id,
            event_type: "FOLLOW_UP",
            title: `Follow-up ${status}`,
            description: `Task marked as ${status} by ${staff.name}`,
            operator_name: staff.name
          }
        });
        break;
      }

      case "add_payment": {
        const { amount, paymentMethod, transactionRef, invoiceId, notes } = body;
        if (!amount || !paymentMethod) {
          return NextResponse.json({ error: "Amount and method required." }, { status: 400 });
        }

        result = await db.paymentHistory.create({
          data: {
            customer_id: customer.id,
            amount: Number(amount),
            payment_method: paymentMethod,
            transaction_ref: transactionRef || "",
            invoice_id: invoiceId || "",
            status: "COMPLETED",
            notes: notes || "",
            created_by: staff.name
          }
        });

        // Add to customer timeline
        await db.customerTimeline.create({
          data: {
            customer_id: customer.id,
            event_type: "PAYMENT_RECEIVED",
            title: `Payment Received: ₹${Number(amount).toLocaleString()}`,
            description: `Received via ${paymentMethod}. Ref: ${transactionRef || "N/A"}. Invoice: ${invoiceId || "Advance"}. Notes: ${notes || "None"}`,
            operator_name: staff.name,
            reference_id: invoiceId || undefined
          }
        });

        await db.auditLog.create({
          data: {
            user_name: staff.name,
            action: "CRM_ADD_PAYMENT",
            description: `Recorded ₹${amount} payment for customer ${customer.company_name}`,
            linked_id: String(buyerId)
          }
        });
        break;
      }

      case "add_tag": {
        const { label } = body;
        if (!label) return NextResponse.json({ error: "Label tag required." }, { status: 400 });
        
        // Prevent duplicate tag for same customer
        const existing = await db.customerTag.findFirst({
          where: { customer_id: customer.id, label }
        });
        if (existing) {
          result = existing;
        } else {
          result = await db.customerTag.create({
            data: {
              customer_id: customer.id,
              label
            }
          });
        }
        break;
      }

      case "delete_tag": {
        const { tagId } = body;
        await db.customerTag.delete({
          where: { tag_id: Number(tagId) }
        });
        result = { success: true };
        break;
      }

      case "add_reminder": {
        const { reminderText, remindAt } = body;
        if (!reminderText || !remindAt) return NextResponse.json({ error: "Text and remind date are required." }, { status: 400 });

        result = await db.customerReminder.create({
          data: {
            customer_id: customer.id,
            reminder_text: reminderText,
            remind_at: new Date(remindAt),
            status: "PENDING"
          }
        });
        break;
      }

      case "update_reminder": {
        const { reminderId, status } = body;
        result = await db.customerReminder.update({
          where: { reminder_id: Number(reminderId) },
          data: { status }
        });
        break;
      }

      case "add_message": {
        const { channel, sender, content, direction, messageType, mediaUrl } = body;
        if (!content) return NextResponse.json({ error: "Message content required." }, { status: 400 });

        // Find or create conversation
        let conversation = await db.conversation.findFirst({
          where: { customer_id: customer.id, channel: channel || "WHATSAPP" }
        });

        if (!conversation) {
          conversation = await db.conversation.create({
            data: {
              customer_id: customer.id,
              channel: channel || "WHATSAPP",
              title: `${channel || "WHATSAPP"} Sync`
            }
          });
        }

        result = await db.message.create({
          data: {
            conversation_id: conversation.conversation_id,
            sender: sender || "salesperson",
            content,
            direction: direction || "outgoing",
            message_type: messageType || "text",
            status: "sent",
            media_url: mediaUrl || null
          }
        });

        await db.conversation.update({
          where: { conversation_id: conversation.conversation_id },
          data: { last_message_at: new Date() }
        });

        // Trigger timeline entry for WhatsApp messages
        if (channel === "WHATSAPP" || !channel) {
          await db.customerTimeline.create({
            data: {
              customer_id: customer.id,
              event_type: direction === "incoming" ? "WHATSAPP_RECEIVED" : "SYSTEM_ALERT",
              title: direction === "incoming" ? "Incoming WhatsApp Message" : "Outgoing WhatsApp Message",
              description: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
              operator_name: staff.name
            }
          });
        }
        break;
      }

      case "update_ai": {
        const { summary, buyerBehavior, repeatProducts, followupSuggestion, priorityScore, riskDetection, paymentDelayEst } = body;
        
        const existingAI = await db.customerAIInsight.findFirst({
          where: { customer_id: customer.id }
        });

        if (existingAI) {
          result = await db.customerAIInsight.update({
            where: { insight_id: existingAI.insight_id },
            data: {
              summary: summary ?? existingAI.summary,
              buyer_behavior: buyerBehavior ?? existingAI.buyer_behavior,
              repeat_products: repeatProducts ? JSON.stringify(repeatProducts) : existingAI.repeat_products,
              followup_suggestion: followupSuggestion ?? existingAI.followup_suggestion,
              priority_score: priorityScore ?? existingAI.priority_score,
              risk_detection: riskDetection ?? existingAI.risk_detection,
              payment_delay_est: paymentDelayEst ?? existingAI.payment_delay_est
            }
          });
        } else {
          result = await db.customerAIInsight.create({
            data: {
              customer_id: customer.id,
              summary: summary || "Awaiting conversations aggregation.",
              buyer_behavior: buyerBehavior || "Calculating sourcing cycles.",
              repeat_products: repeatProducts ? JSON.stringify(repeatProducts) : "[]",
              followup_suggestion: followupSuggestion || "Schedule follow-up call.",
              priority_score: priorityScore ?? 50,
              risk_detection: riskDetection || "LOW RISK",
              payment_delay_est: paymentDelayEst || "ON TIME"
            }
          });
        }
        break;
      }

      case "add_timeline": {
        const { eventType, title, description, referenceId } = body;
        if (!eventType || !title || !description) {
          return NextResponse.json({ error: "EventType, Title, Description are required." }, { status: 400 });
        }

        result = await db.customerTimeline.create({
          data: {
            customer_id: customer.id,
            event_type: eventType,
            title,
            description,
            operator_name: staff.name,
            reference_id: referenceId || null
          }
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error("CRM PUT Operation Error:", error);
    return NextResponse.json({ error: "Failed to perform CRM action." }, { status: 500 });
  }
}
