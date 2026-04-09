"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, CheckCircle } from "lucide-react";
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
      setError("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    // Show preview
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
      setError("Upload failed. Please try again.");
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
    <div className="space-y-6">
      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-border-color bg-foreground/[0.02] group">
          <img
            src={preview}
            alt="Payment proof"
            className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {uploaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="w-16 h-16 rounded-full bg-green-500/20 backdrop-blur-md flex items-center justify-center border border-green-500/40">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <span className="font-black uppercase tracking-[0.2em] text-xs">Payment Verified</span>
              </div>
            </div>
          )}
          
          {!uploaded && !uploading && (
            <button
              onClick={clearPreview}
              className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-viltrum-red transition-all duration-300 border border-white/10"
            >
              <X size={16} />
            </button>
          )}
          
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-viltrum-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                  Uploading Security Tape...
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
          className={`cursor-pointer border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-700 group relative overflow-hidden ${
            dragOver
              ? "border-viltrum-red bg-viltrum-red/5"
              : "border-border-color bg-foreground/[0.01] hover:bg-foreground/[0.03] hover:border-viltrum-red/30"
          }`}
        >
          <div className="flex flex-col items-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-foreground/[0.03] border border-border-color flex items-center justify-center mb-6 transition-transform duration-500 group-hover:-translate-y-2">
              <Upload
                size={28}
                className={`transition-colors duration-300 ${
                  dragOver ? "text-viltrum-red" : "text-foreground/20"
                }`}
              />
            </div>
            <p className="text-sm font-bold text-foreground/60 uppercase tracking-widest mb-2">
              Drop proof of payment here
            </p>
            <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-[0.2em]">
              JPG, PNG, PDF (max 5mb)
            </p>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,0,0,0.03),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}
    </div>
  );
}
