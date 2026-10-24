// NIPOST Postcode API client.
//
// Two providers behind one interface:
//   - LiveProvider  calls https://api.postcode.gov.ng/v1 with X-API-Key
//   - MockProvider  resolves a small built-in fixture set (the documented
//     sandbox code plus a few synthetic Lagos/FCT buildings), so the whole
//     product runs end-to-end before a key is granted.
//
// Docs: /v1/lookup, /v1/search/autocomplete, /v1/search/reverse
import { config } from "../config";
import { confidenceForDistance, haversineMeters } from "./geo";
import { format, normalize } from "./postcode";

export interface AdministrativeAddress {
  state_name?: string;
  lga_name?: string;
  locality_name?: string;
  zone?: string;
}

export interface LookupResult {
  postcode: string;
  valid: boolean;
  administrative_address?: AdministrativeAddress;
  recent_house_address?: { recent: string };
  building_use_status?: string;
}

export interface ReverseUnit {
  postcode: string;
  display: string;
  distance_m: number;
  confidence: "high" | "medium" | "low";
  state_name?: string;
  lga_name?: string;
  locality_name?: string;
  address?: string;
}

export interface ReverseResult {
  found: boolean;
  coordinate: [number, number]; // [lng, lat]
  radius_m: number;
  unit?: ReverseUnit;
  message?: string;
}

export interface AutocompleteResult {
  segment: "state" | "lga" | "district" | "area" | "unit";
  suggestions: { code: string; label: string }[];
}

export interface NipostProvider {
  readonly name: "live" | "mock" | "hybrid";
  lookup(code: string, level: number): Promise<LookupResult>;
  reverse(lat: number, lng: number, maxDistanceM?: number): Promise<ReverseResult>;
  autocomplete(q: string): Promise<AutocompleteResult>;
}

// ---------------------------------------------------------------------------
// Live provider
// ---------------------------------------------------------------------------

class LiveProvider implements NipostProvider {
  readonly name = "live" as const;

  constructor(
    private base: string,
    private apiKey: string
  ) {}

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: { "X-API-Key": this.apiKey, Accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new NipostError(res.status, body || res.statusText);
    }
    const json = (await res.json()) as { data: T };
    return json.data;
  }

  lookup(code: string, level: number): Promise<LookupResult> {
    const params = new URLSearchParams({ code: format(code), level: String(level) });
    return this.get<LookupResult>(`/lookup?${params.toString()}`);
  }

  reverse(lat: number, lng: number, maxDistanceM = 250): Promise<ReverseResult> {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      max_distance_m: String(maxDistanceM),
    });
    return this.get<ReverseResult>(`/search/reverse?${params.toString()}`);
  }

  autocomplete(q: string): Promise<AutocompleteResult> {
    const params = new URLSearchParams({ q });
    return this.get<AutocompleteResult>(`/search/autocomplete?${params.toString()}`);
  }
}

// ---------------------------------------------------------------------------
// Mock provider (sandbox fixtures)
// ---------------------------------------------------------------------------

interface MockBuilding {
  postcode: string;
  lat: number;
  lng: number;
  admin: AdministrativeAddress;
  recent: string;
  use: string;
}

// Includes the documented sandbox code FC-01-A01-KP-27 and the docs example
// EK-01-A03-FK-01, plus synthetic Lagos buildings for a richer demo.
export const MOCK_BUILDINGS: MockBuilding[] = [
  {
    // FCT LGA 02 = Abuja Municipal (matches the CBD house address).
    postcode: "FC-02-A01-KP-27",
    lat: 9.057900,
    lng: 7.495100,
    admin: { state_name: "FCT", lga_name: "ABUJA MUNICIPAL", locality_name: "CENTRAL AREA", zone: "NORTH CENTRAL" },
    recent: "SANDBOX HOUSE, CENTRAL BUSINESS DISTRICT, ABUJA",
    use: "commercial",
  },
  {
    postcode: "EK-01-A03-FK-01",
    lat: 7.621000,
    lng: 5.221000,
    admin: { state_name: "EKITI", lga_name: "ADO EKITI", locality_name: "ADO EKITI", zone: "SOUTH WEST" },
    recent: "NTA ROAD, BACK OF FABIAN HOTEL, ADO EKITI",
    use: "residential",
  },
  {
    // LGA codes match the live NIPOST reference (Ikeja = LA 11).
    postcode: "LA-11-B14-IK-07",
    lat: 6.601800,
    lng: 3.351500,
    admin: { state_name: "LAGOS", lga_name: "IKEJA", locality_name: "IKEJA GRA", zone: "SOUTH WEST" },
    recent: "12 OBAFEMI AWOLOWO WAY, IKEJA, LAGOS",
    use: "residential",
  },
  {
    postcode: "LA-08-D02-VI-03",
    lat: 6.428100,
    lng: 3.421900,
    admin: { state_name: "LAGOS", lga_name: "ETI-OSA", locality_name: "VICTORIA ISLAND", zone: "SOUTH WEST" },
    recent: "7 ADEOLA ODEKU STREET, VICTORIA ISLAND, LAGOS",
    use: "commercial",
  },
  {
    postcode: "LA-16-C09-MU-12",
    lat: 6.528000,
    lng: 3.354000,
    admin: { state_name: "LAGOS", lga_name: "MUSHIN", locality_name: "MUSHIN", zone: "SOUTH WEST" },
    recent: "5 IBIOSI STREET, MUSHIN, LAGOS",
    use: "residential",
  },
];

class MockProvider implements NipostProvider {
  readonly name = "mock" as const;

  private find(code: string): MockBuilding | undefined {
    const c = normalize(code);
    return MOCK_BUILDINGS.find((b) => normalize(b.postcode) === c);
  }

  async lookup(code: string, level: number): Promise<LookupResult> {
    const b = this.find(code);
    if (!b) return { postcode: format(code), valid: false };
    const out: LookupResult = { postcode: format(b.postcode), valid: true };
    if (level >= 2) {
      out.administrative_address = b.admin;
      out.recent_house_address = { recent: b.recent };
    }
    if (level >= 3) out.building_use_status = b.use;
    return out;
  }

  async reverse(lat: number, lng: number, maxDistanceM = 250): Promise<ReverseResult> {
    const clamped = Math.min(Math.max(maxDistanceM, 0), 250);
    let best: { b: MockBuilding; d: number } | null = null;
    for (const b of MOCK_BUILDINGS) {
      const d = haversineMeters(lat, lng, b.lat, b.lng);
      if (!best || d < best.d) best = { b, d };
    }
    if (!best || best.d > clamped) {
      return {
        found: false,
        coordinate: [lng, lat],
        radius_m: clamped,
        message: "No active unit within range",
      };
    }
    const conf = confidenceForDistance(best.d);
    return {
      found: true,
      coordinate: [lng, lat],
      radius_m: clamped,
      unit: {
        postcode: format(best.b.postcode),
        display: format(best.b.postcode).replace(/-/g, " "),
        distance_m: Math.round(best.d * 10) / 10,
        confidence: conf,
        state_name: best.b.admin.state_name,
        lga_name: best.b.admin.lga_name,
        locality_name: best.b.admin.locality_name,
        address: best.b.recent,
      },
    };
  }

  async autocomplete(q: string): Promise<AutocompleteResult> {
    const c = normalize(q);
    const matches = MOCK_BUILDINGS.filter((b) => normalize(b.postcode).startsWith(c)).slice(0, 8);
    return {
      segment: "unit",
      suggestions: matches.map((b) => ({
        code: format(b.postcode),
        label: `${format(b.postcode).replace(/-/g, " ")} · ${b.admin.locality_name}`,
      })),
    };
  }
}

export class NipostError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "NipostError";
  }
}

// ---------------------------------------------------------------------------
// Live reference data (states and LGAs). These endpoints work on a test/L1 key
// and return the real national hierarchy, so we use them for real validation.
// ---------------------------------------------------------------------------

class LiveReference {
  private statesCache: Map<string, string> | null = null;
  private lgaCache = new Map<string, Map<string, string>>();

  constructor(
    private base: string,
    private apiKey: string
  ) {}

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: { "X-API-Key": this.apiKey, Accept: "application/json" },
    });
    if (!res.ok) throw new NipostError(res.status, await res.text().catch(() => ""));
    const json = (await res.json()) as { data: T };
    return json.data;
  }

  async states(): Promise<Map<string, string>> {
    if (this.statesCache) return this.statesCache;
    const data = await this.get<{ states: { code: string; name: string }[] }>("/reference/states");
    this.statesCache = new Map(data.states.map((s) => [s.code.toUpperCase(), s.name]));
    return this.statesCache;
  }

  async lgas(state: string): Promise<Map<string, string>> {
    const key = state.toUpperCase();
    const cached = this.lgaCache.get(key);
    if (cached) return cached;
    const data = await this.get<{ lgas: { code: string; name: string }[] }>(
      `/reference/lgas?state=${encodeURIComponent(key)}`
    );
    const map = new Map(data.lgas.map((l) => [l.code, l.name]));
    this.lgaCache.set(key, map);
    return map;
  }

  async health(): Promise<{ ok: boolean; states: number }> {
    try {
      const s = await this.states();
      return { ok: true, states: s.size };
    } catch {
      return { ok: false, states: 0 };
    }
  }
}

// ---------------------------------------------------------------------------
// Hybrid provider: real live state/LGA validation + fixtures for building and
// reverse geocode (which a test/L1 key cannot serve yet). Resilient: if a live
// call fails it falls back to fixture admin names, so the demo never breaks.
// ---------------------------------------------------------------------------

class HybridProvider implements NipostProvider {
  readonly name = "hybrid" as const;
  private ref: LiveReference;
  private mock = new MockProvider();

  constructor(base: string, apiKey: string) {
    this.ref = new LiveReference(base, apiKey);
  }

  reference() {
    return this.ref;
  }

  private async liveNames(code: string): Promise<{ state?: string; lga?: string }> {
    const c = normalize(code);
    const stateCode = c.slice(0, 2);
    const lgaCode = c.slice(2, 4);
    try {
      const states = await this.ref.states();
      const state = states.get(stateCode);
      let lga: string | undefined;
      if (state) {
        const lgas = await this.ref.lgas(stateCode);
        lga = lgas.get(lgaCode);
      }
      return { state, lga };
    } catch {
      return {};
    }
  }

  async lookup(code: string, level: number): Promise<LookupResult> {
    const base = await this.mock.lookup(code, level);
    if (!base.valid) return base;
    if (level >= 2) {
      const live = await this.liveNames(code);
      base.administrative_address = {
        ...base.administrative_address,
        state_name: live.state ?? base.administrative_address?.state_name,
        lga_name: live.lga ?? base.administrative_address?.lga_name,
      };
    }
    return base;
  }

  async reverse(lat: number, lng: number, maxDistanceM?: number): Promise<ReverseResult> {
    const out = await this.mock.reverse(lat, lng, maxDistanceM);
    if (out.unit) {
      const live = await this.liveNames(out.unit.postcode);
      out.unit.state_name = live.state ?? out.unit.state_name;
      out.unit.lga_name = live.lga ?? out.unit.lga_name;
    }
    return out;
  }

  autocomplete(q: string): Promise<AutocompleteResult> {
    return this.mock.autocomplete(q);
  }
}

let provider: NipostProvider | null = null;

export function nipost(): NipostProvider {
  if (provider) return provider;
  const { mode, base, key } = config.nipost;
  if (mode === "live") provider = new LiveProvider(base, key);
  else if (mode === "hybrid") provider = new HybridProvider(base, key);
  else provider = new MockProvider();
  return provider;
}

export function providerName(): "live" | "mock" | "hybrid" {
  return config.nipost.mode;
}

// Live connectivity check for /health. Only hybrid/live hit the network.
export async function nipostHealth(): Promise<{ mode: string; live_ok: boolean; states: number }> {
  const p = nipost();
  if (p instanceof HybridProvider) {
    const h = await p.reference().health();
    return { mode: "hybrid", live_ok: h.ok, states: h.states };
  }
  return { mode: config.nipost.mode, live_ok: config.nipost.mode === "live", states: 0 };
}
