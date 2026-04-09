"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle, Smartphone } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PaymentUploadProps {
  onUploadComplete: (url: string) => void;
  uploaded: boolean;
}

export default function PaymentUpload({
  onUploadComplete,
  uploaded,
}: PaymentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("FILE PROTOCOL REJECTED: IMAGE REQUIRED");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("FILE SIZE EXCEEDED: 5MB LIMIT");
      return;
    }

    setError(null);
    setUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const ext = file.name.split(".").pop();
      const filePath = `${fileName}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(filePath);

      onUploadComplete(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("UPLOAD INTERRUPTED. RETRY INITIATED.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-10 uppercase">
      {preview ? (
        <div className="relative rounded-[2.5rem] overflow-hidden border border-zinc-100 bg-white p-4 shadow-xl shadow-zinc-900/5">
          <img
            src={preview}
            alt="Payment proof"
            className="w-full h-64 object-contain mix-blend-multiply"
          />
          
          {uploaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/5 backdrop-blur-[4px]">
              <div className="flex flex-col items-center gap-4 bg-white px-8 py-6 rounded-3xl shadow-2xl border border-zinc-50">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <CheckCircle size={24} />
                </div>
                <div className="text-center">
                   <p className="font-black text-[9px] tracking-[0.3em] text-zinc-900">VALIDATED</p>
                </div>
              </div>
            </div>
          )}
          
          {!uploaded && !uploading && (
            <button
              onClick={clearPreview}
              className="absolute top-6 right-6 p-3 rounded-full bg-zinc-900 text-white hover:bg-zinc-700 transition-all duration-300"
            >
              <X size={16} />
            </button>
          )}
          
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm">
              <div className="text-center space-y-4">
                <div className="w-10 h-10 border-4 border-zinc-100 border-t-[#00bfa5] rounded-full animate-spin mx-auto" />
                <span className="text-[9px] font-black tracking-[0.4em] text-zinc-900">
                  DEPOSITING...
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-[2.5rem] border-2 border-dashed p-16 text-center transition-all duration-700 group h-64 flex flex-col items-center justify-center ${
            dragOver
              ? "border-emerald-500 bg-emerald-50/50"
              : "border-zinc-100 bg-zinc-50/30 hover:border-zinc-300 hover:bg-zinc-50/80"
          }`}
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-white border border-zinc-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 shadow-sm">
              <Smartphone
                size={24}
                className={dragOver ? "text-emerald-500" : "text-zinc-300 group-hover:text-zinc-900 transition-colors duration-500"}
              />
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black text-zinc-900 tracking-[0.3em]">
                ADD PAYMENT RECEIPT
              </p>
              <p className="text-[8px] text-zinc-300 font-bold tracking-[0.4em]">
                DRAG & DROP OR TAP
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="p-6 rounded-full bg-red-50 border border-red-100 text-center">
          <p className="text-[9px] text-red-600 font-black tracking-[0.2em]">{error}</p>
        </div>
      )}
    </div>
  );
}
