import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    const order = await db.salesOrder.findUnique({
      where: { order_id: orderId },
      include: { buyer: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order details not found." }, { status: 404 });
    }

    const items = JSON.parse(order.items || "[]");
    const buyer = order.buyer;

    // Calculate taxes (Maharashtra is tier 1 state, Mumbai based B2B hub)
    const isMaharashtra = buyer.state.toLowerCase().includes("maharashtra");
    const cgst = isMaharashtra ? Number((order.gst_amount / 2).toFixed(2)) : 0;
    const sgst = isMaharashtra ? Number((order.gst_amount / 2).toFixed(2)) : 0;
    const igst = !isMaharashtra ? order.gst_amount : 0;

    // Build the high-fidelity HTML representing the GST B2B Invoice
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tax Invoice - ${orderId}</title>
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
            font-size: 28px;
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
                <div class="invoice-title">Tax Invoice</div>
                <div style="text-align: right; margin-top: 15px; color: #4b5563;">
                  <strong>Invoice No:</strong> ${orderId}<br>
                  <strong>Date:</strong> ${new Date(order.order_date).toLocaleDateString()}<br>
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
                <div class="details-title">Billed To (B2B Buyer)</div>
                <div class="address-block">
                  <strong>${buyer.business_name}</strong><br>
                  Proprietor: ${buyer.full_name}<br>
                  📞 Contact: +${buyer.mobile}<br>
                  📍 Address: ${buyer.address || "Shop details verified"}, ${buyer.city}, ${buyer.state} - ${buyer.pincode}<br>
                  <strong>Buyer GSTIN: ${buyer.gst_number || "NOT SHARED (B2C Wholesale)"}</strong>
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

          <div style="font-size: 10px; color: #6b7280; margin-top: 20px; line-height: 1.5;">
            <strong>Declaration & Terms:</strong><br>
            1. All goods are meticulously double QC checked at our Mumbai operations hub before packing.<br>
            2. Any transport damage claims must be registered within 48 hours of cargo receipt with visual proof.<br>
            3. Interest @ 18% p.a. will be levied on credit invoices outstanding beyond configured days limit.<br>
            4. This is a computer generated legal B2B tax invoice and does not require signatures.
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

      return new Response(pdfBuffer, {
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
