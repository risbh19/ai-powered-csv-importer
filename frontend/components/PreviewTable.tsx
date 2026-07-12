import { ParsedCsv } from "@/lib/types";

export default function PreviewTable({ data }: { data: ParsedCsv }) {
  return (
    <div className="grow-table max-h-[420px] overflow-auto rounded-card border border-line bg-white dark:border-slate-700 dark:bg-slate-900">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-panel shadow-[0_1px_0_0_#E4E7EC] dark:bg-slate-900 dark:shadow-[0_1px_0_0_#334155]">
          <tr>
            <th className="whitespace-nowrap bg-surface px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wide text-ink/40 dark:bg-slate-800 dark:text-slate-500">
              #
            </th>
            {data.headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap bg-surface px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wide text-ink/50 dark:bg-slate-800 dark:text-slate-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className="border-t border-line even:bg-surface/50 dark:border-slate-800 dark:even:bg-slate-800/30">
              <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-ink/30 dark:text-slate-500">{i + 1}</td>
              {data.headers.map((h) => (
                <td key={h} className="whitespace-nowrap px-4 py-2 text-ink/80 dark:text-slate-300">
                  {row[h] || <span className="text-ink/25 dark:text-slate-600">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
