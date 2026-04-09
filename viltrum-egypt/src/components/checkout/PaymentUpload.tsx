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
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground/70 tracking-wide">
        Payment Screenshot <span className="text-viltrum-red">*</span>
      </label>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-viltrum-white/10 bg-[#0A0A0A]/50">
          <img
            src={preview}
            alt="Payment proof"
            className="w-full h-48 object-cover"
          />
          {uploaded && (
            <div className="absolute inset-0 bg-green-900/60 flex items-center justify-center">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={24} />
                <span className="font-bold">Uploaded</span>
              </div>
            </div>
          )}
          {!uploaded && !uploading && (
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-viltrum-red border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-sm text-foreground/70">
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
          className={`cursor-pointer border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
            dragOver
              ? "border-viltrum-red bg-viltrum-red/5"
              : "border-viltrum-white/10 hover:border-viltrum-red/30 hover:bg-viltrum-white/5 bg-[#0A0A0A]"
          }`}
        >
          <Upload
            size={32}
            className={`mx-auto mb-3 ${
              dragOver ? "text-viltrum-red" : "text-foreground/30"
            }`}
          />
          <p className="text-sm text-foreground/50 mb-1">
            Drag & drop your screenshot here
          </p>
          <p className="text-xs text-foreground/30">
            or click to browse (max 5MB)
          </p>
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
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
