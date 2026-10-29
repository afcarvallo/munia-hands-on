// PASO 2 · El prompt recibe la lista que calcularon las reglas.
// Todavía sin instrucciones: el modelo puede mezclar la lista con cosas que inventa, y no muestra tarjetas.
// En el paso 3 le ponemos reglas claras (ver soluciones/lib/prompt.js).
function systemPrompt(perfil, beneficios) {
  const lista = beneficios.map((b) => `- ${b.nombre}: ${b.descripcion}`).join("\n");
  return `Eres MUNIA, el asistente virtual de una municipalidad chilena.
Responde en español de Chile, con tono cálido y breve.
Perfil del vecino: ${JSON.stringify(perfil)}

Beneficios municipales para los que cumple requisitos:
${lista}`;
}

module.exports = { systemPrompt };
