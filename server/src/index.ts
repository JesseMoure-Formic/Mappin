import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { regionsRouter } from "./routes/regions";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── API ───────────────────────────────────────────────────────────────────────
// Namespaced under /api so it never collides with the Expo web client's own
// routes (e.g. the /regions tab) when both are served from the same origin.
app.use("/api/regions", regionsRouter);
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Static web client (Expo web export) ─────────────────────────────────────────
// Compiled server runs from server/dist; the web build is exported to the
// repo-root web-build/ directory (see root `npm run build:web`). Serve it and
// fall back to index.html so Expo Router client-side routes resolve on refresh
// or deep-link. Skipped when web-build/ is absent (e.g. server-only dev).
const WEB_DIR = path.join(__dirname, "..", "..", "web-build");
if (fs.existsSync(WEB_DIR)) {
  app.use(express.static(WEB_DIR));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(WEB_DIR, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Mappin server running on port ${PORT}`);
});
