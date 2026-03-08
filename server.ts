import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "node:fs";
import path from "node:path";

type SyncOperation = {
  clientId: string;
  key: string;
  value: string | null;
  op: "set" | "remove";
  updatedAt: number;
};

type SyncPayload = {
  version: number;
  data: Record<string, string>;
};

const SYNC_FILE = path.resolve(process.cwd(), ".sync-state.json");

const loadSyncState = (): SyncPayload => {
  try {
    if (fs.existsSync(SYNC_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SYNC_FILE, "utf-8")) as SyncPayload;
      if (parsed && typeof parsed === "object" && parsed.data && typeof parsed.data === "object") {
        return { version: Number(parsed.version) || Date.now(), data: parsed.data };
      }
    }
  } catch (error) {
    console.error("Failed to load sync state:", error);
  }
  return { version: Date.now(), data: {} };
};

const saveSyncState = (state: SyncPayload) => {
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(state), "utf-8");
  } catch (error) {
    console.error("Failed to save sync state:", error);
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;
  const syncState = loadSyncState();
  const syncClients = new Set<express.Response>();

  app.use(express.json({ limit: "15mb" }));
  app.use("/api", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/sync/state", (req, res) => {
    res.json(syncState);
  });

  app.get("/api/sync/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    syncClients.add(res);
    res.write(`event: ready\ndata: {"ok":true}\n\n`);

    req.on("close", () => {
      syncClients.delete(res);
    });
  });

  app.post("/api/sync/update", (req, res) => {
    const body = req.body as SyncOperation;
    if (!body || typeof body.key !== "string" || (body.op !== "set" && body.op !== "remove")) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    if (body.op === "set" && typeof body.value === "string") {
      syncState.data[body.key] = body.value;
    } else if (body.op === "remove") {
      delete syncState.data[body.key];
    }

    syncState.version = Date.now();
    saveSyncState(syncState);

    const eventPayload: SyncOperation = {
      clientId: body.clientId || "unknown",
      key: body.key,
      value: body.op === "set" ? body.value : null,
      op: body.op,
      updatedAt: syncState.version,
    };
    const chunk = `event: update\ndata: ${JSON.stringify(eventPayload)}\n\n`;
    syncClients.forEach((client) => {
      client.write(chunk);
    });

    res.json({ ok: true, version: syncState.version });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
