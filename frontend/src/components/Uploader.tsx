"use client";

import { useCallback, useMemo, useState } from "react";

type UploadState = "idle" | "uploading" | "success" | "error";

type UploaderProps = {
  onUploaded?: () => void;
};

export default function Uploader({ onUploaded }: UploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string>("Drop a PDF to begin ingestion.");

  const disabled = useMemo(() => uploadState === "uploading", [uploadState]);

  const handleFileSelection = useCallback((file: File | null) => {
    if (!file) {
      return;
    }
    setSelectedFile(file);
    setUploadState("idle");
    setMessage(`Ready to upload ${file.name}`);
  }, []);

  const onDrop: React.DragEventHandler<HTMLLabelElement> = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0] ?? null;
      handleFileSelection(file);
    },
    [handleFileSelection],
  );

  const upload = useCallback(async () => {
    if (!selectedFile) {
      setUploadState("error");
      setMessage("Choose a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setUploadState("uploading");
      setMessage("Uploading and queueing document...");

      const response = await fetch("http://localhost:8000/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed (${response.status})`);
      }

      const payload = (await response.json()) as { id: number };
      setUploadState("success");
      setMessage(`Document #${payload.id} queued successfully.`);
      setSelectedFile(null);
      onUploaded?.();
    } catch (error) {
      const fallback = "Something went wrong while uploading.";
      const text = error instanceof Error ? error.message : fallback;
      setUploadState("error");
      setMessage(text || fallback);
    }
  }, [onUploaded, selectedFile]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-900/70 p-6 shadow-[0_0_60px_rgba(34,211,238,0.15)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-20 -right-12 h-52 w-52 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-cyan-100">Upload Document</h2>
        <p className="text-sm text-slate-300">Drag and drop a file, then push it into the processing queue.</p>

        <label
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={[
            "group flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition",
            isDragging
              ? "border-cyan-300 bg-cyan-400/10"
              : "border-slate-600 bg-slate-950/60 hover:border-cyan-400/70 hover:bg-slate-900/80",
          ].join(" ")}
        >
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            className="hidden"
            disabled={disabled}
            onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
          />

          <div className="mb-3 h-14 w-14 rounded-full border border-cyan-300/40 bg-cyan-400/10" />
          <span className="text-base font-medium text-cyan-100">
            {selectedFile ? selectedFile.name : "Drop file here or click to browse"}
          </span>
          <span className="mt-2 text-xs text-slate-400">Max size and validation are handled by backend policy.</span>
        </label>

        <button
          type="button"
          disabled={disabled || !selectedFile}
          onClick={upload}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {uploadState === "uploading" ? "Uploading..." : "Send To Pipeline"}
        </button>

        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            uploadState === "success" && "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
            uploadState === "error" && "border-rose-400/40 bg-rose-500/10 text-rose-200",
            (uploadState === "idle" || uploadState === "uploading") &&
              "border-slate-600/70 bg-slate-800/60 text-slate-200",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {message}
        </div>
      </div>
    </section>
  );
}
