/**
 * Attendance API returns UTC wall time as "YYYY-MM-DD HH:mm:ss" (no timezone suffix).
 * Backend uses TIME_ZONE=UTC with USE_TZ=True — treat as UTC for local conversions.
 */
export function parseAttendanceInstantUtc(raw: string | null | undefined): Date | null {
  if (raw == null || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  const iso = t.includes("T") ? t : t.replace(" ", "T");
  const withZone = iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatTimeInZone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "";
  }
}

export function shortTimeZoneName(timeZone: string, at: Date): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(at);
    return parts.find((p) => p.type === "timeZoneName")?.value || timeZone;
  } catch {
    return timeZone;
  }
}

/** Primary IANA zone for ISO 3166-1 alpha-2 (coarse for large multi-zone countries). */
const ISO2_PRIMARY_TZ: Record<string, string> = {
  CN: "Asia/Shanghai",
  IN: "Asia/Kolkata",
  HK: "Asia/Hong_Kong",
  MO: "Asia/Macau",
  TW: "Asia/Taipei",
  JP: "Asia/Tokyo",
  KR: "Asia/Seoul",
  TH: "Asia/Bangkok",
  VN: "Asia/Ho_Chi_Minh",
  MY: "Asia/Kuala_Lumpur",
  SG: "Asia/Singapore",
  AE: "Asia/Dubai",
  SA: "Asia/Riyadh",
  GB: "Europe/London",
  IE: "Europe/Dublin",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  PH: "Asia/Manila",
  LK: "Asia/Colombo",
  NP: "Asia/Kathmandu",
  BD: "Asia/Dhaka",
  PK: "Asia/Karachi",
  NZ: "Pacific/Auckland",
  BR: "America/Sao_Paulo",
  MX: "America/Mexico_City",
  ZA: "Africa/Johannesburg",
  EG: "Africa/Cairo",
  ID: "Asia/Jakarta",
  CH: "Europe/Zurich",
  NL: "Europe/Amsterdam",
  IT: "Europe/Rome",
  ES: "Europe/Madrid",
  PT: "Europe/Lisbon",
  PL: "Europe/Warsaw",
  TR: "Europe/Istanbul",
  RU: "Europe/Moscow",
  UA: "Europe/Kyiv",
};

export function ianaTimeZoneFromCountryCode(code: string | null | undefined): string | undefined {
  const cc = code?.toUpperCase().trim().slice(0, 3);
  if (!cc) return undefined;
  if (ISO2_PRIMARY_TZ[cc]) return ISO2_PRIMARY_TZ[cc];
  if (cc === "US") return "America/New_York";
  if (cc === "CA") return "America/Toronto";
  if (cc === "AU") return "Australia/Sydney";
  return undefined;
}

type GeoLike = {
  isoCountryCode?: string | null;
  region?: string | null;
};

/** Prefer region-aware US/CA; otherwise ISO → primary zone. */
export function ianaTimeZoneFromGeocode(geocode: GeoLike): string | undefined {
  const cc = geocode.isoCountryCode?.toUpperCase();
  if (!cc) return undefined;

  if (cc === "US" && geocode.region) {
    const r = geocode.region.toUpperCase();
    const usStateTz: Record<string, string> = {
      CA: "America/Los_Angeles",
      WA: "America/Los_Angeles",
      OR: "America/Los_Angeles",
      NV: "America/Los_Angeles",
      AZ: "America/Phoenix",
      CO: "America/Denver",
      UT: "America/Denver",
      NM: "America/Denver",
      WY: "America/Denver",
      MT: "America/Denver",
      TX: "America/Chicago",
      IL: "America/Chicago",
      MN: "America/Chicago",
      WI: "America/Chicago",
      IA: "America/Chicago",
      MO: "America/Chicago",
      AR: "America/Chicago",
      LA: "America/Chicago",
      MS: "America/Chicago",
      AL: "America/Chicago",
      TN: "America/Chicago",
      KY: "America/New_York",
      OH: "America/New_York",
      MI: "America/Detroit",
      IN: "America/Indiana/Indianapolis",
      NY: "America/New_York",
      FL: "America/New_York",
      MA: "America/New_York",
      NJ: "America/New_York",
      PA: "America/New_York",
      GA: "America/New_York",
      NC: "America/New_York",
      SC: "America/New_York",
      VA: "America/New_York",
      MD: "America/New_York",
      DC: "America/New_York",
      HI: "Pacific/Honolulu",
      AK: "America/Anchorage",
    };
    return usStateTz[r] || "America/New_York";
  }

  if (cc === "CA" && geocode.region) {
    const p = geocode.region.toUpperCase();
    if (["BC", "YT"].includes(p)) return "America/Vancouver";
    if (["AB", "NT", "NU"].includes(p)) return "America/Edmonton";
    if (["SK"].includes(p)) return "America/Regina";
    return "America/Toronto";
  }

  return ianaTimeZoneFromCountryCode(cc);
}

export function formatCountryLabel(
  code: string | null | undefined,
  name: string | null | undefined
): string | null {
  const c = code?.trim();
  const n = name?.trim();
  if (c && n) return `${c} · ${n}`;
  if (n) return n;
  if (c) return c;
  return null;
}

/** ISO 3166-1 alpha-2 → English name (e.g. IN → India) for API `check_*_country` when geocode omits country string. */
export function countryNameFromIsoCode(code: string | null | undefined): string | undefined {
  const cc = code?.trim().toUpperCase();
  if (!cc || cc.length < 2) return undefined;
  const alpha2 = cc.slice(0, 2);
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    const name = dn.of(alpha2);
    if (typeof name === "string" && name.length > 0 && name.toUpperCase() !== alpha2) {
      return name;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

const MAX_ADDRESS_CHARS = 4000;

/** Build one line for API `check_in_location` / `check_out_location` from reverse geocode. */
export function formatGeocodeAddressLine(g: {
  formattedAddress?: string | null;
  name?: string | null;
  streetNumber?: string | null;
  street?: string | null;
  district?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
}): string {
  const fa = g.formattedAddress?.trim();
  if (fa) return fa.slice(0, MAX_ADDRESS_CHARS);

  const streetLine = [g.streetNumber, g.street].filter(Boolean).join(" ").trim();
  const segments = [
    g.name?.trim(),
    streetLine || undefined,
    g.district?.trim(),
    g.city?.trim(),
    g.region?.trim(),
    g.postalCode?.trim(),
    g.country?.trim(),
  ].filter((s): s is string => !!s && s.length > 0);

  const out: string[] = [];
  for (const s of segments) {
    if (!out.some((o) => o === s || o.includes(s) || s.includes(o))) out.push(s);
  }
  return out.join(", ").slice(0, MAX_ADDRESS_CHARS);
}
