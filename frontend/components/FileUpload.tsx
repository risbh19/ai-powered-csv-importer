"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  onFileSelected: (file: File) => void;
  error?: string | null;
};

const MESSY_HEADERS = ["Contact No.", "e-Mail", "Lead Src", "Full_Name", "Ph#", "Created"];
const CRM_CHIPS = ["mobile_without_country_code", "email", "data_source", "name", "created_at"];

export default function FileUpload({ onFileSelected, error }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) return;
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Signature element: messy, arbitrary CSV headers converge onto the
          fixed GrowEasy CRM schema — the thesis of this whole tool, drawn. */}
      <svg
        viewBox="0 0 560 160"
        className="hidden w-full max-w-xl text-ink/70 sm:block"
        aria-hidden
      >
        {MESSY_HEADERS.map((label, i) => {
          const y = 14 + i * 26;
          const targetY = 20 + (i % CRM_CHIPS.length) * 30;
          return (
            <g key={label}>
              <path
                d={`M 130 ${y} C 260 ${y}, 300 ${targetY}, 400 ${targetY}`}
                fill="none"
                stroke="#D6DAE2"
                strokeWidth="1.5"
              />
              <rect x="0" y={y - 11} width="126" height="22" rx="11" fill="#FFFFFF" stroke="#E4E7EC" />
              <text x="63" y={y + 4} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="#6B7080">
                {label}
              </text>
            </g>
          );
        })}
        {CRM_CHIPS.map((label, i) => {
          const y = 20 + i * 30;
          return (
            <g key={label}>
              <rect x="400" y={y - 11} width="160" height="22" rx="11" fill="#EEF0FD" stroke="#4C5FD5" />
              <text x="480" y={y + 4} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono)" fill="#3A47A8">
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={[
          "flex w-full max-w-xl cursor-pointer flex-col items-center gap-3 rounded-card border-2 border-dashed px-8 py-14 text-center transition-colors",
          isDragging
            ? "border-accent bg-accent-soft dark:bg-accent/10"
            : "border-line bg-white hover:border-accent/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-accent/60",
        ].join(" ")}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-dark dark:bg-accent/10 dark:text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-display text-lg font-medium text-ink dark:text-slate-100">Drop your CSV here</p>
        <p className="text-sm text-ink/50 dark:text-slate-400">or click to browse — any column layout works</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="max-w-xl rounded-lg bg-danger-soft px-4 py-2 text-sm text-danger dark:bg-danger/10" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
