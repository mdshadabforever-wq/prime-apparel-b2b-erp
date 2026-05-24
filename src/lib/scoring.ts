export interface ScoringInput {
  businessType: string; // OFFLINE_RETAIL, ONLINE_SELLER, BOUTIQUE, MINI_WHOLESALER, OTHER
  hasInstagram?: boolean;
  hasFacebook?: boolean;
  hasWebsite?: boolean;
  hasGoogleListing?: boolean;
  onlinePresenceTier?: string; // active_ig_google, single_active, weak, none, not_provided
  locationTier?: string; // tier12_market, tier3_stable, village, metro_residential, unclear
  activityLevel?: string; // daily, weekly, monthly, dormant
  productFit?: string; // ethnic_primary, ethnic_western_mix, mostly_western, no_category, different_category
  expectedQtyRange?: string; // qty_500, qty_200_499, qty_100_199, qty_50_99, qty_less_50
  gstStatus?: string; // gst_shared, gst_not_shared, no_gst_established, new_no_docs, evasive
  gstNumber?: string;
}

export interface Scorecard {
  score: number;
  leadStatus: "HOT" | "WARM" | "COLD";
  breakdown: {
    businessTypePoints: number;
    onlinePresencePoints: number;
    locationPoints: number;
    activityPoints: number;
    productFitPoints: number;
    purchasePotentialPoints: number;
    trustSignalsPoints: number;
  };
}

export function calculateLeadScore(input: ScoringInput): Scorecard {
  let businessTypePoints = 5; // Default/Unknown
  let onlinePresencePoints = 5;
  let locationPoints = 6; // Metro residential default
  let activityPoints = 10; // Weekly default
  let productFitPoints = 10; // No category default
  let purchasePotentialPoints = 5; // 50-99 default
  let trustSignalsPoints = 4; // New no docs default

  // 1. Business Type (Max 15)
  switch (input.businessType) {
    case "OFFLINE_RETAIL":
      businessTypePoints = 15;
      break;
    case "BOUTIQUE":
      businessTypePoints = 12;
      break;
    case "ONLINE_SELLER":
      businessTypePoints = 10;
      break;
    case "MINI_WHOLESALER":
      businessTypePoints = 15; // Standard wholesale is highly rated
      break;
    case "OTHER":
      businessTypePoints = 5;
      break;
    default:
      businessTypePoints = 5;
  }

  // 2. Online Presence (Max 15)
  if (input.onlinePresenceTier) {
    switch (input.onlinePresenceTier) {
      case "active_ig_google":
        onlinePresencePoints = 15;
        break;
      case "single_active":
        onlinePresencePoints = 10;
        break;
      case "weak":
        onlinePresencePoints = 6;
        break;
      case "none":
        onlinePresencePoints = 3;
        break;
      case "not_provided":
        onlinePresencePoints = 5;
        break;
    }
  } else {
    // Infer from links if not explicitly specified
    const hasIG = !!input.hasInstagram;
    const hasFB = !!input.hasFacebook;
    const hasWeb = !!input.hasWebsite;
    const hasGoogle = !!input.hasGoogleListing;

    if (hasGoogle && hasIG) onlinePresencePoints = 15;
    else if (hasGoogle || hasIG || hasFB || hasWeb) onlinePresencePoints = 10;
    else onlinePresencePoints = 5; // did not share
  }

  // 3. Location Stability (Max 10)
  if (input.locationTier) {
    switch (input.locationTier) {
      case "tier12_market":
        locationPoints = 10;
        break;
      case "tier3_stable":
        locationPoints = 7;
        break;
      case "village":
        locationPoints = 4;
        break;
      case "metro_residential":
        locationPoints = 6;
        break;
      case "unclear":
        locationPoints = 2;
        break;
    }
  }

  // 4. Activity Level (Max 15)
  if (input.activityLevel) {
    switch (input.activityLevel) {
      case "daily":
        activityPoints = 15;
        break;
      case "weekly":
        activityPoints = 10;
        break;
      case "monthly":
        activityPoints = 5;
        break;
      case "dormant":
        activityPoints = 2;
        break;
    }
  }

  // 5. Product Fit (Max 20)
  if (input.productFit) {
    switch (input.productFit) {
      case "ethnic_primary":
        productFitPoints = 20;
        break;
      case "ethnic_western_mix":
        productFitPoints = 14;
        break;
      case "mostly_western":
        productFitPoints = 8;
        break;
      case "no_category":
        productFitPoints = 10;
        break;
      case "different_category":
        productFitPoints = 2;
        break;
    }
  }

  // 6. Purchase Potential (Max 15)
  if (input.expectedQtyRange) {
    switch (input.expectedQtyRange) {
      case "qty_500":
        purchasePotentialPoints = 15;
        break;
      case "qty_200_499":
        purchasePotentialPoints = 12;
        break;
      case "qty_100_199":
        purchasePotentialPoints = 8;
        break;
      case "qty_50_99":
        purchasePotentialPoints = 5;
        break;
      case "qty_less_50":
        purchasePotentialPoints = 2;
        break;
    }
  }

  // 7. Trust Signals (Max 10)
  if (input.gstNumber && input.gstNumber.trim().length > 0) {
    trustSignalsPoints = 10; // Shared GST number
  } else if (input.gstStatus) {
    switch (input.gstStatus) {
      case "gst_shared":
        trustSignalsPoints = 10;
        break;
      case "gst_not_shared":
        trustSignalsPoints = 7;
        break;
      case "no_gst_established":
        trustSignalsPoints = 5;
        break;
      case "new_no_docs":
        trustSignalsPoints = 4;
        break;
      case "evasive":
        trustSignalsPoints = 1;
        break;
    }
  }

  const score =
    businessTypePoints +
    onlinePresencePoints +
    locationPoints +
    activityPoints +
    productFitPoints +
    purchasePotentialPoints +
    trustSignalsPoints;

  let leadStatus: "HOT" | "WARM" | "COLD" = "COLD";
  if (score >= 75) leadStatus = "HOT";
  else if (score >= 50) leadStatus = "WARM";

  return {
    score,
    leadStatus,
    breakdown: {
      businessTypePoints,
      onlinePresencePoints,
      locationPoints,
      activityPoints,
      productFitPoints,
      purchasePotentialPoints,
      trustSignalsPoints,
    },
  };
}
