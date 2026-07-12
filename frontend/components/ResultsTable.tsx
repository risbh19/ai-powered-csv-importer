"use client";

import { useState } from "react";
import { CRM_FIELDS, ImportResponse } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "bg-success-soft text-success",
  SALE_DONE: "bg-success-soft text-success",
  DID_NOT_CONNECT: "bg-warning-soft text-warning",
  BAD_LEAD: "bg-danger-soft text-danger",
};

function StatCard({ label, value, tone }: { label: string; value: number; tone: "accent" | "success" | "danger" }) {
  const toneClasses = {
    accent: "text-accent-dark bg-accent-soft dark:text-accent dark:bg-accent/10",
    success: "text-success bg-success-soft dark:bg-success/10",
    danger: "text-danger bg-danger-soft dark:bg-danger/10",
  }[tone];

  return (
    <div className={`flex flex-1 flex-col gap-1 rounded-card px-5 py-4 ${toneClasses}`}>
      <span className="font-display text-2xl font-semibold">{value}</span>
      <span className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</span>
    </div>
  );
}

export default function ResultsTable({ result }: { result: ImportResponse }) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <StatCard label="Rows in file" value={result.totalRows} tone="accent" />
        <StatCard label="Imported" value={result.totalImported} tone="success" />
        <StatCard label="Skipped" value={result.totalSkipped} tone="danger" />
      </div>

      {result.failedBatches.length > 0 && (
        <div className="rounded-card bg-warning-soft px-4 py-3 text-sm text-warning dark:bg-warning/10">
          {result.failedBatches.length} batch
          {result.failedBatches.length > 1 ? "es" : ""} of rows failed AI processing after
          retries (rows {result.failedBatches.map((b) => `${b.startRow + 1}–${b.endRow + 1}`).join(", ")}).
          They are not included in the totals above — try re-uploading just those rows.
        </div>
      )}

      <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-line w-fit dark:bg-slate-900 dark:ring-slate-700">
        <button
          onClick={() => setTab("imported")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "imported" ? "bg-accent text-white" : "text-ink/50 hover:text-ink dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          Imported ({result.totalImported})
        </button>
        <button
          onClick={() => setTab("skipped")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "skipped" ? "bg-accent text-white" : "text-ink/50 hover:text-ink dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          Skipped ({result.totalSkipped})
        </button>
      </div>

      {tab === "imported" ? (
        <div className="grow-table max-h-[460px] overflow-auto rounded-card border border-line bg-white dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_0_#E4E7EC] dark:bg-slate-800 dark:shadow-[0_1px_0_0_#334155]">
              <tr>
                {CRM_FIELDS.map((f) => (
                  <th
                    key={f}
                    className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wide text-ink/50 dark:text-slate-400"
                  >
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.records.map((r) => (
                <tr key={r.source_row_index} className="border-t border-line even:bg-surface/50 dark:border-slate-800 dark:even:bg-slate-800/30">
                  {CRM_FIELDS.map((f) => (
                    <td key={f} className="whitespace-nowrap px-4 py-2 text-ink/80 dark:text-slate-300">
                      {f === "crm_status" && r[f] ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r[f]] || ""}`}>
                          {r[f]}
                        </span>
                      ) : (
                        r[f] || <span className="text-ink/25 dark:text-slate-600">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {result.records.length === 0 && (
                <tr>
                  <td colSpan={CRM_FIELDS.length} className="px-4 py-8 text-center text-ink/40 dark:text-slate-500">
                    No records were imported.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grow-table max-h-[460px] overflow-auto rounded-card border border-line bg-white dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_0_#E4E7EC] dark:bg-slate-800 dark:shadow-[0_1px_0_0_#334155]">
              <tr>
                <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wide text-ink/50 dark:text-slate-400">
                  Row #
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wide text-ink/50 dark:text-slate-400">
                  Reason skipped
                </th>
              </tr>
            </thead>
            <tbody>
              {result.skippedRecords.map((r) => (
                <tr key={r.source_row_index} className="border-t border-line even:bg-surface/50 dark:border-slate-800 dark:even:bg-slate-800/30">
                  <td className="px-4 py-2 font-mono text-xs text-ink/60 dark:text-slate-400">{r.source_row_index + 1}</td>
                  <td className="px-4 py-2 text-ink/80 dark:text-slate-300">{r.skip_reason || "—"}</td>
                </tr>
              ))}
              {result.skippedRecords.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-ink/40 dark:text-slate-500">
                    No records were skipped.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
