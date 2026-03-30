import { parse } from "csv-parse/sync";
import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";
import { v4 as uuid } from "uuid";
import { db } from "../db";
import { LatLng } from "../types";

type CsvRow = Record<string, string>;

// Candidate column names for latitude and longitude
const LAT_COLS = ["latitude", "lat", "y", "Latitude", "LAT"];
const LNG_COLS = ["longitude", "lng", "lon", "long", "x", "Longitude", "LNG", "LON"];
const LABEL_COLS = ["name", "label", "title", "address", "Name", "Label"];

function findCol(headers: string[], candidates: string[]): string | undefined {
  return candidates.find((c) => headers.includes(c));
}

function toTurfPolygon(coords: LatLng[]): Feature<Polygon> {
  const ring = coords.map((c) => [c.longitude, c.latitude] as [number, number]);
  if (
    ring[0][0] !== ring[ring.length - 1][0] ||
    ring[0][1] !== ring[ring.length - 1][1]
  ) {
    ring.push(ring[0]);
  }
  return turf.polygon([ring]);
}

export async function importCsvPoints(
  buffer: Buffer,
  regionId: string,
  regionCoords: LatLng[]
): Promise<number> {
  const rows = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  if (rows.length === 0) return 0;

  const headers = Object.keys(rows[0]);
  const latCol = findCol(headers, LAT_COLS);
  const lngCol = findCol(headers, LNG_COLS);

  if (!latCol || !lngCol) {
    throw new Error(
      `CSV must have latitude and longitude columns. Found: ${headers.join(", ")}`
    );
  }

  const labelCol = findCol(headers, LABEL_COLS);
  const polygon = toTurfPolygon(regionCoords);

  const insert = db.prepare(
    "INSERT INTO data_points (id, region_id, latitude, longitude, label) VALUES (?, ?, ?, ?, ?)"
  );

  const insertMany = db.transaction((validRows: CsvRow[]) => {
    let count = 0;
    for (const row of validRows) {
      const lat = parseFloat(row[latCol]);
      const lng = parseFloat(row[lngCol]);
      if (isNaN(lat) || isNaN(lng)) continue;

      // Only import points that fall inside the region polygon
      const point = turf.point([lng, lat]);
      if (!turf.booleanPointInPolygon(point, polygon)) continue;

      insert.run(uuid(), regionId, lat, lng, labelCol ? row[labelCol] ?? null : null);
      count++;
    }
    return count;
  });

  return insertMany(rows) as number;
}

export function getPointsInRegion(regionId: string) {
  return db
    .prepare("SELECT * FROM data_points WHERE region_id = ? ORDER BY created_at")
    .all(regionId);
}
