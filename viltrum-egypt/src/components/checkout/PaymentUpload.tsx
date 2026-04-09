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
      setError("Image must be under 5MB");
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
    <div className="space-y-6 uppercase">
      {preview ? (
        <div className="relative border border-zinc-100 bg-zinc-50 group">
          <img
            src={preview}
            alt="Payment proof"
            className="w-full h-80 object-contain p-4 mix-blend-multiply"
          />
          
          {uploaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/5 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                  <CheckCircle size={24} />
                </div>
                <span className="font-bold text-[10px] tracking-widest text-zinc-900">Proof Uploaded</span>
              </div>
            </div>
          )}
          
          {!uploaded && !uploading && (
            <button
              onClick={clearPreview}
              className="absolute top-4 right-4 p-2 bg-white border border-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all duration-300"
            >
              <X size={16} />
            </button>
          )}
          
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto mb-4" />
                <span className="text-[10px] font-bold tracking-widest text-zinc-400">
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
          className={`cursor-pointer border-2 border-dashed p-16 text-center transition-all duration-300 ${
            dragOver
              ? "border-zinc-900 bg-zinc-50"
              : "border-zinc-100 bg-zinc-50 hover:border-zinc-300"
          }`}
        >
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-white border border-zinc-100 flex items-center justify-center mb-6">
              <Upload
                size={20}
                className={dragOver ? "text-zinc-900" : "text-zinc-300"}
              />
            </div>
            <p className="text-[10px] font-bold text-zinc-900 tracking-widest mb-2">
              Upload payment screenshot
            </p>
            <p className="text-[9px] text-zinc-400 font-bold tracking-widest">
              JPG, PNG (max 5mb)
            </p>
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
        <div className="p-4 bg-red-50 text-center">
          <p className="text-[10px] text-red-600 font-bold tracking-widest">{error}</p>
        </div>
      )}
    </div>
  );
}
