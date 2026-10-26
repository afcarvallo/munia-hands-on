// PASO 2 · Reglas de elegibilidad.
// En un servicio público, QUIÉN califica lo decide código auditable, no el LLM.

/**
 * Devuelve solo los beneficios para los que el vecino cumple TODAS las reglas.
 *
 * Reglas de cada beneficio (data/beneficios.json); null significa "sin restricción":
 *   edad_min, edad_max   rango de edad, inclusivo
 *   genero               "Femenino" | "Masculino" | null
 *   ingreso_max          ingreso mensual máximo del hogar, inclusivo
 *
 * @param {{ edad: number, genero: string, ingreso: number }} perfil
 * @param {Array<object>} beneficios  el catálogo completo
 * @returns {Array<object>} los beneficios elegibles, en el mismo orden
 *
 * Verifica con:  node --test test/reglas.test.js
 */
function elegibles(perfil, beneficios) {
  // TODO (paso 2): filtra el catálogo según las reglas de arriba.
  return beneficios;
}

module.exports = { elegibles };
