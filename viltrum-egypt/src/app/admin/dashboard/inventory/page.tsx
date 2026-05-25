"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import {
  Database,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  RotateCw,
  TrendingDown,
  Info,
  CheckCircle,
} from "lucide-react";

interface StockItem {
  product_id: string;
  size: string;
  quantity: number;
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const [productsRes, stockRes] = await Promise.all([
        supabase.from("products").select("*").order("title", { ascending: true }),
        supabase.from("inventory").select("*"),
      ]);

      if (productsRes.data) {
        setProducts(productsRes.data);
      }

      if (stockRes.error) {
        if (stockRes.error.code === "PGRST205" || stockRes.error.message?.includes("does not exist")) {
          setDbError(true);
        } else {
          console.error("Error fetching stock:", stockRes.error);
        }
      } else if (stockRes.data) {
        setStock(stockRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setDbError(true);
    } finally {
      setLoading(false);
    }
  };

  const getStockQty = (productId: string, size: string): number => {
    const item = stock.find((s) => s.product_id === productId && s.size === size);
    return item ? item.quantity : 0;
  };

  const handleUpdateStock = async (productId: string, size: string, newQty: number) => {
    const qty = Math.max(0, newQty);
    const updateKey = `${productId}-${size}`;
    setUpdatingId(updateKey);

    try {
      const { error } = await supabase
        .from("inventory")
        .upsert({
          product_id: productId,
          size: size,
          quantity: qty,
        }, {
          onConflict: "product_id,size",
        });

      if (!error) {
        setStock((prev) => {
          const filtered = prev.filter((s) => !(s.product_id === productId && s.size === size));
          return [...filtered, { product_id: productId, size, quantity: qty }];
        });
      } else {
        alert(`Error updating stock: ${error.message}`);
      }
    } catch (err) {
      console.error("Failed to update stock:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = stock.filter((s) => s.quantity <= 3).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-border-light border-t-foreground rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.25em] text-muted uppercase font-bold">
            Auditing Inventories
          </span>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="max-w-[1000px] mx-auto py-12 px-6">
        <div className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-10 text-center space-y-6">
          <AlertTriangle size={50} className="mx-auto text-amber-500" />
          <h2 className="text-2xl font-bold text-amber-800">Inventory Table Missing</h2>
          <p className="text-amber-700 max-w-xl mx-auto leading-relaxed">
            The size-specific inventory database system has not been initialized yet. You need to run the database migration SQL script in your Supabase SQL Editor.
          </p>
          <div className="p-4 bg-white border border-amber-100 rounded-2xl text-left max-w-md mx-auto text-xs text-gray-500 font-mono space-y-2">
            <p className="font-bold text-gray-700">Instructions:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open your Supabase Project Dashboard.</li>
              <li>Go to the <b>SQL Editor</b> tab.</li>
              <li>Open the file <span className="underline font-bold text-black">inventory-schema.sql</span> in your local project root.</li>
              <li>Copy its entire content, paste it in Supabase SQL editor, and click <b>Run</b>.</li>
              <li>Once successfully run, click the Refresh button below.</li>
            </ol>
          </div>
          <button
            onClick={fetchData}
            className="btn-primary hover:opacity-90 transition-all rounded-xl"
          >
            Refresh Database Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 pb-4">
        <div>
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] block mb-2">Operations</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground border-l-4 border-primary pl-6 leading-none">
            Stock Inventory
          </h1>
          <p className="text-secondary text-sm font-medium mt-4 italic">Monitor and manage physical size stock levels directly.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-surface border border-border-light px-5 py-3 rounded-2xl">
            <AlertTriangle size={18} className={lowStockCount > 0 ? "text-amber-500 animate-pulse" : "text-emerald-500"} />
            <div>
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Low Stock Warnings</p>
              <p className="text-lg font-bold text-foreground leading-none mt-0.5">{lowStockCount} Items</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="btn-outline flex items-center gap-2"
          >
            <RotateCw size={14} />
            Sync Stock
          </button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface border border-border-light p-4 rounded-[1.5rem]">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search products by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="viltrum-input pl-11 !min-h-[2.5rem]"
          />
        </div>
      </div>

      {/* Inventory Grid Ledger */}
      <div className="bg-surface border border-border-light rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product Information</th>
                <th>Size Stock Levels & Controls</th>
                <th className="text-right">Total In Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-24 text-center">
                    <Info size={40} className="mx-auto text-muted opacity-20 mb-4" />
                    <p className="text-sm font-bold text-muted tracking-widest uppercase italic">No matching products found</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const sizes = product.title === "Thragg Edition" ? ["L", "XL", "XXL"] : (product.sizes || ["S", "M", "L", "XL", "XXL"]);
                  
                  // Calculate total stock count for this product across all sizes
                  const totalProductStock = sizes.reduce((sum, sz) => sum + getStockQty(product.id, sz), 0);

                  return (
                    <tr key={product.id} className="hover:bg-background/40 transition-colors">
                      <td className="w-1/3">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-16 rounded-xl border border-border-light overflow-hidden bg-background shadow-sm flex-shrink-0">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted font-bold text-xs">V</div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{product.title}</h4>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1">{product.price.toLocaleString()} EGP</p>
                          </div>
                        </div>
                      </td>

                      <td className="w-1/2">
                        <div className="flex flex-wrap gap-4 py-2">
                          {sizes.map((size) => {
                            const qty = getStockQty(product.id, size);
                            const updateKey = `${product.id}-${size}`;
                            const isUpdating = updatingId === updateKey;

                            let qtyColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                            if (qty === 0) {
                              qtyColor = "bg-red-50 text-red-700 border-red-200 animate-pulse";
                            } else if (qty <= 3) {
                              qtyColor = "bg-amber-50 text-amber-700 border-amber-200";
                            }

                            return (
                              <div
                                key={size}
                                className="flex items-center gap-2.5 p-2 bg-background border border-border-light rounded-xl shadow-sm hover:border-secondary transition-all"
                              >
                                {/* Size Tag */}
                                <span className="text-xs font-black uppercase text-muted tracking-tight w-6 text-center">
                                  {size}
                                </span>

                                {/* Stock Quantity Pill */}
                                <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border ${qtyColor} min-w-[2.5rem] text-center`}>
                                  {qty}
                                </span>

                                {/* Controls */}
                                <div className="flex items-center border border-border-light rounded-lg bg-surface p-0.5">
                                  <button
                                    onClick={() => handleUpdateStock(product.id, size, qty - 1)}
                                    disabled={qty <= 0 || isUpdating}
                                    className="w-6 h-6 flex items-center justify-center text-muted hover:text-foreground hover:bg-background rounded disabled:opacity-30"
                                  >
                                    <Minus size={10} />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStock(product.id, size, qty + 1)}
                                    disabled={isUpdating}
                                    className="w-6 h-6 flex items-center justify-center text-muted hover:text-foreground hover:bg-background rounded"
                                  >
                                    <Plus size={10} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      <td className="text-right pr-6 align-middle">
                        <span className={`font-bold text-sm ${totalProductStock === 0 ? "text-red-500 animate-pulse font-extrabold" : totalProductStock <= 10 ? "text-amber-500 font-extrabold" : "text-foreground"}`}>
                          {totalProductStock} <span className="text-[10px] opacity-40 ml-1">UNITS</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
