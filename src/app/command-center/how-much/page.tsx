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
  Minus,
  Trash2,
  Download,
  RefreshCw,
  Search,
  RotateCcw,
  Check,
  Layers,
  Printer,
  FileSpreadsheet,
  X,
  FileText,
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
  auto_sync_orders?: boolean;
  auto_sync_expenses?: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  ammar_initial_balance: 0,
  mohamed_initial_balance: 0,
  auto_sync_orders: false,
  auto_sync_expenses: false,
};

const AMMAR_CATEGORIES = [
  "Sales & Delivery Collections",
  "InstaPay Transfer",
  "Vodafone Cash",
  "Direct Cash Inflow",
  "Capital Injection",
  "Direct Expense / Spent by Ammar (-)",
  "Partner Withdrawal (-)",
  "Other Income / Adjustment",
];

const MOHAMED_EXPENSE_CATEGORIES = [
  "Fabric & Materials",
  "Printing & Embroidery",
  "Patterns & Samples",
  "Production & Sewing",
  "Marketing & Ads",
  "Packaging & Bags",
  "Shipping & Logistics",
  "Operations & Supplies",
  "Other Expense",
];

const MOHAMED_INCOME_CATEGORIES = [
  "Custody Received (+)",
  "Direct Client Payment (+)",
  "Supplier Refund (+)",
  "Capital Injection (+)",
  "Direct Expense by Mohamed (-)",
  "Other Inflow (+)",
];

export default function HowMuchPage() {
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);

  // Settings
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Direct Editable Balances
  const [ammarInput, setAmmarInput] = useState("0");
  const [mohamedInput, setMohamedInput] = useState("0");
  const [ammarSaved, setAmmarSaved] = useState(false);
  const [mohamedSaved, setMohamedSaved] = useState(false);
  const [isAmmarFocused, setIsAmmarFocused] = useState(false);
  const [isMohamedFocused, setIsMohamedFocused] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<"all" | "ammar" | "mohamed" | "transfers">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "this_month" | "last_month">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);

  // Add form state
  const [formPerson, setFormPerson] = useState<"ammar" | "mohamed">("ammar");
  const [formType, setFormType] = useState<"income" | "expense" | "transfer">("income");
  const [formAmount, setFormAmount] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState(AMMAR_CATEGORIES[0]);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    let isWorking = false;

    // 1. Fetch Settings
    try {
      const { data: settsData, error: settsErr } = await supabase
        .from("how_much_settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();

      if (!settsErr && settsData) {
        const loaded: Settings = {
          ammar_initial_balance: Number(settsData.ammar_initial_balance || 0),
          mohamed_initial_balance: Number(settsData.mohamed_initial_balance || 0),
          auto_sync_orders: false,
          auto_sync_expenses: false,
        };
        setSettings(loaded);
        localStorage.setItem("how_much_settings", JSON.stringify(loaded));
        isWorking = true;
      } else {
        const cached = localStorage.getItem("how_much_settings");
        if (cached) {
          const parsed = JSON.parse(cached);
          setSettings(parsed);
        }
      }
    } catch {
      const cached = localStorage.getItem("how_much_settings");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setSettings(parsed);
        } catch {}
      }
    }

    // 2. Fetch Transactions
    try {
      const { data: txData, error: txErr } = await supabase
        .from("how_much_transactions")
        .select("*")
        .order("date", { ascending: false });

      if (!txErr && txData) {
        setTransactions(txData);
        isWorking = true;
      } else {
        const cachedTx = localStorage.getItem("how_much_transactions");
        if (cachedTx) {
          setTransactions(JSON.parse(cachedTx));
        }
      }
    } catch {
      const cachedTx = localStorage.getItem("how_much_transactions");
      if (cachedTx) {
        try {
          setTransactions(JSON.parse(cachedTx));
        } catch {}
      }
    }

    setDbConnected(isWorking);
    setLoading(false);
  };

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

  // Calculations
  const ammarAdded = useMemo(() => {
    return transactions
      .filter((t) => t.person === "ammar" && t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const transfersToMohamed = useMemo(() => {
    return transactions
      .filter((t) => t.type === "transfer")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const ammarNet = settings.ammar_initial_balance + ammarAdded - transfersToMohamed;

  const mohamedAdded = useMemo(() => {
    return transactions
      .filter((t) => t.person === "mohamed" && t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const mohamedSpent = useMemo(() => {
    return transactions
      .filter((t) => t.person === "mohamed" && t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const mohamedReceived = settings.mohamed_initial_balance + transfersToMohamed + mohamedAdded;
  const mohamedNet = mohamedReceived - mohamedSpent;

  // Sync inputs with net calculations when user is not typing
  useEffect(() => {
    if (!isAmmarFocused) {
      setAmmarInput(String(ammarNet));
    }
  }, [ammarNet, isAmmarFocused]);

  useEffect(() => {
    if (!isMohamedFocused) {
      setMohamedInput(String(mohamedNet));
    }
  }, [mohamedNet, isMohamedFocused]);

  // Direct Balance Save Handlers
  const saveAmmarDirect = async (customVal?: string) => {
    const raw = customVal !== undefined ? customVal : ammarInput;
    const val = Number(raw);
    if (isNaN(val)) return;
    const newInitial = val - (ammarAdded - transfersToMohamed);
    await saveSettings({ ...settings, ammar_initial_balance: newInitial });
    setAmmarSaved(true);
    setTimeout(() => setAmmarSaved(false), 2000);
  };

  const saveMohamedDirect = async (customVal?: string) => {
    const raw = customVal !== undefined ? customVal : mohamedInput;
    const val = Number(raw);
    if (isNaN(val)) return;
    const newInitial = val - (transfersToMohamed + mohamedAdded - mohamedSpent);
    await saveSettings({ ...settings, mohamed_initial_balance: newInitial });
    setMohamedSaved(true);
    setTimeout(() => setMohamedSaved(false), 2000);
  };

  const handleResetToZero = async () => {
    if (!confirm("Reset both Ammar and Mohamed balances to 0 EGP?")) return;
    setAmmarInput("0");
    setMohamedInput("0");
    const newInitialAmmar = 0 - (ammarAdded - transfersToMohamed);
    const newInitialMohamed = 0 - (transfersToMohamed + mohamedAdded - mohamedSpent);
    await saveSettings({
      ammar_initial_balance: newInitialAmmar,
      mohamed_initial_balance: newInitialMohamed,
      auto_sync_orders: false,
      auto_sync_expenses: false,
    });
  };

  const handleOpenAdd = (action: "ammar_income" | "mohamed_income" | "mohamed_expense" | "transfer") => {
    if (action === "mohamed_income") {
      setFormPerson("mohamed");
      setFormType("income");
      setFormCategory(MOHAMED_INCOME_CATEGORIES[0]);
    } else if (action === "mohamed_expense") {
      setFormPerson("mohamed");
      setFormType("expense");
      setFormCategory(MOHAMED_EXPENSE_CATEGORIES[0]);
    } else if (action === "transfer") {
      setFormPerson("ammar");
      setFormType("transfer");
      setFormCategory("Treasury Transfer");
    } else {
      setFormPerson("ammar");
      setFormType("income");
      setFormCategory(AMMAR_CATEGORIES[0]);
    }
    setFormTitle("");
    setFormAmount("");
    setFormNotes("");
    setShowAddModal(true);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(formAmount);
    if (isNaN(val) || val === 0) {
      alert("Please enter a valid non-zero amount.");
      return;
    }
    if (!formTitle.trim()) {
      alert("Please enter a description.");
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

    setIsSubmitting(false);
    setShowAddModal(false);
    setFormAmount("");
    setFormTitle("");
    setFormNotes("");
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    localStorage.setItem("how_much_transactions", JSON.stringify(updated));

    try {
      await supabase.from("how_much_transactions").delete().eq("id", id);
    } catch {}
  };

  // Total Liquidity (reacts immediately to input changes)
  const currentAmmarDisplay = isAmmarFocused ? Number(ammarInput || 0) : ammarNet;
  const currentMohamedDisplay = isMohamedFocused ? Number(mohamedInput || 0) : mohamedNet;
  const totalLiquidity = currentAmmarDisplay + currentMohamedDisplay;

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (activeTab === "ammar" && t.person !== "ammar") return false;
      if (activeTab === "mohamed" && t.person !== "mohamed") return false;
      if (activeTab === "transfers" && t.type !== "transfer") return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchCategory = (t.category || "").toLowerCase().includes(q);
        const matchNotes = (t.notes || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCategory && !matchNotes) return false;
      }

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

  // Executive CSV Export
  const handleExportCSV = () => {
    const dateStr = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const headers = [
      "Date",
      "Member",
      "Type",
      "Description",
      "Category",
      "Inflow (+EGP)",
      "Outflow (-EGP)",
      "Net Amount (EGP)",
      "Notes",
    ];

    let totalIn = 0;
    let totalOut = 0;

    const dataRows = filteredTransactions.map((t) => {
      const amt = Number(t.amount || 0);
      const isOutflow = t.type === "expense" || (t.type === "income" && amt < 0);
      const absAmt = Math.abs(amt);

      if (t.type === "transfer") {
        // transfer: outflow from Ammar, inflow to Mohamed
      } else if (isOutflow) {
        totalOut += absAmt;
      } else {
        totalIn += absAmt;
      }

      const typeLabel =
        t.type === "transfer"
          ? "Transfer (Ammar -> Mohamed)"
          : isOutflow
          ? `${t.person === "ammar" ? "Ammar" : "Mohamed"} Outflow / Spent`
          : `${t.person === "ammar" ? "Ammar" : "Mohamed"} Inflow / Added`;

      return [
        t.date,
        t.person === "ammar" ? "Ammar" : "Mohamed",
        typeLabel,
        `"${String(t.title || "").replace(/"/g, '""')}"`,
        `"${String(t.category || "General").replace(/"/g, '""')}"`,
        isOutflow || t.type === "transfer" ? "" : absAmt,
        isOutflow ? absAmt : t.type === "transfer" ? absAmt : "",
        amt,
        `"${String(t.notes || "").replace(/"/g, '""')}"`,
      ];
    });

    const summaryBlock = [
      ["VILTRUM COMMAND CENTER — TREASURY FINANCIAL STATEMENT"],
      [`Generated At: ${dateStr}`],
      [`TOTAL BUSINESS BALANCE (LIQUIDITY): ${totalLiquidity.toLocaleString()} EGP`],
      [`Ammar Current Balance: ${currentAmmarDisplay.toLocaleString()} EGP`],
      [`Mohamed Current Balance: ${currentMohamedDisplay.toLocaleString()} EGP`],
      [""],
    ];

    const totalsRow = [
      "TOTALS",
      "",
      "",
      `Total Logged Entries: ${filteredTransactions.length}`,
      "",
      totalIn,
      totalOut,
      totalIn - totalOut,
      "",
    ];

    const csvContent =
      summaryBlock.map((r) => r.join(",")).join("\r\n") +
      "\r\n" +
      headers.map((h) => `"${h}"`).join(",") +
      "\r\n" +
      dataRows.map((r) => r.join(",")).join("\r\n") +
      "\r\n" +
      totalsRow.map((v) => `"${v}"`).join(",");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `viltrum_treasury_report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 text-zinc-100 font-sans" dir="ltr">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                How Much — Treasury
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Directly editable partner cash balances & live financial records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Badge */}
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
              dbConnected
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                : "bg-amber-950/40 border-amber-500/30 text-amber-300"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${dbConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span>{dbConnected ? "Cloud Synced" : "Local Storage"}</span>
          </div>

          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>

          <button
            onClick={handleResetToZero}
            title="Reset balances to 0"
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset (0)</span>
          </button>

          {/* Statement View / Print Modal */}
          <button
            onClick={() => setShowStatementModal(true)}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Statement (PDF)</span>
          </button>

          {/* Excel CSV Download */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => handleOpenAdd("ammar_income")}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Log Transaction</span>
          </button>
        </div>
      </div>

      {/* 3 Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:hidden">
        {/* Card 1: Total Liquidity */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                Total Business Balance
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                Ammar + Mohamed
              </span>
            </div>
            <div className="text-3xl font-black text-white tracking-tight font-mono py-1">
              {totalLiquidity.toLocaleString()} <span className="text-sm font-normal text-zinc-400 font-sans">EGP</span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              Combined live liquid capital currently held by both partners.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Ammar: <strong className="text-emerald-400 font-bold">{currentAmmarDisplay.toLocaleString()} EGP</strong></span>
            <span>Mohamed: <strong className={currentMohamedDisplay >= 0 ? "text-rose-300 font-bold" : "text-red-400 font-bold"}>{currentMohamedDisplay.toLocaleString()} EGP</strong></span>
          </div>
        </div>

        {/* Card 2: Ammar's Treasury (Direct Editable) */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Ammar&apos;s Balance
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenAdd("transfer")}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1 transition"
                  title="Transfer money to Mohamed"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Transfer</span>
                </button>
                <button
                  onClick={() => handleOpenAdd("ammar_income")}
                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1 transition"
                  title="Log incoming transaction"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Inflow</span>
                </button>
              </div>
            </div>

            {/* DIRECT EDITABLE INPUT */}
            <div className="my-2">
              <div className="flex items-center gap-2 bg-zinc-950/90 border border-zinc-800 hover:border-emerald-500/50 focus-within:border-emerald-500 rounded-xl px-3.5 py-2 transition shadow-inner">
                <input
                  type="number"
                  step="any"
                  value={ammarInput}
                  onFocus={() => setIsAmmarFocused(true)}
                  onChange={(e) => setAmmarInput(e.target.value)}
                  onBlur={() => {
                    setIsAmmarFocused(false);
                    saveAmmarDirect();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLElement).blur();
                    }
                  }}
                  placeholder="0"
                  className="w-full bg-transparent text-2xl md:text-3xl font-black text-emerald-300 font-mono tracking-tight focus:outline-none"
                />
                <span className="text-zinc-500 font-mono text-sm font-semibold">EGP</span>
                {ammarSaved ? (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap animate-in fade-in">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                ) : (
                  <button
                    onClick={() => saveAmmarDirect()}
                    className="text-[11px] font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded transition whitespace-nowrap"
                  >
                    Save
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center justify-between px-1">
                <span>Click & type to set your balance anytime</span>
                <span className="text-zinc-400 font-mono">Current Cash</span>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Logged Added: <strong className="text-emerald-400 font-semibold">+{ammarAdded.toLocaleString()}</strong></span>
            <span>Transferred: <strong className="text-amber-400 font-semibold">-{transfersToMohamed.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Card 3: Mohamed's Treasury (Direct Editable with + and -) */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-rose-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" />
                Mohamed&apos;s Balance
              </span>
              <div className="flex items-center gap-1.5">
                {/* Mohamed + Inflow Button */}
                <button
                  onClick={() => handleOpenAdd("mohamed_income")}
                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1 transition shadow-sm"
                  title="Add money directly to Mohamed"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Inflow</span>
                </button>

                {/* Mohamed - Expense Button */}
                <button
                  onClick={() => handleOpenAdd("mohamed_expense")}
                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1 transition shadow-sm"
                  title="Deduct spent expense"
                >
                  <Minus className="w-3 h-3" />
                  <span>- Expense</span>
                </button>
              </div>
            </div>

            {/* DIRECT EDITABLE INPUT */}
            <div className="my-2">
              <div className="flex items-center gap-2 bg-zinc-950/90 border border-zinc-800 hover:border-rose-500/50 focus-within:border-rose-500 rounded-xl px-3.5 py-2 transition shadow-inner">
                <input
                  type="number"
                  step="any"
                  value={mohamedInput}
                  onFocus={() => setIsMohamedFocused(true)}
                  onChange={(e) => setMohamedInput(e.target.value)}
                  onBlur={() => {
                    setIsMohamedFocused(false);
                    saveMohamedDirect();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLElement).blur();
                    }
                  }}
                  placeholder="0"
                  className={`w-full bg-transparent text-2xl md:text-3xl font-black font-mono tracking-tight focus:outline-none ${
                    Number(mohamedInput) >= 0 ? "text-rose-300" : "text-red-400"
                  }`}
                />
                <span className="text-zinc-500 font-mono text-sm font-semibold">EGP</span>
                {mohamedSaved ? (
                  <span className="text-[11px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap animate-in fade-in">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                ) : (
                  <button
                    onClick={() => saveMohamedDirect()}
                    className="text-[11px] font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded transition whitespace-nowrap"
                  >
                    Save
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center justify-between px-1">
                <span>Click & type to set Mohamed balance anytime</span>
                <span className="text-zinc-400 font-mono">Current Cash</span>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono flex-wrap gap-2">
            <span>Added (+): <strong className="text-emerald-400 font-semibold">+{mohamedAdded.toLocaleString()}</strong></span>
            <span>From Ammar: <strong className="text-amber-400 font-semibold">+{transfersToMohamed.toLocaleString()}</strong></span>
            <span>Spent (-): <strong className="text-rose-400 font-semibold">-{mohamedSpent.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* Transactions Ledger */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4 print:hidden">
        {/* Ledger Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              Transactions History Log
            </span>

            {/* Filter Tabs */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  activeTab === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                onClick={() => setActiveTab("ammar")}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  activeTab === "ammar"
                    ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Ammar Entries
              </button>
              <button
                onClick={() => setActiveTab("mohamed")}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  activeTab === "mohamed"
                    ? "bg-rose-600/30 text-rose-300 border border-rose-500/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Mohamed Entries
              </button>
              <button
                onClick={() => setActiveTab("transfers")}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  activeTab === "transfers"
                    ? "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Transfers ({transactions.filter((t) => t.type === "transfer").length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search description or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 w-52 md:w-64"
              />
            </div>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="all">All Dates</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Wallet className="w-10 h-10 mx-auto text-zinc-700 mb-2" />
              <p className="text-sm font-semibold text-zinc-400">No logged transactions found.</p>
              <p className="text-xs text-zinc-600 mt-1">You can set your balances directly above without logging entries.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Member</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Description</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {filteredTransactions.map((tx) => {
                  const isAmmar = tx.person === "ammar";
                  const isTransfer = tx.type === "transfer";
                  const isIncome = tx.type === "income";

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-800/30 transition group">
                      <td className="py-3 px-3 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                        {tx.date}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isTransfer ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 font-sans">
                            Ammar <ArrowRightLeft className="w-2.5 h-2.5" /> Mohamed
                          </span>
                        ) : isAmmar ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-sans">
                            Ammar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 font-sans">
                            Mohamed
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-semibold">
                        {isTransfer ? (
                          <span className="text-amber-400">Transfer</span>
                        ) : isIncome ? (
                          Number(tx.amount) < 0 ? (
                            <span className="text-rose-400 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" /> {tx.person === "ammar" ? "Ammar Spent" : "Mohamed Spent"}
                            </span>
                          ) : (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> Added Inflow
                            </span>
                          )
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> Deducted Expense
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{tx.title}</div>
                        {tx.notes && <div className="text-[11px] text-zinc-500 mt-0.5">{tx.notes}</div>}
                      </td>

                      <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[11px]">
                          {tx.category || "General"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-sm font-mono">
                        {isTransfer ? (
                          <span className="text-amber-400">
                            {Number(tx.amount).toLocaleString()} EGP
                          </span>
                        ) : isIncome ? (
                          Number(tx.amount) < 0 ? (
                            <span className="text-rose-400">
                              -{Math.abs(Number(tx.amount)).toLocaleString()} EGP
                            </span>
                          ) : (
                            <span className="text-emerald-400">
                              +{Number(tx.amount).toLocaleString()} EGP
                            </span>
                          )
                        ) : (
                          <span className="text-rose-400">
                            -{Math.abs(Number(tx.amount)).toLocaleString()} EGP
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          title="Delete Entry"
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition"
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

      {/* Modal: New Transaction */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                Record Transaction
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-5 space-y-4 text-xs">
              {/* Action Switcher: 4 Quick Actions */}
              <div>
                <label className="block text-zinc-400 mb-1.5 font-semibold">Select Action:</label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Ammar Inflow */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormPerson("ammar");
                      setFormType("income");
                      setFormCategory(AMMAR_CATEGORIES[0]);
                    }}
                    className={`py-2.5 px-2 rounded-xl font-bold border transition text-center flex items-center justify-center gap-1.5 ${
                      formPerson === "ammar" && formType === "income"
                        ? "bg-emerald-600/30 border-emerald-500 text-emerald-300"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ammar Inflow</span>
                  </button>

                  {/* Mohamed Inflow (+) */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormPerson("mohamed");
                      setFormType("income");
                      setFormCategory(MOHAMED_INCOME_CATEGORIES[0]);
                    }}
                    className={`py-2.5 px-2 rounded-xl font-bold border transition text-center flex items-center justify-center gap-1.5 ${
                      formPerson === "mohamed" && formType === "income"
                        ? "bg-emerald-600/30 border-emerald-500 text-emerald-300"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mohamed Inflow (+)</span>
                  </button>

                  {/* Mohamed Expense (-) */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormPerson("mohamed");
                      setFormType("expense");
                      setFormCategory(MOHAMED_EXPENSE_CATEGORIES[0]);
                    }}
                    className={`py-2.5 px-2 rounded-xl font-bold border transition text-center flex items-center justify-center gap-1.5 ${
                      formPerson === "mohamed" && formType === "expense"
                        ? "bg-rose-600/30 border-rose-500 text-rose-300"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5 text-rose-400" />
                    <span>Mohamed Expense (-)</span>
                  </button>

                  {/* Transfer Ammar -> Mohamed */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormPerson("ammar");
                      setFormType("transfer");
                      setFormCategory("Treasury Transfer");
                    }}
                    className={`py-2.5 px-2 rounded-xl font-bold border transition text-center flex items-center justify-center gap-1.5 ${
                      formType === "transfer"
                        ? "bg-amber-600/30 border-amber-500 text-amber-300"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>Transfer to Mohamed</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-zinc-400 mb-1.5 font-semibold">Amount (EGP):</label>
                <div className="relative flex items-center">
                  {/* +/- toggle for inflows */}
                  {formType === "income" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formAmount.startsWith("-")) {
                          setFormAmount(formAmount.replace("-", ""));
                        } else if (formAmount) {
                          setFormAmount("-" + formAmount);
                        } else {
                          setFormAmount("-");
                        }
                      }}
                      className={`px-3 py-2.5 rounded-l-xl text-xs font-bold border transition font-mono ${
                        formAmount.startsWith("-")
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      }`}
                      title="Click to toggle positive (+) or negative (-)"
                    >
                      {formAmount.startsWith("-") ? "-" : "+"}
                    </button>
                  )}
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder={formType === "income" ? "e.g. 5000 or -1500" : "e.g. 5000"}
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className={`w-full bg-zinc-950 border border-zinc-800 ${
                      formType === "income" ? "rounded-r-xl border-l-0" : "rounded-xl"
                    } px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500`}
                    autoFocus
                  />
                  <span className="absolute right-3.5 top-3 text-zinc-500 font-semibold text-xs pointer-events-none">
                    EGP
                  </span>
                </div>
                {formType === "income" && (
                  <p className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
                    <span>
                      Tip: Enter a negative amount (e.g. <strong className="text-rose-400">-1500</strong>) to deduct directly.
                    </span>
                    {formAmount.startsWith("-") && (
                      <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        Will be deducted (-)
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-zinc-400 mb-1.5 font-semibold">Description / Reason:</label>
                <input
                  type="text"
                  required
                  placeholder={
                    formType === "transfer"
                      ? "e.g. Custody transferred to Mohamed"
                      : formPerson === "ammar"
                      ? "e.g. Courier cash collection"
                      : formType === "income"
                      ? "e.g. Client deposit directly to Mohamed"
                      : "e.g. Fabric purchase deposit"
                  }
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Category */}
              {formType !== "transfer" && (
                <div>
                  <label className="block text-zinc-400 mb-1.5 font-semibold">Category:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {(formPerson === "ammar"
                      ? AMMAR_CATEGORIES
                      : formType === "income"
                      ? MOHAMED_INCOME_CATEGORIES
                      : MOHAMED_EXPENSE_CATEGORIES
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-zinc-400 mb-1.5 font-semibold">Date:</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-zinc-400 mb-1.5 font-semibold">Notes (Optional):</label>
                <textarea
                  rows={2}
                  placeholder="Additional reference, invoice #, receipt details..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-900/30 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Beautiful Financial Statement (Printable / PDF) */}
      {showStatementModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Top Bar (Hidden in Print) */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Executive Financial Statement</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel CSV</span>
                </button>
                <button
                  onClick={() => setShowStatementModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 text-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Statement Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-zinc-900 bg-white dark:bg-zinc-950 dark:text-zinc-100 print:p-0 print:m-0 font-sans">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 border-zinc-200 dark:border-zinc-800">
                <div>
                  <div className="text-xl font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    VILTRUM EGYPT
                  </div>
                  <h2 className="text-2xl font-black tracking-tight mt-1 text-zinc-900 dark:text-white">
                    Treasury & Partnership Statement
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Certified Partner Balance & Cash Ledger for Ammar & Mohamed
                  </p>
                </div>
                <div className="text-left sm:text-right text-xs space-y-1 font-mono text-zinc-600 dark:text-zinc-400">
                  <div>Date: <strong className="text-zinc-900 dark:text-white">{new Date().toISOString().split("T")[0]}</strong></div>
                  <div>Time: <strong className="text-zinc-900 dark:text-white">{new Date().toLocaleTimeString()}</strong></div>
                  <div className="text-[11px] text-zinc-500">Document #: VLT-HOWMUCH-{Date.now().toString().slice(-6)}</div>
                </div>
              </div>

              {/* Summary Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                    Total Business Liquidity
                  </div>
                  <div className="text-2xl font-black font-mono mt-1 text-zinc-900 dark:text-white">
                    {totalLiquidity.toLocaleString()} <span className="text-xs font-normal">EGP</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">Combined partner liquidity</div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                    Ammar Balance
                  </div>
                  <div className="text-2xl font-black font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                    {currentAmmarDisplay.toLocaleString()} <span className="text-xs font-normal">EGP</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Added: +{ammarAdded.toLocaleString()} | Transferred: -{transfersToMohamed.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-rose-600 dark:text-rose-400">
                    Mohamed Balance
                  </div>
                  <div className="text-2xl font-black font-mono mt-1 text-rose-600 dark:text-rose-400">
                    {currentMohamedDisplay.toLocaleString()} <span className="text-xs font-normal">EGP</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Added: +{mohamedAdded.toLocaleString()} | Spent: -{mohamedSpent.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Partner</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-sans">
                    {filteredTransactions.map((tx) => {
                      const isAmmar = tx.person === "ammar";
                      const isTransfer = tx.type === "transfer";
                      const isIncome = tx.type === "income";
                      const isNeg = Number(tx.amount) < 0;

                      return (
                        <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                          <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap text-zinc-500">
                            {tx.date}
                          </td>
                          <td className="py-2 px-3 font-semibold whitespace-nowrap">
                            {isTransfer ? "Ammar -> Mohamed" : isAmmar ? "Ammar" : "Mohamed"}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isTransfer
                              ? "Transfer"
                              : isIncome
                              ? isNeg
                                ? "Outflow / Spent"
                                : "Inflow / Added"
                              : "Expense / Outflow"}
                          </td>
                          <td className="py-2 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                            {tx.title}
                          </td>
                          <td className="py-2 px-3 text-zinc-500 whitespace-nowrap">
                            {tx.category || "General"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap">
                            {isTransfer ? (
                              <span className="text-amber-600 dark:text-amber-400">
                                {Number(tx.amount).toLocaleString()} EGP
                              </span>
                            ) : isIncome ? (
                              isNeg ? (
                                <span className="text-rose-600 dark:text-rose-400">
                                  -{Math.abs(Number(tx.amount)).toLocaleString()} EGP
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  +{Number(tx.amount).toLocaleString()} EGP
                                </span>
                              )
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400">
                                -{Math.abs(Number(tx.amount)).toLocaleString()} EGP
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Statement Footer */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2">
                <span>Total Entries: {filteredTransactions.length} recorded items</span>
                <span>Generated via Viltrum Command Center — How Much</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
