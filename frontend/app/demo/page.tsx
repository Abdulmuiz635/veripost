"use client";

import { useEffect, useMemo, useState } from "react";
import { PostcodeInput } from "@/components/PostcodeInput";
import { ScoreMeter } from "@/components/ScoreMeter";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button, Card, Pill, Postcode, SectionLabel } from "@/components/ui";
import { depthLabel, statusBlurb } from "@/lib/format";
import type { DemoBuilding, VerifyResponse } from "@/lib/types";

type LocMode = "at" | "elsewhere" | "away" | "skip" | "real";

function normalize(code: string) {
  return code.replace(/[\s-]/g, "").toUpperCase();
}

export default function DemoPage() {
  const [buildings, setBuildings] = useState<DemoBuilding[]>([]);
  const [liveMode, setLiveMode] = useState(false);
  const [providerMode, setProviderMode] = useState("mock");
  const [postcode, setPostcode] = useState("");
  const [customerRef, setCustomerRef] = useState("");
  const [locMode, setLocMode] = useState<LocMode>("at");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setCustomerRef("cust_" + Math.random().toString(36).slice(2, 8));
    fetch("/api/demo-buildings")
      .then((r) => r.json())
      .then((j) => {
        const list: DemoBuilding[] = j?.buildings ?? [];
        setBuildings(list);
        setProviderMode(j?.provider ?? "mock");
        if (list.length === 0) {
          setLiveMode(true);
          setLocMode("real");
        } else {
          setPostcode(list[0].postcode);
        }
      })
      .catch(() => setLiveMode(true));
  }, []);

  const claimedBuilding = useMemo(
    () => buildings.find((b) => normalize(b.postcode) === normalize(postcode)),
    [buildings, postcode]
  );
  const otherBuilding = useMemo(
    () => buildings.find((b) => normalize(b.postcode) !== normalize(postcode)),
    [buildings, postcode]
  );

  async function locationForMode(mode: LocMode): Promise<{ lat: number; lng: number } | null> {
    if (mode === "skip") return null;
    if (mode === "real") {
      return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    }
    if (mode === "at" && claimedBuilding) {
      return { lat: claimedBuilding.lat + 0.00007, lng: claimedBuilding.lng - 0.00006 };
    }
    if (mode === "elsewhere" && otherBuilding) {
      return { lat: otherBuilding.lat + 0.00005, lng: otherBuilding.lng };
    }
    if (mode === "away" && claimedBuilding) {
      return { lat: claimedBuilding.lat + 0.02, lng: claimedBuilding.lng + 0.02 };
    }
    return null;
  }

  async function runVerify() {
    setLoading(true);
    setError(null);
    setNote(null);
    try {
      const location = await locationForMode(locMode);
      if (locMode === "real" && !location) {
        setError("Could not read your location. Allow location access or pick Skip.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode, customer_ref: customerRef, location: location ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Verification failed.");
      } else {
        setResult(data as VerifyResponse);
      }
    } catch {
      setError("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function reconfirm() {
    if (!claimedBuilding) {
      setNote("Reconfirm needs a known sandbox building.");
      return;
    }
    setLoading(true);
    try {
      const location = { lat: claimedBuilding.lat + 0.00006, lng: claimedBuilding.lng };
      const res = await fetch("/api/reconfirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_ref: customerRef, location, postcode }),
      });
      const data = await res.json();
      if (res.ok && result) {
        setResult({
          ...result,
          status: data.status,
          score: data.score,
          match_depth: data.match_depth,
          distance_m: data.distance_m,
          confidence: data.confidence,
          reason: data.reason,
          record: data.record ?? result.record,
        });
        setNote(
          `Later session logged. ${data.presence_confirmations} presence confirmation(s) on record.`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setNote(null);
    setCustomerRef("cust_" + Math.random().toString(36).slice(2, 8));
    setLocMode(liveMode ? "real" : "at");
  }

  const locOptions: { mode: LocMode; label: string; hint: string }[] = liveMode
    ? [
        { mode: "real", label: "Use my location", hint: "Reads your real device GPS" },
        { mode: "skip", label: "Skip for now", hint: "Verify without a location signal" },
      ]
    : [
        { mode: "at", label: "At this address", hint: "Expected: Verified" },
        { mode: "elsewhere", label: "A different address", hint: "Expected: Unverified" },
        { mode: "away", label: "Away from home", hint: "Expected: Flagged" },
        { mode: "skip", label: "Skip location", hint: "Expected: Flagged" },
      ];

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Bank onboarding demo
            </h1>
            <p className="mt-1 text-muted">
              The left is the customer in a bank app. The right is what your backend receives.
            </p>
          </div>
          <Pill tone={providerMode === "mock" ? "teal" : "emerald"}>
            {providerMode === "hybrid"
              ? "Live NIPOST reference + sandbox"
              : providerMode === "live"
                ? "Live NIPOST API"
                : "NIPOST sandbox"}
          </Pill>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
          {/* Phone */}
          <div className="mx-auto w-full max-w-[380px]">
            <div className="rounded-[2.2rem] border border-border bg-card p-3 shadow-card">
              <div className="overflow-hidden rounded-[1.7rem] border border-border bg-bg">
                {/* App bar */}
                <div className="flex items-center justify-between bg-ink px-4 py-3 text-white">
                  <span className="text-sm font-semibold">First Harvest Bank</span>
                  <span className="font-mono text-[10px] text-white/60">KYC · Tier 3</span>
                </div>

                <div className="bg-grid p-5">
                  {!result ? (
                    <div className="animate-fade-up space-y-5">
                      <div>
                        <h2 className="font-display text-lg font-semibold">Verify your address</h2>
                        <p className="mt-1 text-sm text-muted">
                          Enter your NIPOST postcode to confirm where you live.
                        </p>
                      </div>

                      <PostcodeInput
                        value={postcode}
                        onValueChange={setPostcode}
                        onSelect={setPostcode}
                      />

                      <div>
                        <SectionLabel>
                          {liveMode ? "Location" : "Simulate device location"}
                        </SectionLabel>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {locOptions.map((o) => (
                            <button
                              key={o.mode}
                              type="button"
                              onClick={() => setLocMode(o.mode)}
                              className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                                locMode === o.mode
                                  ? "border-teal/60 bg-teal/10 text-fg"
                                  : "border-border bg-card text-muted hover:border-teal/40"
                              }`}
                            >
                              <span className="block font-medium">{o.label}</span>
                              <span className="mt-0.5 block text-[11px] text-muted-weak">
                                {o.hint}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={runVerify}
                        disabled={loading || postcode.trim().length < 4}
                        className="w-full"
                      >
                        {loading ? "Verifying…" : "Verify address"}
                      </Button>

                      {error && (
                        <p role="alert" className="text-sm text-rose">
                          {error}
                        </p>
                      )}

                      <p className="text-center font-mono text-[10px] text-muted-weak">
                        Consent: location used once to verify this address.
                      </p>
                    </div>
                  ) : (
                    <ResultScreen
                      result={result}
                      onReset={reset}
                      onReconfirm={reconfirm}
                      loading={loading}
                      note={note}
                    />
                  )}
                </div>
              </div>
            </div>
            {!liveMode && (
              <p className="mt-3 text-center text-xs text-muted-weak">
                Sandbox postcodes only. Try{" "}
                <button
                  className="font-mono text-teal underline-offset-2 hover:underline"
                  onClick={() => setPostcode("LA-11-B14-IK-07")}
                >
                  LA-11-B14-IK-07
                </button>
              </p>
            )}
          </div>

          {/* Developer response panel */}
          <DevPanel result={result} />
        </div>
      </div>
    </div>
  );
}

function ResultScreen({
  result,
  onReset,
  onReconfirm,
  loading,
  note,
}: {
  result: VerifyResponse;
  onReset: () => void;
  onReconfirm: () => void;
  loading: boolean;
  note: string | null;
}) {
  return (
    <div className="animate-fade-up space-y-4 text-center">
      <div className="flex justify-center">
        <ScoreMeter score={result.score} status={result.status} size={128} />
      </div>
      <StatusBadge status={result.status} size="lg" />
      <p className="text-sm text-muted">{statusBlurb(result.status)}</p>
      <Postcode code={result.postcode} className="block text-sm font-semibold text-fg" />

      {note && (
        <p className="rounded-lg bg-emerald/10 px-3 py-2 text-xs text-emerald">{note}</p>
      )}

      {(result.status === "FLAGGED" || result.status === "UNVERIFIED") && (
        <Button variant="secondary" onClick={onReconfirm} disabled={loading} className="w-full">
          {loading ? "Checking…" : "Simulate a later session at home"}
        </Button>
      )}
      <button
        onClick={onReset}
        className="w-full rounded-lg py-2 text-sm font-medium text-muted hover:text-fg"
      >
        Start over
      </button>
    </div>
  );
}

function DevPanel({ result }: { result: VerifyResponse | null }) {
  if (!result) {
    return (
      <Card className="flex min-h-[420px] flex-col items-center justify-center p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card-raised text-muted-weak">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-4 font-medium text-fg">Run a verification</p>
        <p className="mt-1 max-w-xs text-sm text-muted">
          The signed response your backend receives will appear here, with the score breakdown and audit fields.
        </p>
      </Card>
    );
  }

  const addr = result.address?.administrative_address;
  const house = result.address?.recent_house_address?.recent;
  const b = result.breakdown;

  return (
    <Card className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <SectionLabel>VeriPost API response</SectionLabel>
        <Pill tone={result.provider === "mock" ? "teal" : "emerald"}>{result.provider}</Pill>
      </div>

      <div className="mt-5 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <ScoreMeter score={result.score} status={result.status} size={128} />
        <div>
          <StatusBadge status={result.status} size="lg" />
          <p className="mt-2 text-sm text-muted">{result.reason}</p>
        </div>
      </div>

      {/* Fields */}
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 text-sm sm:grid-cols-4">
        <Field label="Postcode"><Postcode code={result.postcode} className="text-fg" /></Field>
        <Field label="Match depth">{depthLabel(result.match_depth)}</Field>
        <Field label="Distance">{result.distance_m != null ? `${result.distance_m} m` : "-"}</Field>
        <Field label="Confidence">{result.confidence ?? "-"}</Field>
      </dl>

      {/* Resolved address */}
      {addr && (
        <div className="mt-6 rounded-xl border border-border bg-card-raised p-4">
          <SectionLabel>Resolved address (NIPOST)</SectionLabel>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-weak">
                House address
              </p>
              <p className="mt-1 text-sm text-fg">{house ?? "-"}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-weak">
                Administrative area
                <span className="ml-1.5 rounded bg-emerald/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald">
                  live
                </span>
              </p>
              <p className="mt-1 text-sm text-fg">
                {[
                  addr.locality_name,
                  addr.lga_name ? `${addr.lga_name} LGA` : null,
                  addr.state_name,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown */}
      {b && (
        <div className="mt-6">
          <SectionLabel>Score breakdown</SectionLabel>
          <div className="mt-3 space-y-2.5">
            <Bar label="Location match depth" value={b.depthPoints} max={50} />
            <Bar label="Distance" value={b.distancePoints} max={25} />
            <Bar label="NIPOST confidence" value={b.confidencePoints} max={25} />
            <Bar label="Presence confirmations" value={b.presenceBonus} max={20} />
          </div>
        </div>
      )}

      {/* VAR */}
      {result.record && (
        <div className="mt-6 rounded-xl border border-emerald/30 bg-emerald/5 p-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Signed Verified Address Record</SectionLabel>
            <span className="font-mono text-[11px] text-emerald">
              exp {new Date(result.record.expiresAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-muted">
            {result.record.token.slice(0, 96)}…
          </p>
        </div>
      )}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-weak">{label}</dt>
      <dd className="mt-1 font-medium text-fg">{children}</dd>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-muted-weak">
          {value}/{max}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal to-emerald-bright"
          style={{ width: `${Math.max(3, pct)}%` }}
        />
      </div>
    </div>
  );
}
