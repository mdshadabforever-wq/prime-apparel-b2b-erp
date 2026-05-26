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
    const totalQty = order.total_qty;
    const subtotal = order.subtotal_amount;
    
    // Deterministic settlement breakdown
    const isPrepaid = order.payment_terms === "advance" || order.payment_terms === "partial";
    const isCod = order.payment_terms === "cod";

    // 2% prepaid discount
    const prepaidDiscount = isPrepaid ? Math.round(subtotal * 0.02) : 0;
    // 2% COD collection charges
    const codCharges = isCod ? Math.round(subtotal * 0.02) : 0;

    // Courier / Freight Charges: ₹20 per piece (standard B2B wholesale logistics)
    const courierCharges = totalQty * 20;
    // Packaging & double QC sacks handling: flat ₹150
    const packagingCharges = 150;

    // Volume scheme B2B bulk discounts
    let volumeDiscountPercent = 0;
    if (totalQty >= 50) volumeDiscountPercent = 5;
    else if (totalQty >= 25) volumeDiscountPercent = 3;
    const volumeDiscount = Math.round((subtotal * volumeDiscountPercent) / 100);

    // Calculate dynamic Taxable value and GST splits penny-perfectly
    const taxableAmount = subtotal - volumeDiscount - prepaidDiscount + codCharges + courierCharges + packagingCharges;
    
    // CGST, SGST, IGST calculations
    const cgst = isMaharashtra ? Number((order.gst_amount / 2).toFixed(2)) : 0;
    const sgst = isMaharashtra ? Number((order.gst_amount / 2).toFixed(2)) : 0;
    const igst = !isMaharashtra ? order.gst_amount : 0;

    // Amount saved due to prepaid
    const amountSaved = isPrepaid ? (prepaidDiscount + Math.round(subtotal * 0.02)) : 0;

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
            width: 48%;
            margin-left: auto;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 11.5px;
          }
          .summary-table td {
            padding: 7px 10px;
            border-bottom: 1px solid #f3f4f6;
          }
          .summary-table tr.total td {
            font-weight: 800;
            color: #1e3a8a;
            border-top: 2.5px double #1e3a8a;
            font-size: 15px;
            background: #f0f4ff;
          }
          .flow-container {
            margin-top: 10px;
            margin-bottom: 30px;
            background: #fafafa;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            font-family: inherit;
          }
          .flow-title {
            font-size: 11px;
            font-weight: 800;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .flow-steps {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .flow-card {
            flex: 1;
            min-width: 100px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            position: relative;
          }
          .flow-card.accent {
            background: #f0f4ff;
            border-color: #bfdbfe;
          }
          .flow-card.saving {
            background: #ecfdf5;
            border-color: #a7f3d0;
          }
          .flow-card.danger {
            background: #fef2f2;
            border-color: #fca5a5;
          }
          .flow-label {
            font-size: 9px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .flow-value {
            font-size: 13px;
            font-weight: 800;
            color: #111827;
          }
          .flow-card.accent .flow-value {
            color: #1e3a8a;
          }
          .flow-card.saving .flow-value {
            color: #047857;
          }
          .flow-card.danger .flow-value {
            color: #b91c1c;
          }
          .flow-arrow {
            color: #9ca3af;
            font-weight: bold;
            font-size: 16px;
          }
          .bank-details {
            border: 1px dashed #d1d5db;
            background: #fafafa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 30px;
            width: 48%;
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
                <td style="color: #6b7280;">Product Subtotal (${totalQty} pcs)</td>
                <td style="text-align: right; font-weight: bold;">₹${subtotal.toLocaleString()}</td>
              </tr>
              ${volumeDiscount > 0 ? `
                <tr style="color: #047857;">
                  <td style="color: #047857;">Volume Scheme Discount (${volumeDiscountPercent}%)</td>
                  <td style="text-align: right; font-weight: bold; color: #047857;">- ₹${volumeDiscount.toLocaleString()}</td>
                </tr>
              ` : ""}
              ${prepaidDiscount > 0 ? `
                <tr style="color: #047857; background: #f0fdf4;">
                  <td style="color: #047857; font-weight: bold;">Prepaid Payment Discount (2%)</td>
                  <td style="text-align: right; font-weight: bold; color: #047857;">- ₹${prepaidDiscount.toLocaleString()}</td>
                </tr>
              ` : ""}
              ${codCharges > 0 ? `
                <tr style="color: #b45309; background: #fffbeb;">
                  <td style="color: #b45309;">COD Collection Charges (2%)</td>
                  <td style="text-align: right; font-weight: bold; color: #b45309;">+ ₹${codCharges.toLocaleString()}</td>
                </tr>
              ` : ""}
              <tr>
                <td style="color: #6b7280;">Courier / Freight Charges</td>
                <td style="text-align: right; font-weight: bold;">+ ₹${courierCharges.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Packaging & QC Sack Wrapping</td>
                <td style="text-align: right; font-weight: bold;">+ ₹${packagingCharges.toLocaleString()}</td>
              </tr>
              <tr style="border-top: 1.5px solid #d1d5db; font-weight: bold;">
                <td style="color: #374151;">Taxable Value</td>
                <td style="text-align: right; color: #111827;">₹${taxableAmount.toLocaleString()}</td>
              </tr>
              ${cgst > 0 ? `
                <tr style="color: #6b7280; font-size: 11px;">
                  <td>CGST (2.5%)</td>
                  <td style="text-align: right;">₹${cgst.toLocaleString()}</td>
                </tr>
                <tr style="color: #6b7280; font-size: 11px;">
                  <td>SGST (2.5%)</td>
                  <td style="text-align: right;">₹${sgst.toLocaleString()}</td>
                </tr>
              ` : `
                <tr style="color: #6b7280; font-size: 11px;">
                  <td>IGST (5.0%)</td>
                  <td style="text-align: right;">₹${igst.toLocaleString()}</td>
                </tr>
              `}
              <tr class="total">
                <td>Final Payable Amount</td>
                <td style="text-align: right;">₹${order.invoice_amount.toLocaleString()}</td>
              </tr>
              ${order.payment_received_amount > 0 ? `
                <tr style="color: #047857; font-weight: bold; background: #ecfdf5;">
                  <td style="color: #047857; padding: 7px 10px;">Payment Received / Advance</td>
                  <td style="text-align: right; color: #047857; padding: 7px 10px;">- ₹${order.payment_received_amount.toLocaleString()}</td>
                </tr>
              ` : ""}
              ${(order.invoice_amount - order.payment_received_amount) > 0 ? `
                <tr style="color: #b91c1c; font-weight: 800; background: #fef2f2; font-size: 14px; border-top: 2px solid #ef4444;">
                  <td style="color: #b91c1c; padding: 8px 10px;">Net Pending Balance Due</td>
                  <td style="text-align: right; color: #b91c1c; padding: 8px 10px;">₹${(order.invoice_amount - order.payment_received_amount).toLocaleString()}</td>
                </tr>
              ` : `
                <tr style="color: #047857; font-weight: 800; background: #ecfdf5; font-size: 14px; border-top: 2px solid #10b981;">
                  <td style="color: #047857; padding: 8px 10px;">Invoice Status</td>
                  <td style="text-align: right; color: #047857; padding: 8px 10px;">FULLY SETTLED</td>
                </tr>
              `}
            </table>
          </div>

          <!-- Visual B2B Settlement Flowchart -->
          <div class="flow-container">
            <div class="flow-title">
              📊 Commercial Billing Flow Breakdown (Indian B2B Wholesale Rules)
            </div>
            <div class="flow-steps">
              <div class="flow-card accent">
                <div class="flow-label">1. Gross Products</div>
                <div class="flow-value">₹${subtotal.toLocaleString()}</div>
                <div style="font-size: 8px; color: #6b7280; margin-top: 2px;">${totalQty} Pcs Count</div>
              </div>
              
              <div class="flow-arrow">➔</div>

              <div class="flow-card ${volumeDiscount > 0 ? 'saving' : ''}">
                <div class="flow-label">2. Bulk Discount</div>
                <div class="flow-value">${volumeDiscount > 0 ? `-₹${volumeDiscount.toLocaleString()}` : '₹0'}</div>
                <div style="font-size: 8px; color: #6b7280; margin-top: 2px;">Scheme: ${volumeDiscountPercent}%</div>
              </div>

              <div class="flow-arrow">➔</div>

              ${isPrepaid ? `
                <div class="flow-card saving">
                  <div class="flow-label">3. Prepaid Bonus</div>
                  <div class="flow-value">-₹${prepaidDiscount.toLocaleString()}</div>
                  <div style="font-size: 8px; color: #047857; font-weight: bold; margin-top: 2px;">2% Cash Saved!</div>
                </div>
              ` : `
                <div class="flow-card ${codCharges > 0 ? 'danger' : ''}">
                  <div class="flow-label">3. COD Fee</div>
                  <div class="flow-value">${codCharges > 0 ? `+₹${codCharges.toLocaleString()}` : '₹0'}</div>
                  <div style="font-size: 8px; color: #b91c1c; font-weight: bold; margin-top: 2px;">COD Charge (2%)</div>
                </div>
              `}

              <div class="flow-arrow">➔</div>

              <div class="flow-card">
                <div class="flow-label">4. Freight & Sack</div>
                <div class="flow-value">+₹${(courierCharges + packagingCharges).toLocaleString()}</div>
                <div style="font-size: 8px; color: #6b7280; margin-top: 2px;">Double Sacks QC</div>
              </div>

              <div class="flow-arrow">➔</div>

              <div class="flow-card accent">
                <div class="flow-label">5. Taxable Base</div>
                <div class="flow-value">₹${taxableAmount.toLocaleString()}</div>
                <div style="font-size: 8px; color: #6b7280; margin-top: 2px;">For GST split</div>
              </div>

              <div class="flow-arrow">➔</div>

              <div class="flow-card">
                <div class="flow-label">6. GST splits (5%)</div>
                <div class="flow-value">+₹${order.gst_amount.toLocaleString()}</div>
                <div style="font-size: 8px; color: #6b7280; margin-top: 2px;">${isMaharashtra ? 'CGST+SGST' : 'IGST'}</div>
              </div>

              <div class="flow-arrow">➔</div>

              <div class="flow-card accent" style="background: #e0e7ff; border-color: #818cf8;">
                <div class="flow-label" style="color: #3730a3;">7. Net Invoice</div>
                <div class="flow-value" style="color: #3730a3; font-size: 14px;">₹${order.invoice_amount.toLocaleString()}</div>
                <div style="font-size: 8px; color: #4338ca; font-weight: bold; margin-top: 2px;">Total Due</div>
              </div>
            </div>
            
            ${isPrepaid ? `
              <div style="margin-top: 15px; text-align: center; font-size: 11.5px; font-weight: bold; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 8px; border-radius: 6px;">
                🎉 Prepaid Bonus Saved: You saved ₹${amountSaved.toLocaleString()} on this wholesale consignment by settling payments in advance!
              </div>
            ` : `
              <div style="margin-top: 15px; text-align: center; font-size: 11.5px; font-weight: bold; color: #4b5563; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 8px; border-radius: 6px;">
                💡 Pro-Tip: Settle this order as **Prepaid** next time to automatically save ₹${Math.round(subtotal * 0.04).toLocaleString()} in extra COD collection fees and prepaid discounts!
              </div>
            `}
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
