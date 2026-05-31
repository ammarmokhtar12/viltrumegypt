/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element, react-hooks/exhaustive-deps, @typescript-eslint/no-require-imports */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  DollarSign,
  Calendar,
  PlusCircle,
  Trash2,
  Filter,
  Search,
  AlertTriangle,
  TrendingDown,
  Info,
  Layers,
  FileText,
} from "lucide-react";

interface Expense {
  id: string;
  category: "fabric" | "pattern" | "printing" | "designer" | "transport" | "production" | "marketing" | "packaging" | "other";
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
}

const CATEGORY_MAP = {
  fabric: { label: "قماش (Fabric)", color: "text-blue-600", border: "border-blue-200", bg: "bg-blue-50" },
  pattern: { label: "باترون (Pattern)", color: "text-purple-600", border: "border-purple-200", bg: "bg-purple-50" },
  printing: { label: "طباعة (Printing)", color: "text-pink-600", border: "border-pink-200", bg: "bg-pink-50" },
  designer: { label: "ديزاينر (Designer)", color: "text-indigo-600", border: "border-indigo-200", bg: "bg-indigo-50" },
  transport: { label: "مواصلات (Transport)", color: "text-amber-600", border: "border-amber-200", bg: "bg-amber-50" },
  production: { label: "إنتاج / خياطة (Production)", color: "text-emerald-600", border: "border-emerald-200", bg: "bg-emerald-50" },
  marketing: { label: "تسويق / إعلانات (Marketing)", color: "text-red-600", border: "border-red-200", bg: "bg-red-50" },
  packaging: { label: "تغليف / كرتون (Packaging)", color: "text-teal-600", border: "border-teal-200", bg: "bg-teal-50" },
  other: { label: "أخرى / عام (Other)", color: "text-slate-600", border: "border-slate-200", bg: "bg-slate-50" },
};

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  // Form states
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Expense["category"]>("fabric");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        // Table probably doesn't exist yet (PGRST205)
        if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
          setDbError(true);
        } else {
          console.error("Error fetching expenses:", error);
        }
      } else if (data) {
        setExpenses(data);
      }
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
      setDbError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Please enter a valid positive number for amount");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          category,
          amount: parseFloat(amount),
          description: description.trim() || null,
          date,
        })
        .select();

      if (error) {
        alert(`Error adding expense: ${error.message}`);
      } else if (data) {
        setExpenses((prev) => [data[0], ...prev]);
        // Reset form
        setAmount("");
        setDescription("");
        setDate(new Date().toISOString().split("T")[0]);
      }
    } catch (err) {
      console.error("Failed to add expense:", err);
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (!error) {
        setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      } else {
        alert(`Error deleting: ${error.message}`);
      }
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  // Calculations
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = searchQuery === ""
      ? true
      : (e.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;

    // Date filtering
    let matchesDate = true;
    if (dateFilter !== "all") {
      const expDate = new Date(e.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === "today") {
        const todayStr = today.toISOString().split("T")[0];
        matchesDate = e.date === todayStr;
      } else if (dateFilter === "week") {
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = expDate >= oneWeekAgo;
      } else if (dateFilter === "month") {
        const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = expDate >= oneMonthAgo;
      }
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Category totals
  const getCategoryTotal = (cat: Expense["category"]) => {
    return expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-border-light border-t-foreground rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.25em] text-muted uppercase font-bold">
            Auditing Ledgers
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
          <h2 className="text-2xl font-bold text-amber-800">Expenses Table Missing</h2>
          <p className="text-amber-700 max-w-xl mx-auto leading-relaxed">
            The expenses database system has not been initialized yet. You need to run the database migration SQL script in your Supabase SQL Editor.
          </p>
          <div className="p-4 bg-white border border-amber-100 rounded-2xl text-left max-w-md mx-auto text-xs text-gray-500 font-mono space-y-2">
            <p className="font-bold text-gray-700">Instructions:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open your Supabase Project Dashboard.</li>
              <li>Go to the <b>SQL Editor</b> tab.</li>
              <li>Open the file <span className="underline font-bold text-black">add-cancelled-and-expenses.sql</span> in your local project root.</li>
              <li>Copy its entire content, paste it in Supabase SQL editor, and click <b>Run</b>.</li>
              <li>Once successfully run, click the Refresh button below.</li>
            </ol>
          </div>
          <button
            onClick={fetchExpenses}
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
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] block mb-2">Finance</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground border-l-4 border-primary pl-6 leading-none">
            Expenses System
          </h1>
          <p className="text-secondary text-sm font-medium mt-4 italic">Track, categorize, and optimize your business expenditure.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface border border-border-light px-5 py-3 rounded-2xl">
          <TrendingDown size={18} className="text-red-500" />
          <div>
            <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Total Expenses (Selected Filter)</p>
            <p className="text-lg font-bold text-foreground leading-none mt-0.5">{totalExpenses.toLocaleString()} EGP</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {(["fabric", "pattern", "printing", "designer", "transport"] as const).map((cat) => {
          const cfg = CATEGORY_MAP[cat];
          const total = getCategoryTotal(cat);
          return (
            <div key={cat} className={`bg-surface border ${cfg.border} p-5 rounded-2xl flex flex-col justify-between hover:shadow-sm transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                  {cfg.label.split(" ")[0]}
                </span>
                <span className="text-xs opacity-40">EGP</span>
              </div>
              <p className="text-xl font-bold text-foreground tracking-tight">
                {total.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Log Expense Form */}
        <div className="lg:col-span-4 bg-surface border border-border-light rounded-[2rem] p-6 lg:p-8 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <PlusCircle size={16} /> Log New Expenditure
            </h3>
            <p className="text-[11px] text-muted mt-1 font-bold uppercase tracking-wide">Enter spending values here</p>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">
                Amount (EGP) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">EGP</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="viltrum-input pl-14 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Expense["category"])}
                className="w-full px-4 py-3 rounded-xl border border-border-light bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all uppercase tracking-wide font-bold"
              >
                {Object.entries(CATEGORY_MAP).map(([key, value]) => (
                  <option key={key} value={key} className="normal-case">
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">
                Date *
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="viltrum-input pl-11 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">
                Description / Memo
              </label>
              <input
                type="text"
                placeholder="e.g. Bought 50m black cotton canvas"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="viltrum-input"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-primary text-white rounded-2xl text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? "Processing..." : "Commit Transaction"}
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-8 space-y-6">
          {/* Controls Strip */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface border border-border-light p-4 rounded-[1.5rem]">
            <div className="relative flex-1 w-full">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search memo details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="viltrum-input pl-11 !min-h-[2.5rem]"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-border-light bg-background rounded-xl text-xs font-bold tracking-wide uppercase focus:outline-none"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                  <option key={key} value={key}>
                    {key.toUpperCase()}
                  </option>
                ))}
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-border-light bg-background rounded-xl text-xs font-bold tracking-wide uppercase focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-surface border border-border-light rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Memo/Description</th>
                    <th>Spent Date</th>
                    <th>Financial Weight</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <Info size={40} className="mx-auto text-muted opacity-20 mb-4" />
                        <p className="text-sm font-bold text-muted tracking-widest uppercase italic">Ledger sheet is blank</p>
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const cfg = CATEGORY_MAP[exp.category] || CATEGORY_MAP.other;
                      return (
                        <tr key={exp.id} className="hover:bg-background/40 transition-colors">
                          <td>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                {cfg.label.split(" ")[0]}
                              </span>
                            </div>
                          </td>
                          <td>
                            <p className="text-xs text-foreground font-medium max-w-sm truncate" title={exp.description || "N/A"}>
                              {exp.description || "—"}
                            </p>
                          </td>
                          <td>
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                              {new Date(exp.date).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </td>
                          <td>
                            <span className="font-bold text-foreground">
                              {Number(exp.amount).toLocaleString()} <span className="text-[10px] opacity-40 ml-1">EGP</span>
                            </span>
                          </td>
                          <td>
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="w-8 h-8 flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Delete record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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
      </div>
    </div>
  );
}
