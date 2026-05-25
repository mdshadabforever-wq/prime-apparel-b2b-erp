import { db } from "./db";

// In-memory conversation session states for chatbot simulation
interface ChatSession {
  state: "WELCOME" | "CATALOG_CITY" | "CATALOG_BUSINESS" | "CATALOG_CATEGORY" | "ORDER_STATUS_WAIT" | "COMPLAINT_TYPE" | "HUMAN_ESCALATED";
  data: Record<string, any>;
  lastUpdated: number;
}

const sessions = new Map<string, ChatSession>();

// Static Initial FAQs from SOURCE 1
export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

export const FAQ_DATABASE: FAQItem[] = [
  {
    id: "moq",
    category: "ORDERING",
    question: "Minimum order kitna hai?",
    answer: "Minimum 12 pieces per design hai. Alag alag designs mein mix kar sakte hain, lekin ek design mein minimum 12 pieces chahiye.",
    keywords: ["minimum", "order", "pcs", "piece", "qty", "limit", "mix"]
  },
  {
    id: "sample",
    category: "ORDERING",
    question: "Sample piece milega?",
    answer: "Abhi hum single piece nahi bhejte. Minimum 12 pieces se shuru hota hai. Lekin hamare catalog mein detailed high-definition photos aur videos hain jo fabric quality and stitching clearly dikhate hain.",
    keywords: ["sample", "ek piece", "single", "check", "trial"]
  },
  {
    id: "negotiation",
    category: "PRICING",
    question: "Price negotiation hoti hai?",
    answer: "Hamari wholesale prices already manufacturing rates pe set hain. Bulk orders pe special schemes milti hain:\n✅ 25-49 pcs: 3% discount\n✅ 50+ pcs: 5% discount\nIsse zyada discount possible nahi kyunki hum Surat sourcing and Mumbai strictly 100% Quality Control standard operate karte hain.",
    keywords: ["discount", "negotiate", "kam hoga", "rate", "less"]
  },
  {
    id: "gst",
    category: "PRICING",
    question: "GST alag lagega?",
    answer: "Haan, ladies ethnic wear standard regulations ke mutabik GST alag lagega (usually 5% for apparel). Bill/Invoice mein strictly clear bifurcation rahegi. GST registered buyers are fully eligible for input credit returns.",
    keywords: ["gst", "tax", "bill", "invoice", "gst number"]
  },
  {
    id: "payment_method",
    category: "PAYMENT",
    question: "Payment kaise karni hai?",
    answer: "First order ke liye hum strict 100% advance standard industry rule enforce karte hain. Payment methods available:\n🏦 Direct Bank Transfer / IMPS / NEFT\n📱 Fast UPI Transfers\nExact account details order finalize hone par direct invoice ke saath di jaayengi.",
    keywords: ["payment", "bank transfer", "upi", "google pay", "pay", "advance", "account number"]
  },
  {
    id: "credit",
    category: "PAYMENT",
    question: "Credit (Udhari) milta hai?",
    answer: "Pehle 2 orders strict advance basis pe hote hain. Uske baad regular track record review karke regular GST registered buyers ko 7 Days Credit policy verify and grant ki jaati hai standard terms pe.",
    keywords: ["credit", "udhaari", "udhar", "days", "limit", "payment terms"]
  },
  {
    id: "cod",
    category: "PAYMENT",
    question: "COD available hai?",
    answer: "B2B wholesale trading operations mein Cash On Delivery (COD) standard service options mein completely disabled hai. Business strictly advance or eligible verified credit limits pe run hota hai.",
    keywords: ["cod", "cash on delivery", "delivery pe payment"]
  },
  {
    id: "delivery_days",
    category: "DELIVERY",
    question: "Delivery kitne din mein aati hai?",
    answer: "Sourcing estimates from Mumbai dispatch:\n📌 Mumbai local: 1-2 business days\n📌 Maharashtra: 2-3 business days\n📌 North India: 3-5 business days\n📌 South India: 4-6 business days\n📌 Northeast: 5-7 business days\nActual time transport speeds pe check hota hai.",
    keywords: ["delivery", "days", "time", "speed", "transport", "reach", "kab milega"]
  },
  {
    id: "freight",
    category: "DELIVERY",
    question: "Transport charges kitne hain?",
    answer: "Hum free transport shipping provide karte hain selected pan-India logistics corridors pe standard sizes ke orders ke liye. Exact transportation weights or rates order details pe direct define kiye jaate hain.",
    keywords: ["freight", "transport charges", "delivery charges", "shipping charges", "bhaada", "charge"]
  },
  {
    id: "tracking",
    category: "DELIVERY",
    question: "Tracking kaise karein?",
    answer: "Aapke order dispatch hote hi digital copy of LR (Lorry Receipt) or tracking number system automatically WhatsApp alerts pe update kar dega! Aap direct transport website tracker or helpline se check kar sakte hain.",
    keywords: ["tracking", "lr", "lorry receipt", "consignment", "status", "shipment"]
  },
  {
    id: "quality",
    category: "QUALITY",
    question: "Quality guarantee hai?",
    answer: "Yes, hamari tagline hai: 'Surat variety, Mumbai QC discipline'. Mumbai warehouse mein strict 100% Quality Control verify check pass filters hote hain block printed designs, fabric durability, color bleeding and stitching double locks ke liye. Sahi product hi bhejenge.",
    keywords: ["quality", "defect", "fabric", "stitching", "guarantee", "color bleeding", "damage"]
  },
  {
    id: "returns",
    category: "QUALITY",
    question: "Return policy kya hai?",
    answer: "Standard B2B regulations:\n🔴 Return & Defect Claim: 3-day strict claim limit from delivery date.\n🔴 Mandatory Requirement: Video recording of parcel opening is mandatory for any shortage or damage claims. No claims will be entertained without unedited, complete parcel opening raw video.\n🔴 Change of mind (wholesale): Not allowed.",
    keywords: ["return", "replace", "policy", "damage policy", "defect return", "refund"]
  },
  {
    id: "fabrics",
    category: "PRODUCTS",
    question: "Kaunse fabrics available hain?",
    answer: "Prime Catalog lists ethnic master collections in:\n✅ Pure Cambric Cotton (60-60 premium dailywear)\n✅ Heavy Rayon (14kg standard long-wear)\n✅ Silk Georgette (Festive/Occasion hand embroideries)\n✅ Pure Crepe prints for premium boutique margins.",
    keywords: ["fabric", "cotton", "rayon", "georgette", "crepe", "cloth", "kapda"]
  }
];

// Fallback logic to answer using keyword match
export function queryFAQBrain(message: string): { answer: string; confidence: number } {
  const query = message.toLowerCase();
  let bestMatch: FAQItem | null = null;
  let maxScore = 0;

  for (const item of FAQ_DATABASE) {
    let score = 0;
    // Check keyword exact matches
    for (const keyword of item.keywords) {
      if (query.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
    // Check direct sentence matches
    if (query.includes(item.question.toLowerCase())) {
      score += 5;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  // Calculate generic confidence
  const confidence = bestMatch ? Math.min(100, Math.round((maxScore / 4) * 100)) : 0;

  if (bestMatch && confidence >= 50) {
    return { answer: bestMatch.answer, confidence };
  }

  return {
    answer: "Yeh details main check karke standard manager se double-confirm karta hoon! Main hamare sales representative ko escalate kar raha hoon taaki vo direct catalog aur exact pricing details ke saath personal call/WhatsApp pe reply karein.",
    confidence: 0
  };
}

export async function processIncomingWhatsApp(
  contactNumber: string,
  messageContent: string
): Promise<{ reply: string; status: string; escalated: boolean }> {
  const cleanMobile = contactNumber.replace(/\D/g, "");
  const text = messageContent.trim();
  const lowerText = text.toLowerCase();

  // Get current user type
  const staffUser = await db.staff.findUnique({ where: { mobile: cleanMobile } });
  if (staffUser) {
    return {
      reply: `Staff member detected! Staff is signed in as ${staffUser.name} [Role: ${staffUser.role}]. Web dashboard pe active orders control karein!`,
      status: "staff",
      escalated: false
    };
  }

  const buyerUser = await db.buyer.findUnique({ where: { mobile: cleanMobile } });
  const leadUser = await db.lead.findUnique({ where: { mobile: cleanMobile } });

  // Load or construct session state
  if (!sessions.has(cleanMobile)) {
    sessions.set(cleanMobile, { state: "WELCOME", data: {}, lastUpdated: Date.now() });
  }
  const session = sessions.get(cleanMobile)!;
  session.lastUpdated = Date.now();

  let reply = "";
  let escalated = false;

  // Handle explicit human handoff requests
  if (lowerText.includes("human") || lowerText.includes("staff") || lowerText.includes("representative") || lowerText.includes("baat karao") || lowerText.includes("call me") || lowerText.includes("admin")) {
    session.state = "HUMAN_ESCALATED";
    reply = "Aapki request direct sales coordinator team ko forward ho gayi hai! 🧑‍💼 Hum active representative Amit Sharma ji ko notification bhej rahe hain. Vo direct is conversation pe manually call/reply karenge within 15 mins! Urgent guidelines ke liye support direct Call karein: +91 99999 99999.";
    
    // Log escalation as notification
    await db.notification.create({
      data: {
        type: "new_lead", // escalated lead alert
        message: `🚨 Chat escalated to human! Buyer/Lead requested staff: ${cleanMobile}`,
        linked_to_id: buyerUser ? String(buyerUser.buyer_id) : leadUser ? String(leadUser.lead_id) : "unknown",
        status: "unread",
        for_role: "SALES"
      }
    });

    // Update log
    await logWhatsApp(cleanMobile, "incoming", text, buyerUser?.buyer_id, leadUser?.lead_id, "human");
    await logWhatsApp(cleanMobile, "outgoing", reply, buyerUser?.buyer_id, leadUser?.lead_id, "human");

    return { reply, status: "escalated", escalated: true };
  }

  if (session.state === "HUMAN_ESCALATED") {
    reply = "Simulated human handoff enabled on this number. Staff will reply manually shortly. System is waiting for active representative...";
    await logWhatsApp(cleanMobile, "incoming", text, buyerUser?.buyer_id, leadUser?.lead_id, "human");
    return { reply, status: "escalated", escalated: true };
  }

  // DIALOG STATE MACHINE
  if (buyerUser) {
    // FLOW 5: Registered Buyer Dialog Engine
    if (session.state === "WELCOME") {
      const cleanLower = lowerText.trim();
      const isStrictOption = ["1", "2", "3", "4", "catalog", "order", "status", "payment"].includes(cleanLower);

      if (isStrictOption) {
        if (cleanLower === "1" || cleanLower === "catalog") {
          session.state = "CATALOG_CATEGORY";
          reply = `Bilkul ${buyerUser.full_name} ji! 📁 Kaunsi wholesale category ka premium design catalog download karna hai?\n\n1️⃣ Pure Cambric Cotton Kurtis\n2️⃣ Festive Silk Suit Sets\n3️⃣ Summer Daily Rayon Sets\n4️⃣ Sab dikhaiye!`;
        } else if (cleanLower === "2" || cleanLower === "order") {
          reply = `Badiya choice! Please active catalog designs mein se jo bhi orders confirm karne hain, unka digital photo ya SKU code direct details ke saath yahan bhej dijiye.\n\n📌 Minimum order is strictly 12 pieces per design.\n🏦 Aapki approved credit limits: ₹${buyerUser.credit_limit} - ${buyerUser.credit_days} days.`;
        } else if (cleanLower === "3" || cleanLower === "status") {
          // Fetch last order
          const lastOrder = await db.salesOrder.findFirst({
            where: { buyer_id: buyerUser.buyer_id },
            orderBy: { order_date: "desc" }
          });

          if (lastOrder) {
            reply = `📋 Aapka last Sales Order summary [ID: ${lastOrder.order_id}]:\n\n📌 Status: ${lastOrder.order_status.toUpperCase()} ✅\n🚚 Transport carrier: ${lastOrder.transport_name || "Assign ho raha hai"}\n🔢 LR Booking Number: ${lastOrder.lr_number || "Aane wala hai"}\n📅 Expected Delivery: ${lastOrder.expected_delivery_date ? new Date(lastOrder.expected_delivery_date).toDateString() : "Check details"}\n\nInvoice is marked as ${lastOrder.payment_status.toUpperCase()}.\nKoi issue ho to direct help type karein!`;
          } else {
            reply = "Hame aapka koi active order is account pe nahi mila. Direct wholesale prices unlocked hain catalog page pe. Website: http://localhost:3000/catalog";
          }
        } else if (cleanLower === "4" || cleanLower === "payment") {
          reply = `Aapka outstanding invoice record verify kiya ja raha hai.\n🏦 Standard Bank account payment option:\nName: Prime Apparel Exports Ltd\nBank: HDFC Bank Mumbai\nA/C Number: 50200012345678\nIFSC: HDFC0001234\nUPI ID: primeapparel@upi\n\nPayment screen details screenshot direct chat pe copy kar dein.`;
        }
      } else {
        // Not a strict option -> check FAQ brain first
        const faq = queryFAQBrain(text);
        if (faq.confidence > 0) {
          reply = faq.answer;
        } else {
          reply = `Namaste ${buyerUser.full_name} ji! 👋\nPrime Apparel wholesale digital server panel unlocked.\n\nAapka current registration status: APPROVED ✅\n\nKya assistance chahiye aaj?\n1️⃣ Premium digital catalog download karein\n2️⃣ Order place karein\n3️⃣ Active order tracking status\n4️⃣ Bank payment account details\n5️⃣ Direct Customer support representative call`;
        }
      }
    } else if (session.state === "CATALOG_CATEGORY") {
      session.state = "WELCOME";
      let categoryName = "Complete ethnic master collection";
      if (lowerText === "1") categoryName = "Cotton Daily Wear Kurtis";
      if (lowerText === "2") categoryName = "3-Piece Festive Silk Sets";
      if (lowerText === "3") categoryName = "Rayon collections";
      
      reply = `Perfect choice! 📁 Hame khushi hai dynamic catalog compile ho gayi hai:\n👇 Link standard catalog download for: *${categoryName}*:\n🔗 http://localhost:3000/catalog\n\nWholesale rates or SKU inventory details direct check karein digital website catalog page pe!`;
    }
  } else {
    // NEW VISITOR OR PRE-REGISTERED LEAD STATE MACHINE
    if (session.state === "WELCOME") {
      const cleanLower = lowerText.trim();
      const isStrictOption = ["1", "2", "3", "4", "catalog", "price", "sample", "order", "company", "about"].includes(cleanLower);

      if (isStrictOption) {
        if (cleanLower === "1" || cleanLower === "catalog") {
          session.state = "CATALOG_CITY";
          reply = "Bilkul! catalog ki digital details link share karne se pehle, ek-do normal questions ka verification zaroori hai:\n\n📍 Aap kis City/State se wholesale trading operations operate karte hain? (City name type karein)";
        } else if (cleanLower === "2" || cleanLower === "price") {
          reply = "Hamari standard ladies ethnic wholesale pricing summary:\n\n📦 Cotton Daily Kurtis: ₹280 - ₹420 / piece\n📦 Heavy Rayon Kurtis: ₹320 - ₹480 / piece\n📦 Luxury 3-Piece Suit Sets: ₹380 - ₹580 / set\n📦 Occasion Georgette Festives: ₹450 - ₹750 / set\n\n✨ Direct wholesale margins or discount scheme details dekhne ke liye, login required hai:\n🔗 Website Register Page: http://localhost:3000/register";
        } else if (cleanLower === "3" || cleanLower === "sample" || cleanLower === "order") {
          reply = "Prime Apparel exports standard B2B rules guidelines follow karta hai:\n👉 Sourcing points Surat, strictly QC check Mumbai warehouse se dispatched.\n👉 Minimum order requirement standard 12 pieces per design style sizes.\n👉 Single piece sample facility is currently disabled for security.\n\nPehla order finalize karne ke liye, direct register and verification links follow karein:\n🔗 Register Page: http://localhost:3000/register";
        } else if (cleanLower === "4" || cleanLower === "company" || cleanLower === "about") {
          reply = "Prime Apparel Exports B2B ladies ethnic apparel trade leader hai.\nSourcing office: Ring Road, Surat.\nQC, billing and Mumbai primary cargo dispatches: Bandra West, Mumbai.\n\n✨ Strict 100% Quality Checks guaranteed parameters checks before every dispatch transit!";
        }
      } else {
        // Check FAQ brain first
        const faq = queryFAQBrain(text);
        if (faq.confidence > 0) {
          reply = faq.answer;
        } else {
          reply = "Namaste! 🙏 Prime Apparel Exports wholesale customer service bot assistant.\nHum ladies ethnic wear wholesale manufacturers & suppliers hain. (Surat Sourcing point, Mumbai QC control).\n\nAapko kya details jaanna hai?\n1️⃣ Premium digital catalog download links\n2️⃣ Product wholesale pricing list\n3️⃣ Minimum order / sample guidelines\n4️⃣ Company logistics check details\n5️⃣ Support team representative call request";
        }
      }
    } else if (session.state === "CATALOG_CITY") {
      session.state = "CATALOG_BUSINESS";
      // Save city in memory data
      session.data.city = text;
      
      reply = `Perfect! Humne update kar liya hai business city: *${text}*.\n\nAap kis business setup model pe focus karte hain?\n\n1️⃣ Offline physical Retail Shop\n2️⃣ Online Boutique seller (Instagram, Meesho, Website)\n3️⃣ Small Group WhatsApp reseller network\n4️⃣ Regional Mini Wholesaler`;
    } else if (session.state === "CATALOG_BUSINESS") {
      session.state = "CATALOG_CATEGORY";
      
      let bizType = "Boutique/Online";
      if (lowerText === "1") bizType = "OFFLINE_RETAIL";
      if (lowerText === "2") bizType = "ONLINE_SELLER";
      if (lowerText === "3") bizType = "OTHER";
      if (lowerText === "4") bizType = "MINI_WHOLESALER";
      session.data.businessType = bizType;

      // Automatically create a dynamic Lead in the Database if not existing!
      if (!leadUser) {
        try {
          await db.lead.create({
            data: {
              name: `WhatsApp Lead (${cleanMobile.slice(-5)})`,
              mobile: cleanMobile,
              city: session.data.city || "Unknown",
              source: "whatsapp",
              business_type: bizType,
              score: 35, // Starter score
              status: "new",
              notes: `Auto WhatsApp Bot conversation lead creation. City: ${session.data.city}.`
            }
          });
        } catch (e) {
          // ignore unique constraint
        }
      }

      reply = `Shukriya! System register successfully standard details format.\n\nAapko kis category design trends mein zyada interest hai?\n\n1️⃣ Pure Cotton Daily Kurtis\n2️⃣ 3-Piece Festive Suit Sets\n3️⃣ Premium Occasion Georgette\n4️⃣ Sabhi designs dikhaiye!`;
    } else if (session.state === "CATALOG_CATEGORY") {
      session.state = "WELCOME";
      let category = "Full collection";
      if (lowerText === "1") category = "Cotton Kurtis";
      if (lowerText === "2") category = "Festive Suit Sets";
      
      reply = `Aapki dynamic catalog details links generated for: *${category}*! 📁\n🔗 catalog website links: http://localhost:3000/catalog\n\nPrices blur locked are restricted for visitor privacy. Direct register for approved wholesale rates unlocked:\n🔗 Register Page: http://localhost:3000/register\n\nKoi help? support type karein!`;
    }
  }

  // Log conversation log
  await logWhatsApp(cleanMobile, "incoming", text, buyerUser?.buyer_id, leadUser?.lead_id, "ai");
  await logWhatsApp(cleanMobile, "outgoing", reply, buyerUser?.buyer_id, leadUser?.lead_id, "ai");

  return { reply, status: session.state, escalated };
}

// Utility to write to database whatsAppLog table
async function logWhatsApp(
  mobile: string,
  direction: "incoming" | "outgoing",
  content: string,
  buyerId?: number,
  leadId?: number,
  handledBy = "ai"
) {
  try {
    await db.whatsAppLog.create({
      data: {
        contact_number: mobile,
        direction,
        message_type: "text",
        message_content: content,
        handled_by: handledBy,
        buyer_id: buyerId || null,
        lead_id: leadId || null
      }
    });
  } catch (error) {
    console.error("Error logging WhatsApp message to DB: ", error);
  }
}
