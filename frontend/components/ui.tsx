import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-weak">
      {children}
    </p>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "teal" | "emerald";
}) {
  const tones = {
    neutral: "bg-card-raised text-muted ring-1 ring-border",
    teal: "bg-teal/10 text-teal ring-1 ring-teal/25",
    emerald: "bg-emerald/10 text-emerald ring-1 ring-emerald/25",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

const buttonVariants = {
  primary:
    "bg-emerald text-white hover:bg-emerald-bright hover:-translate-y-0.5 shadow-[0_8px_20px_-8px_rgb(var(--emerald)/0.6)]",
  secondary:
    "bg-card text-fg ring-1 ring-border hover:ring-teal/50 hover:-translate-y-0.5",
  ghost: "text-muted hover:text-fg hover:bg-card-raised",
} as const;

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  href,
  variant = "primary",
  className = "",
}: ButtonProps & { href: string }) {
  return (
    <Link href={href} className={`${buttonBase} ${buttonVariants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Postcode({ code, className = "" }: { code: string; className?: string }) {
  return <span className={`postcode ${className}`}>{code}</span>;
}
