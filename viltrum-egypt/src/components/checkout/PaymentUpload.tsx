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
        <div className="relative border-2 border-zinc-900 bg-white p-2">
          <img
            src={preview}
            alt="Payment proof"
            className="w-full h-[400px] object-contain mix-blend-multiply"
          />
          
          {uploaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/10 backdrop-blur-[4px]">
              <div className="flex flex-col items-center gap-6 bg-white p-12 shadow-2xl border border-zinc-100">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <CheckCircle size={32} />
                </div>
                <div className="text-center space-y-2">
                   <span className="font-black text-xs tracking-[0.4em] text-zinc-900 block">PROTOCOL VALIDATED</span>
                   <span className="text-[10px] font-bold text-zinc-400 block tracking-widest">PROOF OF TRANSFER SECURED</span>
                </div>
              </div>
            </div>
          )}
          
          {!uploaded && !uploading && (
            <button
              onClick={clearPreview}
              className="absolute top-8 right-8 p-3 bg-zinc-900 text-white hover:bg-zinc-700 transition-all duration-300"
            >
              <X size={20} />
            </button>
          )}
          
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/95">
              <div className="text-center space-y-6">
                <div className="w-12 h-12 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin mx-auto" />
                <span className="text-xs font-black tracking-[0.4em] text-zinc-900">
                  ENCRYPTING UPLOAD...
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
          className={`cursor-pointer border-2 border-dashed p-24 md:p-32 text-center transition-all duration-500 group ${
            dragOver
              ? "border-zinc-900 bg-zinc-50"
              : "border-zinc-100 bg-white hover:border-zinc-900"
          }`}
        >
          <div className="flex flex-col items-center space-y-8">
            <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 flex items-center justify-center group-hover:bg-zinc-900 transition-colors duration-500">
              <Smartphone
                size={32}
                className={dragOver ? "text-zinc-900" : "text-zinc-300 group-hover:text-white transition-colors duration-500"}
              />
            </div>
            <div className="space-y-4">
               <p className="text-sm font-black text-zinc-900 tracking-[0.3em]">
                DRAG PAYMENT RECEIPT
              </p>
              <p className="text-[10px] text-zinc-400 font-bold tracking-[0.4em]">
                MAXIMUM COMPRESSION: 5MB / FORMATS: JPG, PNG
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
        <div className="p-6 bg-red-50 border-l-4 border-red-600">
          <p className="text-[10px] text-red-600 font-black tracking-[0.2em]">{error}</p>
        </div>
      )}
    </div>
  );
}
