// Servidor de MUNIA (Node 18+, sin dependencias). Ya está listo: lo que programas en el taller
// está en lib/llm.js, lib/reglas.js y lib/prompt.js.
//
//   GET  /api/beneficios  → el catálogo
//   POST /api/chat        → { perfil, messages }  →  respuesta del LLM en streaming (texto plano)

const http = require("http");
const fs = require("fs");
const path = require("path");

// --- .env mínimo ---------------------------------------------------------------------
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const linea of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
process.env.BASE_URL ||= "https://api.openai.com/v1";
process.env.MODEL ||= "gpt-4.1-mini";
process.env.API_KEY ||= process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "";

// Recarga lib/ en cada consulta: al aplicar un paso (npm run pasoN) basta con volver a preguntar en el chat.
function cargar(modulo) {
  const ruta = require.resolve(`./lib/${modulo}`);
  delete require.cache[ruta];
  delete require.cache[require.resolve("./lib/sse")];
  return require(ruta);
}

const BENEFICIOS = JSON.parse(fs.readFileSync(path.join(__dirname, "data/beneficios.json"), "utf8"));
const PUBLIC = path.join(__dirname, "public");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json" };

function leerBody(req) {
  return new Promise((ok, mal) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => { try { ok(JSON.parse(data || "{}")); } catch (e) { mal(e); } });
  });
}

async function chat(req, res) {
  const { perfil = {}, messages = [] } = await leerBody(req);
  const p = { nombre: perfil.nombre, edad: Number(perfil.edad), genero: perfil.genero, ingreso: Number(perfil.ingreso) };

  const { llamarLLM } = cargar("llm"), { elegibles } = cargar("reglas"), { systemPrompt } = cargar("prompt");
  const lista = elegibles(p, BENEFICIOS);                      // paso 2
  const sistema = systemPrompt(p, lista);                      // paso 3
  console.log(`[chat] ${p.nombre || "vecino"}, ${p.edad} años: ${lista.length} de ${BENEFICIOS.length} beneficios elegibles`);

  const historial = messages.slice(-10).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: String(m.content) }));
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" });
  try {
    for await (const trozo of llamarLLM([{ role: "system", content: sistema }, ...historial])) res.write(trozo);   // paso 1
  } catch (e) {
    console.error("[chat]", e.message);
    const pista = e.message.startsWith("TODO") ? `\n\nAplica el paso en la carpeta de este servidor:\n${__dirname}` : "";
    res.write(`⚠️ ${e.message}${pista}`);
  }
  res.end();
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "POST" && url.pathname === "/api/chat") return await chat(req, res);
    if (url.pathname === "/api/beneficios") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(BENEFICIOS));
    }
    const archivo = path.normalize(path.join(PUBLIC, url.pathname === "/" ? "index.html" : url.pathname));
    if (!archivo.startsWith(PUBLIC) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) { res.writeHead(404); return res.end("No encontrado"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(archivo)] || "application/octet-stream", "Cache-Control": "no-cache" });
    fs.createReadStream(archivo).pipe(res);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
}).listen(Number(process.env.PORT || 3000), () => {
  console.log(`MUNIA en http://localhost:${process.env.PORT || 3000}  ·  modelo: ${process.env.MODEL}`);
  console.log(`Carpeta: ${__dirname}  ·  aplica los pasos aquí con: npm run paso1`);
  const k = process.env.API_KEY || "";
  if (!k || k.includes("PEGA_AQUI")) console.warn("⚠  Falta tu API_KEY en .env");
});
