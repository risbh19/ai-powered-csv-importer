import { Step } from "@/lib/types";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview & confirm" },
  { key: "results", label: "Mapped results" },
];

export default function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "pending";
        return (
          <li key={step.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-medium",
                  state === "done" && "bg-accent text-white",
                  state === "active" &&
                    "bg-accent-soft text-accent-dark ring-1 ring-inset ring-accent dark:bg-accent/10 dark:text-accent",
                  state === "pending" &&
                    "bg-white text-ink/30 ring-1 ring-inset ring-line dark:bg-slate-900 dark:text-slate-600 dark:ring-slate-700",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {i + 1}
              </span>
              <span
                className={[
                  "hidden text-sm sm:inline",
                  state === "pending"
                    ? "text-ink/40 dark:text-slate-600"
                    : "text-ink font-medium dark:text-slate-100",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="h-px w-6 shrink-0 bg-line dark:bg-slate-700 sm:w-10" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
