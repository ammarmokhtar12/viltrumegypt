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
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    image_url: "",
    sizes: ["S", "M", "L", "XL", "XXL"],
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
      sizes: product.sizes || ["S", "M", "L", "XL", "XXL"],
      is_active: product.is_active,
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const ext = file.name.split(".").pop();
      const filePath = `${fileName}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Failed to upload image");
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
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (!error) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-viltrum-red border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-[0.2em] text-foreground/60/30 uppercase">Loading products</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground tracking-tight">Products</h1>
          <p className="text-sm text-foreground/60/35 mt-1">
            {products.length} products
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="admin-btn admin-btn-primary"
        >
          <Plus size={15} />
          Add Product
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={resetForm}>
          <div
            className="glass-card-static rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid rgba(240, 240, 240, 0.05)" }}>
              <h2 className="font-display font-bold text-foreground tracking-wide">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={resetForm}
                className="p-1.5 rounded-lg text-foreground/60/40 hover:text-foreground hover:bg-viltrum-white/5 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground/60/40 tracking-[0.15em] uppercase mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder-viltrum-mist/20 focus:outline-none focus:ring-1 focus:ring-viltrum-red/30 transition-all"
                  style={{ background: "rgba(240, 240, 240, 0.04)", border: "1px solid rgba(240, 240, 240, 0.06)" }}
                  placeholder="Product name"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground/60/40 tracking-[0.15em] uppercase mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder-viltrum-mist/20 focus:outline-none focus:ring-1 focus:ring-viltrum-red/30 transition-all resize-none"
                  style={{ background: "rgba(240, 240, 240, 0.04)", border: "1px solid rgba(240, 240, 240, 0.06)" }}
                  placeholder="Product description"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground/60/40 tracking-[0.15em] uppercase mb-2">
                  Price (EGP) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder-viltrum-mist/20 focus:outline-none focus:ring-1 focus:ring-viltrum-red/30 transition-all"
                  style={{ background: "rgba(240, 240, 240, 0.04)", border: "1px solid rgba(240, 240, 240, 0.06)" }}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground/60/40 tracking-[0.15em] uppercase mb-2">
                  Product Image
                </label>
                {formData.image_url ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(240, 240, 240, 0.06)" }}>
                    <img
                      src={formData.image_url}
                      alt="Product"
                      className="w-full h-44 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, image_url: "" }))
                      }
                      className="absolute top-3 right-3 p-2 rounded-lg text-white hover:bg-viltrum-red transition-colors"
                      style={{ background: "rgba(0, 0, 0, 0.6)" }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl p-8 text-center cursor-pointer transition-all duration-300 hover:border-viltrum-red/20"
                    style={{ border: "2px dashed rgba(240, 240, 240, 0.08)", background: "rgba(240, 240, 240, 0.02)" }}
                  >
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-viltrum-red border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      <>
                        <Upload
                          size={24}
                          className="mx-auto text-foreground/60/20 mb-3"
                        />
                        <p className="text-sm text-foreground/60/30">
                          Click to upload image
                        </p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                />
                {/* Or paste URL */}
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      image_url: e.target.value,
                    }))
                  }
                  className="w-full mt-3 px-4 py-2.5 rounded-xl text-sm text-foreground placeholder-viltrum-mist/20 focus:outline-none focus:ring-1 focus:ring-viltrum-red/30 transition-all"
                  style={{ background: "rgba(240, 240, 240, 0.04)", border: "1px solid rgba(240, 240, 240, 0.06)" }}
                  placeholder="Or paste image URL"
                />
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground/60/40 tracking-[0.15em] uppercase mb-3">
                  Available Sizes
                </label>
                <div className="flex gap-2">
                  {["S", "M", "L", "XL", "XXL"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                        formData.sizes.includes(size)
                          ? "bg-viltrum-red/15 text-viltrum-red border border-viltrum-red/20"
                          : "text-foreground/60/30 hover:text-foreground/60/60"
                      }`}
                      style={
                        !formData.sizes.includes(size)
                          ? { background: "rgba(240, 240, 240, 0.03)", border: "1px solid rgba(240, 240, 240, 0.06)" }
                          : undefined
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: !prev.is_active,
                    }))
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                    formData.is_active ? "bg-viltrum-red" : "bg-viltrum-gray-lighter"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${
                      formData.is_active ? "translate-x-5" : ""
                    }`}
                  />
                </button>
                <span className="text-sm text-foreground/60/50 flex items-center gap-2">
                  {formData.is_active ? (
                    <><Eye size={14} /> Visible</>
                  ) : (
                    <><EyeOff size={14} /> Hidden</>
                  )}
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="admin-btn admin-btn-primary w-full py-3.5"
              >
                <Save size={15} />
                {saving
                  ? "Saving..."
                  : editingProduct
                  ? "Update Product"
                  : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-24 glass-card-static rounded-2xl">
          <Package size={40} className="mx-auto text-foreground/60/15 mb-5" />
          <h2 className="text-lg font-display font-bold text-foreground/60/40">
            No products yet
          </h2>
          <p className="text-sm text-foreground/60/20 mt-2">
            Add your first product to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => (
            <div
              key={product.id}
              className="glass-card-static rounded-2xl overflow-hidden group transition-all duration-300 hover:border-viltrum-white/10"
            >
              <div className="relative" style={{ aspectRatio: "4/5" }}>
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(22, 22, 22, 0.8)" }}>
                    <Package size={36} className="text-foreground/60/15" />
                  </div>
                )}
                {!product.is_active && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase"
                    style={{ background: "rgba(0, 0, 0, 0.7)", color: "rgba(240, 240, 240, 0.5)" }}
                  >
                    Hidden
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-70" />
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-foreground truncate">
                    {product.title}
                  </h3>
                  <p className="text-lg font-display font-black text-viltrum-red mt-1">
                    EGP {product.price}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {product.sizes?.map((size) => (
                    <span
                      key={size}
                      className="px-2 py-0.5 text-[10px] font-semibold rounded text-foreground/60/30"
                      style={{ background: "rgba(240, 240, 240, 0.04)" }}
                    >
                      {size}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openEditForm(product)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-semibold rounded-xl transition-all duration-300 text-foreground/60/50 hover:text-foreground"
                    style={{ background: "rgba(240, 240, 240, 0.04)", border: "1px solid rgba(240, 240, 240, 0.06)" }}
                  >
                    <Edit2 size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 text-[12px] font-semibold rounded-xl transition-all duration-300 text-viltrum-red/60 hover:text-viltrum-red hover:bg-viltrum-red/10"
                    style={{ border: "1px solid rgba(178, 0, 0, 0.1)" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
