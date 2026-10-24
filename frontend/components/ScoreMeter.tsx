import { statusLabel } from "@/lib/format";
import type { Status } from "@/lib/types";

const ringStroke: Record<Status, string> = {
  VERIFIED: "stroke-emerald-bright",
  FLAGGED: "stroke-amber-bright",
  UNVERIFIED: "stroke-muted",
  REJECTED: "stroke-rose",
};

export function ScoreMeter({
  score,
  status,
  size = 150,
}: {
  score: number;
  status: Status;
  size?: number;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const offset = c * (1 - pct);

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Confidence score ${score} of 100, status ${statusLabel(status)}`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} className="stroke-border" strokeWidth="7" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={r}
          className={`${ringStroke[status]} transition-[stroke-dashoffset] duration-700 ease-out`}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold leading-none tabular-nums">
          {score}
        </span>
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-weak">
          of 100
        </span>
      </div>
    </div>
  );
}

// Compact horizontal variant with threshold markers, for list rows.
export function ScoreBar({ score, status }: { score: number; status: Status }) {
  const fill: Record<Status, string> = {
    VERIFIED: "bg-emerald-bright",
    FLAGGED: "bg-amber-bright",
    UNVERIFIED: "bg-muted",
    REJECTED: "bg-rose",
  };
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${fill[status]}`}
          style={{ width: `${Math.max(2, score)}%` }}
        />
      </div>
      <span className="w-7 text-right font-mono text-xs tabular-nums text-muted">{score}</span>
    </div>
  );
}
