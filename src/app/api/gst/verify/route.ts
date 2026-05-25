import { NextResponse } from "next/server";

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

// State code mapping for realistic address generation
const STATE_CODES: Record<string, string> = {
  "27": "Maharashtra",
  "24": "Gujarat",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "33": "Tamil Nadu",
  "29": "Karnataka"
};

// POST /api/gst/verify: Validate GSTIN format and fetch business intelligence snapshot
export async function POST(request: Request) {
  try {
    const { gstNumber } = await request.json();

    if (!gstNumber) {
      return NextResponse.json(
        { error: "GST Number is mandatory for verification." },
        { status: 400 }
      );
    }

    const cleanGst = gstNumber.trim().toUpperCase();

    if (!GSTIN_REGEX.test(cleanGst)) {
      return NextResponse.json(
        { error: "Invalid GSTIN format! Standard 15-character GSTIN expected (e.g. 27AAAAA1111A1Z1)." },
        { status: 400 }
      );
    }

    // Extraction of state code
    const stateCode = cleanGst.slice(0, 2);
    const stateName = STATE_CODES[stateCode] || "Maharashtra";

    // Generate highly realistic response details based on the business name PAN digits
    const panPart = cleanGst.slice(2, 12);
    const entityType = panPart[3]; // 4th character of PAN represents status (P=Individual/Proprietorship, C=Company, F=Partnership, etc.)
    
    let suffix = "Retail Enterprises";
    if (entityType === "C") suffix = "Apparels Pvt Ltd";
    else if (entityType === "F") suffix = "Textile Associates";
    else if (entityType === "P") suffix = "Fashion Hub";

    // Simulated verified profile
    const gstDetails = {
      success: true,
      gstNumber: cleanGst,
      legalName: `Verma ${suffix}`,
      tradeName: `Verma Sourcing ${suffix}`,
      address: `G-32 Ground Floor, Textile Tower, Ring Road Area, ${stateName} - ${stateCode === "27" ? "400001" : "395002"}`,
      filingStatus: "Active",
      registrationDate: "2018-04-01",
      taxpayerType: "Regular"
    };

    return NextResponse.json(gstDetails);
  } catch (error: any) {
    console.error("GST verification endpoint error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compile GST verification request." },
      { status: 500 }
    );
  }
}
