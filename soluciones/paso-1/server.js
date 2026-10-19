// MUNIA · PASO 1: servidor + proxy al LLM (Node 18+, sin dependencias).
// Sirve el frontend de /public y hace de proxy hacia OpenRouter (Llama 3.3 70B).
// La API key vive solo en el servidor: el navegador nunca la ve.

const http = require("http");
const fs = require("fs");
const path = require("path");

// --- .env mínimo --------------------------------------------------------------
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.MODEL || "meta-llama/llama-3.3-70b-instruct";
// Cambia BASE_URL para usar un LLM local compatible con OpenAI (Ollama, vLLM):
//   BASE_URL=http://localhost:11434/v1   MODEL=llama3.3:70b
const BASE_URL = process.env.BASE_URL || "https://openrouter.ai/api/v1";
const API_KEY = process.env.OPENROUTER_API_KEY || "";

const BENEFICIOS = JSON.parse(fs.readFileSync(path.join(__dirname, "data/beneficios.json"), "utf8"));
const COMUNA = "Municipalidad de Villa Esperanza (comuna ficticia)";

function systemPrompt(perfil) {
  return `Eres MUNIA, el asistente virtual de la ${COMUNA}.
Hablas español de Chile, con tono cálido, claro y breve (máximo 120 palabras por respuesta).
Perfil del vecino: ${JSON.stringify(perfil)}`;
}

// --- HTTP ----------------------------------------------------------------------
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch (e) { reject(e); } });
  });
}

async function chat(req, res) {
  const { perfil = {}, messages = [] } = await readBody(req);
  if (BASE_URL.includes("openrouter") && (!API_KEY || API_KEY.includes("PEGA_AQUI"))) {
    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Falta tu API key: copia .env.example a .env y reemplaza PEGA_AQUI_TU_API_KEY." }));
  }
  const historial = messages.slice(-12).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: String(m.content).slice(0, 2000) }));

  // Un reintento ante fallas de red: en una demo en vivo el wifi no perdona.
  const llamar = (opts) => fetch(`${BASE_URL}/chat/completions`, opts)
    .catch(() => new Promise((r) => setTimeout(r, 800)).then(() => fetch(`${BASE_URL}/chat/completions`, opts)));
  const upstream = await llamar({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": "http://localhost",
      "X-Title": "MUNIA hands-on UAI",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      temperature: 0.3,
      max_tokens: 600,
      messages: [{ role: "system", content: systemPrompt(perfil) }, ...historial],
    }),
  });

  if (!upstream.ok) {
    const txt = await upstream.text();
    res.writeHead(502, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: `LLM ${upstream.status}: ${txt.slice(0, 300)}` }));
  }

  // Re-emitimos solo el texto como stream plano: más simple de consumir en el navegador.
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" });
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of upstream.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
      try {
        const delta = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content;
        if (delta) res.write(delta);
      } catch {}
    }
  }
  res.end();
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (req.method === "POST" && url.pathname === "/api/chat") return await chat(req, res);
    if (url.pathname === "/api/beneficios") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(BENEFICIOS));
    }
    const file = path.normalize(path.join(__dirname, "public", url.pathname === "/" ? "index.html" : url.pathname));
    if (!file.startsWith(path.join(__dirname, "public")) || !fs.existsSync(file)) {
      res.writeHead(404); return res.end("No encontrado");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e.message }));
  }
}).listen(PORT, () => {
  console.log(`MUNIA en http://localhost:${PORT}  ·  modelo: ${MODEL}`);
  if (BASE_URL.includes("openrouter") && (!API_KEY || API_KEY.includes("PEGA_AQUI"))) console.warn("⚠  Falta tu OPENROUTER_API_KEY en .env");
});
