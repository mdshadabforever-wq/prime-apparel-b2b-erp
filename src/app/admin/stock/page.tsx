"use client";

import { useState, useEffect } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  Package,
  Search,
  Filter,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit3,
  TrendingDown,
  Sparkles,
  Upload,
  Trash2,
  Settings,
  Image as ImageIcon
} from "lucide-react";

export default function AdminStockPage() {
  const [products, setProducts] = useState<any[]>([]);

  const generateNextSku = (category: string, designName: string, productsList: any[]) => {
    const year = "26"; // 2026
    const month = "05"; // May = 05
    
    let catCode = "KR";
    if (category === "suit") catCode = "SU";
    else if (category === "cord_set") catCode = "CO";
    else if (category === "festive") catCode = "FE";
    else if (category === "daily") catCode = "DA";

    // Extract unique prefix from Design Name (first 4 uppercase letters, padded with X if too short)
    const cleanDesign = (designName || "")
      .replace(/[^a-zA-Z]/g, "") // keep only letters
      .toUpperCase();
    const designCode = cleanDesign.substring(0, 4).padEnd(4, "X");

    const prefix = `PA-${year}${month}-${catCode}-${designCode}-`;
    const matchingProducts = productsList.filter(p => p.sku_id && p.sku_id.startsWith(prefix));
    
    let maxSeq = 0;
    matchingProducts.forEach(p => {
      const parts = p.sku_id.split("-");
      const seqStr = parts[parts.length - 1];
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    });

    const nextSeq = maxSeq + 1;
    const nextSeqStr = String(nextSeq).padStart(3, "0");
    return `${prefix}${nextSeqStr}`;
  };
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fabricFilter, setFabricFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection states
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Add form state
  const [addForm, setAddForm] = useState({
    skuId: "",
    designName: "",
    category: "kurti",
    fabric: "cotton",
    colorOptions: "Red, Blue, Green",
    sizeSet: "S, M, L, XL, XXL",
    lengthCm: "",
    purchaseCost: "",
    freightPerPiece: "0",
    overheadPerPiece: "0",
    standardPrice: "",
    qtyAvailable: "0",
    grade: "A",
    videoUrl: "",
    notes: ""
  });
  const [addPhotos, setAddPhotos] = useState<string[]>([]);

  // Edit form state
  const [editForm, setEditForm] = useState({
    designName: "",
    category: "kurti",
    fabric: "cotton",
    colorOptions: "",
    sizeSet: "",
    lengthCm: "",
    purchaseCost: "",
    freightPerPiece: "",
    overheadPerPiece: "",
    standardPrice: "",
    qtyAvailable: "",
    grade: "A",
    status: "available",
    videoUrl: "",
    notes: ""
  });
  const [editPhotos, setEditPhotos] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Fetch Products Error: ", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (isEditMode) {
        setEditPhotos(prev => [...prev, data.url]);
      } else {
        setAddPhotos(prev => [...prev, data.url]);
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          photoUrls: addPhotos
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Product creation failed.");

      setIsAddOpen(false);
      setAddPhotos([]);
      setAddForm({
        skuId: "",
        designName: "",
        category: "kurti",
        fabric: "cotton",
        colorOptions: "Red, Blue, Green",
        sizeSet: "S, M, L, XL, XXL",
        lengthCm: "",
        purchaseCost: "",
        freightPerPiece: "0",
        overheadPerPiece: "0",
        standardPrice: "",
        qtyAvailable: "0",
        grade: "A",
        videoUrl: "",
        notes: ""
      });
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to add SKU.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const res = await fetch(`/api/products/${selectedProduct.sku_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          photoUrls: editPhotos
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update product failed.");

      setIsEditOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to update SKU.");
    }
  };

  const handleDeleteSKU = async (skuId: string) => {
    if (!confirm(`Are you absolutely sure you want to delete SKU ${skuId} from database?`)) return;

    try {
      const res = await fetch(`/api/products/${skuId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete SKU.");

      setIsEditOpen(false);
      setSelectedProduct(null);
      fetchProducts();
      alert("SKU code successfully deleted.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const setQuickFilter = (type: string) => {
    if (type === "low") {
      setStatusFilter("low_stock");
      setCategoryFilter("all");
      setFabricFilter("all");
    } else if (type === "dead") {
      setSearch("");
      setProducts((prev) => {
        const sorted = [...prev].sort((a, b) => a.qty_sold_total - b.qty_sold_total);
        return sorted;
      });
      alert("SKUs sorted by lowest historical sales to identify dead stock.");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.sku_id.toLowerCase().includes(search.toLowerCase()) ||
      p.design_name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesFabric = fabricFilter === "all" || p.fabric === fabricFilter;
    
    let matchesStatus = true;
    if (statusFilter === "all") matchesStatus = true;
    else if (statusFilter === "low_stock") matchesStatus = p.qty_available > 0 && p.qty_available < 10;
    else if (statusFilter === "out_of_stock") matchesStatus = p.qty_available === 0;
    else matchesStatus = p.status === statusFilter;

    return matchesSearch && matchesCategory && matchesFabric && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 text-left font-sans text-slate-300 animate-fade-in">
      {/* Title & Action Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2 border-b border-white/5">
        <div>
          <span className="text-[10px] text-gold font-bold tracking-wider uppercase bg-gold/10 px-2.5 py-1 rounded-full border border-gold/15">
            Admin Inventory
          </span>
          <h2 className="text-2xl font-outfit font-extrabold text-white tracking-tight mt-2">
            Stock & SKU Master List
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 leading-normal max-w-xl">
            Real-time physical stocks tracking, purchase pricing margins audit, and low-stock automatic reorder alarms.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
          <Tooltip content="Register a new design SKU, configure cost structures, and assign initial warehouse stock." position="bottom">
            <button
              onClick={() => {
                const nextSku = generateNextSku("kurti", "", products);
                setAddForm({
                  skuId: nextSku,
                  designName: "",
                  category: "kurti",
                  fabric: "cotton",
                  colorOptions: "Red, Blue, Green",
                  sizeSet: "S, M, L, XL, XXL",
                  lengthCm: "",
                  purchaseCost: "",
                  freightPerPiece: "0",
                  overheadPerPiece: "0",
                  standardPrice: "",
                  qtyAvailable: "0",
                  grade: "A",
                  videoUrl: "",
                  notes: ""
                });
                setIsAddOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg shadow-gold/15 active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" /> Add New SKU
            </button>
          </Tooltip>
          
          <Tooltip content="Download the entire active warehouse stock and SKU master catalog as a CSV spreadsheet." position="bottom">
            <button
              onClick={() => {
                if (confirm("Export entire SKU Product catalog to CSV spreadsheet?")) {
                  window.open("/api/export?type=products", "_blank");
                }
              }}
              className="py-2.5 px-4 rounded-xl border border-white/5 bg-slate-950 text-slate-400 hover:text-white font-bold text-xs transition-all hover:bg-slate-900 active:scale-95"
            >
              Export CSV
            </button>
          </Tooltip>
          
          <Tooltip content="Upload a CSV file to bulk create or update product catalog entries in the database." position="bottom">
            <label className="py-2.5 px-4 rounded-xl border border-white/5 bg-slate-950 text-slate-400 hover:text-white font-bold text-xs transition-all cursor-pointer hover:bg-slate-900 flex items-center justify-center active:scale-95">
              Import CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  const file = files[0];
                  const reader = new FileReader();
                  reader.onload = async (evt) => {
                    const text = evt.target?.result;
                    if (typeof text !== "string") return;
                    try {
                      const res = await fetch("/api/import", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ csvContent: text })
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "Import failed");
                      alert(data.message || "Bulk import completed successfully.");
                      fetchProducts();
                    } catch (err: any) {
                      alert(err.message);
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </Tooltip>
          
          <Tooltip content="Filter the SKU grid to display only items that are running low (below 10 pieces)." position="bottom">
            <button
              onClick={() => setQuickFilter("low")}
              className="py-2.5 px-4 rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" /> Low Stock
            </button>
          </Tooltip>
          
          <Tooltip content="Sort product catalog in ascending order of historical sales to identify stagnant inventory." position="bottom">
            <button
              onClick={() => setQuickFilter("dead")}
              className="py-2.5 px-4 rounded-xl border border-white/5 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <TrendingDown className="w-4 h-4 text-slate-500" /> Dead Stock
            </button>
          </Tooltip>
        </div>
      </div>

      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tooltip content="Total unique design product codes registered in our catalog." position="top" className="w-full">
          <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-gold/20 transition-all duration-300 h-full">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Active SKUs</p>
              <p className="text-2xl font-outfit font-extrabold text-white mt-1">{products.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-gold group-hover:scale-110 transition-transform duration-300">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </Tooltip>

        <Tooltip content="Total sum of physical pieces currently stored across all design SKUs." position="top" className="w-full">
          <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-gold/20 transition-all duration-300 h-full">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Warehouse Pieces</p>
              <p className="text-2xl font-outfit font-extrabold text-white mt-1">
                {products.reduce((acc, p) => acc + (p.qty_available || 0), 0)} pcs
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="w-5 h-5 rotate-180" />
            </div>
          </div>
        </Tooltip>

        <Tooltip content="Number of design SKUs with physical stock count below safety threshold (10 pieces)." position="top" className="w-full">
          <div className="glass-panel p-4 rounded-xl border border-red-500/10 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-red-500/20 transition-all duration-300 bg-red-950/5 h-full">
            <div>
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Low Stock Alerts</p>
              <p className="text-2xl font-outfit font-extrabold text-red-400 mt-1">
                {products.filter(p => p.qty_available > 0 && p.qty_available < 10).length} SKUs
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-red-400 group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </Tooltip>

        <Tooltip content="Number of design SKUs currently at zero physical inventory." position="top" className="w-full">
          <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300 h-full">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Out Of Stock</p>
              <p className="text-2xl font-outfit font-extrabold text-slate-400 mt-1">
                {products.filter(p => p.qty_available === 0).length} SKUs
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </Tooltip>
      </div>

      {/* FILTER CONTROLLERS */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU code, block print name, fabric details..."
            className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white placeholder-slate-600 transition-colors"
          />
        </div>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full md:w-44 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-medium transition-colors"
        >
          <option value="all">Category: All</option>
          <option value="kurti">Kurtis Only</option>
          <option value="suit">Suit Sets Only</option>
          <option value="festive">Festive Wear</option>
          <option value="daily">Daily Wear</option>
        </select>

        {/* Fabric */}
        <select
          value={fabricFilter}
          onChange={(e) => setFabricFilter(e.target.value)}
          className="w-full md:w-44 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-medium transition-colors"
        >
          <option value="all">Fabric: All</option>
          <option value="cotton">Cambric Cotton</option>
          <option value="rayon">Heavy Rayon</option>
          <option value="georgette">Georgette Silk</option>
          <option value="crepe">Crepe Prints</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-44 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-medium transition-colors"
        >
          <option value="all">Status: All</option>
          <option value="available">In Stock</option>
          <option value="low_stock">Low Stock Alerts</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>

      {/* PRODUCTS MASTER TABLE */}
      {loading ? (
        <div className="glass-panel p-20 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
          <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Loading warehouse inventory counts...</span>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-xs md:text-sm text-left">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-850 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="p-4 pl-6">SKU Code</th>
                  <th className="p-4">Design Print / Fabric</th>
                  <th className="p-4 text-center">Available Stock</th>
                  <th className="p-4 text-center">Reserved POs</th>
                  <th className="p-4">Wholesale Rate</th>
                  <th className="p-4">Landed / Margin</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredProducts.map((p) => {
                  const available = p.qty_available - p.qty_reserved;
                  return (
                    <tr key={p.sku_id} className="hover:bg-slate-900/20 transition-all text-xs text-slate-300 group">
                      <td className="p-4 pl-6 font-bold text-white uppercase flex items-center gap-3">
                        {p.photo_urls && JSON.parse(p.photo_urls)[0] ? (
                          <img
                            src={JSON.parse(p.photo_urls)[0]}
                            alt={p.sku_id}
                            className="w-10 h-10 rounded-lg object-cover border border-white/10 shadow-md group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-950 border border-white/5 flex items-center justify-center text-slate-600">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-outfit tracking-wide">{p.sku_id}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white group-hover:text-gold transition-colors">{p.design_name}</span>
                          <span className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">
                            {p.fabric} | Sizes: {p.size_set}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-white block">{p.qty_available} pcs</span>
                        <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Unreserved: {available}</span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-400">{p.qty_reserved} pcs</td>
                      <td className="p-4">
                        <Tooltip content="Standard B2B wholesale selling price per piece offered to buyers." position="top">
                          <span className="font-extrabold text-gold text-sm block">₹{p.standard_price}</span>
                          <span className="text-[9px] text-slate-500 font-semibold block">per piece</span>
                        </Tooltip>
                      </td>
                      <td className="p-4">
                        <Tooltip content="Sourcing price includes fabric procurement, logistics freight, and manufacturing overhead costs." position="top">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-300">Landed: ₹{p.landed_cost}</span>
                            <span className="text-[9px] text-emerald-400 font-bold mt-0.5 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> Margin: {p.margin_percent}%
                            </span>
                          </div>
                        </Tooltip>
                      </td>
                      <td className="p-4">
                        <Tooltip content={
                          p.qty_available >= 10
                            ? "Sufficient physical stock level to fulfill active B2B orders."
                            : p.qty_available > 0
                            ? "Inventory level is below safety threshold! Reorder from manufacturer immediately."
                            : "No physical inventory left in warehouse. Sales orders locked for this SKU."
                        } position="top">
                          <span className={`py-1 px-2.5 rounded-md font-bold uppercase text-[9px] tracking-wider ${
                            p.qty_available >= 10
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : p.qty_available > 0
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {p.qty_available >= 10 ? "Available" : p.qty_available > 0 ? "Low Stock" : "Out of stock"}
                          </span>
                        </Tooltip>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Tooltip content="View and modify comprehensive SKU properties, fabric composition, purchase costs, and photos." position="left">
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                                setEditForm({
                                  designName: p.design_name,
                                  category: p.category,
                                  fabric: p.fabric,
                                  colorOptions: p.color_options,
                                  sizeSet: p.size_set,
                                  lengthCm: String(p.length_cm || ""),
                                  purchaseCost: String(p.purchase_cost),
                                  freightPerPiece: String(p.freight_per_piece),
                                  overheadPerPiece: String(p.overhead_per_piece),
                                  standardPrice: String(p.standard_price),
                                  qtyAvailable: String(p.qty_available),
                                  grade: p.grade,
                                  status: p.status,
                                  videoUrl: p.video_url || "",
                                  notes: p.notes || ""
                                });
                                setEditPhotos(p.photo_urls ? JSON.parse(p.photo_urls) : []);
                                setIsEditOpen(true);
                              }}
                              className="py-1.5 px-3 rounded-lg bg-slate-950 border border-white/5 hover:border-gold/30 hover:bg-slate-900 text-gold transition-all font-bold text-xs flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD NEW PRODUCT MODAL (GLASS SHEET) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleAddSubmit}
            className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full p-6 flex flex-col gap-5 text-left shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans glass-panel-glow"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-outfit font-extrabold text-white text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-gold animate-bounce" /> Add New SKU to Master Catalog
              </h3>
              <button
                type="button"
                onClick={() => { setIsAddOpen(false); setAddPhotos([]); }}
                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Select Product Category *</label>
                <select
                  value={addForm.category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    const generated = generateNextSku(newCat, addForm.designName, products);
                    setAddForm(p => ({ ...p, category: newCat, skuId: generated }));
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-semibold cursor-pointer focus:ring-2 focus:ring-gold/10"
                >
                  <option value="kurti">Kurti (KR)</option>
                  <option value="suit">Suit Set (SU)</option>
                  <option value="cord_set">Cord Set (CO)</option>
                  <option value="festive">Festive Wear (FE)</option>
                  <option value="daily">Daily Wear (DA)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Design Name * (Types to Generate SKU)</label>
                <input
                  type="text"
                  placeholder="e.g. Aishwarya Anarkali Set"
                  value={addForm.designName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const generated = generateNextSku(addForm.category, newName, products);
                    setAddForm(p => ({ ...p, designName: newName, skuId: generated }));
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all placeholder-slate-700 font-semibold"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dynamic B2B SKU ID (Auto-Generated & Verified)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={addForm.skuId}
                    className="flex-grow py-2.5 px-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-gold font-mono font-bold cursor-not-allowed focus:outline-none"
                    required
                    readOnly
                  />
                  <span className="py-2.5 px-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 flex-shrink-0 animate-pulse">
                    ✔ Anti-Duplicate Secured
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Prefix parameters parsed: <strong>PA</strong> (Prime Apparel) | <strong>2605</strong> (May 2026) | <strong>{addForm.category === 'kurti' ? 'KR' : addForm.category === 'suit' ? 'SU' : addForm.category === 'cord_set' ? 'CO' : addForm.category === 'festive' ? 'FE' : 'DA'}</strong> (Category) | <strong>{(addForm.designName || "").replace(/[^a-zA-Z]/g, "").toUpperCase().substring(0, 4).padEnd(4, "X")}</strong> (Design Code)
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fabric *</label>
                <select
                  value={addForm.fabric}
                  onChange={(e) => setAddForm(p => ({ ...p, fabric: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-semibold cursor-pointer"
                >
                  <option value="cotton">Cambric Cotton</option>
                  <option value="rayon">Heavy Rayon</option>
                  <option value="georgette">Georgette Silk</option>
                  <option value="crepe">Crepe Prints</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Colors (comma separated)</label>
                <input
                  type="text"
                  value={addForm.colorOptions}
                  onChange={(e) => setAddForm(p => ({ ...p, colorOptions: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Size Set (comma separated)</label>
                <input
                  type="text"
                  value={addForm.sizeSet}
                  onChange={(e) => setAddForm(p => ({ ...p, sizeSet: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Purchase Cost per Piece (INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 180"
                  value={addForm.purchaseCost}
                  onChange={(e) => setAddForm(p => ({ ...p, purchaseCost: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all placeholder-slate-700"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Freight per Piece (INR)</label>
                <input
                  type="number"
                  value={addForm.freightPerPiece}
                  onChange={(e) => setAddForm(p => ({ ...p, freightPerPiece: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Overheads per Piece (INR)</label>
                <input
                  type="number"
                  value={addForm.overheadPerPiece}
                  onChange={(e) => setAddForm(p => ({ ...p, overheadPerPiece: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Standard Wholesale Price (INR) *</label>
                <input
                  type="number"
                  placeholder="e.g. 290"
                  value={addForm.standardPrice}
                  onChange={(e) => setAddForm(p => ({ ...p, standardPrice: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all placeholder-slate-700"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Initial Warehouse Stock Qty *</label>
                <input
                  type="number"
                  value={addForm.qtyAvailable}
                  onChange={(e) => setAddForm(p => ({ ...p, qtyAvailable: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Product Quality Grade</label>
                <input
                  type="text"
                  value={addForm.grade}
                  onChange={(e) => setAddForm(p => ({ ...p, grade: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                />
              </div>
            </div>

            {/* Photo Uploader Widget */}
            <div className="flex flex-col gap-2.5 mt-2 bg-slate-950 p-4 rounded-xl border border-white/5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-gold animate-bounce" /> Cloudinary Product Photo Uploads
              </label>
              
              <div className="flex flex-wrap gap-3 items-center mt-2">
                {addPhotos.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl border border-white/10 overflow-hidden bg-slate-900 group shadow-md">
                    <img src={url} alt="product" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAddPhotos(p => p.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-95"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-800 hover:border-gold/30 flex flex-col items-center justify-center cursor-pointer transition-all text-[10px] text-slate-500 gap-1.5 bg-slate-950 active:scale-95">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold">{uploading ? "Uploading..." : "Add Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, false)}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">SKU Notes</label>
              <textarea
                value={addForm.notes}
                onChange={(e) => setAddForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Special packaging checks or custom Surat batch code references..."
                className="py-2.5 px-3 h-20 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white resize-none focus:ring-2 focus:ring-gold/10 transition-all placeholder-slate-700"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => { setIsAddOpen(false); setAddPhotos([]); }}
                className="py-2.5 px-4 rounded-xl border border-white/5 text-slate-400 text-xs hover:text-white hover:bg-white/5 transition-all font-semibold active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-gold/15 active:scale-95"
              >
                Create SKU Catalog
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT INVENTORY & FULL SKU PARAMETERS MODAL (GLASS SHEET) */}
      {isEditOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleEditSubmit}
            className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full p-6 flex flex-col gap-5 text-left shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans glass-panel-glow"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-outfit font-extrabold text-white text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold animate-spin-slow" /> Edit SKU & Master Stock Details
              </h3>
              <button
                type="button"
                onClick={() => handleDeleteSKU(selectedProduct.sku_id)}
                className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-extrabold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete SKU
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => { setIsEditOpen(false); setSelectedProduct(null); }}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-between p-3.5 rounded-xl bg-slate-950 border border-white/5 text-xs shadow-inner">
              <span className="text-slate-500 font-bold uppercase tracking-wider">SKU Design Code:</span>
              <span className="font-black text-gold uppercase tracking-widest font-outfit">{selectedProduct.sku_id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Design Name *</label>
                <input
                  type="text"
                  value={editForm.designName}
                  onChange={(e) => setEditForm(p => ({ ...p, designName: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Category *</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm(p => ({ ...p, category: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-semibold cursor-pointer"
                >
                  <option value="kurti">Kurti</option>
                  <option value="suit">Suit Set</option>
                  <option value="festive">Festive Wear</option>
                  <option value="daily">Daily Wear</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fabric *</label>
                <select
                  value={editForm.fabric}
                  onChange={(e) => setEditForm(p => ({ ...p, fabric: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-semibold cursor-pointer"
                >
                  <option value="cotton">Cambric Cotton</option>
                  <option value="rayon">Heavy Rayon</option>
                  <option value="georgette">Georgette Silk</option>
                  <option value="crepe">Crepe Prints</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Colors</label>
                <input
                  type="text"
                  value={editForm.colorOptions}
                  onChange={(e) => setEditForm(p => ({ ...p, colorOptions: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Size Set</label>
                <input
                  type="text"
                  value={editForm.sizeSet}
                  onChange={(e) => setEditForm(p => ({ ...p, sizeSet: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sourcing Purchase Cost (INR)</label>
                <input
                  type="number"
                  value={editForm.purchaseCost}
                  onChange={(e) => setEditForm(p => ({ ...p, purchaseCost: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Freight per Piece (INR)</label>
                <input
                  type="number"
                  value={editForm.freightPerPiece}
                  onChange={(e) => setEditForm(p => ({ ...p, freightPerPiece: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Overhead per Piece (INR)</label>
                <input
                  type="number"
                  value={editForm.overheadPerPiece}
                  onChange={(e) => setEditForm(p => ({ ...p, overheadPerPiece: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Standard wholesale Price (INR) *</label>
                <input
                  type="number"
                  value={editForm.standardPrice}
                  onChange={(e) => setEditForm(p => ({ ...p, standardPrice: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Physical Pieces Available *</label>
                <input
                  type="number"
                  value={editForm.qtyAvailable}
                  onChange={(e) => setEditForm(p => ({ ...p, qtyAvailable: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">SKU Status *</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(p => ({ ...p, status: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-semibold cursor-pointer"
                >
                  <option value="available">Available</option>
                  <option value="low_stock">Low Stock Alerts</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="discontinued">Discontinued SKU</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Quality Grade</label>
                <input
                  type="text"
                  value={editForm.grade}
                  onChange={(e) => setEditForm(p => ({ ...p, grade: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all"
                />
              </div>
            </div>

            {/* Photo Uploader Widget */}
            <div className="flex flex-col gap-2.5 mt-2 bg-slate-950 p-4 rounded-xl border border-white/5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-gold animate-bounce" /> Cloudinary Product Photo Uploads
              </label>
              
              <div className="flex flex-wrap gap-3 items-center mt-2">
                {editPhotos.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl border border-white/10 overflow-hidden bg-slate-900 group shadow-md">
                    <img src={url} alt="product" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditPhotos(p => p.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-95"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-800 hover:border-gold/30 flex flex-col items-center justify-center cursor-pointer transition-all text-[10px] text-slate-500 gap-1.5 bg-slate-950 active:scale-95">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold">{uploading ? "Uploading..." : "Add Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, true)}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">SKU Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))}
                className="py-2.5 px-3 h-20 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white resize-none focus:ring-2 focus:ring-gold/10 transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => { setIsEditOpen(false); setSelectedProduct(null); }}
                className="py-2.5 px-4 rounded-xl border border-white/5 text-slate-400 text-xs hover:text-white hover:bg-white/5 transition-all font-semibold active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-gold/15 active:scale-95"
              >
                Save SKU Details
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
