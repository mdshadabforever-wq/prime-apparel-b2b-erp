"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  ShoppingBag,
  MapPin,
  Globe,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Lock,
  Sparkles
} from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  // Stateful Form Fields
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessType: "OFFLINE_RETAIL",
    gstNumber: "",
    yearsInBusiness: "1-3",
    city: "",
    state: "Maharashtra",
    pincode: "",
    address: "",
    instagramLink: "",
    facebookLink: "",
    websiteLink: "",
    justdialLink: "",
    productsInterested: [] as string[],
    expectedMonthlyPurchase: "50-100",
    currentlyBuyingFrom: "",
    referralSource: "Instagram"
  });

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (productType: string) => {
    setFormData((prev) => {
      const alreadyChecked = prev.productsInterested.includes(productType);
      const newSelections = alreadyChecked
        ? prev.productsInterested.filter((p) => p !== productType)
        : [...prev.productsInterested, productType];
      return { ...prev, productsInterested: newSelections };
    });
  };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!formData.fullName || !formData.mobile || !formData.password || !formData.confirmPassword) {
        setError("Sabhi details (Name, WhatsApp Mobile, Passwords) fill karna zaroori hai.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Password aur Confirm Password match nahi ho rahe hain.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password kam se kam 6 characters ka hona zaroori hai.");
        return;
      }
    }
    if (step === 2) {
      if (!formData.businessName || !formData.businessType) {
        setError("Shop Name aur Business Type zaroori hain.");
        return;
      }
    }
    if (step === 3) {
      if (!formData.city || !formData.state || !formData.pincode) {
        setError("City, State aur Pincode zaroori hain.");
        return;
      }
      if (formData.pincode.replace(/\D/g, "").length !== 6) {
        setError("Pincode strict 6-digits ka hona zaroori hai.");
        return;
      }
    }
    setStep((prev) => Math.min(5, prev + 1));
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Registration process fails. Please verify input data.");
      }

      setRegistrationResult(data);
      setStep(6); // Success Step Screen!
    } catch (e: any) {
      setError(e.message || "Registration failed. Internet connection check karein.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-950 font-sans text-slate-200 flex flex-col items-center justify-center min-h-screen px-4 py-12 w-full relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gold/5 blur-[100px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-[500px] flex flex-col gap-6 animate-scale-in">
        {/* Title */}
        <div className="text-center flex flex-col items-center gap-1.5">
          <Link href="/" className="inline-flex items-center gap-1.5 font-outfit font-black text-white text-lg tracking-tight hover:opacity-90 transition-opacity">
            <Sparkles className="w-5 h-5 text-gold animate-pulse-glow" />
            <span>PRIME ERP</span>
          </Link>
          <h2 className="font-outfit text-2xl font-extrabold text-white tracking-tight leading-none mt-2">Create B2B Account</h2>
          <p className="text-slate-500 text-xs mt-1 leading-normal">Register to unlock dynamic Surat wholesale catalog prices.</p>
        </div>

        {/* Progress Bar (Visible during form steps 1 to 5) */}
        {step <= 5 && (
          <div className="px-1 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Step {step} of 5</span>
              <span>{Math.round((step / 5) * 100)}% Completed</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-gold to-yellow-500 transition-all duration-500"
                style={{ width: `${(step / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl relative">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* STEP 1: PERSONAL DETAILS */}
            {step === 1 && (
              <div className="flex flex-col gap-5 text-left">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-900">
                  <User className="w-4 h-4 text-gold" />
                  <h3 className="font-outfit font-bold text-white text-sm uppercase tracking-wider">Personal Details</h3>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Ramesh Kumar"
                    className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">WhatsApp Mobile Number *</label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="9876543210 (without country code)"
                    className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-855 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                  />
                  <span className="text-[10px] text-slate-600 leading-normal font-medium">This mobile number is your login username.</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Email Address (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="ramesh@gmail.com"
                    className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Create Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••"
                      className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••"
                      className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: BUSINESS DETAILS */}
            {step === 2 && (
              <div className="flex flex-col gap-5 text-left">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-900">
                  <ShoppingBag className="w-4 h-4 text-gold" />
                  <h3 className="font-outfit font-bold text-white text-sm uppercase tracking-wider">Business & Shop Details</h3>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Shop / Business Name *</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Ramesh Garments"
                    className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Business Type *</label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-medium"
                    >
                      <option value="OFFLINE_RETAIL">Offline Retail Shop</option>
                      <option value="ONLINE_SELLER">Online Boutique (IG / Meesho)</option>
                      <option value="BOUTIQUE">Custom Boutique Store</option>
                      <option value="MINI_WHOLESALER">Mini Wholesaler</option>
                      <option value="OTHER">Other trade model</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Years in Business</label>
                    <select
                      name="yearsInBusiness"
                      value={formData.yearsInBusiness}
                      onChange={handleInputChange}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-medium"
                    >
                      <option value="Less than 1">Less than 1 year</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="5+">More than 5 years</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">GST Number (Optional)</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="27AAAAA1111A1Z1"
                    className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                  />
                  <span className="text-[10px] text-slate-600 leading-normal font-medium">💎 GST registered buyers qualify for instant credit verification logs.</span>
                </div>
              </div>
            )}

            {/* STEP 3: LOCATION DETAILS */}
            {step === 3 && (
              <div className="flex flex-col gap-5 text-left">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-900">
                  <MapPin className="w-4 h-4 text-gold" />
                  <h3 className="font-outfit font-bold text-white text-sm uppercase tracking-wider">Location Details</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">City Name *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Indore"
                      className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-855 focus:border-gold outline-none text-xs text-slate-300 font-medium"
                    >
                      {indianStates.map((s, idx) => (
                        <option key={idx} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="452001"
                    className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Full Shop Address (Optional)</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Shop number, market center..."
                    className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white resize-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: ONLINE PRESENCE */}
            {step === 4 && (
              <div className="flex flex-col gap-5 text-left">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-900">
                  <Globe className="w-4 h-4 text-gold" />
                  <h3 className="font-outfit font-bold text-white text-sm uppercase tracking-wider">Online Presence</h3>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Instagram Sourcing Page</label>
                  <input
                    type="text"
                    name="instagramLink"
                    value={formData.instagramLink}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/myboutique"
                    className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Facebook Shop Link</label>
                  <input
                    type="text"
                    name="facebookLink"
                    value={formData.facebookLink}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/myboutique"
                    className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Website Link</label>
                    <input
                      type="text"
                      name="websiteLink"
                      value={formData.websiteLink}
                      onChange={handleInputChange}
                      placeholder="https://myshop.com"
                      className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Justdial Listing Link</label>
                    <input
                      type="text"
                      name="justdialLink"
                      value={formData.justdialLink}
                      onChange={handleInputChange}
                      placeholder="Listing URL..."
                      className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-855 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: BUYING PREFERENCES */}
            {step === 5 && (
              <div className="flex flex-col gap-5 text-left">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-900">
                  <Star className="w-4 h-4 text-gold" />
                  <h3 className="font-outfit font-bold text-white text-sm uppercase tracking-wider">Buying Preferences</h3>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-medium">Products Interested In (Choose multiple)</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {["Cotton Kurtis", "Rayon Kurtis", "Suit Sets", "Festive Wear", "Daily Wear"].map((pt, idx) => (
                      <label key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-850 bg-slate-950 hover:bg-slate-900 cursor-pointer text-xs text-slate-400 font-medium">
                        <input
                          type="checkbox"
                          checked={formData.productsInterested.includes(pt)}
                          onChange={() => handleCheckboxChange(pt)}
                          className="rounded border-slate-850 text-gold focus:ring-gold accent-gold w-3.5 h-3.5"
                        />
                        <span>{pt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Expected Monthly Purchase Qty</label>
                    <select
                      name="expectedMonthlyPurchase"
                      value={formData.expectedMonthlyPurchase}
                      onChange={handleInputChange}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-medium"
                    >
                      <option value="qty_less_50">Less than 50 pieces</option>
                      <option value="50-100">50 - 100 pieces</option>
                      <option value="100-500">100 - 500 pieces</option>
                      <option value="500-1000">500 - 1000 pieces</option>
                      <option value="1000+">More than 1000 pieces</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Referral Source</label>
                    <select
                      name="referralSource"
                      value={formData.referralSource}
                      onChange={handleInputChange}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-medium"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Google">Google Search</option>
                      <option value="Reference">Reference from Retailer</option>
                      <option value="Other">Other medium</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Currently Sourcing From (Optional)</label>
                  <input
                    type="text"
                    name="currentlyBuyingFrom"
                    value={formData.currentlyBuyingFrom}
                    onChange={handleInputChange}
                    placeholder="Surat agents / local wholesale market..."
                    className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                  />
                </div>
              </div>
            )}

            {/* STEP 6: SUCCESS REPORT */}
            {step === 6 && registrationResult && (
              <div className="flex flex-col items-center text-center gap-6 py-4 animate-scale-in">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
                
                <div>
                  <h3 className="font-outfit font-extrabold text-2xl text-white tracking-tight">Registration Received</h3>
                  <p className="text-slate-400 text-xs mt-1.5">Our team will verify your shop status and WhatsApp you within 24 hours.</p>
                </div>

                <div className="w-full bg-slate-950 border border-white/5 rounded-2xl p-6 text-left flex flex-col gap-4 shadow-xl">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lead Scoring Report</span>
                    <span className={`py-1 px-2.5 rounded-lg text-[10px] font-bold uppercase border ${
                      registrationResult.leadStatus === "HOT"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : registrationResult.leadStatus === "WARM"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {registrationResult.leadStatus} LEAD
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400">Onboarding Sourcing Score:</span>
                    <span className="text-lg font-black text-gold tracking-tight">{registrationResult.score} / 100</span>
                  </div>

                  <div className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    📌 {registrationResult.leadStatus === "HOT" 
                      ? "HOT Lead matches! Instant digital sourcing catalogs and dedicated support coordinator will follow up on WhatsApp in 2 hours." 
                      : "Standard buyer verification logged. Team will review and call you on your WhatsApp number shortly!"}
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full mt-4 font-sans">
                  <a
                    href={`https://wa.me/919999999999?text=Namaste!%20Mera%20shop%20nam%20'${formData.businessName}'%20ka%20registration%20verify%20karo.%20Registered%20WhatsApp:%20${formData.mobile}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/10 text-xs"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    Verify on WhatsApp
                  </a>
                  <Link
                    href="/login"
                    className="py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-850 transition-all text-center"
                  >
                    Already Approved? Sign In Here
                  </Link>
                </div>
              </div>
            )}

            {/* Stepper Buttons */}
            {step <= 5 && (
              <div className="mt-8 pt-6 border-t border-slate-900 flex justify-between gap-4 font-sans">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                ) : (
                  <div></div>
                )}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="py-2 px-5 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition-all flex items-center gap-1.5 ml-auto shadow-lg shadow-white/5"
                  >
                    Next Step <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2 px-5 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 ml-auto disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Registration"} <CheckCircle className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
