"use client";

import { useEffect, useRef, useState } from "react";

interface Suggestion {
  code: string;
  label: string;
}

export function PostcodeInput({
  value,
  onValueChange,
  onSelect,
  placeholder = "e.g. LA 21 B14 IK 07",
}: {
  value: string;
  onValueChange: (v: string) => void;
  onSelect: (code: string) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (!cancelled) {
          setSuggestions(json?.data?.suggestions ?? []);
          setOpen(true);
          setActive(-1);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function choose(s: Suggestion) {
    onValueChange(s.code);
    onSelect(s.code);
    setOpen(false);
    setSuggestions([]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-weak">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </span>
        <input
          value={value}
          onChange={(e) => onValueChange(e.target.value.toUpperCase())}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          aria-label="NIPOST postcode"
          autoComplete="off"
          spellCheck={false}
          className="postcode w-full rounded-xl border border-border bg-card py-3.5 pl-12 pr-4 text-base text-fg outline-none transition-colors placeholder:text-muted-weak placeholder:tracking-normal focus:border-teal/60"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-teal" />
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-card"
        >
          {suggestions.map((s, i) => (
            <li key={s.code} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(s)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  i === active ? "bg-teal/10" : "hover:bg-card-raised"
                }`}
              >
                <span className="postcode text-sm font-medium text-fg">{s.code}</span>
                <span className="ml-auto truncate text-xs text-muted">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
