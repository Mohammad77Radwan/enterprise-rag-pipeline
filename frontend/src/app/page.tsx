"use client";

import { useState } from "react";

import StatusList from "@/src/components/StatusList";
import Uploader from "@/src/components/Uploader";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.25),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.22),transparent_45%),linear-gradient(180deg,#020617,#0f172a)] px-4 py-10 text-slate-100 sm:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Enterprise RAG Pipeline</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Document Ingestion Control Center</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
            Drop documents, queue processing, and monitor each file from upload through completion.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.3fr]">
          <Uploader onUploaded={() => setRefreshKey((value) => value + 1)} />
          <StatusList refreshKey={refreshKey} />
        </section>
      </div>
    </main>
  );
}
