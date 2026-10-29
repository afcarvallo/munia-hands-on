// Aplica un paso del taller sin escribir código:  npm run paso1 | paso2 | paso3   (paso0 = volver al inicio)
// Copia a lib/ la versión resuelta de cada archivo hasta el paso pedido y explica qué cambió.
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const PASOS = {
  1: { archivo: "llm.js", titulo: "Conectamos el LLM",
       que: "llamarLLM() hace un POST con streaming a la API (BASE_URL, MODEL, API_KEY de .env).",
       efecto: "El chat ahora responde… pero el modelo no conoce el catálogo: INVENTA beneficios." },
  2: { archivo: "reglas.js", titulo: "Agregamos reglas de elegibilidad",
       que: "elegibles() filtra el catálogo por edad, género e ingreso. Es código auditable y con tests.",
       efecto: "El log del servidor baja de '14 de 14' a los que de verdad corresponden… pero el modelo aún no los ve." },
  3: { archivo: "prompt.js", titulo: "Le damos al modelo solo lo elegible",
       que: "systemPrompt() incluye SOLO los beneficios filtrados, prohíbe inventar y pide [[BENEFICIO:id]].",
       efecto: "Ahora recomienda solo beneficios reales, como tarjetas, y dice que no cuando algo no existe." },
};

const n = Number(process.argv[2]);
if (!(n >= 0 && n <= 3)) { console.log("Uso: npm run paso0 | paso1 | paso2 | paso3"); process.exit(1); }

for (const k of [1, 2, 3]) {
  const { archivo } = PASOS[k];
  const origen = path.join(raiz, "soluciones", k <= n ? "lib" : "inicial", archivo);
  fs.copyFileSync(origen, path.join(raiz, "lib", archivo));
}

if (n === 0) {
  console.log("\n↺  Volvimos al inicio: lib/llm.js, lib/reglas.js y lib/prompt.js tienen sus TODO.\n   En el chat verás: “⚠️ TODO paso 1”.\n");
} else {
  const p = PASOS[n];
  console.log(`\n✅ Paso ${n} · ${p.titulo}\n   Archivo: lib/${p.archivo}\n   Qué cambia: ${p.que}\n   Qué vas a ver: ${p.efecto}\n\n   Vuelve a preguntar en el chat (no hace falta reiniciar el servidor).\n`);
}
