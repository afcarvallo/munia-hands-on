// SOLUCIÓN · Paso 1. Para usarla:  cp soluciones/lib/llm.js lib/
const { leerStream } = require("./sse");

async function* llamarLLM(messages) {
  const respuesta = await fetch(`${process.env.BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({ model: process.env.MODEL, messages, stream: true, temperature: 0.3, max_tokens: 500 }),
  });
  if (!respuesta.ok) throw new Error(`LLM ${respuesta.status}: ${(await respuesta.text()).slice(0, 200)}`);
  yield* leerStream(respuesta);
}

module.exports = { llamarLLM };
