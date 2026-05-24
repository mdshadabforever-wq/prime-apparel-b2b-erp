"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ShoppingCart,
  MessageCircle,
  Lock,
  X,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Sparkles,
  Info,
  Heart,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";

export interface SerializedProduct {
  sku_id: string;
  design_name: string;
  category: string;
  fabric: string;
  color_options: string[];
  size_set: string[];
  length_cm: number | null;
  purchase_cost: number;
  landed_cost: number;
  standard_price: number;
  scheme_price: number;
  repeat_price: number;
  qty_available: number;
  qty_reserved: number;
  grade: string;
  status: string;
  photo_urls: string[];
  video_url: string | null;
  notes: string;
}

interface CartItem {
  product: SerializedProduct;
  qty: number; // must be multiples of 12 MOQ
}

interface CatalogClientProps {
  initialProducts: SerializedProduct[];
  loggedInUser: { name: string; role: string; isStaff: boolean } | null;
}

export default function CatalogClient({ initialProducts, loggedInUser }: CatalogClientProps) {
  const [products] = useState<SerializedProduct[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFabric, setSelectedFabric] = useState("all");
  const [selectedPriceBand, setSelectedPriceBand] = useState("all");
  const [selectedStock, setSelectedStock] = useState("all");

  // Favorites
  const [favorites, setFavorites] = useState<string[]>([]);

  // Cart & Modal state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<SerializedProduct | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const isLoggedIn = !!loggedInUser;

  // Toggle Favorite
  const toggleFavorite = (skuId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(skuId) ? prev.filter(id => id !== skuId) : [...prev, skuId]
    );
  };

  // Filter products dynamically
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.sku_id.toLowerCase().includes(search.toLowerCase()) ||
        p.design_name.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchesFabric = selectedFabric === "all" || p.fabric === selectedFabric;

      let matchesPrice = true;
      if (selectedPriceBand === "budget") matchesPrice = p.standard_price < 300;
      else if (selectedPriceBand === "mid") matchesPrice = p.standard_price >= 300 && p.standard_price <= 500;
      else if (selectedPriceBand === "premium") matchesPrice = p.standard_price > 500;

      let matchesStock = true;
      if (selectedStock === "in_stock") matchesStock = p.qty_available > 10;
      else if (selectedStock === "low_stock") matchesStock = p.qty_available > 0 && p.qty_available <= 10;

      return matchesSearch && matchesCategory && matchesFabric && matchesPrice && matchesStock;
    });
  }, [products, search, selectedCategory, selectedFabric, selectedPriceBand, selectedStock]);

  // Add to Enquiry Cart helper
  const addToCart = (product: SerializedProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.sku_id === product.sku_id);
      if (existing) {
        return prev.map((item) =>
          item.product.sku_id === product.sku_id ? { ...item, qty: item.qty + 12 } : item
        );
      }
      return [...prev, { product, qty: 12 }]; // Default MOQ 12 pcs pack
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (skuId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.sku_id === skuId) {
            const newQty = Math.max(12, item.qty + delta * 12);
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (skuId: string) => {
    setCart((prev) => prev.filter((item) => item.product.sku_id !== skuId));
  };

  // Compile pre-filled WhatsApp enquiry message
  const compileWhatsAppEnquiry = () => {
    let msg = `Namaste! 🙏 Prime Apparel Exports,\nMera B2B enquiry order list:\n\n`;
    let subtotal = 0;

    cart.forEach((item, idx) => {
      let currentPrice = item.product.standard_price;
      if (item.qty >= 50) currentPrice = item.product.repeat_price;
      else if (item.qty >= 25) currentPrice = item.product.scheme_price;

      const lineTotal = currentPrice * item.qty;
      subtotal += lineTotal;

      msg += `${idx + 1}. *SKU: ${item.product.sku_id}* (${item.product.design_name})\n`;
      msg += `   Fabric: ${item.product.fabric.toUpperCase()} | Qty: ${item.qty} pcs\n`;
      msg += `   Rate: ₹${currentPrice}/pc | Subtotal: ₹${lineTotal}\n\n`;
    });

    const discPercent = cart.reduce((sum, item) => sum + item.qty, 0) >= 50 ? 5 : cart.reduce((sum, item) => sum + item.qty, 0) >= 25 ? 3 : 0;
    const discount = Math.round((subtotal * discPercent) / 100);
    const finalVal = subtotal - discount;
    const gst = Math.round(finalVal * 0.05);
    const totalWithTax = finalVal + gst;

    msg += `-------------------------\n`;
    msg += `📦 Est Total Pieces: ${cart.reduce((sum, item) => sum + item.qty, 0)} pcs\n`;
    msg += `💰 Est Invoice Amount: *₹${totalWithTax}* (GST Included)\n`;
    msg += `🏦 Payment preference: First order advance.\n\n`;
    msg += `Please stock and standard logistics charges confirm karein!`;

    return `https://wa.me/919999999999?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 w-full font-sans text-left relative min-h-screen animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/5 pb-8">
        <div>
          <span className="badge">✦ Digital Catalog</span>
          <h2 className="font-outfit text-3xl md:text-4xl font-extrabold text-white mt-2 tracking-tight">Wholesale Lookbook</h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">
            {isLoggedIn 
              ? `Welcome back, ${loggedInUser.name}! Real-time pricing & inventory counts are fully unlocked.` 
              : "Registered buyers get full pricing and ordering features. Visitor pricing is restricted."}
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold hover:border-gold/20 hover:text-white text-xs transition-all w-full md:w-auto"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Filter Specs</span>
          </button>
          
          {isLoggedIn && cart.length > 0 && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-5 bg-gold hover:bg-gold-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-gold/10 transition-all transform hover:scale-105 active:scale-95 text-xs w-full md:w-auto shrink-0"
            >
              <ShoppingCart className="w-4 h-4 fill-current" />
              <span>Enquiry Cart ({cart.reduce((s, i) => s + i.qty, 0)} pcs)</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER DRAWER / PANEL */}
      {isFiltersOpen && (
        <div className="glass-panel rounded-2xl p-6 mb-8 border border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 items-center animate-scale-in">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SKU (PA-25) or name..."
              className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1 px-1">Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-medium"
            >
              <option value="all">Category: All</option>
              <option value="kurti">Kurtis Only</option>
              <option value="suit">Suit Sets Only</option>
              <option value="festive">Festive Wear</option>
              <option value="daily">Daily Wear</option>
            </select>
          </div>

          {/* Fabric */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1 px-1">Fabric Sourcing</span>
            <select
              value={selectedFabric}
              onChange={(e) => setSelectedFabric(e.target.value)}
              className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-medium"
            >
              <option value="all">Fabric: All</option>
              <option value="cotton">Cambric Cotton</option>
              <option value="rayon">Heavy Rayon</option>
              <option value="georgette">Georgette Silk</option>
              <option value="crepe">Crepe Prints</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1 px-1">Price Bracket</span>
            <select
              value={selectedPriceBand}
              onChange={(e) => setSelectedPriceBand(e.target.value)}
              className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-medium"
            >
              <option value="all">Price: All</option>
              <option value="budget">Budget (&lt; ₹300)</option>
              <option value="mid">Mid (₹300 - ₹500)</option>
              <option value="premium">Premium (&gt; ₹500)</option>
            </select>
          </div>
        </div>
      )}

      {/* LUXURY PRODUCT GRID (Pinterest masonry style lookbook) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filteredProducts.map((p) => {
          const isFav = favorites.includes(p.sku_id);
          return (
            <div key={p.sku_id} className="glass-panel rounded-2xl overflow-hidden glass-card-hover flex flex-col group relative border border-white/5">
              
              {/* Product image container */}
              <div
                className="relative h-[320px] bg-slate-900 cursor-pointer overflow-hidden"
                onClick={() => setSelectedProductDetail(p)}
              >
                <img
                  src={p.photo_urls[0] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80"}
                  alt={p.design_name}
                  className="w-full h-full object-cover object-top group-hover:scale-103 transition-transform duration-500"
                />

                {/* SKU Badge */}
                <span className="absolute bottom-3.5 left-3.5 py-0.5 px-2 bg-slate-950/80 backdrop-blur-md rounded text-[9px] text-gold font-bold uppercase tracking-widest border border-gold/15">
                  {p.sku_id}
                </span>

                {/* Stock Tag */}
                <span className={`absolute top-3.5 right-3.5 py-0.5 px-2 rounded text-[9px] font-bold uppercase tracking-wider ${
                  p.qty_available > 10
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : p.qty_available > 0
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {p.qty_available > 10 ? "Available" : p.qty_available > 0 ? "Low Stock" : "Out of Stock"}
                </span>

                {/* Favorite Heart trigger */}
                <button
                  onClick={(e) => toggleFavorite(p.sku_id, e)}
                  className="absolute top-3.5 left-3.5 w-7 h-7 rounded-full bg-slate-950/80 border border-white/5 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                </button>
              </div>

              {/* Specifications & Actions block */}
              <div className="p-6 flex flex-col gap-4 flex-grow justify-between text-left">
                <div>
                  <h3
                    onClick={() => setSelectedProductDetail(p)}
                    className="font-outfit font-bold text-base text-white hover:text-gold transition-colors cursor-pointer line-clamp-1"
                  >
                    {p.design_name}
                  </h3>
                  <div className="mt-2 text-xs flex flex-col gap-1.5 text-slate-400">
                    <p>Fabric: <span className="text-slate-300 font-semibold uppercase">{p.fabric}</span></p>
                    <p>Sizes: <span className="text-slate-300 font-semibold">{p.size_set.join(", ")}</span></p>
                    <p>MOQ: <span className="text-slate-300 font-semibold">12 pcs pack</span></p>
                  </div>
                </div>

                {/* Pricing Locks & enquiry conversion CTA */}
                <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                  {!isLoggedIn ? (
                    <div className="w-full flex flex-col gap-3">
                      <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-gold" /> Pricing Locked</span>
                        <span className="blur-[4.5px] font-bold text-slate-400">₹320 / pc</span>
                      </div>
                      <Link
                        href="/register"
                        className="w-full py-2.5 rounded-xl bg-slate-900 border border-gold/15 hover:border-gold hover:bg-gold/5 text-gold font-bold text-center text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        Register to View Prices <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col gap-3.5">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Wholesale Price</span>
                          <span className="text-base font-extrabold text-gold tracking-tight">₹{p.standard_price} <span className="text-[10px] text-slate-500 font-normal">/ pc</span></span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Schemes Unlocked</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => addToCart(p)}
                          className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" /> Enquiry
                        </button>
                        <a
                          href={`https://wa.me/919999999999?text=Namaste!%20I%20want%20to%20order%20SKU%20${p.sku_id}%20(${p.design_name}).%20Please%20confirm%20wholesale%20rates.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/20 text-emerald-400 font-bold text-xs transition-all flex items-center justify-center gap-1 text-center"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" /> WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20 text-slate-500 text-sm">
          Aapke filter criteria se matching koi design SKU catalog mein nahi mila. Search text check karein.
        </div>
      )}

      {/* LUXURY PRODUCT DETAIL SLIDE MODAL */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-gold/15 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-scale-in">
            {/* Close */}
            <button
              onClick={() => setSelectedProductDetail(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Visual */}
                <div className="w-full md:w-1/2 h-72 rounded-xl bg-slate-950 overflow-hidden relative">
                  <img
                    src={selectedProductDetail.photo_urls[0] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80"}
                    alt={selectedProductDetail.design_name}
                    className="w-full h-full object-cover object-top"
                  />
                  <span className="absolute bottom-3 left-3 py-0.5 px-2 bg-slate-950/80 rounded text-[9px] text-gold font-bold border border-gold/15 uppercase">
                    {selectedProductDetail.sku_id}
                  </span>
                </div>

                {/* Specs */}
                <div className="w-full md:w-1/2 flex flex-col gap-4 text-left font-sans">
                  <div>
                    <span className="text-[9px] font-bold text-gold bg-gold/10 py-0.5 px-2 border border-gold/20 rounded uppercase tracking-wider inline-block">
                      {selectedProductDetail.category}
                    </span>
                    <h3 className="font-outfit font-extrabold text-xl text-white mt-2 leading-tight">
                      {selectedProductDetail.design_name}
                    </h3>
                  </div>

                  <div className="text-xs flex flex-col gap-2 text-slate-400">
                    <p>Fabric: <span className="text-slate-300 font-semibold uppercase">{selectedProductDetail.fabric}</span></p>
                    <p>Color Options: <span className="text-slate-300 font-semibold">{selectedProductDetail.color_options.join(", ")}</span></p>
                    <p>Size Set Packs: <span className="text-slate-300 font-semibold">{selectedProductDetail.size_set.join(", ")}</span></p>
                    <p>Est. Retail MRP: <span className="text-emerald-400 font-semibold">₹{Math.round(selectedProductDetail.standard_price * 1.6)} - ₹{Math.round(selectedProductDetail.standard_price * 1.8)}</span></p>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    {isLoggedIn ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Standard Wholesale Rate</span>
                        <span className="text-2xl font-black text-gold tracking-tight">₹{selectedProductDetail.standard_price} <span className="text-xs text-slate-500 font-normal">/ piece</span></span>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-center flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4 text-gold shrink-0" />
                        <span className="text-xs text-slate-400 font-medium">Rates locked. <Link href="/register" className="text-gold underline font-bold">Register B2B Account</Link></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bulk schemes pricing breakdown */}
              <div className="text-left font-sans border-t border-slate-800 pt-4">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-2.5">Wholesale Bulk Scheme Rates:</h4>
                <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col gap-0.5">
                    <span className="text-slate-500 text-[10px]">12 - 24 pcs</span>
                    <span className="font-bold text-slate-300 mt-1">₹{selectedProductDetail.standard_price}</span>
                    <span className="text-[9px] text-slate-600 font-normal">Standard Rate</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-855 flex flex-col gap-0.5 border-l-2 border-l-gold">
                    <span className="text-slate-500 text-[10px]">25 - 49 pcs</span>
                    <span className="font-bold text-gold mt-1">₹{selectedProductDetail.scheme_price}</span>
                    <span className="text-[9px] text-gold/80 font-bold">3% Scheme Disc</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-855 flex flex-col gap-0.5 border-l-2 border-l-emerald-500">
                    <span className="text-slate-500 text-[10px]">50+ pcs</span>
                    <span className="font-bold text-emerald-400 mt-1">₹{selectedProductDetail.repeat_price}</span>
                    <span className="text-[9px] text-emerald-400 font-bold">5% Best Rate</span>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 font-sans">
                <button
                  onClick={() => setSelectedProductDetail(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-white transition-all text-xs"
                >
                  Cancel
                </button>
                {isLoggedIn && (
                  <button
                    onClick={() => {
                      addToCart(selectedProductDetail);
                      setSelectedProductDetail(null);
                    }}
                    className="py-2.5 px-5 rounded-xl bg-white text-slate-950 font-bold transition-all text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" /> Add to Enquiry Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE THUMB-FRIENDLY SLIDING CART DRAWER */}
      {isCartOpen && isLoggedIn && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-white/5 h-full flex flex-col justify-between shadow-2xl relative animate-scale-in font-sans">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-gold" />
                <h3 className="font-outfit font-extrabold text-white text-lg tracking-tight">Enquiry Cart</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto p-5 flex flex-col gap-4 text-left">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-500 text-center">
                  <ShoppingCart className="w-12 h-12 text-slate-800" />
                  <p className="text-xs">Aapka Enquiry Cart khali hai.</p>
                </div>
              ) : (
                cart.map((item) => {
                  let activePrice = item.product.standard_price;
                  if (item.qty >= 50) activePrice = item.product.repeat_price;
                  else if (item.qty >= 25) activePrice = item.product.scheme_price;

                  return (
                    <div key={item.product.sku_id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex gap-3 relative overflow-hidden group">
                      <button
                        onClick={() => removeFromCart(item.product.sku_id)}
                        className="absolute right-2 top-2 text-slate-500 hover:text-red-400 transition-colors"
                        aria-label="Remove item"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Mini Thumbnail */}
                      <div className="w-16 h-20 rounded bg-slate-900 overflow-hidden shrink-0">
                        <img
                          src={item.product.photo_urls[0]}
                          alt={item.product.design_name}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex flex-col justify-between flex-grow">
                        <div>
                          <h4 className="font-bold text-xs text-white max-w-[85%] truncate">{item.product.design_name}</h4>
                          <span className="text-[9px] text-gold font-bold uppercase">{item.product.sku_id}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1 bg-slate-900 border border-slate-850 rounded-lg p-0.5">
                            <button
                              onClick={() => updateCartQty(item.product.sku_id, -1)}
                              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                              disabled={item.qty <= 12}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-white">{item.qty} pcs</span>
                            <button
                              onClick={() => updateCartQty(item.product.sku_id, 1)}
                              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] font-bold text-gold">₹{activePrice}/pc</span>
                            <span className="text-[9px] text-slate-500">Total: ₹{(activePrice * item.qty).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* MOQ Information Note */}
              <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-start gap-2 text-slate-500 text-[10px] leading-relaxed font-medium">
                <Info className="w-4 h-4 text-gold shrink-0 mt-0.5 animate-pulse-glow" />
                <span>🔔 B2B Wholesale MOQ rule: Minimum 12 pieces pack per design. Quantity adjustments strictly follow packs of 12 (sizes S-XXL assorted).</span>
              </div>
            </div>

            {/* Calculations and Send WhatsApp button */}
            <div className="p-5 border-t border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-xs text-slate-400 font-sans">
                <div className="flex justify-between">
                  <span>Total quantity pieces:</span>
                  <span className="font-semibold text-white">{cart.reduce((s, i) => s + i.qty, 0)} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST (5%):</span>
                  <span className="text-white">Included in invoice</span>
                </div>

                <div className="flex justify-between items-end border-t border-slate-800 pt-3 mt-1.5">
                  <span className="text-xs font-semibold text-slate-300">Est Invoice Value:</span>
                  <span className="text-lg font-black text-gold tracking-tight">
                    ₹{cart.reduce((total, item) => {
                      let activePrice = item.product.standard_price;
                      if (item.qty >= 50) activePrice = item.product.repeat_price;
                      else if (item.qty >= 25) activePrice = item.product.scheme_price;
                      return total + activePrice * item.qty;
                    }, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {cart.length > 0 ? (
                <a
                  href={compileWhatsAppEnquiry()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-center flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/10 text-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  Send B2B Enquiry to WhatsApp
                </a>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 text-slate-500 font-bold text-center flex items-center justify-center gap-2 cursor-not-allowed text-xs"
                >
                  Cart Empty
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
