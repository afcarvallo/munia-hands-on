// Aplica un paso del taller sin escribir código. Dos formas, el mismo efecto:
//   - en la app: la barra "Pasos del taller", junto al teléfono
//   - en la terminal: npm run paso1 | paso2 | paso3   (paso0 = volver al inicio)
// Copia a lib/ la versión resuelta de cada archivo hasta el paso pedido.
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const PASOS = {
  0: { archivo: null, titulo: "Inicio",
       que: "lib/llm.js, lib/reglas.js y lib/prompt.js tienen sus TODO.",
       efecto: "El chat responde “⚠️ TODO paso 1”: todavía no está conectado a ningún modelo." },
  1: { archivo: "llm.js", titulo: "Conectamos el LLM",
       que: "llamarLLM() hace un POST con streaming a la API (BASE_URL, MODEL, API_KEY de .env).",
       efecto: "El chat ahora responde… pero el modelo no conoce el catálogo: INVENTA beneficios." },
  2: { archivo: "reglas.js", titulo: "Agregamos reglas de elegibilidad",
       que: "elegibles() filtra el catálogo por edad, género e ingreso. Es código auditable y con tests.",
       efecto: "La lista del catálogo tacha lo que no le corresponde (y dice por qué) y el contador baja de 14… pero el modelo aún no recibe la lista: la respuesta sigue inventando." },
  3: { archivo: "prompt.js", titulo: "Le damos al modelo solo lo elegible",
       que: "systemPrompt() incluye SOLO los beneficios filtrados, prohíbe inventar y pide [[BENEFICIO:id]].",
       efecto: "Ahora recomienda solo beneficios reales, como tarjetas, y dice que no cuando algo no existe." },
};
const ARCHIVOS = [1, 2, 3].map((k) => PASOS[k].archivo);

function aplicar(n) {
  if (!(Number.isInteger(n) && n >= 0 && n <= 3)) throw new Error("El paso debe ser 0, 1, 2 o 3");
  for (const k of [1, 2, 3]) {
    const origen = path.join(raiz, "soluciones", k <= n ? "lib" : "inicial", PASOS[k].archivo);
    fs.copyFileSync(origen, path.join(raiz, "lib", PASOS[k].archivo));
  }
}

// Paso en que está lib/: 0–3, o null si algún archivo fue editado a mano.
function actual() {
  const igual = (a, b) => fs.readFileSync(a, "utf8") === fs.readFileSync(b, "utf8");
  const estado = ARCHIVOS.map((f) =>
    igual(path.join(raiz, "lib", f), path.join(raiz, "soluciones/lib", f)) ? 1
      : igual(path.join(raiz, "lib", f), path.join(raiz, "soluciones/inicial", f)) ? 0 : null);
  if (estado.includes(null)) return null;
  const n = estado.indexOf(0) === -1 ? 3 : estado.indexOf(0);
  return estado.slice(n).every((e) => e === 0) ? n : null;
}

module.exports = { PASOS, aplicar, actual };

if (require.main === module) {
  const n = Number(process.argv[2]);
  try { aplicar(n); } catch { console.log("Uso: npm run paso0 | paso1 | paso2 | paso3"); process.exit(1); }
  const p = PASOS[n];
  if (n === 0) console.log(`\n↺  Volvimos al inicio: ${p.que}\n   ${p.efecto}\n`);
  else console.log(`\n✅ Paso ${n} · ${p.titulo}\n   Archivo: lib/${p.archivo}\n   Qué cambia: ${p.que}\n   Qué vas a ver: ${p.efecto}\n\n   Vuelve a preguntar en el chat (no hace falta reiniciar el servidor).\n`);
}
