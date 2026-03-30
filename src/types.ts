export type LatLng = {
  latitude: number;
  longitude: number;
};

export type Region = {
  id: string;
  name: string;
  color: string;
  coordinates: LatLng[]; // polygon boundary
  center: LatLng;
  pointCount?: number;
};

export type DataPoint = {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
  regionId?: string;
};

export type BoundaryType = "zipCodes" | "counties" | "states";

export type BoundaryResult = {
  code: string;       // zip code, county name, or state name
  coveragePct: number; // 0-100
};
