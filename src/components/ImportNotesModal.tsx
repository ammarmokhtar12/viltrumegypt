/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Save,
  Filter,
  Phone,
  User,
  Hash,
} from "lucide-react";

interface ImportNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingOrders?: any[];
}

function normalizePhone(p: any): string {
  if (!p) return "";
  const digits = String(p).replace(/[^0-9]/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10); // last 10 digits
  }
  return digits;
}

function normalizeName(name: any): string {
  if (!name) return "";
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s\-_.]+/g, " ");
}

export default function ImportNotesModal({
  isOpen,
  onClose,
  onSuccess,
  existingOrders = [],
}: ImportNotesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);

  // Selected column mapping
  const [orderCol, setOrderCol] = useState<string>("");
  const [phoneCol, setPhoneCol] = useState<string>("");
  const [nameCol, setNameCol] = useState<string>("");
  const [notesCol, setNotesCol] = useState<string>("");

  const [importMode, setImportMode] = useState<"append" | "overwrite">("append");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    updated: number;
    notFound: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fast lookup maps for local preview
  const { orderNumMap, phoneMap, nameMap } = useMemo(() => {
    const oMap = new Map<number, any>();
    const pMap = new Map<string, any>();
    const nMap = new Map<string, any>();

    existingOrders.forEach((o) => {
      const num = parseInt(String(o?.order_number || ""), 10);
      if (!isNaN(num) && num > 0) oMap.set(num, o);

      const normP = normalizePhone(o?.customer_phone);
      if (normP && normP.length >= 8) pMap.set(normP, o);

      const normN = normalizeName(o?.customer_name);
      if (normN && normN.length >= 3) nMap.set(normN, o);
    });

    return { orderNumMap: oMap, phoneMap: pMap, nameMap: nMap };
  }, [existingOrders]);

  // Read file and parse sheets
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);
    setErrorMessage("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheets = workbook.SheetNames;
        if (!sheets || sheets.length === 0) {
          setErrorMessage("الملف لا يحتوي على صفحات بيانات (Sheets).");
          return;
        }

        setSheetNames(sheets);
        const defaultSheet =
          sheets.find((s) => /return|order|مرتجع|طلب/i.test(s)) || sheets[0];
        setSelectedSheet(defaultSheet);
        parseWorksheet(workbook.Sheets[defaultSheet]);
      } catch (err: any) {
        setErrorMessage("حدث خطأ أثناء قراءة ملف الإكسيل: " + err.message);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const parseWorksheet = (worksheet: any) => {
    if (!worksheet) return;
    const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    if (!json || json.length === 0) {
      setColumns([]);
      setRawRows([]);
      setErrorMessage("هذه الصفحة فارغة.");
      return;
    }

    setRawRows(json);
    const keys = Object.keys(json[0] || {});
    setColumns(keys);

    // 1. Detect Order Column
    let bestOrderCol = "";
    let maxOrderScore = -999;
    keys.forEach((col) => {
      const clean = col.toLowerCase().trim();
      let score = 0;
      if (clean === "#" || clean === "م" || clean === "row" || clean === "index" || clean === "id") {
        score -= 50;
      }
      if (clean.includes("order #") || clean.includes("order_number") || clean.includes("رقم الأوردر") || clean.includes("رقم الاوردر") || clean.includes("رقم الطلب")) {
        score += 100;
      } else if (clean.includes("order") || clean.includes("أوردر") || clean.includes("اوردر") || clean.includes("طلب")) {
        score += 40;
      }
      const sampleVals = json.slice(0, 5).map((r) => r[col]);
      const validNumbers = sampleVals.filter((v) => {
        const n = parseInt(String(v).replace(/[^0-9]/g, ""), 10);
        return !isNaN(n) && n >= 100;
      });
      score += validNumbers.length * 10;
      if (score > maxOrderScore) {
        maxOrderScore = score;
        bestOrderCol = col;
      }
    });
    setOrderCol(maxOrderScore > 0 ? bestOrderCol : "");

    // 2. Detect Phone Column
    let bestPhoneCol = "";
    let maxPhoneScore = 0;
    keys.forEach((col) => {
      const clean = col.toLowerCase().trim();
      let score = 0;
      if (clean.includes("phone") || clean.includes("هاتف") || clean.includes("تليفون") || clean.includes("موبايل") || clean.includes("mobile")) {
        score += 80;
      }
      const sampleVals = json.slice(0, 5).map((r) => String(r[col] || ""));
      const isPhoneLike = sampleVals.filter((v) => {
        const digits = v.replace(/[^0-9]/g, "");
        return digits.length >= 10 && (digits.startsWith("01") || digits.startsWith("1") || digits.startsWith("201"));
      });
      score += isPhoneLike.length * 15;
      if (score > maxPhoneScore) {
        maxPhoneScore = score;
        bestPhoneCol = col;
      }
    });
    setPhoneCol(bestPhoneCol || "");

    // 3. Detect Name Column
    let bestNameCol = "";
    let maxNameScore = 0;
    keys.forEach((col) => {
      const clean = col.toLowerCase().trim();
      let score = 0;
      if (clean.includes("customer name") || clean.includes("اسم العميل") || clean.includes("العميل") || clean === "name" || clean === "الاسم") {
        score += 90;
      } else if (clean.includes("name") || clean.includes("اسم")) {
        score += 50;
      }
      if (score > maxNameScore) {
        maxNameScore = score;
        bestNameCol = col;
      }
    });
    setNameCol(bestNameCol || "");

    // 4. Detect Notes Column
    let bestNotesCol = "";
    let maxNotesScore = -999;
    keys.forEach((col) => {
      const clean = col.toLowerCase().trim();
      let score = 0;
      if (clean.includes("admin notes") || clean.includes("ملاحظات الأدمن") || clean.includes("ملاحظات الادمن")) {
        score += 100;
      } else if (clean.includes("note") || clean.includes("ملاحظ") || clean.includes("نوت")) {
        score += 60;
      } else if (clean.includes("تعليق") || clean.includes("comment") || clean.includes("سبب المرتجع") || clean.includes("reason")) {
        score += 30;
      }
      if (score > maxNotesScore) {
        maxNotesScore = score;
        bestNotesCol = col;
      }
    });
    setNotesCol(bestNotesCol || keys[keys.length - 1] || "");
  };

  // Re-parse when user changes sheet
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        parseWorksheet(workbook.Sheets[sheetName]);
      } catch (err: any) {
        setErrorMessage("فشل قراءة الصفحة: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Build rows preview based on current selected columns
  const parsedItems = useMemo(() => {
    if (!notesCol || rawRows.length === 0) return [];

    const items: Array<{
      orderNumber?: number;
      phone?: string;
      customerName?: string;
      newNote: string;
      currentNote: string;
      matchedBy: "order" | "phone" | "name" | "none";
      matchedOrderNum?: number;
      matchedCustomerName?: string;
    }> = [];

    rawRows.forEach((row) => {
      const rawNote = String(row[notesCol] || "").trim();
      if (!rawNote) return; // Skip empty notes

      // Extract Order Number
      let rawOrderNum: number | undefined = undefined;
      if (orderCol && row[orderCol] !== undefined && row[orderCol] !== null) {
        const clean = parseInt(String(row[orderCol]).replace(/[^0-9]/g, ""), 10);
        if (!isNaN(clean) && clean > 0) rawOrderNum = clean;
      }

      // Extract Phone
      let rawPhone: string | undefined = undefined;
      if (phoneCol && row[phoneCol]) {
        rawPhone = String(row[phoneCol]).trim();
      }

      // Extract Name
      let rawName: string | undefined = undefined;
      if (nameCol && row[nameCol]) {
        rawName = String(row[nameCol]).trim();
      }

      if (!rawOrderNum && !rawPhone && !rawName) return;

      // Matching algorithm
      let matchedOrder: any = null;
      let matchedBy: "order" | "phone" | "name" | "none" = "none";

      // 1. By Order Number
      if (rawOrderNum && orderNumMap.has(rawOrderNum)) {
        matchedOrder = orderNumMap.get(rawOrderNum);
        matchedBy = "order";
      }

      // 2. By Phone
      if (!matchedOrder && rawPhone) {
        const normP = normalizePhone(rawPhone);
        if (normP && phoneMap.has(normP)) {
          matchedOrder = phoneMap.get(normP);
          matchedBy = "phone";
        }
      }

      // 3. By Name
      if (!matchedOrder && rawName) {
        const normN = normalizeName(rawName);
        if (normN) {
          if (nameMap.has(normN)) {
            matchedOrder = nameMap.get(normN);
            matchedBy = "name";
          } else {
            // Partial match
            matchedOrder = existingOrders.find((o) => {
              const oN = normalizeName(o?.customer_name);
              return oN.length >= 4 && (oN.includes(normN) || normN.includes(oN));
            });
            if (matchedOrder) matchedBy = "name";
          }
        }
      }

      items.push({
        orderNumber: rawOrderNum,
        phone: rawPhone,
        customerName: rawName,
        newNote: rawNote,
        currentNote: matchedOrder?.notes || "",
        matchedBy,
        matchedOrderNum: matchedOrder?.order_number,
        matchedCustomerName: matchedOrder?.customer_name,
      });
    });

    return items;
  }, [rawRows, orderCol, phoneCol, nameCol, notesCol, orderNumMap, phoneMap, nameMap, existingOrders]);

  // Apply updates via server API
  const handleApply = async () => {
    if (parsedItems.length === 0) return;
    setImporting(true);
    setErrorMessage("");

    try {
      const payload = {
        updates: parsedItems.map((p) => ({
          orderNumber: p.orderNumber,
          phone: p.phone,
          customerName: p.customerName,
          note: p.newNote,
        })),
        mode: importMode,
      };

      const res = await fetch("/api/admin/orders/import-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل التحديث من السيرفر");
      }

      setImportResult({
        updated: data.updatedCount || 0,
        notFound: data.notFound || [],
      });

      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "حدث خطأ أثناء حفظ الملاحظات.");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setSheetNames([]);
    setSelectedSheet("");
    setColumns([]);
    setRawRows([]);
    setOrderCol("");
    setPhoneCol("");
    setNameCol("");
    setNotesCol("");
    setImportResult(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  if (!isOpen) return null;

  const validMatchCount = parsedItems.filter((i) => i.matchedBy !== "none").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">استيراد ملاحظات الأوردرات (Import Notes)</h3>
              <p className="text-xs text-zinc-400">
                يتعرف على الأوردر تلقائياً عبر <span className="text-amber-400 font-bold">رقم الأوردر</span> أو <span className="text-amber-400 font-bold">رقم التليفون</span> أو <span className="text-amber-400 font-bold">اسم العميل</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-amber-500/60 rounded-2xl p-10 text-center cursor-pointer bg-zinc-950/40 hover:bg-zinc-950/80 transition-all space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Upload size={26} />
              </div>
              <div>
                <p className="text-base font-bold text-white">اضغط هنا لاختيار ملف الإكسيل أو اسحبه</p>
                <p className="text-xs text-zinc-500 mt-1">يدعم ملفات .xlsx و .xls و .csv من شركات الشحن أو الإكسيل العادي</p>
              </div>
              <div className="inline-block px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-lg border border-zinc-700">
                يقوم بالمطابقة الذكية بواسطة: <span className="text-amber-400 font-bold">رقم الأوردر</span> / <span className="text-amber-400 font-bold">رقم الهاتف</span> / <span className="text-amber-400 font-bold">اسم العميل</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info & Sheet Selection */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-zinc-800/60 border border-zinc-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={22} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">{file.name}</p>
                    <p className="text-[11px] text-zinc-400">
                      إجمالي الصفوف: <span className="text-white font-bold">{rawRows.length}</span> · صفوف بها ملاحظات:{" "}
                      <span className="text-amber-400 font-bold">{parsedItems.length}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {sheetNames.length > 1 && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span>الصفحة:</span>
                      <select
                        value={selectedSheet}
                        onChange={(e) => handleSheetChange(e.target.value)}
                        className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-bold text-xs"
                      >
                        {sheetNames.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!importing && !importResult && (
                    <button
                      onClick={() => {
                        setFile(null);
                        setRawRows([]);
                        setColumns([]);
                      }}
                      className="text-xs text-zinc-400 hover:text-red-400 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
                    >
                      تغيير الملف
                    </button>
                  )}
                </div>
              </div>

              {/* Column Mapping Selectors */}
              {!importResult && columns.length > 0 && (
                <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Filter size={14} />
                    <span>تأكيد أعمدة الشيت (التعرف التلقائي):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {/* Order Column */}
                    <div>
                      <label className="flex items-center gap-1 text-zinc-400 font-bold mb-1.5">
                        <Hash size={12} className="text-amber-400" />
                        <span>رقم الأوردر:</span>
                      </label>
                      <select
                        value={orderCol}
                        onChange={(e) => setOrderCol(e.target.value)}
                        className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-amber-400"
                      >
                        <option value="">(غير محدد)</option>
                        {columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Phone Column */}
                    <div>
                      <label className="flex items-center gap-1 text-zinc-400 font-bold mb-1.5">
                        <Phone size={12} className="text-emerald-400" />
                        <span>رقم التليفون:</span>
                      </label>
                      <select
                        value={phoneCol}
                        onChange={(e) => setPhoneCol(e.target.value)}
                        className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-emerald-400"
                      >
                        <option value="">(غير محدد)</option>
                        {columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Name Column */}
                    <div>
                      <label className="flex items-center gap-1 text-zinc-400 font-bold mb-1.5">
                        <User size={12} className="text-blue-400" />
                        <span>اسم العميل:</span>
                      </label>
                      <select
                        value={nameCol}
                        onChange={(e) => setNameCol(e.target.value)}
                        className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-blue-400"
                      >
                        <option value="">(غير محدد)</option>
                        {columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notes Column */}
                    <div>
                      <label className="flex items-center gap-1 text-amber-300 font-bold mb-1.5">
                        <span>📝 الملاحظات:</span>
                      </label>
                      <select
                        value={notesCol}
                        onChange={(e) => setNotesCol(e.target.value)}
                        className="w-full px-2.5 py-2 bg-zinc-900 border border-amber-500/50 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-amber-400"
                      >
                        {columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode Selector */}
              {!importResult && parsedItems.length > 0 && (
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                  <p className="text-xs font-bold text-zinc-300">طريقة كتابة الملاحظات:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        importMode === "append"
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === "append"}
                        onChange={() => setImportMode("append")}
                        className="mt-0.5 accent-amber-500"
                      />
                      <div>
                        <span className="font-bold block text-white">إضافة على الملاحظات القديمة (Append)</span>
                        <span className="text-[11px] text-zinc-500">يحافظ على أي نوت مسجلة سابقاً ويضيف الجديدة أسفلها</span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        importMode === "overwrite"
                          ? "bg-red-500/10 border-red-500/40 text-red-200"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === "overwrite"}
                        onChange={() => setImportMode("overwrite")}
                        className="mt-0.5 accent-red-500"
                      />
                      <div>
                        <span className="font-bold block text-white">استبدال الملاحظات (Overwrite)</span>
                        <span className="text-[11px] text-zinc-500">يكتب النوت الجديدة ويمسح ما قبلها</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {!importResult && parsedItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
                    <span>
                      معاينة البيانات ({parsedItems.length} صف) ·{" "}
                      <span className="text-emerald-400">{validMatchCount} متطابق في السيستم</span>
                      {parsedItems.length - validMatchCount > 0 && (
                        <span className="text-amber-400 mr-2">({parsedItems.length - validMatchCount} غير متطابق)</span>
                      )}
                    </span>
                  </div>

                  <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-zinc-800/90 text-zinc-300 sticky top-0 font-bold border-b border-zinc-700">
                        <tr>
                          <th className="p-2.5">الأوردر المتطابق</th>
                          <th className="p-2.5">طريقة المطابقة</th>
                          <th className="p-2.5">البيانات من الملف</th>
                          <th className="p-2.5 text-amber-400">الملاحظة من الإكسيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                        {parsedItems.map((r, i) => (
                          <tr key={i} className={`hover:bg-zinc-800/30 ${r.matchedBy === "none" ? "opacity-50 bg-zinc-950/40" : ""}`}>
                            <td className="p-2.5 whitespace-nowrap">
                              {r.matchedOrderNum ? (
                                <div>
                                  <span className="font-bold text-white block">#{r.matchedOrderNum}</span>
                                  <span className="text-[11px] text-zinc-400">{r.matchedCustomerName}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-zinc-500 italic">غير متطابق</span>
                              )}
                            </td>

                            <td className="p-2.5 whitespace-nowrap">
                              {r.matchedBy === "order" && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  ✓ برقم الأوردر
                                </span>
                              )}
                              {r.matchedBy === "phone" && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  ✓ برقم التليفون
                                </span>
                              )}
                              {r.matchedBy === "name" && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  ✓ باسم العميل
                                </span>
                              )}
                              {r.matchedBy === "none" && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-500">
                                  ⚠️ لم يتم العثور عليه
                                </span>
                              )}
                            </td>

                            <td className="p-2.5 text-zinc-400 text-[11px] whitespace-nowrap">
                              {r.orderNumber ? `#${r.orderNumber} ` : ""}
                              {r.phone ? `(${r.phone}) ` : ""}
                              {r.customerName ? `${r.customerName}` : ""}
                            </td>

                            <td className="p-2.5 text-amber-300 font-medium max-w-[200px] truncate" title={r.newNote}>
                              {r.newNote}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Success Result Message */}
              {importResult && (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3 text-center animate-in zoom-in-95">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={28} />
                  </div>
                  <h4 className="text-base font-bold text-emerald-400">تم التحديث بنجاح في قاعدة البيانات! 🎉</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed max-w-md mx-auto">
                    تم تحديث ملاحظات <span className="font-bold text-white text-sm">({importResult.updated})</span> أوردر بنجاح.
                    {importResult.notFound.length > 0 && (
                      <span className="text-amber-400 block mt-1.5 text-[11px]">
                        ({importResult.notFound.length} صف لم نجد أوردر مطابق له في السيستم)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
          >
            {importResult ? "إغلاق" : "إلغاء"}
          </button>

          {file && !importResult && (
            <button
              onClick={handleApply}
              disabled={importing || parsedItems.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20"
            >
              {importing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  جاري التحديث في قاعدة البيانات...
                </>
              ) : (
                <>
                  <Save size={14} />
                  تطبيق وتحديث ({parsedItems.length}) أوردر الآن
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
