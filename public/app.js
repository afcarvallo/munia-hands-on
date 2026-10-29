// MUNIA · frontend (JS plano, sin build). Ya está listo: no necesitas modificarlo en el taller.

const $ = (s) => document.querySelector(s);
const app = $("#app");
const CATEGORIAS = ["Salud", "Educación", "Deporte", "Cultura", "Empleo", "Vivienda", "Adulto mayor"];
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
  paso: 1,
  borrador: { intereses: [] },
  beneficios: [],
  cargando: false,
};

// --- Utilidades ---------------------------------------------------------------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clp = (n) => "$" + Number(n).toLocaleString("es-CL");

function rutValido(rut) {
  const r = rut.replace(/[.\-\s]/g, "").toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(r)) return false;
  let suma = 0, mul = 2;
  for (let i = r.length - 2; i >= 0; i--) { suma += Number(r[i]) * mul; mul = mul === 7 ? 2 : mul + 1; }
  const dv = 11 - (suma % 11);
  return r.at(-1) === (dv === 11 ? "0" : dv === 10 ? "K" : String(dv));
}

function edadDesde(fecha) {
  const f = new Date(fecha), h = new Date();
  let e = h.getFullYear() - f.getFullYear();
  if (h < new Date(h.getFullYear(), f.getMonth(), f.getDate())) e--;
  return e;
}

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

// --- Registro (4 pasos) --------------------------------------------------------
const PASOS = {
  1: { titulo: "Datos Personales", campos: `
      <label>RUT</label><input id="rut" placeholder="12.345.678-5" />
      <label>Nombre</label><input id="nombre" placeholder="María" />
      <label>Apellido Paterno</label><input id="apellidoP" />
      <label>Apellido Materno</label><input id="apellidoM" />` },
  2: { titulo: "Información Personal", campos: `
      <label>Fecha de Nacimiento</label><input id="nacimiento" type="date" />
      <label>Género</label>
      <select id="genero"><option value="">Selecciona…</option><option>Femenino</option><option>Masculino</option><option>Otro</option></select>` },
  3: { titulo: "Ubicación e Ingresos", campos: `
      <label>Dirección</label><input id="direccion" placeholder="Av. Siempre Viva 742" />
      <label>Teléfono</label><input id="telefono" type="tel" placeholder="+56 9 1234 5678" />
      <label>Email</label><input id="email" type="email" />
      <label>Ingreso Mensual del Hogar</label>
      <select id="ingreso"><option value="">Selecciona…</option>${INGRESOS.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>` },
  4: { titulo: "¿Qué áreas te interesan?", campos: `
      <p class="paso">Puedes seleccionar varias.</p>
      <div class="chips">${CATEGORIAS.map((c) => `<button class="chip" data-int="${c}">${c}</button>`).join("")}</div>` },
};

function vistaRegistro() {
  const p = PASOS[state.paso], b = state.borrador;
  app.innerHTML = `
    <div class="header"><div class="avatar">M</div><div><h1>Registro Municipal</h1><small>Crea tu perfil ciudadano</small></div></div>
    <div class="registro">
      <div class="progreso">${[1, 2, 3, 4].map((i) => `<span class="${i <= state.paso ? "on" : ""}"></span>`).join("")}</div>
      <div class="paso">Paso ${state.paso} de 4</div>
      <h2>${p.titulo}</h2>
      ${p.campos}
      <div class="error" id="error"></div>
      <div class="botones">
        ${state.paso > 1 ? `<button class="btn sec" id="atras">Atrás</button>` : ""}
        <button class="btn" id="seguir">${state.paso < 4 ? "Continuar →" : "Comenzar"}</button>
      </div>
    </div>`;
  app.querySelectorAll("input, select").forEach((el) => { if (b[el.id]) el.value = b[el.id]; });
  app.querySelectorAll("[data-int]").forEach((el) => {
    el.classList.toggle("on", b.intereses.includes(el.dataset.int));
    el.onclick = () => {
      const i = el.dataset.int;
      b.intereses = b.intereses.includes(i) ? b.intereses.filter((x) => x !== i) : [...b.intereses, i];
      el.classList.toggle("on");
    };
  });
  if ($("#atras")) $("#atras").onclick = () => { leerCampos(); state.paso--; render(); };
  $("#seguir").onclick = () => {
    leerCampos();
    const err = validar(state.paso);
    if (err) return ($("#error").textContent = err);
    if (state.paso < 4) { state.paso++; return render(); }
    state.perfil = { ...b, edad: edadDesde(b.nacimiento) };
    guardar("munia.perfil", state.perfil);
    state.mensajes = [{ role: "assistant", content: `¡Hola, ${b.nombre}! 👋 Soy MUNIA, tu asistente municipal. Con tu perfil ya revisé qué beneficios podrías recibir. ¿Qué necesitas hoy?` }];
    guardar("munia.mensajes", state.mensajes);
    render();
  };
}

function leerCampos() { app.querySelectorAll("input, select").forEach((el) => (state.borrador[el.id] = el.value.trim())); }

function validar(paso) {
  const b = state.borrador;
  if (paso === 1) {
    if (!rutValido(b.rut || "")) return "RUT inválido (revisa el dígito verificador).";
    if (!b.nombre || !b.apellidoP) return "Nombre y apellido paterno son obligatorios.";
  }
  if (paso === 2) {
    if (!b.nacimiento || edadDesde(b.nacimiento) < 0 || edadDesde(b.nacimiento) > 120) return "Ingresa una fecha de nacimiento válida.";
    if (!b.genero) return "Selecciona un género.";
  }
  if (paso === 3) {
    if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) return "Email inválido.";
    if (!b.ingreso) return "Selecciona el ingreso del hogar.";
  }
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
  if (!state.perfil) return vistaRegistro();
  app.innerHTML = `
    <div class="header"><div class="avatar">M</div><div><h1>MUNIA · Asistente Municipal</h1><small>en línea</small></div></div>
    <div class="vista"></div>
    <nav class="tabs">${TABS.map(([k, i, t]) => `<button data-tab="${k}" class="${state.tab === k ? "on" : ""}"><span class="ico">${i}</span>${t}</button>`).join("")}</nav>`;
  ({ chat: vistaChat, beneficios: vistaBeneficios, mis: vistaMis, perfil: vistaPerfil })[state.tab]();
  app.querySelectorAll("[data-tab]").forEach((el) => (el.onclick = () => { state.tab = el.dataset.tab; render(); }));
  app.querySelectorAll("[data-solicitar]").forEach((el) => (el.onclick = () => solicitar(el.dataset.solicitar)));
}

fetch("/api/beneficios").then((r) => r.json()).then((b) => { state.beneficios = b; render(); });
