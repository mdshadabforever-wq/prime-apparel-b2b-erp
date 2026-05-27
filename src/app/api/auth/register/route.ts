import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { calculateLeadScore } from "@/lib/scoring";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      mobile,
      email,
      password,
      businessName,
      businessType,
      gstNumber,
      yearsInBusiness,
      city,
      state,
      pincode,
      address,
      instagramLink,
      facebookLink,
      websiteLink,
      justdialLink,
      productsInterested, // Array: ['cotton_kurti', 'rayon_kurti', etc.]
      expectedMonthlyPurchase, // Dropdown range
      currentlyBuyingFrom,
      referralSource,
      buyerType, // "GST" or "NON_GST"
      panOrAadhaar, // secure pan or aadhaar string for unregistered
      gstLegalName,
      gstAddress,
      gstFilingStatus,
      isExportBuyer,
      exportCountry,
      exportIecCode,
      termsConsent,
      whatsappConsent,
      arbitrationConsent
    } = body;

    // Validate consents
    if (!termsConsent || !whatsappConsent || !arbitrationConsent) {
      return NextResponse.json(
        { error: "Submit karne ke liye sabhi Master Terms, WhatsApp communication aur Arbitration policies ko consent dena zaroori hai." },
        { status: 400 }
      );
    }

    // Validate essential fields
    if (!fullName || !mobile || !password || !businessName || !businessType || !city || !state || !pincode) {
      return NextResponse.json(
        { error: "Zaroori fields (Name, Mobile, Password, Shop Name, Business Type, Location details) miss hain." },
        { status: 400 }
      );
    }

    // Strong backend validations for buyer type
    const selectedBuyerType = buyerType === "GST" ? "GST" : "NON_GST";
    
    if (isExportBuyer) {
      if (!exportIecCode || exportIecCode.trim().length === 0) {
        return NextResponse.json(
          { error: "Export Buyer ke liye Import-Export Code (IEC) ya Tax ID mandatory hai." },
          { status: 400 }
        );
      }
    } else {
      if (selectedBuyerType === "GST") {
        if (!gstNumber || gstNumber.trim().length !== 15) {
          return NextResponse.json(
            { error: "Registered Business ke liye 15-character valid GSTIN number mandatory hai." },
            { status: 400 }
          );
        }
      } else {
        if (!panOrAadhaar || panOrAadhaar.trim().length === 0) {
          return NextResponse.json(
            { error: "Unregistered Retailer ke liye PAN card ya Aadhaar number mandatory hai." },
            { status: 400 }
          );
        }
        
        const cleanPanOrAadhaar = panOrAadhaar.trim().toUpperCase();
        const isPan = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPanOrAadhaar);
        const isAadhaar = /^[0-9]{12}$/.test(cleanPanOrAadhaar);
        
        if (!isPan && !isAadhaar) {
          return NextResponse.json(
            { error: "Kripya valid 10-digit PAN (e.g. ABCDE1234F) ya 12-digit Aadhaar number daalein." },
            { status: 400 }
          );
        }
      }
    }

    const cleanMobile = mobile.replace(/\D/g, "");

    // Check if user already exists in Staff
    const existingStaff = await db.staff.findUnique({
      where: { mobile: cleanMobile }
    });
    if (existingStaff) {
      return NextResponse.json(
        { error: "Yeh number staff account ke liye registered hai. Login karein." },
        { status: 400 }
      );
    }

    // Check if buyer already registered
    const existingBuyer = await db.buyer.findUnique({
      where: { mobile: cleanMobile }
    });
    if (existingBuyer) {
      return NextResponse.json(
        { error: "Yeh mobile number pehle se registered hai. Login karein." },
        { status: 400 }
      );
    }

    // 1. Hash the password
    const passwordHash = await hashPassword(password);

    // 2. Map online presence signals
    const hasInstagram = !!instagramLink && instagramLink.trim().length > 0;
    const hasFacebook = !!facebookLink && facebookLink.trim().length > 0;
    const hasWebsite = !!websiteLink && websiteLink.trim().length > 0;
    const hasGoogle = !!justdialLink && justdialLink.trim().length > 0;

    // Estimate online presence tier
    let onlinePresenceTier = "none";
    if (hasInstagram && hasGoogle) onlinePresenceTier = "active_ig_google";
    else if (hasInstagram || hasFacebook || hasWebsite || hasGoogle) onlinePresenceTier = "single_active";
    else onlinePresenceTier = "not_provided";

    // Estimate location stability based on state/city tier (Mumbai, Delhi, Kolkata, Bangalore, Surat standard high tier)
    const tier12Cities = ["mumbai", "delhi", "surat", "ahmedabad", "jaipur", "bangalore", "kolkata", "chennai", "hyderabad", "pune", "nagpur", "lucknow"];
    const locationTier = tier12Cities.includes(city.toLowerCase().trim()) ? "tier12_market" : "tier3_stable";

    // Standardize expected quantity mapping
    let expectedQtyRange = "qty_less_50";
    if (expectedMonthlyPurchase === "1000+" || expectedMonthlyPurchase === "500-1000") {
      expectedQtyRange = "qty_500";
    } else if (expectedMonthlyPurchase === "200-500" || expectedMonthlyPurchase === "100-500") {
      expectedQtyRange = "qty_200_499";
    } else if (expectedMonthlyPurchase === "50-100" || expectedMonthlyPurchase === "100-199") {
      expectedQtyRange = "qty_100_199";
    } else if (expectedMonthlyPurchase === "50-99") {
      expectedQtyRange = "qty_50_99";
    }

    // Map GST Status
    const finalGstNum = selectedBuyerType === "GST" ? gstNumber.trim().toUpperCase() : null;
    const gstStatus = finalGstNum ? "gst_shared" : "gst_not_shared";

    // 3. Compute dynamic B2B lead scoring!
    const scorecard = calculateLeadScore({
      businessType,
      hasInstagram,
      hasFacebook,
      hasWebsite,
      hasGoogleListing: hasGoogle,
      onlinePresenceTier,
      locationTier,
      activityLevel: "weekly", // Default starting activity tier
      productFit: "ethnic_primary", // Since they are registering on an ethnic wear platform
      expectedQtyRange,
      gstStatus,
      gstNumber: finalGstNum
    });

    // Retrieve IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";

    // 4. Create Buyer record
    const newBuyer = await db.buyer.create({
      data: {
        full_name: fullName,
        mobile: cleanMobile,
        email: email || null,
        password_hash: passwordHash,
        business_name: businessName,
        business_type: businessType,
        gst_number: finalGstNum,
        buyer_type: selectedBuyerType,
        pan_or_aadhaar: selectedBuyerType === "NON_GST" ? panOrAadhaar.trim().toUpperCase() : null,
        gst_legal_name: selectedBuyerType === "GST" ? gstLegalName || null : null,
        gst_address: selectedBuyerType === "GST" ? gstAddress || null : null,
        gst_filing_status: selectedBuyerType === "GST" ? gstFilingStatus || null : null,
        city,
        state,
        pincode,
        address: selectedBuyerType === "GST" && gstAddress ? gstAddress : (address || null),
        instagram_link: instagramLink || null,
        facebook_link: facebookLink || null,
        website_link: websiteLink || null,
        score: scorecard.score,
        lead_status: scorecard.leadStatus,
        account_status: "PENDING", // Manual approval needed
        credit_limit: 0,
        credit_days: 0,
        notes: `Registered expected purchases: ${expectedMonthlyPurchase || "Unspecified"}. Products: ${Array.isArray(productsInterested) ? productsInterested.join(", ") : "None"}. currently buying from: ${currentlyBuyingFrom || "None"}.`,
        consent_version: "v2026-06-01",
        consent_ip: ip,
        consent_timestamp: new Date(),
        whatsapp_consent: !!whatsappConsent,
        arbitration_consent: !!arbitrationConsent,
        is_export_buyer: !!isExportBuyer,
        export_iec_code: isExportBuyer ? exportIecCode : null,
        export_country: isExportBuyer ? exportCountry : null
      }
    });

    // 5. Simulate Outgoing WhatsApp alerts & notifications
    // Log registration message in WhatsApp logs (direction outgoing simulated from bot)
    await db.whatsAppLog.create({
      data: {
        contact_number: cleanMobile,
        direction: "outgoing",
        message_type: "text",
        message_content: `Namaste ${fullName}! 🙏 Prime Apparel Exports mein aapka swagat hai. Aapki shop '${businessName}' ka registration request mil gaya hai! Hamari team use review karke 24 hours mein WhatsApp pe credentials approve karegi. Tab tak aap direct humse query pooch sakte hain!`,
        handled_by: "ai",
        buyer_id: newBuyer.buyer_id
      }
    });

    // Notify staff on their WhatsApp / Dashboard
    await db.notification.create({
      data: {
        type: "new_lead",
        message: `🔥 New B2B registration! Shop: ${businessName}, City: ${city}, Score: ${scorecard.score}/100 [${scorecard.leadStatus}]`,
        linked_to_id: String(newBuyer.buyer_id),
        status: "unread",
        for_role: "SALES"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Registration completed. Verification pending.",
      score: scorecard.score,
      leadStatus: scorecard.leadStatus,
      buyerId: newBuyer.buyer_id
    });
  } catch (error) {
    console.error("Registration Error: ", error);
    return NextResponse.json(
      { error: "Registration process fails. Please verify input data." },
      { status: 500 }
    );
  }
}
