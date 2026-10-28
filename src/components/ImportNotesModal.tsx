/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Save,
} from "lucide-react";

interface ParsedImportRow {
  orderNumber: number;
  newNote: string;
  currentNote: string;
  customerName: string;
}

interface ImportNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingOrders?: any[];
}

export default function ImportNotesModal({
  isOpen,
  onClose,
  onSuccess,
  existingOrders = [],
}: ImportNotesModalProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [importMode, setImportMode] = useState<"append" | "overwrite">("append");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ updated: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Build quick map of existing orders by order_number
  const ordersMap = new Map<number, any>();
  existingOrders.forEach((o) => {
    if (o?.order_number) ordersMap.set(o.order_number, o);
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!json || json.length === 0) {
          alert("الملف فارغ أو لا يحتوي على بيانات");
          return;
        }

        const sample = json[0];
        const keys = Object.keys(sample);

        // Find Order Number column
        const orderKey = keys.find((k) => {
          const s = k.toLowerCase().replace(/[\s_#-]/g, "");
          return (
            s.includes("order#") ||
            s.includes("ordernumber") ||
            s.includes("رقمأوردر") ||
            s.includes("رقمطلب") ||
            s.includes("رقم_الاوردر") ||
            s.includes("رقم_الطلب") ||
            s.includes("order") ||
            s.includes("طلب") ||
            s.includes("أوردر")
          );
        }) || keys[1] || keys[0];

        // Find Notes column
        const notesKey = keys.find((k) => {
          const s = k.toLowerCase();
          return (
            (s.includes("admin") && s.includes("note")) ||
            s.includes("ملاحظات الأدمن") ||
            s.includes("ملاحظات الادمن") ||
            s.includes("admin notes")
          );
        }) || keys.find((k) => {
          const s = k.toLowerCase();
          return (
            s.includes("note") ||
            s.includes("ملاحظ") ||
            s.includes("نوت") ||
            s.includes("تعليق") ||
            s.includes("comment") ||
            s.includes("company return reason") ||
            s.includes("سبب المرتجع")
          );
        });

        if (!notesKey) {
          alert("لم يتم العثور على عمود للملاحظات (Admin Notes / ملاحظات) في الملف.");
          return;
        }

        // Parse rows
        const matched: ParsedImportRow[] = [];
        json.forEach((row) => {
          const rawOrder = row[orderKey];
          if (rawOrder === undefined || rawOrder === null) return;
          const cleanNumStr = String(rawOrder).replace(/[^0-9]/g, "");
          const num = parseInt(cleanNumStr, 10);
          if (isNaN(num) || num <= 0) return;

          const rawNote = String(row[notesKey] || "").trim();
          if (!rawNote) return; // Skip empty notes

          const existingOrder = ordersMap.get(num);

          matched.push({
            orderNumber: num,
            newNote: rawNote,
            currentNote: existingOrder?.notes || "",
            customerName:
              existingOrder?.customer_name ||
              String(
                row["اسم العميل (Customer Name)"] ||
                row["Customer Name"] ||
                row["العميل"] ||
                ""
              ),
          });
        });

        setParsedRows(matched);
      } catch (err: any) {
        console.error(err);
        alert(`حدث خطأ أثناء قراءة الملف: ${err.message || ""}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleApplyImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setImportProgress(0);

    let updatedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < parsedRows.length; i++) {
      const item = parsedRows[i];
      let finalNote = item.newNote;

      if (importMode === "append" && item.currentNote.trim()) {
        const todayStr = new Date().toLocaleDateString("en-GB");
        finalNote = `${item.currentNote.trim()}\n[${todayStr}]: ${item.newNote.trim()}`;
      }

      try {
        const { error } = await supabase
          .from("orders")
          .update({
            notes: finalNote,
            updated_at: new Date().toISOString(),
          })
          .eq("order_number", item.orderNumber);

        if (error) {
          failedCount++;
        } else {
          updatedCount++;
        }
      } catch {
        failedCount++;
      }

      setImportProgress(Math.round(((i + 1) / parsedRows.length) * 100));
    }

    setImporting(false);
    setImportResult({ updated: updatedCount, failed: failedCount });
    onSuccess();
  };

  const handleClose = () => {
    setImportFile(null);
    setParsedRows([]);
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">استيراد ملاحظات الأوردرات من إكسيل</h3>
              <p className="text-xs text-zinc-400">
                ارفع شيت الإكسيل لوضع الملاحظات (Admin Notes) تلقائياً لكل أوردر
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
          {!importFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-amber-500/60 rounded-2xl p-8 text-center cursor-pointer bg-zinc-950/40 hover:bg-zinc-950/80 transition-all space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Upload size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">اضغط لاختيار ملف الإكسيل أو اسحبه هنا</p>
                <p className="text-xs text-zinc-500 mt-1">يدعم ملفات .xlsx و .xls و .csv</p>
              </div>
              <div className="inline-block px-3 py-1 bg-zinc-800 text-zinc-400 text-[11px] rounded-lg border border-zinc-700">
                يقرأ عمود <span className="text-amber-400 font-bold">Admin Notes</span> ورقم الأوردر تلقائياً
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File info card */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-800/70 border border-zinc-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={20} className="text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">{importFile.name}</p>
                    <p className="text-[11px] text-zinc-400">
                      تم العثور على <span className="text-amber-400 font-bold">{parsedRows.length}</span> أوردر به ملاحظات
                    </p>
                  </div>
                </div>
                {!importing && !importResult && (
                  <button
                    onClick={() => {
                      setImportFile(null);
                      setParsedRows([]);
                    }}
                    className="text-xs text-zinc-400 hover:text-red-400 px-2 py-1 rounded hover:bg-zinc-700 transition-all"
                  >
                    تغيير الملف
                  </button>
                )}
              </div>

              {/* Mode Selector */}
              {!importResult && parsedRows.length > 0 && (
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-zinc-300">طريقة تحديث الملاحظات:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        importMode === "append"
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
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
                        <span className="font-bold block text-white">إضافة على الملاحظات القديمة</span>
                        <span className="text-[11px] text-zinc-500">يحافظ على أي نوت سابقة ويضيف النوت الجديدة تحتها مع التاريخ</span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        importMode === "overwrite"
                          ? "bg-red-500/10 border-red-500/40 text-red-200"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
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
                        <span className="font-bold block text-white">استبدال الملاحظات بالكامل</span>
                        <span className="text-[11px] text-zinc-500">يكتب النوت الجديدة ويمسح ما قبلها</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {!importResult && parsedRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-400">
                    معاينة البيانات قبل التطبيق ({parsedRows.length} أوردر):
                  </p>
                  <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-zinc-800/80 text-zinc-400 sticky top-0 font-bold border-b border-zinc-700">
                        <tr>
                          <th className="p-2.5">رقم الأوردر</th>
                          <th className="p-2.5">العميل</th>
                          <th className="p-2.5">النوت الحالية</th>
                          <th className="p-2.5 text-amber-400">النوت الجديدة من الإكسيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                        {parsedRows.map((r, i) => (
                          <tr key={i} className="hover:bg-zinc-800/30">
                            <td className="p-2.5 font-bold text-white whitespace-nowrap">#{r.orderNumber}</td>
                            <td className="p-2.5 text-zinc-400 whitespace-nowrap">{r.customerName || "-"}</td>
                            <td className="p-2.5 text-zinc-500 max-w-[120px] truncate" title={r.currentNote}>
                              {r.currentNote || <span className="italic text-zinc-600">فارغ</span>}
                            </td>
                            <td className="p-2.5 text-amber-300 font-medium max-w-[180px] truncate" title={r.newNote}>
                              {r.newNote}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {importing && (
                <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <div className="flex justify-between text-xs text-zinc-400 font-bold">
                    <span>جاري تحديث النوتس في قاعدة البيانات...</span>
                    <span className="text-amber-400">{importProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-200"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Result Message */}
              {importResult && (
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-center">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
                  <h4 className="text-sm font-bold text-emerald-400">تم التحديث بنجاح!</h4>
                  <p className="text-xs text-zinc-300">
                    تم تحديث ملاحظات <span className="font-bold text-white">{importResult.updated}</span> أوردر في السيستم.
                    {importResult.failed > 0 && (
                      <span className="text-red-400 block mt-1">({importResult.failed} أوردر فشل تحديثهم)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
          >
            {importResult ? "إغلاق" : "إلغاء"}
          </button>

          {importFile && !importResult && (
            <button
              onClick={handleApplyImport}
              disabled={importing || parsedRows.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20"
            >
              {importing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save size={14} />
                  تطبيق وتحديث ({parsedRows.length}) أوردر
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
