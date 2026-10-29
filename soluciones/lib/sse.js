// Ya implementado: convierte la respuesta en streaming (Server-Sent Events) de una API
// compatible con OpenAI en trozos de texto. Cada línea útil se ve así:
//   data: {"choices":[{"delta":{"content":"Hola"}}]}
// y el stream termina con:  data: [DONE]

async function* leerStream(respuesta) {
  const dec = new TextDecoder();
  let buffer = "";
  for await (const chunk of respuesta.body) {
    buffer += dec.decode(chunk, { stream: true });
    const lineas = buffer.split("\n");
    buffer = lineas.pop();                       // la última puede venir incompleta
    for (const linea of lineas) {
      if (!linea.startsWith("data: ") || linea.includes("[DONE]")) continue;
      try {
        const texto = JSON.parse(linea.slice(6)).choices?.[0]?.delta?.content;
        if (texto) yield texto;
      } catch {}                                 // líneas que no son JSON (comentarios de control del proveedor)
    }
  }
}

module.exports = { leerStream };
