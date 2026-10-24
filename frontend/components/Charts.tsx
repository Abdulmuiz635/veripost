import type { Stats } from "@/lib/types";

interface Segment {
  label: string;
  value: number;
  strokeClass: string;
  textClass: string;
}

export function StatusDonut({ counts }: { counts: Stats["status_counts"] }) {
  const segments: Segment[] = [
    { label: "Verified", value: counts.VERIFIED, strokeClass: "stroke-emerald-bright", textClass: "text-emerald" },
    { label: "Flagged", value: counts.FLAGGED, strokeClass: "stroke-amber-bright", textClass: "text-amber" },
    { label: "Unverified", value: counts.UNVERIFIED, strokeClass: "stroke-muted", textClass: "text-muted" },
    { label: "Rejected", value: counts.REJECTED, strokeClass: "stroke-rose", textClass: "text-rose" },
  ];
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = 42;
  const c = 2 * Math.PI * r;

  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} className="stroke-border" strokeWidth="9" fill="none" />
          {total > 0 &&
            segments.map((s) => {
              if (s.value === 0) return null;
              const frac = s.value / total;
              const dash = frac * c;
              const gap = c - dash;
              const offset = -acc * c;
              acc += frac;
              return (
                <circle
                  key={s.label}
                  cx="50"
                  cy="50"
                  r={r}
                  className={s.strokeClass}
                  strokeWidth="9"
                  fill="none"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={offset}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold tabular-nums">{total}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-weak">
            total
          </span>
        </div>
      </div>
      <ul className="flex-1 space-y-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-sm ${s.strokeClass.replace("stroke", "bg")}`} />
              <span className="text-muted">{s.label}</span>
            </span>
            <span className={`font-mono font-semibold tabular-nums ${s.textClass}`}>
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ActivityBars({ daily }: { daily: Stats["daily"] }) {
  const max = Math.max(1, ...daily.map((d) => d.total));
  return (
    <div>
      <div className="flex h-32 items-end gap-1.5">
        {daily.map((d) => {
          const h = (d.total / max) * 100;
          const vh = d.total > 0 ? (d.verified / d.total) * 100 : 0;
          return (
            <div
              key={d.date}
              className="group relative flex h-full flex-1 flex-col justify-end"
              title={`${d.date}: ${d.total} checks, ${d.verified} verified`}
            >
              <div
                className="w-full rounded-t-md bg-teal/25"
                style={{ height: `${Math.max(4, h)}%` }}
              >
                <div
                  className="w-full rounded-t-md bg-emerald-bright"
                  style={{ height: `${vh}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-weak">
        <span>{daily[0]?.date.slice(5)}</span>
        <span>today</span>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-bright" /> Verified
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-teal/25" /> Other outcomes
        </span>
      </div>
    </div>
  );
}
