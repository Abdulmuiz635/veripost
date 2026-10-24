"use client";

import { useCallback, useEffect, useState } from "react";
import { ActivityBars, StatusDonut } from "@/components/Charts";
import { ScoreBar } from "@/components/ScoreMeter";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, Pill, Postcode, SectionLabel } from "@/components/ui";
import { depthLabel, relativeTime, timeOfDay } from "@/lib/format";
import type { Stats, Status, VerificationRow } from "@/lib/types";

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "VERIFIED", label: "Verified" },
  { key: "FLAGGED", label: "Flagged" },
  { key: "UNVERIFIED", label: "Unverified" },
  { key: "REJECTED", label: "Rejected" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/verifications?${params.toString()}`);
    const json = await res.json();
    setRows(json?.verifications ?? []);
  }, [filter, q]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      loadRows(),
    ])
      .then(([s]) => setStats(s))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(loadRows, 200);
    return () => clearTimeout(t);
  }, [loadRows]);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Verification dashboard
            </h1>
            <p className="mt-1 text-muted">Live verification activity and outcomes.</p>
          </div>
          {stats && (
            <Pill tone="teal">
              {stats.total} total checks
            </Pill>
          )}
        </div>

        {/* Stat tiles */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Total verifications" value={stats?.total ?? "-"} />
          <StatTile label="Pass rate" value={stats ? `${stats.pass_rate}%` : "-"} accent="emerald" />
          <StatTile label="Avg confidence" value={stats?.avg_score ?? "-"} />
          <StatTile label="Last 24 hours" value={stats?.last_24h ?? "-"} accent="teal" />
        </div>

        {/* Charts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <SectionLabel>Outcome breakdown</SectionLabel>
            <div className="mt-5">
              {stats ? <StatusDonut counts={stats.status_counts} /> : <Skeleton h={140} />}
            </div>
          </Card>
          <Card className="p-6">
            <SectionLabel>Activity, last 14 days</SectionLabel>
            <div className="mt-5">
              {stats ? <ActivityBars daily={stats.daily} /> : <Skeleton h={140} />}
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card className="mt-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    filter === f.key
                      ? "bg-ink text-white"
                      : "text-muted hover:bg-card-raised hover:text-fg"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search postcode or customer"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-teal/60 sm:w-64"
            />
          </div>

          <div className="scroll-slim hidden max-h-[540px] overflow-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-card-raised/90 backdrop-blur">
                <tr className="text-xs uppercase tracking-wider text-muted-weak">
                  <th className="px-4 py-3 font-medium">Postcode</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Match</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">When</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted">
                      No verifications match this view.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r.id)}
                    className="cursor-pointer border-t border-border transition-colors hover:bg-card-raised"
                  >
                    <td className="px-4 py-3">
                      <Postcode code={r.postcode} className="text-fg" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{r.customer_ref}</td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">
                      {depthLabel(r.match_depth)}
                      {r.distance_m != null && (
                        <span className="ml-1 text-muted-weak">· {r.distance_m}m</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={r.score} status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-muted md:table-cell">
                      {relativeTime(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="divide-y divide-border sm:hidden">
            {loading && rows.length === 0 && (
              <p className="px-4 py-12 text-center text-muted">Loading…</p>
            )}
            {!loading && rows.length === 0 && (
              <p className="px-4 py-12 text-center text-muted">
                No verifications match this view.
              </p>
            )}
            {rows.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className="flex w-full flex-col gap-2 px-4 py-4 text-left transition-colors hover:bg-card-raised"
              >
                <div className="flex items-center justify-between gap-3">
                  <Postcode code={r.postcode} className="text-fg" />
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-muted">{r.customer_ref}</span>
                  <ScoreBar score={r.score} status={r.status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-weak">
                  <span>
                    {depthLabel(r.match_depth)}
                    {r.distance_m != null && ` · ${r.distance_m}m`}
                  </span>
                  <span className="ml-auto">{relativeTime(r.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {selected && <DetailDrawer id={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "emerald" | "teal";
}) {
  const accentClass =
    accent === "emerald" ? "text-emerald" : accent === "teal" ? "text-teal" : "text-fg";
  return (
    <Card className="p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-weak">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${accentClass}`}>{value}</p>
    </Card>
  );
}

function Skeleton({ h }: { h: number }) {
  return <div className="w-full animate-pulse rounded-xl bg-card-raised" style={{ height: h }} />;
}

interface Detail {
  id: string;
  client: string;
  customer_ref: string;
  postcode: string;
  status: Status;
  score: number;
  match_depth: string;
  distance_m: number | null;
  confidence: string | null;
  reverse_postcode: string | null;
  address: {
    administrative_address?: { state_name?: string; lga_name?: string; locality_name?: string };
    recent_house_address?: { recent: string };
  } | null;
  gps: { lat: number; lng: number } | null;
  record_jti: string | null;
  provider: string;
  presence_confirmations: number;
  presence_events: { id: string; postcode: string; distance_m: number | null; confidence: string | null; created_at: string }[];
  created_at: string;
}

function DetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const [d, setD] = useState<Detail | null>(null);

  useEffect(() => {
    fetch(`/api/verifications/${id}`)
      .then((r) => r.json())
      .then(setD)
      .catch(() => setD(null));
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative h-full w-full max-w-md animate-fade-up overflow-auto border-l border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <SectionLabel>Verification detail</SectionLabel>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted hover:bg-card-raised hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {!d ? (
          <div className="mt-8"><Skeleton h={200} /></div>
        ) : (
          <div className="mt-5 space-y-6">
            <div className="flex items-center gap-4">
              <StatusBadge status={d.status} size="lg" />
              <span className="font-display text-2xl font-bold tabular-nums">{d.score}</span>
            </div>

            <Postcode code={d.postcode} className="block text-lg font-semibold text-fg" />

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <DRow label="Client">{d.client}</DRow>
              <DRow label="Customer">{d.customer_ref}</DRow>
              <DRow label="Match depth">{depthLabel(d.match_depth)}</DRow>
              <DRow label="Distance">{d.distance_m != null ? `${d.distance_m} m` : "-"}</DRow>
              <DRow label="Confidence">{d.confidence ?? "-"}</DRow>
              <DRow label="Nearest unit">
                {d.reverse_postcode ? <Postcode code={d.reverse_postcode} /> : "-"}
              </DRow>
              <DRow label="Provider">{d.provider}</DRow>
              <DRow label="Confirmations">{d.presence_confirmations}</DRow>
            </dl>

            {d.address?.administrative_address && (
              <div className="rounded-xl border border-border bg-card-raised p-4">
                <SectionLabel>Resolved address</SectionLabel>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-weak">
                      House address
                    </p>
                    <p className="mt-1 text-sm text-fg">
                      {d.address.recent_house_address?.recent ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-weak">
                      Administrative area
                    </p>
                    <p className="mt-1 text-sm text-fg">
                      {[
                        d.address.administrative_address.locality_name,
                        d.address.administrative_address.lga_name
                          ? `${d.address.administrative_address.lga_name} LGA`
                          : null,
                        d.address.administrative_address.state_name,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <SectionLabel>Presence timeline</SectionLabel>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-teal" />
                  <div className="text-sm">
                    <p className="text-fg">Initial verification</p>
                    <p className="font-mono text-xs text-muted-weak">
                      {new Date(d.created_at).toLocaleString()}
                    </p>
                  </div>
                </li>
                {d.presence_events.map((e) => (
                  <li key={e.id} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-bright" />
                    <div className="text-sm">
                      <p className="text-fg">
                        Presence confirmed{" "}
                        {e.distance_m != null && (
                          <span className="text-muted">at {e.distance_m}m</span>
                        )}
                      </p>
                      <p className="font-mono text-xs text-muted-weak">
                        {timeOfDay(e.created_at)} · {relativeTime(e.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {d.record_jti && (
              <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-4">
                <SectionLabel>Record id (audit)</SectionLabel>
                <p className="mt-1 break-all font-mono text-xs text-muted">{d.record_jti}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-weak">{label}</dt>
      <dd className="mt-0.5 font-medium text-fg">{children}</dd>
    </div>
  );
}
