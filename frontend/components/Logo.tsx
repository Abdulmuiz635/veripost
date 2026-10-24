// VeriPost mark: a clean location pin with a bold verification check,
// in a teal-to-emerald gradient. Pure inline SVG, theme-aware.

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 48"
      className={className}
      fill="none"
      role="img"
      aria-label="VeriPost"
    >
      <defs>
        <linearGradient id="vp-grad" x1="4" y1="2" x2="36" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "rgb(var(--teal))" }} />
          <stop offset="1" style={{ stopColor: "rgb(var(--emerald-bright))" }} />
        </linearGradient>
      </defs>

      {/* Pin */}
      <path
        d="M20 2C11.16 2 4 9.16 4 18c0 11.2 12.1 24.9 15.1 28.1a1.2 1.2 0 0 0 1.8 0C23.9 42.9 36 29.2 36 18 36 9.16 28.84 2 20 2Z"
        fill="url(#vp-grad)"
        fillOpacity="0.14"
        stroke="url(#vp-grad)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Verification check */}
      <path
        d="M12.4 18.8l5.4 5.4L27.8 13.6"
        stroke="url(#vp-grad)"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className = "",
  markClass = "h-8 w-8",
}: {
  className?: string;
  markClass?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClass} />
      <span className="font-display text-xl font-bold tracking-tight">
        <span className="text-fg">Veri</span>
        <span className="text-emerald">Post</span>
      </span>
    </span>
  );
}
