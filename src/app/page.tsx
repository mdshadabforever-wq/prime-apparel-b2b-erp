import Link from "next/link";
import {
  MessageCircle,
  ShieldCheck,
  Truck,
  FileText,
  UserCheck,
  MapPin,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Activity,
  Layers,
  Heart
} from "lucide-react";

export default function HomePage() {
  const trustBadges = [
    { icon: <UserCheck className="w-4 h-4 text-amber-400" />, text: "500+ Verified Buyers" },
    { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, text: "Double QC Checked" },
    { icon: <FileText className="w-4 h-4 text-blue-400" />, text: "GST ITC Compliant" },
    { icon: <Truck className="w-4 h-4 text-pink-400" />, text: "Express Dispatch" },
    { icon: <MapPin className="w-4 h-4 text-purple-400" />, text: "Pan-India Sourcing" }
  ];

  const whoWeServe = [
    {
      title: "Boutique Creators",
      icon: <Sparkles className="w-5 h-5 text-gold" />,
      desc: "Source handpicked pure cambric cottons and silk georgette catalog sets. Perfect margins for high-end boutique stores without high travel costs."
    },
    {
      title: "Online Resellers",
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      desc: "Ideal for Instagram boutiques and premium WhatsApp resellers. Get HD photos, high-resolution videos, and live digital inventory catalogs ready to download."
    },
    {
      title: "Local Retailers",
      icon: <ShoppingBag className="w-5 h-5 text-blue-400" />,
      desc: "Fast weekly collections directly from Surat sourcing mills. Strict quality standards double-checked at our Mumbai operational dispatch hub."
    }
  ];

  const steps = [
    { step: "01", title: "Verify Account", desc: "Fill the rapid B2B registration form with your shop card or GST details." },
    { step: "02", title: "Unlock Wholesale", desc: "Unlock catalog prices with bulk schemes and real-time inventory counts." },
    { step: "03", title: "Build Enquiry", desc: "Select sizes, build your wholesale pack and finalize in a single click." },
    { step: "04", title: "Same-Day Cargo", desc: "Dispatch from Mumbai cargo hub with real-time Lorry Receipt (LR) tracking." }
  ];

  const mockFeaturedProducts = [
    {
      sku: "PA-25-KR-001",
      name: "Meera Jaipuri Cotton A-Line",
      fabric: "Pure Cambric Cotton (60-60)",
      price: "₹280 - ₹350",
      moq: "12 pcs per design",
      img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80"
    },
    {
      sku: "PA-25-KR-002",
      name: "Sunehri Rayon Festive Suit Set",
      fabric: "Premium Rayon (14kg standard)",
      price: "₹340 - ₹420",
      moq: "12 sets per design",
      img: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80"
    },
    {
      sku: "PA-25-SS-001",
      name: "Maharani Georgette Anarkali Set",
      fabric: "Luxury Silk Georgette",
      price: "₹450 - ₹550",
      moq: "12 sets per design",
      img: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=400&q=80"
    }
  ];

  const usps = [
    { title: "Surat Sourcing Sourcing Advantage", desc: "Get raw mill prices directly. We exclude middleman agents completely." },
    { title: "Mumbai Quality Check Discipline", desc: "Double master-QC filter check ensures 100% defect-free dispatches." },
    { title: "Automated Lorry Tracking", desc: "Instant LR receipt details automatically shared directly to your WhatsApp." }
  ];

  return (
    <div className="bg-slate-950 font-sans text-slate-200 flex flex-col w-full min-h-screen relative overflow-hidden">
      {/* Background radial glowing grid */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-blue-900/10 via-transparent to-transparent -z-10 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px] -z-10 pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative px-6 md:px-12 pt-24 pb-20 md:pt-36 md:pb-32 flex flex-col items-center text-center max-w-5xl mx-auto w-full animate-fade-in">
        
        {/* Release tag */}
        <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-6 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse-glow" /> B2B Wholesalers Only
        </div>

        {/* Master Heading */}
        <h1 className="font-outfit text-4xl md:text-7xl font-black tracking-tight text-white leading-[1.08] max-w-4xl">
          India&apos;s Smartest Sourcing Hub <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-amber-500 font-extrabold">
            For Kurtis & Suit Sets
          </span>
        </h1>

        {/* Subheading */}
        <p className="mt-6 text-slate-400 text-sm md:text-lg max-w-2xl leading-relaxed">
          Surat&apos;s direct mill prices merged with Mumbai&apos;s strict quality control discipline. Unlocking seamless WhatsApp order finalization and digital tracking audits.
        </p>

        {/* CTA Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link
            href="/register"
            className="py-3 px-6 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold transition-all shadow-lg hover:shadow-white/5 text-center flex items-center justify-center gap-1.5 text-sm"
          >
            Register B2B Account <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://wa.me/919999999999?text=Namaste!%20Prime%20Apparel%20Exports%20se%20wholesale%20catalog%20aur%20rates%20ki%20details%20bhejiye."
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-gold/30 hover:bg-slate-900/80 text-white font-semibold text-center flex items-center justify-center gap-1.5 transition-all text-sm"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400 fill-current" />
            Enquiry via WhatsApp
          </a>
        </div>
      </section>

      {/* 2. TRUST BADGES BAR */}
      <section className="border-y border-white/5 bg-slate-900/20 backdrop-blur-md py-5 overflow-x-auto whitespace-nowrap scrollbar-none w-full">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center gap-8 min-w-[700px]">
          {trustBadges.map((badge, idx) => (
            <div key={idx} className="flex items-center gap-2 text-slate-400 font-medium text-xs md:text-sm">
              {badge.icon}
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. WHO WE SERVE */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto w-full text-center">
        <div className="mb-16">
          <span className="text-[10px] font-bold text-gold uppercase tracking-widest bg-gold/10 px-2 py-0.5 border border-gold/15 rounded">B2B Core Segments</span>
          <h2 className="font-outfit text-3xl md:text-4xl font-extrabold text-white mt-3">Tailored Commerce Solutions</h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto mt-2">Empowering active buyers across the sub-continent.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {whoWeServe.map((card, idx) => (
            <div
              key={idx}
              className="glass-panel p-8 rounded-2xl glass-card-hover flex flex-col gap-5 text-left relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gold/10 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                {card.icon}
              </div>
              <div>
                <h3 className="font-outfit font-bold text-lg text-white group-hover:text-gold transition-colors">{card.title}</h3>
                <p className="text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-24 px-6 md:px-12 border-t border-white/5 bg-slate-900/10 w-full relative">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-20">
            <span className="text-[10px] font-bold text-gold uppercase tracking-widest bg-gold/10 px-2 py-0.5 border border-gold/15 rounded">Sourcing Journey</span>
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold text-white mt-3">Simple Operational Pipeline</h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto mt-2">Rapid checkout built for premium mobile workflows.</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            {steps.map((st, idx) => (
              <div key={idx} className="flex flex-col gap-4 text-left p-2 relative group">
                <span className="font-outfit font-black text-4xl text-slate-800 group-hover:text-gold/20 transition-colors leading-none">{st.step}</span>
                <div>
                  <h3 className="font-bold text-md text-white">{st.title}</h3>
                  <p className="text-slate-400 text-xs md:text-sm mt-1.5 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED PRODUCTS */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold text-gold uppercase tracking-widest bg-gold/10 px-2 py-0.5 border border-gold/15 rounded">Live SKU Master</span>
          <h2 className="font-outfit text-3xl md:text-4xl font-extrabold text-white mt-3">Signature Designs</h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto mt-2">Premium cambric cottons and luxury georgette print sets.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {mockFeaturedProducts.map((p, idx) => (
            <div key={idx} className="glass-panel rounded-2xl overflow-hidden glass-card-hover flex flex-col group text-left">
              <div className="relative h-72 overflow-hidden bg-slate-900">
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-full h-full object-cover object-top group-hover:scale-103 transition-transform duration-500"
                />
                <span className="absolute bottom-3 left-3 py-0.5 px-2 bg-slate-950/80 backdrop-blur-md rounded text-[9px] text-gold font-bold uppercase border border-gold/15">
                  {p.sku}
                </span>
              </div>
              <div className="p-6 flex flex-col gap-4 justify-between flex-grow">
                <div>
                  <h3 className="font-outfit font-bold text-md text-white group-hover:text-gold transition-colors truncate">{p.name}</h3>
                  <div className="mt-2 text-xs flex flex-col gap-1 text-slate-400">
                    <p>Fabric: <span className="text-slate-300 font-semibold">{p.fabric}</span></p>
                    <p>MOQ: <span className="text-slate-300 font-semibold">{p.moq}</span></p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Wholesale Price</span>
                    <span className="text-sm font-extrabold text-gold tracking-tight">{p.price}</span>
                  </div>
                  <Link
                    href="/register"
                    className="py-1.5 px-3 rounded-lg bg-gold hover:bg-gold-600 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    View Prices
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. ADVANTAGES */}
      <section className="py-24 px-6 md:px-12 border-t border-white/5 bg-slate-900/10 w-full">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold text-gold uppercase tracking-widest bg-gold/10 px-2 py-0.5 border border-gold/15 rounded">Core Systems</span>
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold text-white mt-3">Why B2B Buyers Trust Us</h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto mt-2">Engineered for retail scale and billing compliance.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {usps.map((u, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl flex gap-4 text-left border border-white/5 hover:border-gold/15 transition-all">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center font-bold text-gold text-xs">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{u.title}</h3>
                  <p className="text-slate-400 text-xs md:text-sm mt-1.5 leading-relaxed">{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA BANNER */}
      <section className="px-6 py-20 text-center bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950 border-t border-white/5 w-full">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <h2 className="font-outfit text-3xl font-extrabold text-white">Optimize Your Retail Margins</h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
            Register as a verified buyer in 2 minutes to unlock direct manufacturing catalog prices, invoice payment schemes, and express Mumbai dispatches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-sm">
            <Link
              href="/register"
              className="py-3 px-6 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-bold transition-all text-center text-sm shadow-lg shadow-gold/10"
            >
              Verify & Register Now
            </Link>
            <a
              href="https://wa.me/919999999999?text=Namaste!%20Interested%20in%20Kurtis%20and%20Suits%20wholesale.%20Please%20guide."
              className="py-3 px-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-gold/30 font-semibold transition-all text-center flex items-center justify-center gap-2 text-sm text-white"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 fill-current" /> Chat with Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/5 py-12 px-6 md:px-12 w-full text-xs text-slate-500">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-left">
          <div className="flex flex-col gap-3">
            <h4 className="font-outfit font-bold text-white text-md tracking-wider">PRIME APPAREL EXPORTS</h4>
            <p className="leading-relaxed text-slate-400">India&apos;s leading B2B ladies ethnic apparel distribution hub. Surat sourcing mill prices, Mumbai Quality Control discipline.</p>
            <p className="text-[10px] text-slate-500">GST Compliant Billing guaranteed.</p>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-white">Operational Cargo Hubs</h4>
            <p>📍 <span className="text-slate-300">QC & Operations Hub:</span> Bandra Link Road, Mumbai, MH - 400050</p>
            <p>📍 <span className="text-slate-300">Sourcing office:</span> Ring Road Textiles Market, Surat, GJ</p>
            <p className="mt-1">📞 Sales direct: +91 99999 99999</p>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-white">Quick References</h4>
            <Link href="/catalog" className="hover:text-gold transition-colors text-slate-400">Digital Sourcing Catalog</Link>
            <Link href="/register" className="hover:text-gold transition-colors text-slate-400">B2B Buyer Verification</Link>
            <Link href="/login" className="hover:text-gold transition-colors text-slate-400">Staff Secure Portal</Link>
            <p className="mt-4 text-[10px] text-slate-600">© 2026 Prime Apparel Exports Ltd. All trade rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
