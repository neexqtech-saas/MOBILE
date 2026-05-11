import * as Location from "expo-location";

import { apiService } from "@/services/api";
import {
  countryNameFromIsoCode,
  formatGeocodeAddressLine,
} from "@/utils/punchLocationTime";

export type ResolvedPunchLocation = {
  country?: string;
  countryCode?: string;
  location: string;
};

/**
 * Expo reverse-geocode first; if empty/fails, backend Nominatim proxy (works on web + native, no CORS).
 */
export async function resolvePunchLocation(lat: number, lng: number): Promise<ResolvedPunchLocation> {
  const gpsFallback = `GPS ${lat}, ${lng}`;

  try {
    const geoList = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const g = geoList[0];
    if (g && (g.isoCountryCode || g.country)) {
      const addressLine = formatGeocodeAddressLine(g);
      const code = g.isoCountryCode ?? undefined;
      return {
        country: (g.country?.trim() || countryNameFromIsoCode(code)) ?? undefined,
        countryCode: code,
        location: addressLine.trim() || gpsFallback,
      };
    }
  } catch {
    /* continue to backend */
  }

  const fromBackend = await backendReverse(lat, lng);
  if (fromBackend) {
    return fromBackend;
  }

  return { location: gpsFallback };
}

async function backendReverse(lat: number, lng: number): Promise<ResolvedPunchLocation | null> {
  try {
    const rg = await apiService.reverseGeocode(lat, lng);
    const d = rg.data;
    if (!d) return null;
    const rawCode = d.country_code;
    const countryCode =
      typeof rawCode === "string" && rawCode.length > 0 ? rawCode.toUpperCase().slice(0, 3) : undefined;
    const countryRaw = d.country;
    const countryName =
      (typeof countryRaw === "string" && countryRaw.trim()) || countryNameFromIsoCode(countryCode) || undefined;
    const display =
      typeof d.display_name === "string" && d.display_name.trim()
        ? d.display_name.trim().slice(0, 4000)
        : "";

    if (!countryCode && !countryName && !display) {
      return null;
    }

    return {
      country: countryName,
      countryCode,
      location: display || `GPS ${lat}, ${lng}`,
    };
  } catch {
    return null;
  }
}
