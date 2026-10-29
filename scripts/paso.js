// Aplica un paso del taller sin escribir código. Dos formas, el mismo efecto:
//   - en la app: la barra "Pasos del taller", junto al teléfono
//   - en la terminal: npm run paso1 | paso2 | paso3   (paso0 = volver al inicio)
// Copia a lib/ la versión de cada archivo que corresponde al paso pedido (ver VERSIONES).
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const PASOS = {
  0: { archivos: [], titulo: "Inicio",
       que: "lib/llm.js, lib/reglas.js y lib/prompt.js tienen sus TODO.",
       efecto: "El chat responde “⚠️ TODO paso 1”: todavía no está conectado a ningún modelo." },
  1: { archivos: ["llm.js"], titulo: "Conectamos el LLM",
       que: "llamarLLM() hace un POST con streaming a la API (BASE_URL, MODEL, API_KEY de .env).",
       efecto: "El chat responde… pero el modelo no conoce el catálogo: INVENTA beneficios." },
  2: { archivos: ["reglas.js", "prompt.js"], titulo: "Reglas + la lista en el prompt",
       que: "elegibles() filtra el catálogo por edad, género e ingreso (código con tests), y el prompt recibe esa lista.",
       efecto: "Ya nombra beneficios reales del catálogo… pero solo en texto: sin tarjetas, y nada le impide inventar." },
  3: { archivos: ["prompt.js"], titulo: "Reglas claras para el modelo",
       que: "El prompt prohíbe inventar, limita a 3 recomendaciones y pide [[BENEFICIO:id]] para cada una.",
       efecto: "Recomienda solo beneficios reales, como tarjetas con botón Solicitar, y dice que no cuando algo no existe." },
};

// Qué versión de cada archivo de lib/ corresponde a cada paso (0, 1, 2, 3).
const VERSIONES = {
  "llm.js":    ["inicial", "lib", "lib", "lib"],
  "reglas.js": ["inicial", "inicial", "lib", "lib"],
  "prompt.js": ["inicial", "inicial", "paso2", "lib"],
};

function aplicar(n) {
  if (!(Number.isInteger(n) && n >= 0 && n <= 3)) throw new Error("El paso debe ser 0, 1, 2 o 3");
  for (const [archivo, v] of Object.entries(VERSIONES))
    fs.copyFileSync(path.join(raiz, "soluciones", v[n], archivo), path.join(raiz, "lib", archivo));
}

// Paso en que está lib/: 0–3, o null si algún archivo fue editado a mano.
function actual() {
  const leer = (...p) => fs.readFileSync(path.join(raiz, ...p), "utf8");
  for (const n of [0, 1, 2, 3])
    if (Object.entries(VERSIONES).every(([archivo, v]) => leer("lib", archivo) === leer("soluciones", v[n], archivo))) return n;
  return null;
}

module.exports = { PASOS, aplicar, actual };

if (require.main === module) {
  const n = Number(process.argv[2]);
  try { aplicar(n); } catch { console.log("Uso: npm run paso0 | paso1 | paso2 | paso3"); process.exit(1); }
  const p = PASOS[n];
  if (n === 0) console.log(`\n↺  Volvimos al inicio: ${p.que}\n   ${p.efecto}\n`);
  else console.log(`\n✅ Paso ${n} · ${p.titulo}\n   Archivos: ${p.archivos.map((f) => "lib/" + f).join(", ")}\n   Qué cambia: ${p.que}\n   Qué vas a ver: ${p.efecto}\n\n   Vuelve a preguntar en el chat (no hace falta reiniciar el servidor).\n`);
}
