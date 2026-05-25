import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    const { searchParams } = new URL(request.url);
    const forceHtml = searchParams.get("html") === "true";
    const order = await db.salesOrder.findUnique({
      where: { order_id: orderId },
      include: { buyer: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order details not found." }, { status: 404 });
    }

    const items = JSON.parse(order.items || "[]");
    const buyer = order.buyer;

    // Determine B2B status
    const isB2B = order.invoice_type === "B2B" || (buyer.buyer_type === "GST" && !!buyer.gst_number);
    const invoiceTitle = isB2B ? "B2B Tax Invoice" : "B2C Unregistered Invoice";

    const maskPanOrAadhaar = (val?: string | null) => {
      if (!val) return "Not Provided";
      if (val.length <= 4) return val;
      return "X".repeat(val.length - 4) + val.slice(-4);
    };

    // Calculate taxes (Maharashtra is tier 1 state, Mumbai based B2B hub)
    const isMaharashtra = buyer.state.toLowerCase().includes("maharashtra");
    const cgst = isMaharashtra ? Number((order.gst_amount / 2).toFixed(2)) : 0;
    const sgst = isMaharashtra ? Number((order.gst_amount / 2).toFixed(2)) : 0;
    const igst = !isMaharashtra ? order.gst_amount : 0;

    // Calculate dynamic due date
    const calculatedDueDate = order.due_date 
      ? new Date(order.due_date)
      : new Date(new Date(order.order_date).getTime() + (buyer.credit_days || 0) * 24 * 60 * 60 * 1000);

    // Build the high-fidelity HTML representing the GST Invoice
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${invoiceTitle} - ${orderId}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 40px;
            font-size: 13px;
            line-height: 1.4;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            border: 1px solid #eee;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
            padding: 30px;
            background: #fff;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .header-table td {
            vertical-align: top;
          }
          .company-logo {
            font-size: 24px;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: -0.5px;
          }
          .company-subtitle {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 1px;
            margin-top: 2px;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: 300;
            color: #9ca3af;
            text-align: right;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .details-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .details-grid td {
            width: 50%;
            vertical-align: top;
            padding: 10px;
            background: #f9fafb;
            border: 1px solid #f3f4f6;
          }
          .details-title {
            font-size: 10px;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .address-block {
            line-height: 1.5;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 12px;
          }
          .items-table th {
            background: #1e3a8a;
            color: #fff;
            text-align: left;
            padding: 8px 10px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
          .items-table td {
            padding: 10px;
            border-bottom: 1px solid #f3f4f6;
          }
          .items-table tr:nth-child(even) td {
            background: #fcfcfc;
          }
          .summary-table {
            width: 40%;
            margin-left: auto;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .summary-table td {
            padding: 6px 10px;
            border-bottom: 1px solid #f3f4f6;
          }
          .summary-table tr.total td {
            font-weight: 800;
            color: #1e3a8a;
            border-top: 2px solid #1e3a8a;
            font-size: 15px;
            background: #f0f4ff;
          }
          .bank-details {
            border: 1px dashed #d1d5db;
            background: #fafafa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 30px;
            width: 55%;
            font-size: 11px;
          }
          .footer-note {
            text-align: center;
            color: #9ca3af;
            font-size: 11px;
            margin-top: 40px;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          @media print {
            body {
              padding: 0;
            }
            .invoice-box {
              border: none;
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <table class="header-table">
            <tr>
              <td>
                <div class="company-logo">PRIME APPAREL EXPORTS</div>
                <div class="company-subtitle">B2B Ethnic Garments Distribution</div>
                <div style="margin-top: 10px; color: #4b5563;">
                  📍 Mumbai Cargo Hub: Bandra Link Road, Mumbai, MH - 400050<br>
                  📍 Surat Mill Point: Ring Road Textiles Market, Surat, GJ<br>
                  📞 Direct Helpline: +91 99999 99999 | ✉️ billing@primeapparel.com<br>
                  <strong>GSTIN: 27AAAAA1111A1Z1</strong>
                </div>
              </td>
              <td>
                <div class="invoice-title">${invoiceTitle}</div>
                <div style="text-align: right; margin-top: 15px; color: #4b5563;">
                  <strong>Invoice No:</strong> ${orderId}<br>
                  <strong>Date:</strong> ${new Date(order.order_date).toLocaleDateString()}<br>
                  <strong>Due Date:</strong> ${calculatedDueDate.toLocaleDateString()}<br>
                  <strong>Payment Terms:</strong> ${order.payment_terms.toUpperCase()}<br>
                  <strong>Status:</strong> ${order.payment_status.toUpperCase()}<br>
                  <strong>Operator:</strong> ${order.created_by}
                </div>
              </td>
            </tr>
          </table>

          <table class="details-grid">
            <tr>
              <td>
                <div class="details-title">Billed To (${isB2B ? "B2B Buyer" : "B2C Unregistered Buyer"})</div>
                <div class="address-block">
                  <strong>${buyer.business_name}</strong><br>
                  Proprietor: ${buyer.full_name}<br>
                  📞 Contact: +${buyer.mobile}<br>
                  📍 Address: ${buyer.address || "Shop details verified"}, ${buyer.city}, ${buyer.state} - ${buyer.pincode}<br>
                  ${isB2B 
                    ? `<strong>Buyer GSTIN: ${buyer.gst_number}</strong>`
                    : `<strong>Verification details: PAN/Aadhaar (Masked): ${maskPanOrAadhaar(buyer.pan_or_aadhaar)}</strong>`
                  }
                </div>
              </td>
              <td>
                <div class="details-title">Consignee (Shipping Address)</div>
                <div class="address-block">
                  <strong>${buyer.business_name}</strong><br>
                  📍 Cargo Destination: ${buyer.city}, ${buyer.state} - ${buyer.pincode}<br>
                  🚚 Transport Booking: ${order.transport_name || "Dispatched on booking"}<br>
                  🔢 Lorry Receipt (LR) No: ${order.lr_number || "Awaiting consignment booking"}<br>
                  📅 Expected Delivery: ${order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : "Pending Dispatch"}
                </div>
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 15%;">SKU Code</th>
                <th style="width: 45%;">Design & Fabric Description</th>
                <th style="width: 10%; text-align: center;">Size Set</th>
                <th style="width: 10%; text-align: center;">Qty (Pcs)</th>
                <th style="width: 10%; text-align: right;">Rate (₹)</th>
                <th style="width: 10%; text-align: right;">Subtotal (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td style="font-weight: bold; text-transform: uppercase;">${item.skuId}</td>
                  <td>
                    <strong>${item.designName || "Ethnic Kurti"}</strong><br>
                    <span style="font-size: 10px; color: #6b7280;">B2B premium dual QC checked</span>
                  </td>
                  <td style="text-align: center;">S-XXL</td>
                  <td style="text-align: center; font-weight: bold;">${item.qty}</td>
                  <td style="text-align: right;">₹${item.price}</td>
                  <td style="text-align: right; font-weight: bold;">₹${(item.qty * item.price).toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="bank-details">
              <strong style="color: #1e3a8a; display: block; margin-bottom: 5px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Official Settlement Bank Account</strong>
              Bank Name: <strong>HDFC Bank Ltd</strong><br>
              Account Name: <strong>Prime Apparel Exports Ltd</strong><br>
              Account Number: <strong>50200012345678</strong><br>
              IFSC Sourcing Code: <strong>HDFC0001234</strong><br>
              Branch Location: <strong>Bandra West Link, Mumbai</strong><br>
              <span style="display: block; margin-top: 5px; color: #6b7280; font-size: 9px;">* Note: Payment must contain Invoice No: ${orderId} as reference details.</span>
            </div>

            <table class="summary-table">
              <tr>
                <td style="color: #6b7280;">Gross Subtotal</td>
                <td style="text-align: right; font-weight: bold;">₹${order.subtotal_amount.toLocaleString()}</td>
              </tr>
              ${order.discount_amount > 0 ? `
                <tr>
                  <td style="color: #10b981;">Volume Scheme Disc</td>
                  <td style="text-align: right; font-weight: bold; color: #10b981;">- ₹${order.discount_amount.toLocaleString()}</td>
                </tr>
              ` : ""}
              <tr>
                <td style="color: #6b7280;">Taxable Value</td>
                <td style="text-align: right; font-weight: bold;">₹${order.final_amount.toLocaleString()}</td>
              </tr>
              ${cgst > 0 ? `
                <tr>
                  <td style="color: #6b7280; font-size: 11px;">CGST (2.5%)</td>
                  <td style="text-align: right; font-size: 11px;">₹${cgst.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 11px;">SGST (2.5%)</td>
                  <td style="text-align: right; font-size: 11px;">₹${sgst.toLocaleString()}</td>
                </tr>
              ` : `
                <tr>
                  <td style="color: #6b7280; font-size: 11px;">IGST (5.0%)</td>
                  <td style="text-align: right; font-size: 11px;">₹${igst.toLocaleString()}</td>
                </tr>
              `}
              <tr class="total">
                <td>Total Due</td>
                <td style="text-align: right;">₹${order.invoice_amount.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          ${order.pod_url ? `
            <div style="margin-top: 25px; padding: 15px; border: 1px solid #10b981; background: #f0fdf4; border-radius: 6px; font-size: 11px; line-height: 1.6;">
              <strong style="color: #0f766e; display: block; margin-bottom: 5px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Shiprocket Delivery Confirmation (POD)</strong>
              Consignment delivered successfully. <br>
              <strong>AWB Number:</strong> ${order.awb_number || "N/A"}<br>
              <strong>Signed Delivery Proof (POD):</strong> <a href="${order.pod_url}" target="_blank" style="color: #0f766e; text-decoration: underline; font-weight: bold;">View Signed Delivery Slip</a>
              ${order.pod_signature ? `<br><strong>Consignee Signature:</strong> <span style="font-family: 'Courier New', monospace; font-size: 12px; font-weight: bold; color: #374151; background: #fff; padding: 2px 6px; border: 1px solid #d1d5db; border-radius: 4px;">${order.pod_signature}</span>` : ""}
            </div>
          ` : ""}

          <div style="font-size: 10px; color: #6b7280; margin-top: 30px; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px;">
            <strong>TERMS & CONDITIONS:</strong><br>
            1. All disputes are subject to Mumbai Jurisdiction only.<br>
            2. Payment must be cleared within the mentioned due date from invoice date.<br>
            3. This firm is registered under MSME (Udyam). Delayed payments beyond 45 days will attract compound interest at 3 times the RBI bank rate as per MSME Act.<br>
            4. Video recording of parcel opening is mandatory for any shortage or damage claims within 3 days of delivery. No claims will be entertained without unedited opening video.<br>
            5. This is a computer generated legal B2B/B2C invoice and does not require signatures.
          </div>

          <div class="footer-note">
            Thank you for sourcing with Prime Apparel Exports!<br>
            <strong style="color: #1e3a8a;">Surat Sourcing Variety | Mumbai Quality Control Discipline</strong>
          </div>
        </div>
        
        <script>
          // Automatic trigger print utility for fallback HTML view
          if (window.location.search.includes("print=true")) {
            window.onload = function() {
              window.print();
            }
          }
        </script>
      </body>
      </html>
    `;

    // Allow forcing HTML printable page for test runners or manual preview
    if (forceHtml) {
      return new Response(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `inline; filename="Invoice-${orderId}.html"`
        }
      });
    }

    // Attempt standard server-side PDF generation using Puppeteer
    try {
      console.log(`Launching Puppeteer PDF generation for: ${orderId}`);
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
      const page = await browser.newPage();
      
      await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
      
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
      });
      
      await browser.close();

      return new Response(pdfBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="Invoice-${orderId}.pdf"`,
          "Content-Length": String(pdfBuffer.length)
        }
      });
    } catch (pdfErr) {
      console.error("Puppeteer PDF compilation failed, rendering printable fallback HTML:", pdfErr);
      
      // Super high-fidelity printable HTML fallback
      return new Response(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `inline; filename="Invoice-${orderId}.html"`
        }
      });
    }
  } catch (error: any) {
    console.error("Invoice endpoint error:", error);
    return NextResponse.json({ error: error.message || "Failed to compile invoice." }, { status: 500 });
  }
}
