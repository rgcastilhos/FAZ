import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { GoogleGenAI, Type, type GenerateContentParameters } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

for (const envFile of [".env.local", ".env"]) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

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

const DATA_DIR = (() => {
  const configured =
    (
      process.env.STORAGE_PATH ||
      process.env.DATA_DIR ||
      process.env.USER_DATA_DIR ||
      process.env.RENDER_DISK_PATH ||
      ""
    ).trim();
  return configured ? path.resolve(configured) : process.cwd();
})();
const SYNC_FILE = path.resolve(DATA_DIR, ".sync-state.json");
const USERS_FILE = path.resolve(DATA_DIR, ".users-state.json");
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "RKI").trim();
const ADMIN_CODE = process.env.ADMIN_CODE || "153720";
const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;
const getGeminiApiKey = (): string =>
  (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

const getAiClient = (): GoogleGenAI | null => {
  const key = getGeminiApiKey();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableAiError = (error: any): boolean => {
  const code = Number(error?.status || error?.statusCode || error?.code || error?.response?.status || 0);
  const statusText = String(error?.error?.status || error?.statusText || "").toUpperCase();
  const message = String(error?.message || "");
  const combined = `${statusText} ${message}`;
  return (
    code === 429 ||
    code === 503 ||
    /RESOURCE_EXHAUSTED|UNAVAILABLE|INDISPONIVEL|INDISPONÍVEL|HIGH DEMAND|ALTA DEMANDA|RATE LIMIT/i.test(combined)
  );
};

const generateContentWithRetry = async (
  ai: GoogleGenAI,
  request: Omit<GenerateContentParameters, "model">,
  preferredModels: string[],
  attemptsPerModel = 3,
) => {
  const models = [...new Set(preferredModels.filter(Boolean))];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= attemptsPerModel; attempt += 1) {
      try {
        return await ai.models.generateContent({
          ...request,
          model,
        });
      } catch (error: any) {
        lastError = error;
        const retryable = isRetryableAiError(error);
        const hasMoreAttempts = attempt < attemptsPerModel;
        if (!retryable || !hasMoreAttempts) break;
        const backoffMs = 800 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
        await sleep(backoffMs);
      }
    }
  }

  throw lastError;
};

const sendAiError = (res: express.Response, error: any, fallbackMessage: string) => {
  if (isRetryableAiError(error)) {
    res.status(503).json({
      error: "Modelo em alta demanda no momento. Tente novamente em alguns segundos.",
    });
    return;
  }
  res.status(500).json({ error: error?.message || fallbackMessage });
};

const ensureDataDir = () => {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to ensure data dir:", DATA_DIR, error);
  }
};

const normalizeUsers = (input: unknown): ManagedUser[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((raw) => {
      const username = String((raw as any)?.username || "").trim();
      const password = String((raw as any)?.password || "").trim();
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
type DbUser = {
  username: string;
  name: string;
  password_hash: string;
  created_at: string;
  expires_at: string | null;
};

const listUsersDb = async (): Promise<DbUser[]> => {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase
    .from("managed_users")
    .select("username,name,password_hash,created_at,expires_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as DbUser[];
};

const findUserDb = async (username: string): Promise<DbUser | null> => {
  if (!supabase) throw new Error("Supabase não configurado.");
  const normalized = username.trim().toLowerCase();

  const { data, error } = await supabase
    .from("managed_users")
    .select("username,name,password_hash,created_at,expires_at")
    .eq("username", normalized)
    .maybeSingle();

  if (error) throw error;
  return (data as DbUser | null) || null;
};
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
  ensureDataDir();
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
    const usersFileExists = fs.existsSync(USERS_FILE);
    res.json({
      status: "ok",
      geminiConfigured: hasGeminiKey,
      geminiEnvSource: process.env.GEMINI_API_KEY
        ? "GEMINI_API_KEY"
        : process.env.GOOGLE_API_KEY
          ? "GOOGLE_API_KEY"
          : "none",
      renderGitCommit:
        (process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || process.env.SOURCE_VERSION || "").trim() ||
        null,
      dataDir: DATA_DIR,
      usersFile: USERS_FILE,
      usersFileExists,
      usersCount: usersState.length,
    });
  });

  app.get("/api/version", (req, res) => {
    const currentVersion = process.env.APP_VERSION || "1.0.1";
    res.json({
      version: currentVersion,
      releaseDate: new Date().toISOString(),
      changelog: "Atualização de layout e cotações CEPEA/UFRGS",
      isRequired: false,
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
    const password = String(req.body?.password || "").trim();
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
        password: password ? password : existing.password,
      };
    } else {
      if (!password) {
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
    
    const chunk = `event: user_updated\ndata: ${JSON.stringify({ username: username.toLowerCase() })}\n\n`;
    syncClients.forEach((client) => {
      client.write(chunk);
    });

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
    
    const chunk = `event: user_updated\ndata: ${JSON.stringify({ username: username.toLowerCase() })}\n\n`;
    syncClients.forEach((client) => {
      client.write(chunk);
    });

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
      const inlineDataList = Array.isArray(req.body?.inlineDataList) ? req.body.inlineDataList : (req.body?.inlineData ? [req.body.inlineData] : []);
      if (!prompt) {
        res.status(400).json({ error: "Prompt inválido." });
        return;
      }

      const parts: any[] = [];
      for (const img of inlineDataList) {
        if (img?.mimeType && img?.data) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data,
            },
          });
        }
      }
      parts.push({ text: prompt });

      const response = await generateContentWithRetry(
        ai,
        {
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
        },
        ["gemini-3-flash-preview", "gemini-2.5-flash"],
      );

      const text = response.text || "";
      const data = JSON.parse(text);
      res.json({ data });
    } catch (error: any) {
      sendAiError(res, error, "Falha na análise de peso.");
    }
  });

  app.post("/api/ai/dr-pasto", async (req, res) => {
    try {
      const ai = getAiClient();
      if (!ai) {
        res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor." });
        return;
      }

      const notes = String(req.body?.notes || "").trim();
      const inlineDataList = Array.isArray(req.body?.inlineDataList) ? req.body.inlineDataList : (req.body?.inlineData ? [req.body.inlineData] : []);
      
      if (inlineDataList.length === 0) {
        res.status(400).json({ error: "Imagem inválida ou ausente." });
        return;
      }

      const prompt = `
Você é o Dr.Pasto, um "veterinário de bolso" para pecuaristas. Analise a FOTO (ou FOTOS) do animal e aponte hipóteses (suspeitas) de doenças/condições com base apenas em sinais visuais.

Regras:
- Não dê diagnóstico definitivo. Use "suspeita" e "diferenciais".
- Se as imagens não permitirem, diga que não é possível concluir e peça mais informações.
- Sempre inclua orientações de segurança e quando chamar um veterinário.
- Assuma bovinos por padrão, mas se não for bovino, mencione a espécie provável.
- Responda em português do Brasil.

Contexto adicional do pecuarista (pode estar vazio): ${notes || "(nenhum)"}

Retorne no schema solicitado.
      `.trim();

      const parts: any[] = inlineDataList.map((img: any) => ({
        inlineData: {
          mimeType: img.mimeType,
          data: img.data,
        },
      }));
      parts.push({ text: prompt });

      const response = await generateContentWithRetry(
        ai,
        {
          contents: { parts },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                especie_provavel: { type: Type.STRING },
                sinais_visuais: { type: Type.ARRAY, items: { type: Type.STRING } },
                suspeitas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      doenca: { type: Type.STRING },
                      probabilidade: { type: Type.NUMBER },
                      justificativa_visual: { type: Type.STRING },
                      nivel_urgencia: { type: Type.STRING },
                      acoes_imediatas: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["doenca", "probabilidade", "justificativa_visual", "nivel_urgencia", "acoes_imediatas"],
                  },
                },
                perguntas_para_confirmar: { type: Type.ARRAY, items: { type: Type.STRING } },
                quando_chamar_veterinario: { type: Type.STRING },
                aviso: { type: Type.STRING },
              },
              required: [
                "especie_provavel",
                "sinais_visuais",
                "suspeitas",
                "perguntas_para_confirmar",
                "quando_chamar_veterinario",
                "aviso",
              ],
            },
          },
        },
        ["gemini-3-flash-preview", "gemini-2.5-flash"],
      );

      const text = response.text || "";
      const data = JSON.parse(text);
      res.json({ data });
    } catch (error: any) {
      sendAiError(res, error, "Falha na análise veterinária.");
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
      const response = await generateContentWithRetry(
        ai,
        {
        contents: `Analise este inventário rural e forneça insights estratégicos curtos:\n${JSON.stringify({ categories, items })}`,
        },
        ["gemini-3-flash-preview", "gemini-2.5-flash"],
      );
      res.json({ text: response.text || "Sem insights no momento." });
    } catch (error: any) {
      sendAiError(res, error, "Falha ao gerar insights.");
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

      const response = await generateContentWithRetry(
        ai,
        {
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
        },
        ["gemini-2.5-flash"],
      );

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = chunks
        .filter((c: any) => c.maps)
        .map((c: any) => ({
          uri: c.maps.uri,
          title: c.maps.title,
        }));

      res.json({ text: response.text || "Nenhum resultado encontrado.", links });
    } catch (error: any) {
      sendAiError(res, error, "Falha ao consultar mapas.");
    }
  });

  app.get("/api/ai/market-quotes", async (req, res) => {
    try {
      const ai = getAiClient();
      if (!ai) {
        res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor." });
        return;
      }

      const prompt = `Busque na internet as cotações atuais (de hoje ou desta semana) do mercado agropecuário. 
Preciso dos valores em Reais (R$) para o Rio Grande do Sul (NESUI/UFRGS) e média CEPEA.
Para a UFRGS/NESUI, se o preço for por Kg, coloque; se for por Arroba, coloque. 
Para a CEPEA, é OBRIGATÓRIO retornar o valor em Reais (R$) por Kg (Quilograma). Se a fonte original fornecer em arroba (@), você DEVE converter para Kg dividindo por 15. Se não achar, coloque 'N/D'.

Formato JSON obrigatório (retorne APENAS o JSON, sem marcações markdown ou texto extra):
{
  "ufrgs": { "boi": "", "vaca": "", "novilho": "", "terneiro": "", "terneira": "" },
  "cepea": { "boi": "", "vaca": "", "novilho": "", "terneiro": "", "terneira": "" }
}`;

      const response = await generateContentWithRetry(
        ai,
        {
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        },
        ["gemini-2.5-flash"]
      );

      let text = response.text || "{}";
      text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const data = JSON.parse(text);
      res.json({ data, fetchedAt: Date.now() });
    } catch (error: any) {
      sendAiError(res, error, "Falha ao buscar cotações do mercado.");
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
    // - index.html: no-store so clients get latest HTML (avoids "stuck" UI after deploy)
    // - hashed assets: cache long-term
    app.use(
      express.static("dist", {
        setHeaders: (res, filePath) => {
          const normalized = filePath.replace(/\\/g, "/");
          if (normalized.endsWith("/index.html")) {
            res.setHeader("Cache-Control", "no-store");
            return;
          }
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        },
      }),
    );
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
