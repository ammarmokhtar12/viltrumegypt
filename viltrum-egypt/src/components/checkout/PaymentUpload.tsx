"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle } from "lucide-react";
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
    <div className="space-y-5">
      {preview ? (
        <div className="relative rounded-xl bg-zinc-900 border border-zinc-700 p-4 overflow-hidden">
          <img
            src={preview}
            alt="Payment proof"
            className="w-full h-56 object-contain"
          />

          {uploaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.2em]">
                  Uploaded
                </p>
              </div>
            </div>
          )}

          {!uploaded && !uploading && (
            <button
              onClick={clearPreview}
              className="absolute top-5 right-5 rounded-xl bg-zinc-800 p-2 text-white transition-colors hover:bg-zinc-700"
            >
              <X size={14} />
            </button>
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center space-y-3">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                <span className="text-[11px] font-semibold text-white uppercase tracking-[0.2em]">
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
          className={`cursor-pointer border border-dashed p-14 text-center transition-all duration-300 group ${
            dragOver
              ? "border-zinc-600 bg-zinc-900"
              : "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800"
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <Upload
              size={24}
              className="text-zinc-400 group-hover:text-white transition-colors duration-300"
            />
            <div className="space-y-2">
              <p className="text-base font-medium text-zinc-100">
                Click or drag to upload
              </p>
              <p className="text-[11px] font-semibold text-zinc-400">
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
