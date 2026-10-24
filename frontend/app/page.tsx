import { ActivityBars } from "@/components/Charts";
import { Logo } from "@/components/Logo";
import { ScoreMeter } from "@/components/ScoreMeter";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, LinkButton, Postcode, SectionLabel } from "@/components/ui";

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-grid">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1.5 text-xs font-medium text-teal ring-1 ring-teal/25">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" />
              Built on the NIPOST digital postcode
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Verify any Nigerian address in <span className="text-emerald">seconds</span>, not days.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              VeriPost turns the national postcode into instant, auditable address
              verification for banks and fintechs. We confirm the address is real,
              then bind it to the customer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/demo" variant="primary">
                <Icon path="M5 12h14M13 6l6 6-6 6" />
                Try the live demo
              </LinkButton>
              <LinkButton href="/dashboard" variant="secondary">
                View the dashboard
              </LinkButton>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-2">
                <span className="text-emerald"><Icon path="M20 6 9 17l-5-5" /></span>
                Under 2 seconds
              </span>
              <span className="flex items-center gap-2">
                <span className="text-emerald"><Icon path="M20 6 9 17l-5-5" /></span>
                No field agents
              </span>
              <span className="flex items-center gap-2">
                <span className="text-emerald"><Icon path="M20 6 9 17l-5-5" /></span>
                Audit trail
              </span>
            </div>
          </div>

          {/* Sample result card */}
          <div className="animate-fade-up [animation-delay:120ms]">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <SectionLabel>Verified Address Record</SectionLabel>
                <StatusBadge status="VERIFIED" />
              </div>
              <div className="mt-5 flex items-center gap-5">
                <ScoreMeter score={92} status="VERIFIED" size={130} />
                <div className="min-w-0">
                  <Postcode code="LA-11-B14-IK-07" className="text-lg font-semibold text-fg" />
                  <p className="mt-1 text-sm text-muted">12 Obafemi Awolowo Way</p>
                  <p className="text-sm text-muted">Ikeja GRA, Lagos</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-card-raised px-2 py-1 font-mono text-muted ring-1 ring-border">
                      building unit match
                    </span>
                    <span className="rounded-md bg-card-raised px-2 py-1 font-mono text-muted ring-1 ring-border">
                      14m
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-border bg-card-raised p-3">
                <p className="font-mono text-[11px] leading-relaxed text-muted-weak">
                  <span className="text-emerald">signed</span> · eyJhbGciOiJIUzI1Ni, exp 90d ·
                  bind(location → postcode)
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Cost strip */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { k: "₦1,500 to₦3,500", v: "Cost per manual address check today" },
            { k: "3 to7 days", v: "Wait for a physical agent to visit" },
            { k: "1 API call", v: "What VeriPost replaces that with" },
          ].map((s) => (
            <div key={s.v} className="px-6 py-8">
              <p className="font-display text-2xl font-bold text-fg sm:text-3xl">{s.k}</p>
              <p className="mt-1 text-sm text-muted">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Three steps from a postcode to a trusted address.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Resolve",
              d: "The customer enters their postcode. We check it is valid and resolve the official administrative and house address from the NIPOST registry.",
              tag: "Lookup L1 and L2",
            },
            {
              n: "02",
              t: "Bind",
              d: "We reverse-geocode the customer's live location and compare the nearest real postcode to the one they claimed. This binds the address to the person.",
              tag: "Reverse geocode",
            },
            {
              n: "03",
              t: "Attest",
              d: "We return a signed Verified Address Record with a confidence score, and keep an audit log the bank can retrieve at any time.",
              tag: "Signed record",
            },
          ].map((step) => (
            <Card key={step.n} className="p-6 transition-transform duration-200 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-teal">{step.n}</span>
                <span className="rounded-md bg-card-raised px-2 py-1 font-mono text-[11px] text-muted ring-1 ring-border">
                  {step.tag}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{step.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Scoring explainer */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionLabel>Why a score, not a yes or no</SectionLabel>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              A valid postcode proves nothing on its own.
            </h2>
            <p className="mt-4 text-muted">
              Anyone can type a real code. The signal that matters is whether the
              live location supports the claim. We grade it so a customer who is
              simply away from home is flagged for review, not rejected, and can be
              reconfirmed on a later session.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                ["Verified", "Live location matches the claimed postcode", "VERIFIED"],
                ["Flagged", "Partial match, route to step-up review", "FLAGGED"],
                ["Unverified", "Location does not support the claim", "UNVERIFIED"],
                ["Rejected", "Postcode is not in the NIPOST registry", "REJECTED"],
              ].map(([, d, s]) => (
                <li key={s} className="flex items-center gap-3">
                  <StatusBadge status={s as never} />
                  <span className="text-muted">{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-weak">
              Confidence score
            </p>
            <div className="mt-4 space-y-4">
              {[
                { label: "Location match depth", range: "0 to50", width: 76 },
                { label: "Distance to real unit", range: "0 to25", width: 58 },
                { label: "NIPOST confidence grade", range: "0 to25", width: 64 },
                { label: "Repeat presence confirmations", range: "0 to20", width: 40 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm">
                    <span className="text-fg">{row.label}</span>
                    <span className="font-mono text-muted">{row.range}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal to-emerald-bright"
                      style={{ width: `${row.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* API usage */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionLabel>Meaningful use of the NIPOST API</SectionLabel>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Four NIPOST tools, each doing real work.
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {[
            ["Search", "Segment-aware autocomplete powers the postcode field, so customers enter a real code the first time."],
            ["Lookup Level 1", "Instant validity check. Malformed or fake codes are rejected before anything else runs."],
            ["Lookup Levels 2 to 3", "Resolves the official administrative and house address that becomes the verified record."],
            ["Reverse geocode", "Takes the live location and returns the nearest real postcode, which we match to the claim."],
          ].map(([t, d]) => (
            <Card key={t} className="flex items-start gap-4 p-6">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                <Icon path="M20 6 9 17l-5-5" />
              </span>
              <div>
                <h3 className="font-semibold text-fg">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Compliance */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionLabel>Responsible by design</SectionLabel>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Nigeria Data Protection Act", "Consent captured before any location read, with data minimised to the score."],
              ["Test data only", "The demo runs on the NIPOST sandbox. No real residential data is used."],
              ["No stored identity", "Customers are a pseudonymous reference, never a real name."],
              ["Hashed keys", "Client API keys are stored only as hashes. The raw key is shown once."],
            ].map(([t, d]) => (
              <div key={t}>
                <p className="font-semibold text-fg">{t}</p>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Card className="overflow-hidden">
          <div className="grid items-center gap-8 p-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                See a verification run end to end.
              </h2>
              <p className="mt-3 max-w-lg text-muted">
                Walk through a bank onboarding flow, then watch the result land on
                the developer dashboard in real time.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton href="/demo" variant="primary">Open the demo</LinkButton>
                <LinkButton href="/dashboard" variant="secondary">Open the dashboard</LinkButton>
              </div>
            </div>
            <div className="hidden lg:block">
              <ActivityBars
                daily={Array.from({ length: 14 }, (_, i) => ({
                  date: `d${i}`,
                  total: 3 + Math.round(Math.abs(Math.sin(i)) * 9),
                  verified: 2 + Math.round(Math.abs(Math.sin(i)) * 6),
                }))}
              />
            </div>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <Logo />
          <p>A prototype for the Built on Nigeria&apos;s Postcode showcase.</p>
          <p className="font-mono text-xs text-muted-weak">VeriPost · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
