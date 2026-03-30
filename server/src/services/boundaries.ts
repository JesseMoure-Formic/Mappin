import * as turf from "@turf/turf";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import { LatLng, BoundaryType, BoundaryResult } from "../types";

const TIGER_BASE = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toTurfPolygon(coords: LatLng[]): Feature<Polygon> {
  const ring = coords.map((c) => [c.longitude, c.latitude] as [number, number]);
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push(ring[0]);
  }
  return turf.polygon([ring]);
}

function coveragePct(boundary: Feature<Polygon | MultiPolygon>, region: Feature<Polygon>): number {
  try {
    const intersection = turf.intersect(
      boundary as Feature<Polygon | MultiPolygon>,
      region
    );
    if (!intersection) return 0;
    const boundaryArea = turf.area(boundary);
    if (boundaryArea === 0) return 0;
    return Math.round((turf.area(intersection) / boundaryArea) * 100);
  } catch {
    return 0;
  }
}

// Build the esriGeometryPolygon JSON that TIGERweb expects
function esriPolygon(coords: LatLng[]): string {
  return encodeURIComponent(
    JSON.stringify({
      rings: [coords.map((c) => [c.longitude, c.latitude])],
      spatialReference: { wkid: 4326 },
    })
  );
}

type TigerFeature = Feature<Polygon | MultiPolygon, Record<string, unknown>>;

async function fetchTiger(
  serviceLayer: string,
  outFields: string,
  coords: LatLng[]
): Promise<TigerFeature[]> {
  const url =
    `${TIGER_BASE}/${serviceLayer}/query` +
    `?geometry=${esriPolygon(coords)}` +
    `&geometryType=esriGeometryPolygon` +
    `&spatialRel=esriSpatialRelIntersects` +
    `&outFields=${outFields}` +
    `&returnGeometry=true` +
    `&f=geojson`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`TIGERweb HTTP ${res.status}`);

  const json = (await res.json()) as { features?: TigerFeature[]; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  return json.features ?? [];
}

// ── Bundled US states fallback ────────────────────────────────────────────────
// Simplified bounding-box polygons for all 50 states + DC.
// Used when the Census API is unreachable (e.g. offline dev).

const STATE_BOXES: { name: string; bbox: [number, number, number, number] }[] = [
  { name: "Alabama", bbox: [-88.47, 30.22, -84.89, 35.01] },
  { name: "Alaska", bbox: [-179.15, 51.21, -129.98, 71.35] },
  { name: "Arizona", bbox: [-114.82, 31.33, -109.05, 37.0] },
  { name: "Arkansas", bbox: [-94.62, 33.0, -89.64, 36.5] },
  { name: "California", bbox: [-124.41, 32.53, -114.13, 42.01] },
  { name: "Colorado", bbox: [-109.06, 36.99, -102.04, 41.0] },
  { name: "Connecticut", bbox: [-73.73, 40.99, -71.79, 42.05] },
  { name: "Delaware", bbox: [-75.79, 38.45, -75.05, 39.84] },
  { name: "District of Columbia", bbox: [-77.12, 38.79, -76.91, 38.99] },
  { name: "Florida", bbox: [-87.63, 24.52, -79.97, 31.0] },
  { name: "Georgia", bbox: [-85.61, 30.36, -80.84, 35.0] },
  { name: "Hawaii", bbox: [-160.25, 18.91, -154.81, 22.24] },
  { name: "Idaho", bbox: [-117.24, 41.99, -111.04, 49.0] },
  { name: "Illinois", bbox: [-91.51, 36.97, -87.02, 42.51] },
  { name: "Indiana", bbox: [-88.1, 37.77, -84.78, 41.76] },
  { name: "Iowa", bbox: [-96.64, 40.38, -90.14, 43.5] },
  { name: "Kansas", bbox: [-102.05, 36.99, -94.59, 40.0] },
  { name: "Kentucky", bbox: [-89.57, 36.5, -81.96, 39.15] },
  { name: "Louisiana", bbox: [-94.04, 28.93, -89.0, 33.02] },
  { name: "Maine", bbox: [-71.08, 43.06, -66.95, 47.46] },
  { name: "Maryland", bbox: [-79.49, 37.91, -75.05, 39.72] },
  { name: "Massachusetts", bbox: [-73.51, 41.24, -69.93, 42.89] },
  { name: "Michigan", bbox: [-90.42, 41.7, -82.41, 48.19] },
  { name: "Minnesota", bbox: [-97.24, 43.5, -89.49, 49.38] },
  { name: "Mississippi", bbox: [-91.66, 30.17, -88.1, 34.99] },
  { name: "Missouri", bbox: [-95.77, 35.99, -89.1, 40.61] },
  { name: "Montana", bbox: [-116.05, 44.36, -104.04, 49.0] },
  { name: "Nebraska", bbox: [-104.05, 39.99, -95.31, 43.0] },
  { name: "Nevada", bbox: [-120.0, 35.0, -114.04, 42.0] },
  { name: "New Hampshire", bbox: [-72.56, 42.7, -70.7, 45.31] },
  { name: "New Jersey", bbox: [-75.56, 38.93, -73.89, 41.36] },
  { name: "New Mexico", bbox: [-109.05, 31.33, -103.0, 37.0] },
  { name: "New York", bbox: [-79.76, 40.5, -71.86, 45.01] },
  { name: "North Carolina", bbox: [-84.32, 33.84, -75.46, 36.59] },
  { name: "North Dakota", bbox: [-104.05, 45.94, -96.55, 49.0] },
  { name: "Ohio", bbox: [-84.82, 38.4, -80.52, 42.32] },
  { name: "Oklahoma", bbox: [-103.0, 33.62, -94.43, 37.0] },
  { name: "Oregon", bbox: [-124.57, 41.99, -116.46, 46.29] },
  { name: "Pennsylvania", bbox: [-80.52, 39.72, -74.69, 42.27] },
  { name: "Rhode Island", bbox: [-71.86, 41.15, -71.12, 42.02] },
  { name: "South Carolina", bbox: [-83.35, 32.05, -78.54, 35.22] },
  { name: "South Dakota", bbox: [-104.06, 42.48, -96.44, 45.94] },
  { name: "Tennessee", bbox: [-90.31, 34.98, -81.65, 36.68] },
  { name: "Texas", bbox: [-106.65, 25.84, -93.51, 36.5] },
  { name: "Utah", bbox: [-114.05, 36.99, -109.04, 42.0] },
  { name: "Vermont", bbox: [-73.44, 42.73, -71.5, 45.02] },
  { name: "Virginia", bbox: [-83.68, 36.54, -75.24, 39.47] },
  { name: "Washington", bbox: [-124.73, 45.54, -116.92, 49.0] },
  { name: "West Virginia", bbox: [-82.64, 37.2, -77.72, 40.64] },
  { name: "Wisconsin", bbox: [-92.89, 42.49, -86.25, 47.08] },
  { name: "Wyoming", bbox: [-111.06, 40.99, -104.05, 45.01] },
];

function statesFromBundles(region: Feature<Polygon>): BoundaryResult[] {
  return STATE_BOXES.flatMap(({ name, bbox: [minLng, minLat, maxLng, maxLat] }) => {
    const statePolygon = turf.polygon([[
      [minLng, minLat], [maxLng, minLat],
      [maxLng, maxLat], [minLng, maxLat],
      [minLng, minLat],
    ]]);
    const pct = coveragePct(statePolygon, region);
    if (pct === 0) return [];
    return [{ code: name, coveragePct: pct }];
  }).sort((a, b) => b.coveragePct - a.coveragePct);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getBoundaries(
  coords: LatLng[],
  type: BoundaryType
): Promise<BoundaryResult[]> {
  const region = toTurfPolygon(coords);

  try {
    if (type === "states") {
      const features = await fetchTiger("State_County/MapServer/0", "NAME", coords);
      return features
        .map((f) => ({ code: String(f.properties?.NAME ?? ""), coveragePct: coveragePct(f, region) }))
        .filter((r) => r.code && r.coveragePct > 0)
        .sort((a, b) => b.coveragePct - a.coveragePct);
    }

    if (type === "counties") {
      const features = await fetchTiger("State_County/MapServer/1", "NAME,STATEFP", coords);
      return features
        .map((f) => ({ code: String(f.properties?.NAME ?? ""), coveragePct: coveragePct(f, region) }))
        .filter((r) => r.code && r.coveragePct > 0)
        .sort((a, b) => b.coveragePct - a.coveragePct);
    }

    // zipCodes — ZCTA5 layer
    const features = await fetchTiger("PUMA_TAD_TAZ_UGA_ZCTA/MapServer/2", "ZCTA5CE10", coords);
    return features
      .map((f) => ({ code: String(f.properties?.ZCTA5CE10 ?? ""), coveragePct: coveragePct(f, region) }))
      .filter((r) => r.code && r.coveragePct > 0)
      .sort((a, b) => b.coveragePct - a.coveragePct);

  } catch (err) {
    // Fallback: use bundled state bounding boxes when Census API is unreachable
    if (type === "states") {
      console.warn("Census API unavailable, using bundled state data:", (err as Error).message);
      return statesFromBundles(region);
    }
    throw err; // ZIP/county fallback would need large datasets — surface the error
  }
}
