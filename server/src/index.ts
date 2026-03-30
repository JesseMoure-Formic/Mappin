import express from "express";
import cors from "cors";
import { regionsRouter } from "./routes/regions";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/regions", regionsRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Mappin server running on port ${PORT}`);
});
