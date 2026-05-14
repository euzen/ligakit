"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  uploadEndpoint: string;
  label?: string;
  previewSize?: "sm" | "md";
}

export function ImageUpload({ value, onChange, uploadEndpoint, label, previewSize = "md" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const previewCls = previewSize === "sm" ? "size-12 rounded-xl" : "size-20 rounded-2xl";

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(uploadEndpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Network error");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-semibold text-slate-700">{label}</p>}
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative shrink-0">
            <img src={value} alt="" className={`${previewCls} object-cover border border-slate-200`} />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <div
            className={`${previewCls} border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 shrink-0`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {uploading
              ? <Loader2 className="size-5 text-slate-400 animate-spin" />
              : <Upload className="size-5 text-slate-300" />
            }
          </div>
        )}

        <div className="flex flex-col gap-2 min-w-0">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-blue-700 hover:text-blue-700 disabled:opacity-50 transition-all"
          >
            {uploading && <Loader2 className="size-3.5 animate-spin" />}
            {uploading ? "Nahrávám..." : "Vybrat soubor"}
          </button>
          <p className="text-xs text-slate-400">PNG, JPG, WebP, SVG · max 2 MB</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}
