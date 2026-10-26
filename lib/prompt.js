// PASO 3 · El system prompt.
// El modelo no puede recomendar lo que no ve: le pasamos SOLO los beneficios elegibles.

/**
 * Arma las instrucciones (system prompt) para el LLM.
 *
 * @param {{ nombre: string, edad: number, genero: string, ingreso: number }} perfil
 * @param {Array<object>} beneficios  SOLO los elegibles (resultado de elegibles())
 * @returns {string}
 *
 * Debe incluir:
 *   - quién es MUNIA y el perfil del vecino
 *   - la lista de beneficios: id, nombre, descripción y requisitos de cada uno
 *   - reglas: no inventar beneficios, máximo 120 palabras, y al recomendar uno escribir
 *     su etiqueta [[BENEFICIO:id]] en una línea aparte (la app la convierte en tarjeta)
 *
 * Verifica con:  node --test test/prompt.test.js
 */
function systemPrompt(perfil, beneficios) {
  // TODO (paso 3): reemplaza este prompt genérico. Hoy el modelo no conoce el catálogo… e inventa.
  return `Eres MUNIA, el asistente virtual de una municipalidad chilena.
Responde en español de Chile, con tono cálido y breve.
Perfil del vecino: ${JSON.stringify(perfil)}`;
}

module.exports = { systemPrompt };
