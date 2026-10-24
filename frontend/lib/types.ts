export type Status = "VERIFIED" | "FLAGGED" | "UNVERIFIED" | "REJECTED";

export interface ScoreBreakdown {
  depthPoints: number;
  distancePoints: number;
  confidencePoints: number;
  presenceBonus: number;
}

export interface VerifyResponse {
  id: string;
  customer_ref: string;
  postcode: string;
  status: Status;
  score: number;
  match_depth: string;
  distance_m: number | null;
  confidence: string | null;
  reverse_postcode: string | null;
  address: {
    administrative_address?: {
      state_name?: string;
      lga_name?: string;
      locality_name?: string;
      zone?: string;
    } | null;
    recent_house_address?: { recent: string } | null;
  } | null;
  reason: string;
  breakdown: ScoreBreakdown | null;
  record: { jti: string; token: string; issuedAt: string; expiresAt: string } | null;
  provider: string;
  created_at: string;
}

export interface DemoBuilding {
  postcode: string;
  lat: number;
  lng: number;
  locality?: string;
  state?: string;
}

export interface Stats {
  total: number;
  last_24h: number;
  avg_score: number;
  pass_rate: number;
  status_counts: Record<Status, number>;
  daily: { date: string; total: number; verified: number }[];
}

export interface VerificationRow {
  id: string;
  client: string;
  customer_ref: string;
  postcode: string;
  status: Status;
  score: number;
  match_depth: string;
  distance_m: number | null;
  confidence: string | null;
  provider: string;
  presence_confirmations: number;
  created_at: string;
}
