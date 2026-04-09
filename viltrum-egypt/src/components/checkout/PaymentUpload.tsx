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
      setError("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB");
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
    <div className="space-y-4">
      {preview ? (
        <div className="relative bg-zinc-50 border border-zinc-100 p-3 overflow-hidden">
          <img
            src={preview}
            alt="Payment proof"
            className="w-full h-48 object-contain"
          />

          {uploaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
                <p className="text-[11px] font-semibold text-zinc-900 uppercase tracking-[0.2em]">
                  Uploaded
                </p>
              </div>
            </div>
          )}

          {!uploaded && !uploading && (
            <button
              onClick={clearPreview}
              className="absolute top-5 right-5 p-2 bg-zinc-900 text-white rounded-sm hover:bg-zinc-700 transition-colors"
            >
              <X size={14} />
            </button>
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin mx-auto" />
                <span className="text-[11px] font-semibold text-zinc-900 uppercase tracking-[0.2em]">
                  Uploading...
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
          className={`cursor-pointer border border-dashed p-12 text-center transition-all duration-300 group ${
            dragOver
              ? "border-zinc-900 bg-zinc-50"
              : "border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50"
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <Upload
              size={24}
              className="text-zinc-300 group-hover:text-zinc-500 transition-colors duration-300"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-600">
                Click or drag to upload
              </p>
              <p className="text-[11px] text-zinc-300 font-semibold">
                JPG, PNG — Max 5MB
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
        <p className="text-[11px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
