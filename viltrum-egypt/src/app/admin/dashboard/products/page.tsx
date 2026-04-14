"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  Package,
  Save,
  Eye,
  EyeOff,
  Search,
  DollarSign,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "hidden">("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    image_url: "",
    gallery_urls: [] as string[],
    video_url: "",
    sizes: ["S", "M", "L", "XL", "XXL"],
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      image_url: "",
      gallery_urls: [],
      video_url: "",
      sizes: ["S", "M", "L", "XL", "XXL"],
      is_active: true,
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const openEditForm = (product: Product) => {
    setFormData({
      title: product.title,
      description: product.description || "",
      price: String(product.price),
      image_url: product.image_url || "",
      gallery_urls: product.gallery_urls || [],
      video_url: product.video_url || "",
      sizes: product.sizes || ["S", "M", "L", "XL", "XXL"],
      is_active: product.is_active,
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFileUpload = async (file: File, type: 'main' | 'gallery' | 'video') => {
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const ext = file.name.split(".").pop();
      const filePath = `${fileName}.${ext}`;
      const bucket = "product-images";

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (type === 'main') {
        setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      } else if (type === 'gallery') {
        setFormData((prev) => ({ ...prev, gallery_urls: [...prev.gallery_urls, publicUrl] }));
      } else if (type === 'video') {
        setFormData((prev) => ({ ...prev, video_url: publicUrl }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) return;

    setSaving(true);
    try {
      const productData = {
        title: formData.title,
        description: formData.description || null,
        price: parseFloat(formData.price),
        image_url: formData.image_url || null,
        gallery_urls: formData.gallery_urls,
        video_url: formData.video_url || null,
        sizes: formData.sizes,
        is_active: formData.is_active,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(productData);
        if (error) throw error;
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (!error) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !product.is_active })
        .eq("id", product.id);

      if (!error) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, is_active: !p.is_active } : p
          )
        );
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const toggleSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterActive === "all" ||
      (filterActive === "active" && p.is_active) ||
      (filterActive === "hidden" && !p.is_active);
    return matchesSearch && matchesFilter;
  });

  // Stats
  const activeCount = products.filter((p) => p.is_active).length;
  const totalValue = products.reduce((sum, p) => sum + p.price, 0);
  const avgPrice = products.length > 0 ? totalValue / products.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-border-light border-t-foreground rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.25em] text-muted uppercase font-bold">
            Scanning Inventory
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 pb-4">
        <div>
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] block mb-2">Global Stock</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground border-l-4 border-primary pl-6 leading-none">
            Inventory
          </h1>
          <p className="text-secondary text-sm font-medium mt-4">Manage products, stock levels and visibility.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary group"
        >
          <Plus size={16} className="mr-2" />
          New Product
        </button>
      </div>

      {/* Stats Quickbar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Assets", value: products.length, icon: Package, color: "text-foreground" },
          { label: "Live Items", value: activeCount, icon: Eye, color: "text-emerald-500" },
          { label: "Avg Listing", value: `${avgPrice.toFixed(0)} EGP`, icon: DollarSign, color: "text-foreground" },
          { label: "Shadowed", value: products.length - activeCount, icon: EyeOff, color: "text-muted" },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-border-light p-6 rounded-2xl flex flex-col justify-between hover:border-secondary transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{stat.label}</span>
              <stat.icon size={14} className="text-muted" />
            </div>
            <p className={`text-2xl font-bold ${stat.color} tracking-tight`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock..."
            className="viltrum-input pl-11 !min-h-[2.75rem]"
          />
        </div>
        <div className="flex gap-2 p-1 bg-surface border border-border-light rounded-xl overflow-hidden self-stretch sm:self-auto">
          {(["all", "active", "hidden"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterActive(filter)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                filterActive === filter
                  ? "bg-primary text-background shadow-md shadow-primary/10"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface border border-border-light rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Asset Identity</th>
                <th>Price Matrix</th>
                <th>Dimensions</th>
                <th>Visibility</th>
                <th className="text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-14 bg-background border border-border-light rounded-lg overflow-hidden flex-shrink-0 group">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-20">
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm truncate max-w-[200px]">
                          {product.title}
                        </p>
                        <p className="text-[10px] text-muted font-bold tracking-widest mt-0.5 truncate max-w-[200px] uppercase">
                          ID: {product.id.split('-')[0]}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-bold text-foreground">
                      {product.price.toLocaleString()} <span className="text-[10px] font-bold opacity-50 ml-1">EGP</span>
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {product.sizes?.map((size) => (
                        <span
                          key={size}
                          className="px-1.5 py-0.5 text-[9px] font-bold text-muted bg-background border border-border-light rounded uppercase"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(product)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border ${
                        product.is_active
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-muted/10 text-muted border-transparent"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-muted opacity-50'}`}></div>
                      {product.is_active ? "Live" : "Shadowed"}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditForm(product)}
                        className="h-9 w-9 flex items-center justify-center text-muted hover:text-foreground hover:bg-background border border-border-light rounded-lg transition-all"
                        title="Edit asset"
                      >
                        <Edit2 size={14} />
                      </button>
                      
                      {deleteConfirm === product.id ? (
                        <div className="flex items-center gap-1 animate-fade-in">
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="h-9 px-3 text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white rounded-lg"
                          >
                            Purge
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="h-9 w-9 flex items-center justify-center text-muted hover:bg-background rounded-lg"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          className="h-9 w-9 flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-500/10 border border-border-light rounded-lg transition-all"
                          title="Purge asset"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="py-24 text-center">
              <Package size={40} className="mx-auto text-muted opacity-20 mb-4" />
              <p className="text-sm font-bold text-muted tracking-widest uppercase italic">The grid is empty</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-primary/20 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-10 animate-fade-in">
          <div
            className="bg-background w-full max-w-2xl max-h-full overflow-y-auto rounded-3xl border border-secondary shadow-2xl flex flex-col scale-100 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Head */}
            <div className="h-20 px-8 flex items-center justify-between border-b border-border-light shrink-0">
               <div>
                 <h2 className="text-lg font-bold text-foreground">
                   {editingProduct ? "Revise Asset" : "Initialize Asset"}
                 </h2>
                 <p className="text-[10px] text-muted font-bold tracking-[0.2em] uppercase mt-1">
                    {editingProduct ? "ID: "+editingProduct.id : "New Inventory Object"}
                 </p>
               </div>
               <button
                 onClick={resetForm}
                 className="p-3 text-muted hover:text-foreground hover:bg-surface rounded-xl transition-all"
               >
                 <X size={18} />
               </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-8 space-y-10 overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted ml-1">Identity Label</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className="viltrum-input"
                    placeholder="Product Title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted ml-1">Asset Value (EGP)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    className="viltrum-input"
                    placeholder="999.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted ml-1">Mission Specs</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="viltrum-input !py-4 min-h-[100px] resize-none"
                  placeholder="Detailed product descriptions..."
                />
              </div>

              <div className="space-y-6">
                 <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted ml-1">Visual Matrix</label>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div 
                         onClick={() => fileInputRef.current?.click()}
                         className="aspect-[4/5] border-2 border-dashed border-border-light rounded-2xl flex flex-col items-center justify-center group cursor-pointer hover:border-primary transition-all p-6 text-center"
                       >
                          {formData.image_url ? (
                            <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner bg-surface">
                              <img src={formData.image_url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <Upload className="text-background" size={24} />
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="text-muted group-hover:text-primary transition-colors mb-4" size={32} />
                              <p className="text-xs font-bold text-foreground">Main Image</p>
                              <p className="text-[10px] text-muted mt-2">Required for grid</p>
                            </>
                          )}
                       </div>
                       
                       {/* Video Upload Section */}
                       <div className="space-y-3">
                          <p className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Motion (360 Video)</p>
                          <div 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'video/*';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) handleFileUpload(file, 'video');
                              };
                              input.click();
                            }}
                            className={`h-24 border-2 border-dashed rounded-2xl flex items-center gap-4 px-6 cursor-pointer transition-all ${
                              formData.video_url ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border-light hover:border-primary'
                            }`}
                          >
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.video_url ? 'bg-emerald-500 text-white' : 'bg-surface text-muted'}`}>
                                <ImageIcon size={20} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-foreground">
                                   {formData.video_url ? 'Asset Embedded' : 'Upload 360 Video'}
                                </p>
                                <p className="text-[10px] text-muted truncate">
                                   {formData.video_url ? 'Click to replace' : 'MP4 recommended'}
                                </p>
                             </div>
                             {formData.video_url && (
                               <button 
                                 type="button"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setFormData(prev => ({ ...prev, video_url: '' }));
                                 }}
                                 className="p-2 text-muted hover:text-red-500 transition-colors"
                               >
                                 <X size={16} />
                               </button>
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-3">
                          <p className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Visual Archive (Gallery)</p>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                             {formData.gallery_urls.map((url, idx) => (
                               <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-border-light">
                                 <img src={url} className="w-full h-full object-cover" />
                                 <button
                                   type="button"
                                   onClick={() => setFormData(p => ({ ...p, gallery_urls: p.gallery_urls.filter((_, i) => i !== idx) }))}
                                   className="absolute top-1 right-1 p-1 bg-background/80 backdrop-blur-sm text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                   <X size={14} />
                                 </button>
                               </div>
                             ))}
                             <button
                               type="button"
                               onClick={() => {
                                 const input = document.createElement('input');
                                 input.type = 'file';
                                 input.accept = 'image/*';
                                 input.onchange = (e) => {
                                   const file = (e.target as HTMLInputElement).files?.[0];
                                   if (file) handleFileUpload(file, 'gallery');
                                 };
                                 input.click();
                               }}
                               className="aspect-square border-2 border-dashed border-border-light rounded-xl flex flex-col items-center justify-center text-muted hover:text-primary hover:border-primary transition-all"
                             >
                                <Plus size={20} />
                                <span className="text-[9px] font-bold uppercase mt-1">Add</span>
                             </button>
                          </div>
                       </div>
                       <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Global Sizes</p>
                       <div className="flex flex-wrap gap-2">
                         {["S", "M", "L", "XL", "XXL"].map((size) => (
                           <button
                             key={size}
                             type="button"
                             onClick={() => toggleSize(size)}
                             className={`w-12 h-12 flex items-center justify-center text-xs font-bold rounded-xl transition-all border ${
                               formData.sizes.includes(size)
                                 ? "bg-primary text-background border-primary"
                                 : "bg-surface text-muted border-border-light hover:border-secondary"
                             }`}
                           >
                             {size}
                           </button>
                         ))}
                       </div>
                       
                       <div className="pt-6">
                         <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Accessibility</p>
                         <button
                           type="button"
                           onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                           className={`w-full h-14 flex items-center justify-between px-6 rounded-2xl border transition-all ${
                             formData.is_active ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-surface border-border-light text-muted'
                           }`}
                         >
                           <div className="flex items-center gap-3">
                              {formData.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                              <span className="text-xs font-bold uppercase tracking-wider">
                                 {formData.is_active ? 'Live Broadcast' : 'Maintenance Mode'}
                              </span>
                           </div>
                           <div className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-muted'}`}></div>
                         </button>
                       </div>
                    </div>
                 </div>
                 <input
                   ref={fileInputRef}
                   type="file"
                   accept="image/*"
                   onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) handleFileUpload(file, 'main');
                   }}
                   className="hidden"
                 />
              </div>

              {/* Submit Action */}
              <div className="pt-10 flex gap-4">
                 <button
                   type="button"
                   onClick={resetForm}
                   className="flex-1 h-14 font-bold text-xs uppercase tracking-[0.2em] border border-border-light text-muted hover:text-foreground hover:bg-surface rounded-2xl transition-all"
                 >
                   Abort
                 </button>
                 <button
                   type="submit"
                   disabled={saving || uploading}
                   className="flex-[2] btn-primary"
                 >
                   {saving ? "Commiting..." : uploading ? "Uploading Visuals..." : editingProduct ? "Confirm Revision" : "Deploy Asset"}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
