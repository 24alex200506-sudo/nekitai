// Vercel Serverless Function — обёртка над Express app
import express from "express";
import cors from "cors";
import { Router } from "express";

// ─── AI провайдеры (инлайн, без workspace imports) ────────────────────────────

const SYSTEM_PROMPT = `Ты — nekit AI, умный ассистент.
Правила ответов:
- Обычные вопросы — коротко, 2-4 предложения, без лишних вступлений
- Если просят код — пиши ПОЛНЫЙ рабочий код без сокращений, но без лишних объяснений вокруг
- Без длинных списков возможностей и саморекламы
- Язык пользователя (русский)`;

async function callGroq(prompt, history) {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
  });
  const model = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: prompt },
    ],
    max_tokens: 8000,
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content ?? "Нет ответа.";
}

async function callOpenAI(prompt, history) {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: prompt },
    ],
    max_tokens: 1500,
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content ?? "Нет ответа.";
}

async function callAnthropic(prompt, history) {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022",
    system: SYSTEM_PROMPT,
    messages: [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: prompt },
    ],
    max_tokens: 1500,
  });
  const block = response.content[0];
  return block?.type === "text" ? block.text : "Нет ответа.";
}

function getProvider() {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "local";
}

function createLocalResponse(prompt) {
  const clean = prompt.trim();
  const lower = clean.toLowerCase();
  if (lower.includes("привет") || lower.includes("хай") || lower === "ку") {
    return "Привет! Я nekit AI. Напиши, что нужно сделать.";
  }
  return `Понял тебя: ${clean.length > 80 ? clean.slice(0, 77) + "..." : clean}.\n\nУточни желаемый результат, и я подготовлю следующий шаг.`;
}

async function askAI(prompt, history = []) {
  const provider = getProvider();
  if (provider === "groq") return { text: await callGroq(prompt, history), provider };
  if (provider === "openai") return { text: await callOpenAI(prompt, history), provider };
  if (provider === "anthropic") return { text: await callAnthropic(prompt, history), provider };
  return { text: createLocalResponse(prompt), provider: "local" };
}

// ─── In-memory история (живёт пока serverless функция горячая) ────────────────
const globalHistory = [];
const MAX_HISTORY = 20;

const activity = [
  { id: "welcome", title: "Создать лендинг для продукта", mode: "create", status: "completed", createdAt: new Date().toISOString() },
];

// ─── Express app ──────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));

// Provider info
app.get("/api/assistant/provider", (_req, res) => {
  const provider = getProvider();
  const labels = { groq: "Groq", openai: "OpenAI", anthropic: "Anthropic Claude", local: "Локальный режим" };
  res.json({ provider, label: labels[provider] ?? provider, isAI: provider !== "local" });
});

// Activity
app.get("/api/assistant/activity", (_req, res) => res.json(activity));

// Chat
app.post("/api/assistant/respond", async (req, res) => {
  const { prompt, mode } = req.body ?? {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Напиши задачу." });
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    const aiResult = await askAI(prompt, globalHistory);
    const responseText = aiResult.text;
    const title = prompt.length > 90 ? prompt.slice(0, 87) + "..." : prompt;

    globalHistory.push({ role: "user", content: prompt });
    globalHistory.push({ role: "assistant", content: responseText });
    if (globalHistory.length > MAX_HISTORY * 2) globalHistory.splice(0, 2);

    activity.unshift({ id, title, mode: mode ?? "create", status: "completed", createdAt });
    activity.splice(8);

    res.json({ id, mode: mode ?? "create", title, summary: `Ответ от ${aiResult.provider}.`, response: responseText, actions: [], createdAt });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Ошибка сервера" });
  }
});

export default app;
