import { Region, DataPoint, BoundaryType, BoundaryResult } from "../types";

// On web the client is served from the same origin as the API, so a relative
// "/api" base resolves correctly with no env needed. Native builds must set
// EXPO_PUBLIC_API_URL to an absolute URL ending in /api (see .env.example).
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "/api";

export async function fetchRegions(): Promise<Region[]> {
  const res = await fetch(`${BASE_URL}/regions`);
  if (!res.ok) throw new Error(`Failed to fetch regions: ${res.status}`);
  return res.json();
}

export async function createRegion(
  payload: Omit<Region, "id" | "pointCount">
): Promise<Region> {
  const res = await fetch(`${BASE_URL}/regions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create region: ${res.status}`);
  return res.json();
}

export async function deleteRegion(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/regions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete region: ${res.status}`);
}

export async function fetchPointsInRegion(regionId: string): Promise<DataPoint[]> {
  const res = await fetch(`${BASE_URL}/regions/${regionId}/points`);
  if (!res.ok) throw new Error(`Failed to fetch points: ${res.status}`);
  return res.json();
}

export async function fetchBoundaries(
  regionId: string,
  type: BoundaryType
): Promise<BoundaryResult[]> {
  const res = await fetch(`${BASE_URL}/regions/${regionId}/boundaries?type=${type}`);
  if (!res.ok) throw new Error(`Failed to fetch boundaries: ${res.status}`);
  return res.json();
}

export async function uploadDataFile(
  regionId: string,
  fileUri: string,
  fileName: string
): Promise<{ pointCount: number }> {
  const body = new FormData();
  body.append("file", { uri: fileUri, name: fileName, type: "text/csv" } as any);
  const res = await fetch(`${BASE_URL}/regions/${regionId}/upload`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(`Failed to upload file: ${res.status}`);
  return res.json();
}
