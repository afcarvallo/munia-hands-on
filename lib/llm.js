// PASO 1 · Llamar al LLM.
// La API de OpenRouter es compatible con la de OpenAI: si mañana cambias BASE_URL por un
// servidor local (Ollama o vLLM), este mismo código sigue funcionando.

const { leerStream } = require("./sse");

/**
 * Envía la conversación al LLM y entrega la respuesta de a poco (streaming).
 *
 * @param {Array<{role: "system"|"user"|"assistant", content: string}>} messages
 *        la conversación completa; el primer mensaje es el system prompt
 * @returns {AsyncGenerator<string>} trozos de texto a medida que llegan
 *
 * Variables de entorno (ya cargadas desde .env): BASE_URL, MODEL, OPENROUTER_API_KEY
 */
async function* llamarLLM(messages) {
  // TODO (paso 1):
  //  1. Haz un POST a `${process.env.BASE_URL}/chat/completions` con fetch.
  //  2. Headers: "Content-Type": "application/json" y "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`.
  //  3. Body (JSON): { model: process.env.MODEL, messages, stream: true, temperature: 0.3, max_tokens: 500 }
  //  4. Si la respuesta no es ok, lanza un Error con el status y el texto de la respuesta.
  //  5. Entrega el texto con:  yield* leerStream(respuesta);
  throw new Error("TODO paso 1: implementa llamarLLM en lib/llm.js");
}

module.exports = { llamarLLM };
