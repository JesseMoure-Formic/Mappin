import * as turf from "@turf/turf";
import type { Feature, Polygon, MultiPolygon, GeoJsonProperties } from "geojson";
import { LatLng, BoundaryType, BoundaryResult } from "../types";

// Census TIGERweb REST API — no API key required
const TIGER_BASE = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb";

type TigerFeature = Feature<Polygon | MultiPolygon, GeoJsonProperties>;

type TigerResponse = {
  features: TigerFeature[];
  error?: { message: string };
};

// Convert our {latitude, longitude} array to a Turf polygon
function toTurfPolygon(coords: LatLng[]): Feature<Polygon> {
  const ring = coords.map((c) => [c.longitude, c.latitude] as [number, number]);
  // Close the ring
  if (
    ring[0][0] !== ring[ring.length - 1][0] ||
    ring[0][1] !== ring[ring.length - 1][1]
  ) {
    ring.push(ring[0]);
  }
  return turf.polygon([ring]);
}

// Bounding box string for TIGERweb query
function bbox(coords: LatLng[]): string {
  const lngs = coords.map((c) => c.longitude);
  const lats = coords.map((c) => c.latitude);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)].join(",");
}

// Fetch features from Census TIGERweb that intersect with the region bounding box
async function fetchTigerFeatures(
  serviceLayer: string,
  outFields: string,
  coords: LatLng[]
): Promise<TigerFeature[]> {
  const geometry = encodeURIComponent(
    JSON.stringify({
      rings: [coords.map((c) => [c.longitude, c.latitude])],
      spatialReference: { wkid: 4326 },
    })
  );

  const url =
    `${TIGER_BASE}/${serviceLayer}/query` +
    `?geometry=${geometry}` +
    `&geometryType=esriGeometryPolygon` +
    `&spatialRel=esriSpatialRelIntersects` +
    `&outFields=${outFields}` +
    `&returnGeometry=true` +
    `&f=geojson`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`TIGERweb HTTP ${res.status}`);

  const json = (await res.json()) as TigerResponse;
  if (json.error) throw new Error(json.error.message);
  return json.features ?? [];
}

// Calculate what % of a boundary feature falls inside the region polygon
function coveragePct(boundary: TigerFeature, region: Feature<Polygon>): number {
  try {
    const intersection = turf.intersect(
      boundary as Feature<Polygon | MultiPolygon>,
      region
    );
    if (!intersection) return 0;

    const boundaryArea = turf.area(boundary);
    if (boundaryArea === 0) return 0;

    const intersectArea = turf.area(intersection);
    return Math.round((intersectArea / boundaryArea) * 100);
  } catch {
    return 0;
  }
}

export async function getBoundaries(
  coords: LatLng[],
  type: BoundaryType
): Promise<BoundaryResult[]> {
  const region = toTurfPolygon(coords);

  if (type === "states") {
    return getStateBoundaries(coords, region);
  }

  if (type === "counties") {
    return getCountyBoundaries(coords, region);
  }

  return getZipCodeBoundaries(coords, region);
}

async function getZipCodeBoundaries(
  coords: LatLng[],
  region: Feature<Polygon>
): Promise<BoundaryResult[]> {
  // TIGER layer: ZCTA5 (ZIP Code Tabulation Areas)
  const features = await fetchTigerFeatures(
    "PUMA_TAD_TAZ_UGA_ZCTA/MapServer/2",
    "ZCTA5CE10",
    coords
  );

  return features
    .map((f) => ({
      code: (f.properties?.ZCTA5CE10 as string) ?? "",
      coveragePct: coveragePct(f, region),
    }))
    .filter((r) => r.code && r.coveragePct > 0)
    .sort((a, b) => b.coveragePct - a.coveragePct);
}

async function getCountyBoundaries(
  coords: LatLng[],
  region: Feature<Polygon>
): Promise<BoundaryResult[]> {
  // TIGER layer: Counties
  const features = await fetchTigerFeatures(
    "State_County/MapServer/1",
    "NAME,STATEFP",
    coords
  );

  return features
    .map((f) => ({
      code: (f.properties?.NAME as string) ?? "",
      coveragePct: coveragePct(f, region),
    }))
    .filter((r) => r.code && r.coveragePct > 0)
    .sort((a, b) => b.coveragePct - a.coveragePct);
}

async function getStateBoundaries(
  coords: LatLng[],
  region: Feature<Polygon>
): Promise<BoundaryResult[]> {
  // States dataset is small enough to fetch and intersect locally
  const features = await fetchTigerFeatures(
    "State_County/MapServer/0",
    "NAME",
    coords
  );

  return features
    .map((f) => ({
      code: (f.properties?.NAME as string) ?? "",
      coveragePct: coveragePct(f, region),
    }))
    .filter((r) => r.code && r.coveragePct > 0)
    .sort((a, b) => b.coveragePct - a.coveragePct);
}
