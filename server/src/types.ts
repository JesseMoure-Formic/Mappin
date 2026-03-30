export type LatLng = { latitude: number; longitude: number };

export type RegionRow = {
  id: string;
  name: string;
  color: string;
  coordinates: string; // JSON
  center: string;      // JSON
  created_at: string;
};

export type Region = {
  id: string;
  name: string;
  color: string;
  coordinates: LatLng[];
  center: LatLng;
  pointCount?: number;
};

export type DataPoint = {
  id: string;
  region_id: string;
  latitude: number;
  longitude: number;
  label?: string;
};

export type BoundaryType = "zipCodes" | "counties" | "states";

export type BoundaryResult = {
  code: string;
  coveragePct: number;
};
