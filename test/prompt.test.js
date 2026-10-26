// Paso 3 · Tests del system prompt.   node --test test/prompt.test.js
const test = require("node:test");
const assert = require("node:assert");
const { systemPrompt } = require("../lib/prompt");
const CATALOGO = require("../data/beneficios.json");

const perfil = { nombre: "Ana", edad: 70, genero: "Femenino", ingreso: 300000 };
const lista = CATALOGO.filter((b) => ["pension-mayor", "pap-mamografia"].includes(b.id));
const prompt = systemPrompt(perfil, lista);

test("incluye el perfil del vecino", () => {
  assert.match(prompt, /Ana/);
  assert.match(prompt, /70/);
});

test("incluye cada beneficio elegible con su id y su nombre", () => {
  for (const b of lista) {
    assert.ok(prompt.includes(b.id), `falta el id ${b.id}`);
    assert.ok(prompt.includes(b.nombre), `falta el nombre ${b.nombre}`);
  }
});

test("NO incluye beneficios que no le pasaste", () => {
  for (const id of ["nino-sano", "escuela-futbol", "mujer-emprende"]) assert.ok(!prompt.includes(id), `no debería mencionar ${id}`);
});

test("explica el formato de etiqueta [[BENEFICIO:id]]", () => {
  assert.ok(prompt.includes("[[BENEFICIO:"), "el modelo debe saber escribir [[BENEFICIO:id]]");
});

test("prohíbe inventar beneficios", () => {
  assert.match(prompt, /invent/i, "debe decir explícitamente que no invente");
});
