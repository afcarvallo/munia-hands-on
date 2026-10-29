// MUNIA · frontend (JS plano, sin build). Ya está listo: no necesitas modificarlo en el taller.
// Incluye la barra "Pasos del taller", que aplica cada paso sin usar la terminal.

const $ = (s) => document.querySelector(s);
const app = $("#app");
const INGRESOS = [
  ["300000", "Menos de $350.000"],
  ["500000", "$350.000 – $600.000"],
  ["800000", "$600.000 – $1.000.000"],
  ["1500000", "$1.000.000 – $2.000.000"],
  ["3000000", "Más de $2.000.000"],
];

const guardado = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const state = {
  perfil: guardado("munia.perfil", null),
  solicitudes: guardado("munia.solicitudes", []),
  mensajes: guardado("munia.mensajes", []),
  tab: "chat",
  borrador: {},
  beneficios: [],
  cargando: false,
  paso: undefined,       // 0–3 según lib/ en el servidor; null si se editó a mano
  pasos: {},
  elegibles: null,       // "7/14": lo que calcularon las reglas en la última consulta
  elegiblesIds: null,    // ids que pasaron las reglas en la última consulta
  ultima: guardado("munia.ultima", ""),
  cambiandoPaso: false,
};

// --- Utilidades ---------------------------------------------------------------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clp = (n) => "$" + Number(n).toLocaleString("es-CL");

function md(texto) {
  const lineas = esc(texto).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").split("\n");
  let html = "", enLista = false;
  for (const l of lineas) {
    const item = l.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)/);
    if (item) { if (!enLista) { html += "<ul>"; enLista = true; } html += `<li>${item[1]}</li>`; continue; }
    if (enLista) { html += "</ul>"; enLista = false; }
    html += l + "\n";
  }
  return (enLista ? html + "</ul>" : html).trim();
}

// --- Registro: solo lo que usan las reglas (nombre, edad, género, ingreso) ------
function vistaRegistro() {
  const b = state.borrador;
  app.innerHTML = `
    <div class="header"><div class="avatar">M</div><div><h1>Registro Municipal</h1><small>Crea tu perfil ciudadano</small></div></div>
    <div class="registro">
      <h2>Tus datos</h2>
      <label>Nombre</label><input id="nombre" placeholder="Ana" />
      <label>Edad</label><input id="edad" type="number" min="0" max="120" placeholder="70" />
      <label>Género</label>
      <select id="genero"><option value="">Selecciona…</option><option>Femenino</option><option>Masculino</option><option>Otro</option></select>
      <label>Ingreso Mensual del Hogar</label>
      <select id="ingreso"><option value="">Selecciona…</option>${INGRESOS.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>
      <div class="error" id="error"></div>
      <div class="botones"><button class="btn" id="seguir">Comenzar</button></div>
    </div>`;
  app.querySelectorAll("input, select").forEach((el) => { if (b[el.id]) el.value = b[el.id]; });
  $("#seguir").onclick = () => {
    leerCampos();
    const err = validar();
    if (err) return ($("#error").textContent = err);
    state.perfil = { nombre: b.nombre, edad: Number(b.edad), genero: b.genero, ingreso: b.ingreso };
    guardar("munia.perfil", state.perfil);
    reiniciarChat();
    render();
  };
}

const saludo = (nombre) => ({ role: "assistant", content: `¡Hola, ${nombre}! 👋 Soy MUNIA, tu asistente municipal. Con tu perfil ya revisé qué beneficios podrías recibir. ¿Qué necesitas hoy?` });
function reiniciarChat() {
  state.mensajes = [saludo(state.perfil.nombre)];
  state.elegibles = null; state.elegiblesIds = null;
  guardar("munia.mensajes", state.mensajes);
}

function leerCampos() { app.querySelectorAll("input, select").forEach((el) => (state.borrador[el.id] = el.value.trim())); }

function validar() {
  const b = state.borrador, edad = Number(b.edad);
  if (!b.nombre) return "Escribe tu nombre.";
  if (!b.edad || !(edad >= 0 && edad <= 120)) return "Escribe una edad entre 0 y 120.";
  if (!b.genero) return "Selecciona un género.";
  if (!b.ingreso) return "Selecciona el ingreso del hogar.";
  return "";
}

// --- Chat ------------------------------------------------------------------------
const SUGERENCIAS = ["¿Qué beneficios tengo?", "Busco actividades deportivas", "Necesito apoyo en salud", "¿Hay algo para emprender?"];

function tarjeta(b, compacta = false) {
  const sol = state.solicitudes.find((s) => s.id === b.id);
  return `<div class="card">
    <span class="tag">${esc(b.categoria)}</span>
    <h3>${esc(b.nombre)}</h3>
    <p>${esc(b.descripcion)}</p>
    ${compacta ? "" : `<ul>${b.requisitos.map((r) => `<li>${esc(r)}</li>`).join("")}</ul><p>🗓 ${esc(b.cuando)}<br>📍 ${esc(b.lugar)}</p>`}
    <button class="btn" data-solicitar="${b.id}" ${sol ? "disabled" : ""}>${sol ? "✓ Solicitado" : "Solicitar"}</button>
  </div>`;
}

function burbuja(m) {
  if (m.role === "user") return `<div class="msg user">${esc(m.content)}</div>`;
  // Cada [[BENEFICIO:id]] (o [id], si el modelo se equivoca de formato) se convierte en tarjeta donde aparece.
  // Solo si el id existe en el catálogo; cada beneficio se muestra una vez y las etiquetas inválidas se ocultan.
  const vistos = new Set(), partes = [];
  let resto = m.content;
  const re = /\[\[?\s*(?:BENEFICIO\s*:)?\s*([^\[\]\n]*?)\s*\]\]?/gi;
  let ult = 0, x;
  while ((x = re.exec(resto))) {
    const b = state.beneficios.find((y) => y.id === x[1]);
    const esEtiqueta = x[0].startsWith("[[") || b;
    if (!esEtiqueta) continue;                       // corchetes normales del texto: se quedan como están
    partes.push({ t: resto.slice(ult, x.index) });
    if (b && !vistos.has(b.id)) { vistos.add(b.id); partes.push({ b }); }
    ult = re.lastIndex;
  }
  partes.push({ t: resto.slice(ult) });
  return partes.map((p) => {
    if (p.b) return tarjeta(p.b, true);
    const t = p.t.replace(/[ \t]+([.,;:])/g, "$1").trim();
    return t ? `<div class="msg bot">${md(t)}</div>` : "";
  }).join("");
}

function vistaChat() {
  const v = $(".vista");
  v.innerHTML = state.mensajes.map(burbuja).join("");
  v.insertAdjacentHTML("afterend", `
    <div class="sugerencias">${SUGERENCIAS.map((s) => `<button class="chip" data-sug="${esc(s)}">${esc(s)}</button>`).join("")}</div>
    <form class="composer"><input id="texto" placeholder="Escribe tu consulta…" autocomplete="off" /><button id="enviar">➤</button></form>`);
  v.scrollTop = v.scrollHeight;
  app.querySelectorAll("[data-sug]").forEach((el) => (el.onclick = () => enviar(el.dataset.sug)));
  $(".composer").onsubmit = (e) => { e.preventDefault(); enviar($("#texto").value); };
}

async function enviar(texto) {
  texto = texto.trim();
  if (!texto || state.cargando) return;
  state.cargando = true;
  state.ultima = texto;
  guardar("munia.ultima", texto);
  state.mensajes.push({ role: "user", content: texto });
  const bot = { role: "assistant", content: "" };
  state.mensajes.push(bot);
  render();
  const v = $(".vista");
  const nodo = v.lastElementChild;
  nodo.classList.add("typing");
  $("#enviar").disabled = true;
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perfil: state.perfil, messages: state.mensajes.slice(0, -1) }),
    });
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    state.elegibles = r.headers.get("X-Elegibles");
    state.elegiblesIds = (r.headers.get("X-Elegibles-Ids") || "").split(",").filter(Boolean);
    renderTaller();
    const reader = r.body.getReader(), dec = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bot.content += dec.decode(value, { stream: true });
      nodo.innerHTML = md(bot.content.replace(/\[\[[\w:-]*\]?\]?/g, ""));
      v.scrollTop = v.scrollHeight;
    }
  } catch (e) {
    bot.content = "😔 No pude conectarme con el asistente. " + e.message;
  }
  state.cargando = false;
  guardar("munia.mensajes", state.mensajes);
  render();
}

// --- Pestañas que se completan en el bonus ---------------------------------------
const pronto = (t) => () => ($(".vista").innerHTML = `<div class="vacio">${t}<br>Llega en el bonus 🚧</div>`);
const vistaBeneficios = pronto("Catálogo de beneficios");
const vistaMis = pronto("Mis solicitudes");
const vistaPerfil = pronto("Mi perfil");
function solicitar() { alert("Las solicitudes con QR llegan en el bonus 🚧"); }

// --- Render principal --------------------------------------------------------------
const TABS = [["chat", "💬", "Chat"], ["beneficios", "🎁", "Beneficios"], ["mis", "📋", "Mis beneficios"], ["perfil", "👤", "Perfil"]];

function render() {
  renderTaller();
  if (!state.perfil) return vistaRegistro();
  app.innerHTML = `
    <div class="header"><div class="avatar">M</div><div><h1>MUNIA · Asistente Municipal</h1><small>en línea</small></div></div>
    <div class="vista"></div>
    <nav class="tabs">${TABS.map(([k, i, t]) => `<button data-tab="${k}" class="${state.tab === k ? "on" : ""}"><span class="ico">${i}</span>${t}</button>`).join("")}</nav>`;
  ({ chat: vistaChat, beneficios: vistaBeneficios, mis: vistaMis, perfil: vistaPerfil })[state.tab]();
  app.querySelectorAll("[data-tab]").forEach((el) => (el.onclick = () => { state.tab = el.dataset.tab; render(); }));
  app.querySelectorAll("[data-solicitar]").forEach((el) => (el.onclick = () => solicitar(el.dataset.solicitar)));
}

// --- Pasos del taller: se eligen aquí (o con npm run pasoN en la terminal) --------------
const NOMBRES = ["Inicio", "LLM", "Reglas", "Prompt"];

function renderTaller() {
  const t = $("#taller");
  if (!t) return;
  const n = state.paso, p = state.pasos[n];
  const [ele, tot] = (state.elegibles || "").split("/");
  const quien = state.perfil ? esc(state.perfil.nombre) : "cada vecino";
  const nota = n === 3 ? "El modelo recibe solo esta lista y tiene prohibido inventar."
    : n === 2 ? "Lo calculan las reglas, y el modelo ya recibe esta lista."
    : "Sin reglas, todos cuentan como elegibles.";
  t.innerHTML = `
    <h2>Pasos del taller</h2>
    <div class="pasos">${NOMBRES.map((nom, k) => `<button data-paso="${k}" class="${k === n ? "on" : ""}" ${state.cambiandoPaso ? "disabled" : ""}><b>${k}</b><span>${nom}</span></button>`).join("")}</div>
    <div class="detalle">
      ${n === null ? `<p class="aviso">Los archivos de lib/ fueron editados a mano. Elige un paso para volver a una versión conocida.</p>`
        : p ? `<h3>Paso ${n} · ${esc(p.titulo)}</h3>
        <p><span class="etq">Qué cambia</span>${esc(p.que)}</p>
        <p><span class="etq">Qué vas a ver</span>${esc(p.efecto)}</p>` : ""}
    </div>
    <div class="contador ${ele && ele !== tot ? "filtrado" : ""}">
      ${ele ? `<b>${ele}</b> de ${tot} beneficios elegibles para ${quien}<small>${nota}</small>`
        : `<small>Pregunta algo en el chat para ver cuántos beneficios le corresponden a ${quien}.</small>`}
    </div>
    ${catalogo()}
    <div class="pie">
      <button id="repetir" ${!state.perfil || !state.ultima || state.cargando ? "disabled" : ""} title="${esc(state.ultima)}">↻ Volver a preguntar</button>
      <button id="nuevo" ${state.perfil ? "" : "disabled"}>Nuevo vecino</button>
    </div>`;
  t.querySelectorAll("[data-paso]").forEach((el) => (el.onclick = () => cambiarPaso(Number(el.dataset.paso))));
  const rep = $("#repetir"), nuevo = $("#nuevo");
  rep.onclick = () => { state.tab = "chat"; enviar(state.ultima); };
  nuevo.onclick = () => {
    state.perfil = null; state.borrador = {}; state.elegibles = null; state.elegiblesIds = null;
    guardar("munia.perfil", null);
    render();
  };
}

// Por qué un beneficio NO le corresponde a este vecino (según sus reglas en data/beneficios.json).
function razon(b, p) {
  if (b.edad_min != null && p.edad < b.edad_min) return `desde ${b.edad_min} años`;
  if (b.edad_max != null && p.edad > b.edad_max) return `hasta ${b.edad_max} años`;
  if (b.genero != null && b.genero !== p.genero) return `solo ${b.genero.toLowerCase()}`;
  if (b.ingreso_max != null && Number(p.ingreso) > b.ingreso_max) return `ingreso hasta ${clp(b.ingreso_max)}`;
  return "";
}

// Catálogo completo: ✓ pasó las reglas, ✗ quedó fuera (y por qué). Hace visible el paso 2.
function catalogo() {
  if (!state.elegiblesIds || !state.perfil) return "";
  const ok = new Set(state.elegiblesIds);
  const orden = [...state.beneficios].sort((a, b) => ok.has(b.id) - ok.has(a.id));
  return `<ul class="catalogo">${orden.map((b) => ok.has(b.id)
    ? `<li class="si">✓ ${esc(b.nombre)}</li>`
    : `<li class="no">✗ <s>${esc(b.nombre)}</s><small>${esc(razon(b, state.perfil))}</small></li>`).join("")}</ul>`;
}

async function cambiarPaso(n) {
  state.cambiandoPaso = true;
  renderTaller();
  try {
    const r = await fetch("/api/paso", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ n }) });
    const d = await r.json();
    state.paso = d.paso; state.pasos = d.pasos;
  } finally {
    state.cambiandoPaso = false;
  }
  // Conversación nueva en cada paso: así la respuesta anterior no influye en la siguiente.
  if (state.perfil) reiniciarChat();
  render();
}

async function leerPaso() {
  try {
    const d = await (await fetch("/api/paso")).json();
    if (d.paso !== state.paso) { state.paso = d.paso; state.pasos = d.pasos; renderTaller(); }
  } catch {}
}

// Si alguien aplica un paso desde la terminal, la barra se actualiza sola.
setInterval(leerPaso, 3000);

Promise.all([fetch("/api/beneficios").then((r) => r.json()), leerPaso()])
  .then(([b]) => { state.beneficios = b; render(); });
