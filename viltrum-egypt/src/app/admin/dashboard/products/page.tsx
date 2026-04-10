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
  MoreVertical,
  DollarSign,
  BarChart3,
  TrendingUp,
  Image as ImageIcon,
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
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
          <span className="text-[11px] tracking-[0.25em] text-zinc-400 uppercase font-semibold">
            Loading products
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-zinc-900 tracking-wide">
            Products
          </h1>
          <p className="text-base text-zinc-500 mt-2">
            {products.length} products · {activeCount} active
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 h-12 px-6 bg-zinc-900 text-white text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-zinc-700 transition-colors rounded-sm"
        >
          <Plus size={15} />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm bg-zinc-50 flex items-center justify-center">
              <Package size={15} className="text-zinc-400" />
            </div>
            <p className="text-[10px] tracking-[0.25em] text-zinc-400 uppercase font-semibold">Total</p>
          </div>
          <p className="text-2xl font-display text-zinc-900">{products.length}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm bg-emerald-50 flex items-center justify-center">
              <Eye size={15} className="text-emerald-600" />
            </div>
            <p className="text-[10px] tracking-[0.25em] text-zinc-400 uppercase font-semibold">Active</p>
          </div>
          <p className="text-2xl font-display text-emerald-600">{activeCount}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm bg-zinc-50 flex items-center justify-center">
              <DollarSign size={15} className="text-zinc-400" />
            </div>
            <p className="text-[10px] tracking-[0.25em] text-zinc-400 uppercase font-semibold">Avg Price</p>
          </div>
          <p className="text-2xl font-display text-zinc-900">EGP {avgPrice.toFixed(0)}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm bg-zinc-50 flex items-center justify-center">
              <EyeOff size={15} className="text-zinc-400" />
            </div>
            <p className="text-[10px] tracking-[0.25em] text-zinc-400 uppercase font-semibold">Hidden</p>
          </div>
          <p className="text-2xl font-display text-zinc-500">{products.length - activeCount}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full h-12 pl-11 pr-4 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-zinc-400 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "hidden"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterActive(filter)}
              className={`h-12 px-5 text-[11px] font-semibold uppercase tracking-[0.15em] border transition-all rounded-lg ${
                filterActive === filter
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-24 bg-white border border-zinc-100 rounded-sm">
          <Package size={36} className="mx-auto text-zinc-200 mb-5" />
          <h2 className="text-lg font-display text-zinc-400">
            {searchQuery ? "No products match your search" : "No products yet"}
          </h2>
          <p className="text-sm text-zinc-300 mt-2">
            {searchQuery ? "Try a different search term." : "Add your first product to get started."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Sizes</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                    {/* Product (Image + Name) */}
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-zinc-50 border border-zinc-100 rounded-sm overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={16} className="text-zinc-200" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 text-sm truncate max-w-[200px]">
                            {product.title}
                          </p>
                          {product.description && (
                            <p className="text-xs text-zinc-400 truncate max-w-[200px] mt-0.5">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Price */}
                    <td>
                      <span className="font-display font-bold text-zinc-900">
                        EGP {product.price}
                      </span>
                    </td>
                    {/* Sizes */}
                    <td>
                      <div className="flex gap-1.5">
                        {product.sizes?.map((size) => (
                          <span
                            key={size}
                            className="px-2 py-0.5 text-[10px] font-semibold text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-sm"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* Status */}
                    <td>
                      <button
                        onClick={() => toggleActive(product)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-sm transition-colors ${
                          product.is_active
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                        }`}
                      >
                        {product.is_active ? (
                          <>
                            <Eye size={12} /> Active
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} /> Hidden
                          </>
                        )}
                      </button>
                    </td>
                    {/* Date */}
                    <td>
                      <span className="text-sm text-zinc-400">
                        {new Date(product.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    {/* Actions */}
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditForm(product)}
                          className="h-9 px-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 bg-zinc-50 border border-zinc-100 hover:border-zinc-300 rounded-sm transition-all"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        {deleteConfirm === product.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="h-9 px-3 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-sm transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="h-9 px-3 text-[11px] font-semibold text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-sm transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="h-9 w-9 inline-flex items-center justify-center text-zinc-400 hover:text-red-600 bg-zinc-50 border border-zinc-100 hover:border-red-200 rounded-sm transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-zinc-100">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-5 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-sm overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={18} className="text-zinc-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 text-sm truncate">
                      {product.title}
                    </p>
                    <p className="text-lg font-display font-bold text-zinc-900 mt-0.5">
                      EGP {product.price}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleActive(product)}
                    className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-sm ${
                      product.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {product.is_active ? "Active" : "Hidden"}
                  </button>
                </div>

                <div className="flex gap-1.5">
                  {product.sizes?.map((size) => (
                    <span
                      key={size}
                      className="px-2 py-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-50 border border-zinc-100 rounded-sm"
                    >
                      {size}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(product)}
                    className="flex-1 h-10 flex items-center justify-center gap-2 text-[11px] font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 hover:border-zinc-400 rounded-sm transition-all"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      deleteConfirm === product.id
                        ? handleDelete(product.id)
                        : setDeleteConfirm(product.id)
                    }
                    className={`h-10 px-4 flex items-center justify-center gap-2 text-[11px] font-semibold rounded-sm transition-all border ${
                      deleteConfirm === product.id
                        ? "bg-red-600 text-white border-red-600"
                        : "text-zinc-400 border-zinc-200 hover:text-red-600 hover:border-red-200"
                    }`}
                  >
                    <Trash2 size={12} />
                    {deleteConfirm === product.id ? "Confirm" : ""}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={resetForm}
        >
          <div
            className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="font-display text-lg text-zinc-900 tracking-wide">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-7 bg-zinc-50 border-t border-zinc-100">
              {/* Title & Price Row */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full h-12 px-4 bg-white border border-transparent focus:border-zinc-300 rounded-lg shadow-sm transition-all text-sm outline-none font-medium"
                    placeholder="E.g. Viltrum Core Compression"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    Price (EGP)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="w-full h-12 px-4 bg-white border border-transparent focus:border-zinc-300 rounded-lg shadow-sm transition-all text-sm outline-none font-medium"
                    placeholder="999"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">
                  Short Desc
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full p-4 bg-white border border-transparent focus:border-zinc-300 rounded-lg shadow-sm transition-all text-sm outline-none font-medium resize-none"
                  placeholder="High-performance fabric..."
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-400 block">
                  Product Image
                </label>
                {formData.image_url ? (
                  <div className="relative border border-zinc-100 rounded-sm overflow-hidden">
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
                      className="absolute top-3 right-3 p-2 rounded-sm text-white bg-zinc-900/70 hover:bg-zinc-900 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-zinc-200 p-8 text-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-all"
                  >
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin mx-auto" />
                    ) : (
                      <>
                        <Upload size={22} className="mx-auto text-zinc-300 mb-3" />
                        <p className="text-sm text-zinc-500">Click to upload image</p>
                        <p className="text-[11px] text-zinc-300 mt-1">JPG, PNG — Max 5MB</p>
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
                  className="viltrum-input mt-2"
                  placeholder="Or paste image URL"
                />
              </div>

              {/* Sizes */}
              <div className="space-y-3">
                <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-400 block">
                  Available Sizes
                </label>
                <div className="flex gap-2">
                  {["S", "M", "L", "XL", "XXL"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`h-10 px-4 text-xs font-semibold border transition-all rounded-sm ${
                        formData.sizes.includes(size)
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: !prev.is_active,
                    }))
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                    formData.is_active ? "bg-emerald-600" : "bg-zinc-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${
                      formData.is_active ? "translate-x-5" : ""
                    }`}
                  />
                </button>
                <span className="text-sm text-zinc-500 flex items-center gap-2">
                  {formData.is_active ? (
                    <>
                      <Eye size={14} /> Visible on store
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} /> Hidden from store
                    </>
                  )}
                </span>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-zinc-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-14 flex items-center justify-center gap-2 bg-zinc-900 text-white text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-zinc-700 transition-colors rounded-sm disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
