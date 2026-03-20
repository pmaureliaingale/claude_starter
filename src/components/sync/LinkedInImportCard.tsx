"use client";

import { useRef, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";

export function LinkedInImportCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file exported from LinkedIn");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/linkedin-import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Import failed");
      } else {
        const { imported, skipped } = data;
        if (imported === 0) {
          toast.success("No new applications — all rows already exist");
        } else {
          toast.success(
            `Imported ${imported} application${imported !== 1 ? "s" : ""}${skipped > 0 ? ` (${skipped} already existed)` : ""}`
          );
        }
      }
    } catch {
      toast.error("Import failed — please try again");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-base font-semibold text-white mb-1">Import from LinkedIn</h2>
      <p className="text-sm text-slate-400 mb-1">
        Download your LinkedIn job application data and import it here.
      </p>
      <ol className="text-xs text-slate-500 mb-5 space-y-0.5 list-decimal list-inside">
        <li>Go to LinkedIn → Settings &amp; Privacy → Data privacy</li>
        <li>Click <span className="text-slate-400">Get a copy of your data</span></li>
        <li>Select <span className="text-slate-400">Job Applications</span> → Request archive</li>
        <li>Download the CSV from the email LinkedIn sends you</li>
      </ol>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          dragOver
            ? "border-purple-400 bg-purple-500/10"
            : "border-white/20 hover:border-white/30 hover:bg-white/5"
        } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={onFileChange}
        />
        {isUploading ? (
          <>
            <Upload className="w-6 h-6 text-purple-400 animate-bounce" />
            <p className="text-sm text-slate-300">Importing...</p>
          </>
        ) : (
          <>
            <FileText className="w-6 h-6 text-slate-400" />
            <div className="text-center">
              <p className="text-sm text-slate-300 font-medium">Drop CSV here or click to browse</p>
              <p className="text-xs text-slate-500 mt-0.5">LinkedIn Job Applications export (.csv)</p>
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
}
