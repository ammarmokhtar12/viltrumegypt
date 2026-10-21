/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Plus,
  Trash2,
  Download,
  Calendar,
  DollarSign,
  UserCheck,
  CreditCard,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";

interface Transaction {
  id: string;
  person: "ammar" | "mohamed";
  type: "income" | "expense" | "transfer";
  amount: number;
  title: string;
  category: string;
  date: string;
  notes?: string;
  created_at?: string;
}

interface Settings {
  ammar_initial_balance: number;
  mohamed_initial_balance: number;
  auto_sync_orders: boolean;
  auto_sync_expenses: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  ammar_initial_balance: 0,
  mohamed_initial_balance: 0,
  auto_sync_orders: false,
  auto_sync_expenses: false,
};

const EXPENSE_CATEGORIES = [
  "قماش (Fabric)",
  "طباعة (Printing)",
  "باترون (Pattern)",
  "إنتاج وخياطة (Production)",
  "إعلانات وتسويق (Marketing)",
  "تغليف ومطبوعات (Packaging)",
  "شحن ومواصلات (Transport)",
  "مصاريف إدارية (Admin)",
  "أخرى (Other)",
];

const INCOME_CATEGORIES = [
  "إيراد مبيعات وتحصيل (Sales)",
  "إنستاباي (InstaPay)",
  "فودافون كاش (Vodafone Cash)",
  "كاش يدوي (Direct Cash)",
  "رأس مال إضافي (Capital Injection)",
  "أخرى (Other)",
];

export default function HowMuchPage() {
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Settings & Initial
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [editingAmmarInit, setEditingAmmarInit] = useState(false);
  const [ammarInitInput, setAmmarInitInput] = useState("0");
  const [editingMohamedInit, setEditingMohamedInit] = useState(false);
  const [mohamedInitInput, setMohamedInitInput] = useState("0");

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Synced store data
  const [storeOrdersDeliveredTotal, setStoreOrdersDeliveredTotal] = useState(0);
  const [storeExpensesTotal, setStoreExpensesTotal] = useState(0);
  const [storeExpensesList, setStoreExpensesList] = useState<any[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<"all" | "ammar" | "mohamed" | "transfers">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "this_month" | "last_month">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsAmmar, setShowDetailsAmmar] = useState(false);
  const [showDetailsMohamed, setShowDetailsMohamed] = useState(false);

  // Add form state
  const [formPerson, setFormPerson] = useState<"ammar" | "mohamed">("ammar");
  const [formType, setFormType] = useState<"income" | "expense" | "transfer">("income");
  const [formAmount, setFormAmount] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState(INCOME_CATEGORIES[0]);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    let isDbWorking = false;

    // 1. Try fetching settings from Supabase
    try {
      const { data: settsData, error: settsErr } = await supabase
        .from("how_much_settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();

      if (!settsErr && settsData) {
        const loadedSettings: Settings = {
          ammar_initial_balance: Number(settsData.ammar_initial_balance || 0),
          mohamed_initial_balance: Number(settsData.mohamed_initial_balance || 0),
          auto_sync_orders: Boolean(settsData.auto_sync_orders ?? false),
          auto_sync_expenses: Boolean(settsData.auto_sync_expenses ?? false),
        };
        setSettings(loadedSettings);
        setAmmarInitInput(String(loadedSettings.ammar_initial_balance));
        setMohamedInitInput(String(loadedSettings.mohamed_initial_balance));
        localStorage.setItem("how_much_settings", JSON.stringify(loadedSettings));
        isDbWorking = true;
      } else {
        // Fallback to localStorage for settings
        const localSetts = localStorage.getItem("how_much_settings");
        if (localSetts) {
          try {
            const parsed = JSON.parse(localSetts);
            setSettings({
              ammar_initial_balance: Number(parsed.ammar_initial_balance || 0),
              mohamed_initial_balance: Number(parsed.mohamed_initial_balance || 0),
              auto_sync_orders: Boolean(parsed.auto_sync_orders ?? false),
              auto_sync_expenses: Boolean(parsed.auto_sync_expenses ?? false),
            });
            setAmmarInitInput(String(parsed.ammar_initial_balance || 0));
            setMohamedInitInput(String(parsed.mohamed_initial_balance || 0));
          } catch {}
        }
      }
    } catch {
      // LocalStorage fallback
      const localSetts = localStorage.getItem("how_much_settings");
      if (localSetts) {
        try {
          const parsed = JSON.parse(localSetts);
          setSettings({
            ammar_initial_balance: Number(parsed.ammar_initial_balance || 0),
            mohamed_initial_balance: Number(parsed.mohamed_initial_balance || 0),
            auto_sync_orders: Boolean(parsed.auto_sync_orders ?? false),
            auto_sync_expenses: Boolean(parsed.auto_sync_expenses ?? false),
          });
          setAmmarInitInput(String(parsed.ammar_initial_balance || 0));
          setMohamedInitInput(String(parsed.mohamed_initial_balance || 0));
        } catch {}
      }
    }

    // 2. Try fetching transactions from Supabase
    try {
      const { data: txData, error: txErr } = await supabase
        .from("how_much_transactions")
        .select("*")
        .order("date", { ascending: false });

      if (!txErr && txData) {
        setTransactions(txData);
        isDbWorking = true;
      } else {
        const localTx = localStorage.getItem("how_much_transactions");
        if (localTx) {
          try {
            setTransactions(JSON.parse(localTx));
          } catch {}
        }
      }
    } catch {
      const localTx = localStorage.getItem("how_much_transactions");
      if (localTx) {
        try {
          setTransactions(JSON.parse(localTx));
        } catch {}
      }
    }

    setDbConnected(isDbWorking);

    // 3. Sync Store Orders & Expenses
    try {
      const [ordersRes, expensesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, total, status, payment_collected, created_at"),
        supabase
          .from("expenses")
          .select("id, amount, category, description, date"),
      ]);

      if (ordersRes.data) {
        // Calculate delivered/collected revenue
        const collectedTotal = ordersRes.data
          .filter((o: any) => o.status === "delivered" || o.payment_collected === true)
          .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
        setStoreOrdersDeliveredTotal(collectedTotal);
      }

      if (expensesRes.data) {
        const expTotal = expensesRes.data.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
        setStoreExpensesTotal(expTotal);
        setStoreExpensesList(expensesRes.data);
      }
    } catch (e) {
      console.warn("Could not load external store metrics:", e);
    }

    setLoading(false);
  };

  // Save Settings helper
  const saveSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem("how_much_settings", JSON.stringify(newSettings));

    try {
      const { error } = await supabase
        .from("how_much_settings")
        .upsert({
          id: "default",
          ...newSettings,
          updated_at: new Date().toISOString(),
        });
      if (!error) setDbConnected(true);
    } catch {}
  };

  // Add Transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(formAmount);
    if (!val || isNaN(val) || val <= 0) {
      alert("يرجى إدخال مبلغ صحيح");
      return;
    }
    if (!formTitle.trim()) {
      alert("يرجى كتابة بيان المعاملة");
      return;
    }

    setIsSubmitting(true);
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      person: formType === "transfer" ? "ammar" : formPerson,
      type: formType,
      amount: val,
      title: formTitle.trim(),
      category: formCategory,
      date: formDate || new Date().toISOString().split("T")[0],
      notes: formNotes.trim(),
      created_at: new Date().toISOString(),
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    localStorage.setItem("how_much_transactions", JSON.stringify(updated));

    try {
      const { error } = await supabase.from("how_much_transactions").insert(newTx);
      if (!error) setDbConnected(true);
    } catch {}

    // Reset Form
    setIsSubmitting(false);
    setShowAddModal(false);
    setFormAmount("");
    setFormTitle("");
    setFormNotes("");
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المعاملة؟")) return;

    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    localStorage.setItem("how_much_transactions", JSON.stringify(updated));

    try {
      await supabase.from("how_much_transactions").delete().eq("id", id);
    } catch {}
  };

  // Save Ammar Initial Balance
  const handleSaveAmmarInit = () => {
    const val = Number(ammarInitInput);
    if (isNaN(val)) return;
    saveSettings({ ...settings, ammar_initial_balance: val });
    setEditingAmmarInit(false);
  };

  // Save Mohamed Initial Balance
  const handleSaveMohamedInit = () => {
    const val = Number(mohamedInitInput);
    if (isNaN(val)) return;
    saveSettings({ ...settings, mohamed_initial_balance: val });
    setEditingMohamedInit(false);
  };

  // Reset Balances to Zero
  const handleResetToZero = async () => {
    if (!confirm("هل تريد تأكيد تصفير رصيد عمار ورصيد محمد إلى 0 ج.م؟ (لن يتم حذف المعاملات المسجلة)")) return;
    const newSettings: Settings = {
      ammar_initial_balance: 0,
      mohamed_initial_balance: 0,
      auto_sync_orders: false,
      auto_sync_expenses: false,
    };
    setAmmarInitInput("0");
    setMohamedInitInput("0");
    await saveSettings(newSettings);
  };

  // Filtered transactions calculation
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Tab filter
      if (activeTab === "ammar" && t.person !== "ammar") return false;
      if (activeTab === "mohamed" && t.person !== "mohamed") return false;
      if (activeTab === "transfers" && t.type !== "transfer") return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCategory = (t.category || "").toLowerCase().includes(q);
        const matchesNotes = (t.notes || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesNotes) return false;
      }

      // Date filter
      if (dateFilter === "this_month") {
        const now = new Date();
        const txDate = new Date(t.date);
        if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (dateFilter === "last_month") {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const txDate = new Date(t.date);
        if (txDate.getMonth() !== lastMonth.getMonth() || txDate.getFullYear() !== lastMonth.getFullYear()) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, activeTab, searchQuery, dateFilter]);

  // Financial Calculations:
  // 1. Ammar Calculations (يبدأ من صفر + يضيف كل اللي جاله - التحويلات لمحمد)
  const ammarManualInflows = transactions
    .filter((t) => t.person === "ammar" && t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const ammarManualExpenses = transactions
    .filter((t) => t.person === "ammar" && t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const ammarDeliveredRevenue = settings.auto_sync_orders ? storeOrdersDeliveredTotal : 0;
  const ammarTotalInflows = ammarManualInflows + ammarDeliveredRevenue;

  // Transfers from Ammar to Mohamed
  const transfersAmmarToMohamed = transactions
    .filter((t) => t.type === "transfer")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Ammar Remaining Balance: Initial (0) + All Inflows - Transferred to Mohamed - Ammar Expenses
  const ammarNetBalance = settings.ammar_initial_balance + ammarTotalInflows - transfersAmmarToMohamed - ammarManualExpenses;

  // 2. Mohamed Calculations (يبدأ من صفر + المستلم من عمار - ينقص منه كل ما يصرف)
  const mohamedManualExpenses = transactions
    .filter((t) => t.person === "mohamed" && t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const mohamedManualInflows = transactions
    .filter((t) => t.person === "mohamed" && t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const mohamedStoreExpenses = settings.auto_sync_expenses ? storeExpensesTotal : 0;
  const mohamedTotalSpent = mohamedManualExpenses + mohamedStoreExpenses;

  // Mohamed Total Capital Received = Initial with Mohamed (0) + Transfers from Ammar + Mohamed direct income
  const mohamedTotalReceived = settings.mohamed_initial_balance + transfersAmmarToMohamed + mohamedManualInflows;

  // Mohamed Remaining Balance: Total Received - Total Spent
  // (لو صفر وصرف مبلغ، هيكون بالسالب - عجز عهدة أو منصرف من جيبه)
  const mohamedNetBalance = mohamedTotalReceived - mohamedTotalSpent;

  // Total Business Net Cash = Ammar remaining + Mohamed remaining
  const totalBusinessLiquidity = ammarNetBalance + mohamedNetBalance;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["التاريخ", "الطرف", "النوع", "البيان", "التصنيف", "المبلغ", "ملاحظات"];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.person === "ammar" ? "عمار" : "محمد",
      t.type === "income" ? "إيراد" : t.type === "expense" ? "مصروف" : "تحويل",
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.category || "").replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `how-much-treasury-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySqlCode = () => {
    const sql = `-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS how_much_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  ammar_initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  mohamed_initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  auto_sync_orders BOOLEAN NOT NULL DEFAULT false,
  auto_sync_expenses BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO how_much_settings (id, ammar_initial_balance, mohamed_initial_balance, auto_sync_orders, auto_sync_expenses)
VALUES ('default', 0, 0, false, false)
ON CONFLICT (id) DO UPDATE SET
  ammar_initial_balance = EXCLUDED.ammar_initial_balance,
  mohamed_initial_balance = EXCLUDED.mohamed_initial_balance,
  auto_sync_orders = EXCLUDED.auto_sync_orders,
  auto_sync_expenses = EXCLUDED.auto_sync_expenses;

CREATE TABLE IF NOT EXISTS how_much_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  person TEXT NOT NULL CHECK (person IN ('ammar', 'mohamed')),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE how_much_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE how_much_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon full access settings" ON how_much_settings;
DROP POLICY IF EXISTS "Anon full access transactions" ON how_much_transactions;
CREATE POLICY "Anon full access settings" ON how_much_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access transactions" ON how_much_transactions FOR ALL TO anon USING (true) WITH CHECK (true);
`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 text-zinc-100 font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 rounded-xl text-amber-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                نظام الخزينة والشراكة — How Much
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                تتبع خزينة الشركاء: عمار (إيرادات وتحصيلات) ومحمد (مصروفات وعهد تشغيلية)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* DB Status Badge */}
          <button
            onClick={() => setShowSqlModal(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              dbConnected
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30"
                : "bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/30"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                dbConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span>{dbConnected ? "قاعدة البيانات متصلة ومزامنة" : "حفظ محلي (اضغط للربط بالسيرفر)"}</span>
          </button>

          <button
            onClick={loadAllData}
            title="تحديث البيانات"
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handleResetToZero}
            title="تصفير الأرصدة المبدئية لعمار ومحمد إلى 0 ج.م"
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>تصفير للصفر (0)</span>
          </button>

          <button
            onClick={() => {
              setFormPerson("ammar");
              setFormType("income");
              setFormCategory(INCOME_CATEGORIES[0]);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل معاملة جديدة</span>
          </button>
        </div>
      </div>

      {/* Main KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Liquidity */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              السيولة الكلية المتبقية (Total Liquidity)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              عمار + محمد
            </span>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {totalBusinessLiquidity.toLocaleString("ar-EG")} <span className="text-sm font-normal text-zinc-400">ج.م</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>رصيد عمار: <strong className="text-emerald-400">{ammarNetBalance.toLocaleString("ar-EG")} ج.م</strong></span>
            <span>رصيد محمد: <strong className="text-rose-400">{mohamedNetBalance.toLocaleString("ar-EG")} ج.م</strong></span>
          </div>
        </div>

        {/* Ammar Quick Stat */}
        <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              صافي خزينة عمار المتاحة
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              الوارد والتحصيل
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-300 tracking-tight">
            {ammarNetBalance.toLocaleString("ar-EG")} <span className="text-sm font-normal text-zinc-400">ج.م</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>المبدئي: <strong className="text-zinc-200">{settings.ammar_initial_balance.toLocaleString("ar-EG")} ج.م</strong></span>
            <span>إجمالي الوارد: <strong className="text-emerald-400">+{ammarTotalInflows.toLocaleString("ar-EG")} ج.م</strong></span>
          </div>
        </div>

        {/* Mohamed Quick Stat */}
        <div className="bg-zinc-900/90 border border-rose-500/30 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" />
              صافي عهدة محمد المتبقية
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
              المصروفات والتشغيل
            </span>
          </div>
          <div className="text-3xl font-black text-rose-300 tracking-tight">
            {mohamedNetBalance.toLocaleString("ar-EG")} <span className="text-sm font-normal text-zinc-400">ج.م</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>العهدة المستلمة: <strong className="text-zinc-200">{mohamedTotalReceived.toLocaleString("ar-EG")} ج.م</strong></span>
            <span>إجمالي المنصرف: <strong className="text-rose-400">-{mohamedTotalSpent.toLocaleString("ar-EG")} ج.م</strong></span>
          </div>
        </div>
      </div>

      {/* Sync Preferences & Toggles bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span>المزامنة التلقائية مع بيانات المتجر (اختياري - افتراضياً مغلقة للبدء من 0):</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white">
            <input
              type="checkbox"
              checked={settings.auto_sync_orders}
              onChange={(e) => saveSettings({ ...settings, auto_sync_orders: e.target.checked })}
              className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0 focus:ring-offset-0"
            />
            <span>مزامنة إيرادات الأوردرات المسلمة لعمار (+{storeOrdersDeliveredTotal.toLocaleString("ar-EG")} ج.م)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white">
            <input
              type="checkbox"
              checked={settings.auto_sync_expenses}
              onChange={(e) => saveSettings({ ...settings, auto_sync_expenses: e.target.checked })}
              className="rounded bg-zinc-800 border-zinc-700 text-rose-500 focus:ring-0 focus:ring-offset-0"
            />
            <span>مزامنة جدول المصروفات تلقائياً لمحمد (-{storeExpensesTotal.toLocaleString("ar-EG")} ج.م)</span>
          </label>
        </div>
      </div>

      {/* TWO MAIN SECTIONS: AMMAR & MOHAMED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============================================================ */}
        {/* PART 1: AMMAR SECTION (الوارد والتحصيل)                       */}
        {/* ============================================================ */}
        <div className="bg-zinc-900/90 border border-emerald-500/20 rounded-2xl p-6 shadow-xl relative flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg">
                  ع
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    خزينة عمار (Ammar)
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      يبدأ من 0 + بيجيله بس
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">يبدأ من 0 ج.م + يضيف كل المبالغ والتحصيلات اللي جاتله - التحويلات لمحمد</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFormPerson("ammar");
                    setFormType("transfer");
                    setFormCategory("تحويل عهدة لمحمد");
                    setFormTitle("تحويل عهدة مصاريف لمحمد");
                    setShowAddModal(true);
                  }}
                  className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  title="تحويل فلوس لمحمد ليصرف منها"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>تحويل لمحمد</span>
                </button>

                <button
                  onClick={() => {
                    setFormPerson("ammar");
                    setFormType("income");
                    setFormCategory(INCOME_CATEGORIES[0]);
                    setFormTitle("");
                    setShowAddModal(true);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إيراد</span>
                </button>
              </div>
            </div>

            {/* Ammar Stats Breakdown */}
            <div className="grid grid-cols-2 gap-3 my-5">
              {/* 1. Initial Balance */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>معاه كام في الأول:</span>
                  {!editingAmmarInit && (
                    <button
                      onClick={() => setEditingAmmarInit(true)}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      تعديل
                    </button>
                  )}
                </div>
                {editingAmmarInit ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="number"
                      value={ammarInitInput}
                      onChange={(e) => setAmmarInitInput(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none"
                    />
                    <button
                      onClick={handleSaveAmmarInit}
                      className="px-2 py-1 bg-emerald-600 text-white rounded text-xs"
                    >
                      حفظ
                    </button>
                  </div>
                ) : (
                  <div className="text-xl font-bold text-white">
                    {settings.ammar_initial_balance.toLocaleString("ar-EG")}{" "}
                    <span className="text-xs font-normal text-zinc-400">ج.م</span>
                  </div>
                )}
              </div>

              {/* 2. Total Inflows (جاله كام) */}
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="text-emerald-400 text-xs mb-1 font-semibold flex items-center justify-between">
                  <span>جاله كام (إجمالي الوارد):</span>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 rounded">وارد</span>
                </div>
                <div className="text-xl font-bold text-emerald-300">
                  +{ammarTotalInflows.toLocaleString("ar-EG")}{" "}
                  <span className="text-xs font-normal text-zinc-400">ج.م</span>
                </div>
              </div>

              {/* 3. Transfers to Mohamed */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div className="text-amber-400 text-xs mb-1 font-semibold flex items-center justify-between">
                  <span>المحوّل لمحمد (عهدة):</span>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-amber-300">
                  -{transfersAmmarToMohamed.toLocaleString("ar-EG")}{" "}
                  <span className="text-xs font-normal text-zinc-400">ج.م</span>
                </div>
              </div>

              {/* 4. Net Available */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-emerald-500/40">
                <div className="text-zinc-300 text-xs mb-1 font-semibold flex items-center justify-between">
                  <span>الصافي المتبقي مع عمار:</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xl font-black text-emerald-400">
                  {ammarNetBalance.toLocaleString("ar-EG")}{" "}
                  <span className="text-xs font-normal text-zinc-400">ج.م</span>
                </div>
              </div>
            </div>

            {/* Inflow Details accordion */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
              <button
                onClick={() => setShowDetailsAmmar(!showDetailsAmmar)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition"
              >
                <span>تفاصيل مصادر دخل عمار</span>
                <span className="flex items-center gap-1 text-zinc-500">
                  {showDetailsAmmar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {showDetailsAmmar && (
                <div className="p-4 border-t border-zinc-800/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-800/40 text-zinc-400">
                    <span>مبيعات مسلّمة ومحصّلة من المتجر (Orders):</span>
                    <strong className="text-emerald-400">
                      {settings.auto_sync_orders ? `+${storeOrdersDeliveredTotal.toLocaleString("ar-EG")} ج.م` : "معطلة"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-zinc-800/40 text-zinc-400">
                    <span>تحصيلات وإيرادات إضافية يدوية:</span>
                    <strong className="text-emerald-400">+{ammarManualInflows.toLocaleString("ar-EG")} ج.م</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 text-zinc-400">
                    <span>تحويلات نقدية إلى محمد:</span>
                    <strong className="text-amber-400">-{transfersAmmarToMohamed.toLocaleString("ar-EG")} ج.م</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
            <span>القاعدة: عمار بيجيله الفلوس وبيدير الخزينة المركزية</span>
            <span className="text-emerald-400 font-semibold">{transactions.filter(t => t.person === "ammar" || t.type === "transfer").length} عملية مسجلة</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PART 2: MOHAMED SECTION (المصروفات والصرف)                   */}
        {/* ============================================================ */}
        <div className="bg-zinc-900/90 border border-rose-500/20 rounded-2xl p-6 shadow-xl relative flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black text-lg">
                  م
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    خزينة محمد (Mohamed)
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      يبدأ من 0 - بينقص منه كل ما يصرف
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">يبدأ من 0 ج.م + المستلم كعهدة من عمار - ينقص منه كل حاجة صرفها</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFormPerson("mohamed");
                    setFormType("expense");
                    setFormCategory(EXPENSE_CATEGORIES[0]);
                    setFormTitle("");
                    setShowAddModal(true);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ تسجيل مصروف</span>
                </button>
              </div>
            </div>

            {/* Mohamed Stats Breakdown */}
            <div className="grid grid-cols-2 gap-3 my-5">
              {/* 1. Initial Balance with Mohamed */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>معاه كام في الأول:</span>
                  {!editingMohamedInit && (
                    <button
                      onClick={() => setEditingMohamedInit(true)}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      تعديل
                    </button>
                  )}
                </div>
                {editingMohamedInit ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="number"
                      value={mohamedInitInput}
                      onChange={(e) => setMohamedInitInput(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none"
                    />
                    <button
                      onClick={handleSaveMohamedInit}
                      className="px-2 py-1 bg-emerald-600 text-white rounded text-xs"
                    >
                      حفظ
                    </button>
                  </div>
                ) : (
                  <div className="text-xl font-bold text-white">
                    {settings.mohamed_initial_balance.toLocaleString("ar-EG")}{" "}
                    <span className="text-xs font-normal text-zinc-400">ج.م</span>
                  </div>
                )}
              </div>

              {/* 2. Received from Ammar */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div className="text-amber-400 text-xs mb-1 font-semibold flex items-center justify-between">
                  <span>مستلم من عمار (عهدة):</span>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-amber-300">
                  +{transfersAmmarToMohamed.toLocaleString("ar-EG")}{" "}
                  <span className="text-xs font-normal text-zinc-400">ج.م</span>
                </div>
              </div>

              {/* 3. Total Spent (صرف كام) */}
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
                <div className="text-rose-400 text-xs mb-1 font-semibold flex items-center justify-between">
                  <span>صرف كام (إجمالي المصروفات):</span>
                  <span className="text-[10px] text-rose-300 bg-rose-500/20 px-1.5 rounded">منصرف</span>
                </div>
                <div className="text-xl font-bold text-rose-300">
                  -{mohamedTotalSpent.toLocaleString("ar-EG")}{" "}
                  <span className="text-xs font-normal text-zinc-400">ج.م</span>
                </div>
              </div>

              {/* 4. Mohamed Remaining Balance */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-rose-500/40">
                <div className="text-zinc-300 text-xs mb-1 font-semibold flex items-center justify-between">
                  <span>الصافي المتبقي مع محمد:</span>
                  <span className={`text-xs font-bold ${mohamedNetBalance > 0 ? "text-emerald-400" : mohamedNetBalance === 0 ? "text-zinc-400" : "text-rose-400"}`}>
                    {mohamedNetBalance > 0 ? "متبقي معه من العهدة" : mohamedNetBalance === 0 ? "متزن (0 ج.م)" : "منصرف من جيبه / عجز عهدة"}
                  </span>
                </div>
                <div className={`text-xl font-black ${mohamedNetBalance > 0 ? "text-emerald-400" : mohamedNetBalance === 0 ? "text-zinc-200" : "text-rose-400"}`}>
                  {mohamedNetBalance.toLocaleString("ar-EG")}{" "}
                  <span className="text-xs font-normal text-zinc-400">ج.م</span>
                </div>
              </div>
            </div>

            {/* Spent Details Accordion */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
              <button
                onClick={() => setShowDetailsMohamed(!showDetailsMohamed)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition"
              >
                <span>تفاصيل مصروفات محمد</span>
                <span className="flex items-center gap-1 text-zinc-500">
                  {showDetailsMohamed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {showDetailsMohamed && (
                <div className="p-4 border-t border-zinc-800/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-800/40 text-zinc-400">
                    <span>مصروفات مسجلة في المتجر (Expenses):</span>
                    <strong className="text-rose-400">
                      {settings.auto_sync_expenses ? `-${storeExpensesTotal.toLocaleString("ar-EG")} ج.م` : "معطلة"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-zinc-800/40 text-zinc-400">
                    <span>مصروفات إضافية يدوية سجلها محمد:</span>
                    <strong className="text-rose-400">-{mohamedManualExpenses.toLocaleString("ar-EG")} ج.م</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 text-zinc-400">
                    <span>إجمالي العهدة المتاحة تحت تصرفه:</span>
                    <strong className="text-zinc-200">{mohamedTotalReceived.toLocaleString("ar-EG")} ج.م</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
            <span>القاعدة: محمد بيستلم عهد ويصرف على الإنتاج والمشتريات</span>
            <span className="text-rose-400 font-semibold">{transactions.filter(t => t.person === "mohamed").length} عملية مسجلة</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PART 3: TRANSACTIONS LEDGER (سجل المعاملات والتحويلات)         */}
      {/* ============================================================ */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">سجل المعاملات:</span>

            {/* Filter Tabs */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                الكل ({transactions.length})
              </button>
              <button
                onClick={() => setActiveTab("ammar")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === "ammar" ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                عمار (إيرادات)
              </button>
              <button
                onClick={() => setActiveTab("mohamed")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === "mohamed" ? "bg-rose-600/30 text-rose-300 border border-rose-500/40" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                محمد (مصروفات)
              </button>
              <button
                onClick={() => setActiveTab("transfers")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === "transfers" ? "bg-amber-600/30 text-amber-300 border border-amber-500/40" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                التحويلات ({transactions.filter(t => t.type === "transfer").length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث في البيان أو التصنيف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 w-44 md:w-56"
              />
            </div>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="all">كل الفترات</option>
              <option value="this_month">هذا الشهر</option>
              <option value="last_month">الشهر الماضي</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Wallet className="w-10 h-10 mx-auto text-zinc-600 mb-2 opacity-40" />
              <p className="text-sm font-semibold">لا توجد معاملات مسجلة تطابق التصفية</p>
              <p className="text-xs text-zinc-600 mt-1">اضغط على زر &quot;تسجيل معاملة جديدة&quot; للبدء</p>
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase text-[11px]">
                  <th className="pb-3 px-3">التاريخ</th>
                  <th className="pb-3 px-3">الطرف</th>
                  <th className="pb-3 px-3">النوع</th>
                  <th className="pb-3 px-3">البيان والوصف</th>
                  <th className="pb-3 px-3">التصنيف</th>
                  <th className="pb-3 px-3 text-left">المبلغ</th>
                  <th className="pb-3 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredTransactions.map((tx) => {
                  const isAmmar = tx.person === "ammar";
                  const isTransfer = tx.type === "transfer";
                  const isIncome = tx.type === "income";

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-800/30 transition group">
                      <td className="py-3 px-3 text-zinc-400 whitespace-nowrap font-mono">
                        {tx.date}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isTransfer ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            عمار <ArrowRightLeft className="w-2.5 h-2.5" /> محمد
                          </span>
                        ) : isAmmar ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            عمار
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                            محمد
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isTransfer ? (
                          <span className="text-amber-400 font-semibold">تحويل عهدة</span>
                        ) : isIncome ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> وارد
                          </span>
                        ) : (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> منصرف
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{tx.title}</div>
                        {tx.notes && <div className="text-[11px] text-zinc-500 mt-0.5">{tx.notes}</div>}
                      </td>

                      <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                        <span className="bg-zinc-800/80 px-2 py-0.5 rounded text-[11px]">
                          {tx.category || "عام"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-left whitespace-nowrap font-bold text-sm font-mono">
                        {isTransfer ? (
                          <span className="text-amber-400">
                            {Number(tx.amount).toLocaleString("ar-EG")} ج.م
                          </span>
                        ) : isIncome ? (
                          <span className="text-emerald-400">
                            +{Number(tx.amount).toLocaleString("ar-EG")} ج.م
                          </span>
                        ) : (
                          <span className="text-rose-400">
                            -{Number(tx.amount).toLocaleString("ar-EG")} ج.م
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          title="حذف المعاملة"
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: ADD TRANSACTION                                      */}
      {/* ============================================================ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                تسجيل معاملة جديدة
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-5 space-y-4 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">نوع المعاملة:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("income");
                      setFormPerson("ammar");
                      setFormCategory(INCOME_CATEGORIES[0]);
                    }}
                    className={`py-2 px-2 rounded-lg font-bold border transition text-center ${
                      formType === "income"
                        ? "bg-emerald-600/30 border-emerald-500 text-emerald-300"
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    إيراد لعمار 🟢
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType("expense");
                      setFormPerson("mohamed");
                      setFormCategory(EXPENSE_CATEGORIES[0]);
                    }}
                    className={`py-2 px-2 rounded-lg font-bold border transition text-center ${
                      formType === "expense"
                        ? "bg-rose-600/30 border-rose-500 text-rose-300"
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    مصروف لمحمد 🔴
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType("transfer");
                      setFormPerson("ammar");
                      setFormCategory("تحويل عهدة لمحمد");
                    }}
                    className={`py-2 px-2 rounded-lg font-bold border transition text-center ${
                      formType === "transfer"
                        ? "bg-amber-600/30 border-amber-500 text-amber-300"
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    تحويل لمحمد 🔄
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">المبلغ (جنيه مصري):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="مثال: 5000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute left-3 top-2.5 text-zinc-500 font-semibold">ج.م</span>
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">بيان المعاملة:</label>
                <input
                  type="text"
                  required
                  placeholder={
                    formType === "transfer"
                      ? "مثال: تحويل عهدة شراء قماش لشهر مارس"
                      : formType === "income"
                      ? "مثال: تحصيل كاش دفعة إضافية"
                      : "مثال: مصاريف طباعة وتطريز دفعة جديدة"
                  }
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Category */}
              {formType !== "transfer" && (
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">التصنيف:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {(formType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">التاريخ:</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">ملاحظات (اختياري):</label>
                <textarea
                  rows={2}
                  placeholder="أي تفاصيل أو ملاحظات إضافية..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-semibold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-lg shadow-amber-900/30 transition disabled:opacity-50"
                >
                  {isSubmitting ? "جاري الحفظ..." : "حفظ المعاملة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SQL SCHEMA HELPER                                     */}
      {/* ============================================================ */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                حالة الاتصال وقاعدة البيانات
              </h3>
              <button onClick={() => setShowSqlModal(false)} className="text-zinc-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-zinc-300 leading-relaxed">
                السيستم يعمل حالياً ويحفظ البيانات محلياً على جهازك. لمزامنة الخزينة بين كل الأجهزة وربطها بـ Supabase، يمكنك نسخ كود الـ SQL التالي وتشغيله في <strong>Supabase SQL Editor</strong>:
              </p>

              <div className="relative">
                <pre className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300 max-h-48 overflow-y-auto">
{`-- VILTRUM HOW MUCH SCHEMA
CREATE TABLE IF NOT EXISTS how_much_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  ammar_initial_balance NUMERIC(12,2) DEFAULT 0,
  mohamed_initial_balance NUMERIC(12,2) DEFAULT 0,
  auto_sync_orders BOOLEAN DEFAULT false,
  auto_sync_expenses BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO how_much_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS how_much_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  person TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}
                </pre>
                <button
                  onClick={copySqlCode}
                  className="absolute top-2 left-2 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 flex items-center gap-1 text-[10px]"
                >
                  {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSql ? "تم النسخ!" : "نسخ الكود"}</span>
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
