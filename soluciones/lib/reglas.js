// SOLUCIÓN · Paso 2. Para usarla:  cp soluciones/lib/reglas.js lib/
function elegibles(perfil, beneficios) {
  return beneficios.filter((b) =>
    (b.edad_min == null || perfil.edad >= b.edad_min) &&
    (b.edad_max == null || perfil.edad <= b.edad_max) &&
    (b.genero == null || b.genero === perfil.genero) &&
    (b.ingreso_max == null || perfil.ingreso <= b.ingreso_max)
  );
}

module.exports = { elegibles };
