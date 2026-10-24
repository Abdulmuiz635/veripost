import { statusLabel } from "@/lib/format";
import type { Status } from "@/lib/types";

// Static class strings per status so Tailwind keeps them at build time.
const styles: Record<Status, { wrap: string; dot: string }> = {
  VERIFIED: {
    wrap: "bg-emerald/10 text-emerald ring-1 ring-emerald/30",
    dot: "bg-emerald-bright",
  },
  FLAGGED: {
    wrap: "bg-amber/10 text-amber ring-1 ring-amber/30",
    dot: "bg-amber-bright",
  },
  UNVERIFIED: {
    wrap: "bg-muted/10 text-muted ring-1 ring-muted/30",
    dot: "bg-muted",
  },
  REJECTED: {
    wrap: "bg-rose/10 text-rose ring-1 ring-rose/30",
    dot: "bg-rose",
  },
};

export function StatusBadge({ status, size = "sm" }: { status: Status; size?: "sm" | "lg" }) {
  const s = styles[status];
  const pad = size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-semibold ${pad} ${s.wrap}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
