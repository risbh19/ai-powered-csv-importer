"use client";

import { useState } from "react";
import Papa from "papaparse";
import FileUpload from "@/components/FileUpload";
import PreviewTable from "@/components/PreviewTable";
import ResultsTable from "@/components/ResultsTable";
import StepIndicator from "@/components/StepIndicator";
import ThemeToggle from "@/components/ThemeToggle";
import { importCsv } from "@/lib/api";
import { ImportResponse, ParsedCsv, Step } from "@/lib/types";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  function handleFileSelected(selected: File) {
    setUploadError(null);
    Papa.parse<Record<string, string>>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (!res.meta.fields || res.meta.fields.length === 0) {
          setUploadError("Couldn't find any columns in that file — please check it's a valid CSV.");
          return;
        }
        setFile(selected);
        setParsed({ headers: res.meta.fields, rows: res.data });
        setStep("preview");
      },
      error: (err) => setUploadError(err.message),
    });
  }

  async function handleConfirm() {
    if (!file) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const res = await importCsv(file);
      setResult(res);
      setStep("results");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Something went wrong during import.");
    } finally {
      setIsImporting(false);
    }
  }

  function handleStartOver() {
    setStep("upload");
    setFile(null);
    setParsed(null);
    setResult(null);
    setImportError(null);
    setUploadError(null);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-accent-dark dark:text-accent">
              GrowEasy CRM
            </p>
            <h1 className="font-display text-2xl font-semibold text-ink dark:text-slate-100 sm:text-3xl">
              CSV Lead Importer
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {step !== "upload" && (
              <button
                onClick={handleStartOver}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink/50 ring-1 ring-line transition-colors hover:text-ink dark:text-slate-400 dark:ring-slate-700 dark:hover:text-slate-100"
              >
                Start over
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
        <StepIndicator current={step} />
      </header>

      {step === "upload" && (
        <section className="flex flex-1 flex-col items-center justify-center gap-2 py-6">
          <FileUpload onFileSelected={handleFileSelected} error={uploadError} />
        </section>
      )}

      {step === "preview" && parsed && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-medium text-ink dark:text-slate-100">
              {parsed.rows.length} row{parsed.rows.length === 1 ? "" : "s"} found in{" "}
              <span className="text-accent-dark dark:text-accent">{file?.name}</span>
            </h2>
            <p className="text-sm text-ink/50 dark:text-slate-400">
              This is a raw preview — nothing has been sent to the AI yet. Confirm below to map
              these rows into the GrowEasy CRM schema.
            </p>
          </div>

          <PreviewTable data={parsed} />

          {importError && (
            <p className="rounded-lg bg-danger-soft px-4 py-2 text-sm text-danger dark:bg-danger/10" role="alert">
              {importError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirm}
              disabled={isImporting}
              className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-medium text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImporting && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {isImporting ? "Mapping fields with AI…" : "Confirm import"}
            </button>
            <button
              onClick={handleStartOver}
              disabled={isImporting}
              className="rounded-full px-6 py-2.5 font-medium text-ink/60 ring-1 ring-line transition-colors hover:text-ink disabled:opacity-60 dark:text-slate-400 dark:ring-slate-700 dark:hover:text-slate-100"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {step === "results" && result && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-medium text-ink dark:text-slate-100">Mapped results</h2>
            <p className="text-sm text-ink/50 dark:text-slate-400">
              AI-extracted CRM records from <span className="text-accent-dark dark:text-accent">{file?.name}</span>.
            </p>
          </div>
          <ResultsTable result={result} />
        </section>
      )}
    </main>
  );
}
