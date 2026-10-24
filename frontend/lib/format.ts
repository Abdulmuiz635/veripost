import type { Status } from "./types";

export function statusLabel(status: Status): string {
  switch (status) {
    case "VERIFIED":
      return "Verified";
    case "FLAGGED":
      return "Flagged";
    case "UNVERIFIED":
      return "Unverified";
    case "REJECTED":
      return "Rejected";
  }
}

export function statusBlurb(status: Status): string {
  switch (status) {
    case "VERIFIED":
      return "Address bound to the customer. Safe to proceed.";
    case "FLAGGED":
      return "Partial signal. Route to step-up review or reconfirm later.";
    case "UNVERIFIED":
      return "Location does not support the claimed address.";
    case "REJECTED":
      return "Postcode is not valid in the NIPOST registry.";
  }
}

export function depthLabel(depth: string): string {
  const map: Record<string, string> = {
    none: "No match",
    state: "State",
    lga: "LGA",
    district: "District",
    area: "Area",
    unit: "Building unit",
  };
  return map[depth] ?? depth;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
