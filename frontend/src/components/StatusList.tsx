"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type DocumentItem = {
  id: number;
  filename: string;
  upload_status: string;
  created_at: string | null;
};

type Summary = {
  Pending: number;
  Processing: number;
  Completed: number;
  Total: number;
};

const statusClasses: Record<string, string> = {
  Pending: "border-amber-400/30 bg-amber-500/15 text-amber-200",
  Processing: "border-sky-400/30 bg-sky-500/15 text-sky-200",
  Completed: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
};

type StatusListProps = {
  refreshKey?: number;
};

export default function StatusList({ refreshKey = 0 }: StatusListProps) {
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [summary, setSummary] = useState<Summary>({ Pending: 0, Processing: 0, Completed: 0, Total: 0 });
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [selectedDocError, setSelectedDocError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchItems = useCallback(async () => {
    try {
      setError("");
      const [documentsResponse, summaryResponse] = await Promise.all([
        fetch("http://localhost:8000/api/v1/documents", {
          method: "GET",
          cache: "no-store",
        }),
        fetch("http://localhost:8000/api/v1/summary", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      if (!documentsResponse.ok) {
        throw new Error(`Unable to fetch statuses (${documentsResponse.status})`);
      }

      if (!summaryResponse.ok) {
        throw new Error(`Unable to fetch summary (${summaryResponse.status})`);
      }

      const payload = (await documentsResponse.json()) as DocumentItem[];
      const summaryPayload = (await summaryResponse.json()) as Summary;
      setItems(Array.isArray(payload) ? payload : []);
      setSummary(summaryPayload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch document statuses.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocumentById = useCallback(async (docId: number) => {
    try {
      setSelectedDocError("");
      const response = await fetch(`http://localhost:8000/api/v1/documents/${docId}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Unable to fetch document (${response.status})`);
      }

      const payload = (await response.json()) as DocumentItem;
      setSelectedDoc(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch document details.";
      setSelectedDocError(message);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    const interval = window.setInterval(fetchItems, 4000);
    return () => window.clearInterval(interval);
  }, [fetchItems, refreshKey]);

  const content = useMemo(() => {
    if (loading) {
      return <p className="text-sm text-slate-300">Loading recent uploads...</p>;
    }

    if (error) {
      return <p className="text-sm text-rose-300">{error}</p>;
    }

    if (!items.length) {
      return <p className="text-sm text-slate-300">No uploads yet. Add a document to start.</p>;
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const badge = statusClasses[item.upload_status] ?? "border-slate-500/30 bg-slate-700/20 text-slate-200";
          const createdAt = item.created_at ? new Date(item.created_at).toLocaleString() : "Unknown time";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => fetchDocumentById(item.id)}
              className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-left shadow-[0_10px_35px_rgba(2,6,23,0.7)] transition hover:border-blue-300/40"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-slate-100">{item.filename}</h3>
                <span className={["rounded-full border px-2 py-1 text-xs font-semibold", badge].join(" ")}>
                  {item.upload_status}
                </span>
              </div>
              <p className="text-xs text-slate-400">Doc ID: #{item.id}</p>
              <p className="mt-1 text-xs text-slate-500">Created: {createdAt}</p>
            </button>
          );
        })}
      </div>
    );
  }, [error, fetchDocumentById, items, loading]);

  return (
    <section className="rounded-3xl border border-blue-400/20 bg-slate-900/70 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-blue-100">Processing Status</h2>
        <button
          type="button"
          onClick={fetchItems}
          className="rounded-lg border border-slate-500/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-blue-300/60 hover:text-blue-100"
        >
          Refresh
        </button>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
          <p className="text-slate-400">Total</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">{summary.Total}</p>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
          <p className="text-amber-200">Pending</p>
          <p className="mt-1 text-lg font-semibold text-amber-100">{summary.Pending}</p>
        </div>
        <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-3">
          <p className="text-sky-200">Processing</p>
          <p className="mt-1 text-lg font-semibold text-sky-100">{summary.Processing}</p>
        </div>
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
          <p className="text-emerald-200">Completed</p>
          <p className="mt-1 text-lg font-semibold text-emerald-100">{summary.Completed}</p>
        </div>
      </div>
      <div className="mb-4 rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Selected Document</p>
        {!selectedDoc && !selectedDocError && (
          <p className="mt-2 text-sm text-slate-300">Click a document card to inspect details.</p>
        )}
        {selectedDocError && <p className="mt-2 text-sm text-rose-300">{selectedDocError}</p>}
        {selectedDoc && (
          <div className="mt-3 space-y-1 text-sm text-slate-200">
            <p>
              <span className="text-slate-400">ID:</span> #{selectedDoc.id}
            </p>
            <p>
              <span className="text-slate-400">Filename:</span> {selectedDoc.filename}
            </p>
            <p>
              <span className="text-slate-400">Status:</span> {selectedDoc.upload_status}
            </p>
            <p>
              <span className="text-slate-400">Created:</span>{" "}
              {selectedDoc.created_at ? new Date(selectedDoc.created_at).toLocaleString() : "Unknown"}
            </p>
          </div>
        )}
      </div>
      {content}
    </section>
  );
}
