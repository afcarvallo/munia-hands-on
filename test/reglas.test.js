// Paso 2 · Tests de las reglas de elegibilidad.   node --test test/reglas.test.js
const test = require("node:test");
const assert = require("node:assert");
const { elegibles } = require("../lib/reglas");
const CATALOGO = require("../data/beneficios.json");

const ids = (perfil) => elegibles(perfil, CATALOGO).map((b) => b.id);

test("Ana, 70 años, mujer, ingreso bajo: recibe beneficios de adulta mayor y de mujer", () => {
  const r = ids({ edad: 70, genero: "Femenino", ingreso: 300000 });
  for (const id of ["pension-mayor", "taller-acuatico", "pap-mamografia"]) assert.ok(r.includes(id), `falta ${id}`);
});

test("Ana, 70 años: NO recibe beneficios de niños ni para menores de 66", () => {
  const r = ids({ edad: 70, genero: "Femenino", ingreso: 300000 });
  for (const id of ["nino-sano", "escuela-futbol", "beca-escolar", "mujer-emprende", "empleo-joven"]) assert.ok(!r.includes(id), `no debería incluir ${id}`);
});

test("Diego, 16 años, hombre: nada exclusivo para mujeres ni para mayores", () => {
  const r = ids({ edad: 16, genero: "Masculino", ingreso: 500000 });
  for (const id of ["basquetbol", "empleo-joven", "beca-escolar", "orquesta"]) assert.ok(r.includes(id), `falta ${id}`);
  for (const id of ["pap-mamografia", "mujer-emprende", "pension-mayor", "subsidio-agua"]) assert.ok(!r.includes(id), `no debería incluir ${id}`);
});

test("Los límites son inclusivos: 65 años justos y el ingreso máximo exacto", () => {
  const r = ids({ edad: 65, genero: "Masculino", ingreso: 500000 });
  assert.ok(r.includes("pension-mayor"), "edad_min 65 e ingreso_max 500.000 deben aceptar 65 años y $500.000");
});

test("El ingreso importa: con $2.000.000 no recibe subsidios", () => {
  const r = ids({ edad: 70, genero: "Femenino", ingreso: 2000000 });
  for (const id of ["pension-mayor", "lentes", "subsidio-agua"]) assert.ok(!r.includes(id), `no debería incluir ${id}`);
  assert.ok(r.includes("taller-acuatico"), "taller-acuatico no tiene tope de ingreso");
});

test("Una guagua de 2 años solo calza con lo que corresponde a su edad", () => {
  assert.deepStrictEqual(ids({ edad: 2, genero: "Femenino", ingreso: 300000 }), ["nino-sano"]);
});
