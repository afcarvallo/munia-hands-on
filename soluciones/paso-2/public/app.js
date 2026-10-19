// MUNIA · PASO 2: registro ciudadano en 4 pasos (JS plano, estado en localStorage).

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
  paso: 1,
  borrador: { intereses: [] },
};

// --- Utilidades ---------------------------------------------------------------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

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

// --- Perfil guardado (el chat llega en el paso 3) ------------------------------
function vistaListo() {
  const p = state.perfil;
  app.innerHTML = `
    <div class="header"><div class="avatar">M</div><div><h1>MUNIA · Asistente Municipal</h1><small>perfil guardado</small></div></div>
    <div class="registro">
      <h2>¡Listo, ${esc(p.nombre)}! ✅</h2>
      <p class="paso">Tu perfil quedó guardado en este dispositivo. En el paso 3 conectamos el chat.</p>
      <div class="card">
        <div class="fila"><span>RUT</span><span>${esc(p.rut)}</span></div>
        <div class="fila"><span>Edad</span><span>${p.edad} años</span></div>
        <div class="fila"><span>Género</span><span>${esc(p.genero)}</span></div>
        <div class="fila"><span>Intereses</span><span>${esc((p.intereses || []).join(", ") || "—")}</span></div>
      </div>
      <button class="btn sec" id="reset" style="width:100%">🔄 Comenzar de nuevo</button>
    </div>`;
  $("#reset").onclick = () => {
    try { localStorage.removeItem("munia.perfil"); } catch {}
    Object.assign(state, { perfil: null, paso: 1, borrador: { intereses: [] } });
    render();
  };
}

function render() {
  if (!state.perfil) return vistaRegistro();
  vistaListo();
}

render();
