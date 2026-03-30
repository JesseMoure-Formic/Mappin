import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { db } from "../db";
import { Region, RegionRow, LatLng, BoundaryType } from "../types";
import { getBoundaries } from "../services/boundaries";
import { importCsvPoints, getPointsInRegion } from "../services/points";

export const regionsRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── Helpers ──────────────────────────────────────────────────────────────────

function rowToRegion(row: RegionRow, pointCount?: number): Region {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    coordinates: JSON.parse(row.coordinates) as LatLng[],
    center: JSON.parse(row.center) as LatLng,
    pointCount,
  };
}

// ── GET /regions ──────────────────────────────────────────────────────────────

regionsRouter.get("/", (_req: Request, res: Response) => {
  const rows = db
    .prepare("SELECT * FROM regions ORDER BY created_at DESC")
    .all() as RegionRow[];

  const countStmt = db.prepare(
    "SELECT COUNT(*) AS cnt FROM data_points WHERE region_id = ?"
  );

  const regions = rows.map((row) => {
    const { cnt } = countStmt.get(row.id) as { cnt: number };
    return rowToRegion(row, cnt);
  });

  res.json(regions);
});

// ── POST /regions ─────────────────────────────────────────────────────────────

regionsRouter.post("/", (req: Request, res: Response) => {
  const { name, color, coordinates, center } = req.body as Omit<Region, "id">;

  if (!name || !color || !Array.isArray(coordinates) || coordinates.length < 3 || !center) {
    res.status(400).json({ error: "name, color, center, and at least 3 coordinates are required." });
    return;
  }

  const id = uuid();
  db.prepare(
    "INSERT INTO regions (id, name, color, coordinates, center) VALUES (?, ?, ?, ?, ?)"
  ).run(id, name, color, JSON.stringify(coordinates), JSON.stringify(center));

  const row = db.prepare("SELECT * FROM regions WHERE id = ?").get(id) as RegionRow;
  res.status(201).json(rowToRegion(row, 0));
});

// ── DELETE /regions/:id ───────────────────────────────────────────────────────

regionsRouter.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const result = db.prepare("DELETE FROM regions WHERE id = ?").run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Region not found." });
    return;
  }
  res.status(204).send();
});

// ── GET /regions/:id/points ───────────────────────────────────────────────────

regionsRouter.get("/:id/points", (req: Request, res: Response) => {
  const { id } = req.params;
  const region = db.prepare("SELECT * FROM regions WHERE id = ?").get(id) as RegionRow | undefined;
  if (!region) {
    res.status(404).json({ error: "Region not found." });
    return;
  }

  const points = db
    .prepare("SELECT * FROM data_points WHERE region_id = ? ORDER BY created_at")
    .all(id);

  res.json(points);
});

// ── GET /regions/:id/boundaries ───────────────────────────────────────────────

regionsRouter.get("/:id/boundaries", async (req: Request, res: Response) => {
  const { id } = req.params;
  const type = (req.query.type as BoundaryType) ?? "zipCodes";

  const validTypes: BoundaryType[] = ["zipCodes", "counties", "states"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: `type must be one of: ${validTypes.join(", ")}` });
    return;
  }

  const region = db.prepare("SELECT * FROM regions WHERE id = ?").get(id) as RegionRow | undefined;
  if (!region) {
    res.status(404).json({ error: "Region not found." });
    return;
  }

  try {
    const coordinates = JSON.parse(region.coordinates) as LatLng[];
    const results = await getBoundaries(coordinates, type);
    res.json(results);
  } catch (err) {
    console.error("Boundary lookup failed:", err);
    res.status(500).json({ error: "Failed to compute boundaries." });
  }
});

// ── POST /regions/:id/upload ──────────────────────────────────────────────────

regionsRouter.post("/:id/upload", upload.single("file"), async (req: Request, res: Response) => {
  const { id } = req.params;

  const region = db.prepare("SELECT * FROM regions WHERE id = ?").get(id) as RegionRow | undefined;
  if (!region) {
    res.status(404).json({ error: "Region not found." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded." });
    return;
  }

  try {
    const coordinates = JSON.parse(region.coordinates) as LatLng[];
    const pointCount = await importCsvPoints(req.file.buffer, id, coordinates);
    res.json({ pointCount });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Failed to process file." });
  }
});
