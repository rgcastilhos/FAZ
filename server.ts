import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI, Type } from "@google/genai";

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

type ManagedUser = {
  username: string;
  password: string;
  name: string;
  role: "user";
  createdAt: number;
  expiresAt: number | undefined;
};

const SYNC_FILE = path.resolve(process.cwd(), ".sync-state.json");
const USERS_FILE = path.resolve(process.cwd(), ".users-state.json");
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "RKI").trim();
const ADMIN_CODE = process.env.ADMIN_CODE || "153720";
const getGeminiApiKey = (): string =>
  (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

const getAiClient = (): GoogleGenAI | null => {
  const key = getGeminiApiKey();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

const normalizeUsers = (input: unknown): ManagedUser[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((raw) => {
      const username = String((raw as any)?.username || "").trim();
      const password = String((raw as any)?.password || "");
      const name = String((raw as any)?.name || "").trim();
      const createdAt = Number((raw as any)?.createdAt) || Date.now();
      const expiresRaw = Number((raw as any)?.expiresAt);
      const expiresAt = Number.isFinite(expiresRaw) && expiresRaw > 0 ? expiresRaw : undefined;

      if (!username || !password || !name) return null;
      return { username, password, name, role: "user" as const, createdAt, expiresAt };
    })
    .filter((u): u is ManagedUser => !!u);
};

const loadUsers = (): ManagedUser[] => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
      return normalizeUsers(parsed);
    }
  } catch (error) {
    console.error("Failed to load users state:", error);
  }
  return [];
};

const saveUsers = (users: ManagedUser[]) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users), "utf-8");
  } catch (error) {
    console.error("Failed to save users state:", error);
  }
};

const sanitizeUser = (user: ManagedUser) => ({
  username: user.username,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
  expiresAt: user.expiresAt,
});

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

const isAdminRequest = (req: express.Request): boolean => {
  const code =
    String(req.header("x-admin-code") || "").trim() ||
    String(req.query?.adminCode || "").trim() ||
    String((req.body as any)?.adminCode || "").trim();
  return code.length > 0 && code === ADMIN_CODE;
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const syncState = loadSyncState();
  const usersState = loadUsers();
  const syncClients = new Set<express.Response>();

  app.use(express.json({ limit: "15mb" }));
  app.use("/api", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-code");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    const hasGeminiKey = !!getGeminiApiKey();
    res.json({
      status: "ok",
      geminiConfigured: hasGeminiKey,
      geminiEnvSource: process.env.GEMINI_API_KEY
        ? "GEMINI_API_KEY"
        : process.env.GOOGLE_API_KEY
          ? "GOOGLE_API_KEY"
          : "none",
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "").trim();
    if (!username || !password) {
      res.status(400).json({ error: "Usuário e senha são obrigatórios." });
      return;
    }

    const user = usersState.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user || user.password !== password) {
      res.status(401).json({ error: "Credenciais incorretas. Tente novamente." });
      return;
    }
    if (user.expiresAt && Date.now() > user.expiresAt) {
      res.status(403).json({ error: "Acesso expirado. Contate o administrador para renovar." });
      return;
    }

    res.json({ ok: true, user: sanitizeUser(user) });
  });

  app.post("/api/auth/admin", (req, res) => {
    const username = String(req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "").trim();
    if (!username) {
      res.status(400).json({ error: "Usuário admin é obrigatório." });
      return;
    }
    if (!password) {
      res.status(400).json({ error: "Senha do admin é obrigatória." });
      return;
    }
    if (username !== ADMIN_USERNAME.toLowerCase()) {
      res.status(401).json({ error: "Usuário admin inválido." });
      return;
    }
    if (password !== ADMIN_CODE) {
      res.status(401).json({ error: "Código de admin inválido." });
      return;
    }
    res.json({
      ok: true,
      user: {
        username: ADMIN_USERNAME,
        name: "Administrador",
        role: "admin",
      },
    });
  });

  app.get("/api/users", (req, res) => {
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: "Não autorizado." });
      return;
    }
    res.json({ users: usersState.map(sanitizeUser) });
  });

  app.post("/api/users/upsert", (req, res) => {
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: "Não autorizado." });
      return;
    }

    const username = String(req.body?.username || "").trim();
    const name = String(req.body?.name || "").trim();
    const password = String(req.body?.password || "");
    const expiresRaw = Number(req.body?.expiresAt);
    const expiresAt = Number.isFinite(expiresRaw) && expiresRaw > 0 ? expiresRaw : undefined;

    if (!username || !name) {
      res.status(400).json({ error: "Preencha pelo menos Nome e Usuário." });
      return;
    }
    if (username.toLowerCase() === "admin") {
      res.status(400).json({ error: 'O nome "admin" é reservado.' });
      return;
    }

    const existingIndex = usersState.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
    if (existingIndex >= 0) {
      const existing = usersState[existingIndex];
      usersState[existingIndex] = {
        ...existing,
        username,
        name,
        expiresAt,
        password: password.trim() ? password : existing.password,
      };
    } else {
      if (!password.trim()) {
        res.status(400).json({ error: "Senha é obrigatória para novos usuários." });
        return;
      }
      usersState.push({
        username,
        name,
        password,
        role: "user",
        createdAt: Date.now(),
        expiresAt,
      });
    }

    saveUsers(usersState);
    res.json({ ok: true, users: usersState.map(sanitizeUser) });
  });

  app.delete("/api/users/:username", (req, res) => {
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: "Não autorizado." });
      return;
    }

    const username = String(req.params.username || "").trim();
    if (!username) {
      res.status(400).json({ error: "Usuário inválido." });
      return;
    }

    const index = usersState.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
    if (index < 0) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    usersState.splice(index, 1);
    saveUsers(usersState);
    res.json({ ok: true, users: usersState.map(sanitizeUser) });
  });

  app.get("/api/license/:username", (req, res) => {
    const username = String(req.params.username || "").trim();
    if (!username) {
      res.status(400).json({ error: "Usuário inválido." });
      return;
    }

    const user = usersState.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    const active = !user.expiresAt || Date.now() <= user.expiresAt;
    res.json({ active, user: sanitizeUser(user) });
  });

  app.post("/api/ai/estimate-weight", async (req, res) => {
    try {
      const ai = getAiClient();
      if (!ai) {
        res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor." });
        return;
      }

      const prompt = String(req.body?.prompt || "").trim();
      const inlineData = req.body?.inlineData as { mimeType?: string; data?: string } | undefined;
      if (!prompt) {
        res.status(400).json({ error: "Prompt inválido." });
        return;
      }

      const parts: any[] = [];
      if (inlineData?.mimeType && inlineData?.data) {
        parts.push({
          inlineData: {
            mimeType: inlineData.mimeType,
            data: inlineData.data,
          },
        });
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              raca: { type: Type.STRING },
              sexo: { type: Type.STRING },
              ecc: { type: Type.STRING },
              analise_visual: { type: Type.STRING },
              peso_estimado_kg: { type: Type.NUMBER },
            },
            required: ["raca", "sexo", "ecc", "analise_visual", "peso_estimado_kg"],
          },
        },
      });

      const text = response.text || "";
      const data = JSON.parse(text);
      res.json({ data });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Falha na análise de peso." });
    }
  });

  app.post("/api/ai/inventory-insights", async (req, res) => {
    try {
      const ai = getAiClient();
      if (!ai) {
        res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor." });
        return;
      }
      const categories = req.body?.categories || [];
      const items = req.body?.items || [];
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise este inventário rural e forneça insights estratégicos curtos:\n${JSON.stringify({ categories, items })}`,
      });
      res.json({ text: response.text || "Sem insights no momento." });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Falha ao gerar insights." });
    }
  });

  app.post("/api/ai/maps-insights", async (req, res) => {
    try {
      const ai = getAiClient();
      if (!ai) {
        res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor." });
        return;
      }

      const query = String(req.body?.query || "").trim();
      const location = req.body?.location as { latitude?: number; longitude?: number } | undefined;
      if (!query) {
        res.status(400).json({ error: "Consulta inválida." });
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Encontre no mapa: ${query}`,
        config: {
          systemInstruction:
            "Você é um assistente agrícola. Retorne em português do Brasil com resumo, destaques em linhas separadas e recomendação final.",
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng:
                location?.latitude && location?.longitude
                  ? { latitude: location.latitude, longitude: location.longitude }
                  : undefined,
            },
          },
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = chunks
        .filter((c: any) => c.maps)
        .map((c: any) => ({
          uri: c.maps.uri,
          title: c.maps.title,
        }));

      res.json({ text: response.text || "Nenhum resultado encontrado.", links });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Falha ao consultar mapas." });
    }
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
