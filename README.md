# MUNIA · Hands-on: el núcleo de un asistente municipal con LLM

Programa las tres piezas que convierten un chat genérico en un asistente municipal confiable:
**llamar a un LLM abierto** (Llama 3.3 70B vía OpenRouter), **decidir con reglas quién califica** y
**darle al modelo solo lo que corresponde**. La interfaz y el servidor ya están hechos.

<p align="center">
  <img src="docs/img/munia_registro.png" width="160" />
  <img src="docs/img/munia_chat.png" width="160" />
</p>

> **Producción vs. taller.** MUNIA funciona por WhatsApp y su LLM corre local en la municipalidad. Aquí
> usamos OpenRouter con el mismo tipo de modelo; como la API es compatible con OpenAI, pasar a un
> servidor local (Ollama o vLLM) es cambiar `BASE_URL`.

| Paso | Archivo | Qué programas | Tiempo |
|---|---|---|---|
| 0 | — | Clonar, configurar la key y correr | 3 min |
| 1 | `lib/llm.js` | `llamarLLM()`: POST con streaming a la API del LLM | 5 min |
| 2 | `lib/reglas.js` | `elegibles()`: reglas de elegibilidad, con tests | 5 min |
| 3 | `lib/prompt.js` | `systemPrompt()`: el modelo solo ve lo elegible, con tests | 5 min |

Solo necesitas **Node 18 o superior**. No hay dependencias: los tests usan `node:test`.

---

## Arquitectura

```
navegador (public/, ya listo)
   │  POST /api/chat  { perfil, messages }
   ▼
server.js (ya listo)
   ├─ elegibles(perfil, catálogo)      ← lib/reglas.js   (paso 2)
   ├─ systemPrompt(perfil, elegibles)  ← lib/prompt.js   (paso 3)
   └─ llamarLLM([system, ...mensajes]) ← lib/llm.js      (paso 1)  ──►  OpenRouter · Llama 3.3 70B
   ▲
   └─ data/beneficios.json: 14 beneficios con sus reglas (edad_min, edad_max, genero, ingreso_max)
```

El servidor imprime en cada consulta cuántos beneficios pasaron las reglas, por ejemplo
`[chat] Ana, 70 años: 8 de 14 beneficios elegibles`.

---

## Paso 0 · Preparar

```bash
git clone https://github.com/afcarvallo/munia-hands-on.git
cd munia-hands-on
cp .env.example .env        # pega tu key de https://openrouter.ai/keys en OPENROUTER_API_KEY
node server.js              # http://localhost:3000
npm test                    # 7 tests fallan: es lo que vas a arreglar
```

Abre `http://localhost:3000`, regístrate con el RUT de prueba `11.111.111-1` y escribe algo en el chat.
Debería responder **"⚠️ TODO paso 1: implementa llamarLLM en lib/llm.js"**.

> ⚠️ La key va solo en `.env` (ya está en `.gitignore`). Nunca la subas a git.

---

## Paso 1 · `lib/llm.js` → `llamarLLM(messages)`

Haz un `POST` a `${BASE_URL}/chat/completions` con `fetch`:

- **Headers:** `Content-Type: application/json` y `Authorization: Bearer ${OPENROUTER_API_KEY}`.
- **Body:** `{ model, messages, stream: true, temperature: 0.3, max_tokens: 500 }`.
- Si `!respuesta.ok`, lanza un `Error` con el status.
- Devuelve el texto con `yield* leerStream(respuesta)`. `lib/sse.js` ya parsea el streaming.

✅ **Checkpoint:** reinicia el servidor (`Ctrl+C` y `node server.js`). Regístrate como una **mujer de 70
años con ingreso bajo** y pregunta **"¿qué beneficios de salud tengo?"**. El chat responde, pero
**inventa** beneficios que no están en el catálogo (en nuestra prueba, "medicamentos subsidiados"). El log
dice `14 de 14 beneficios elegibles`: todavía no hay reglas.

---

## Paso 2 · `lib/reglas.js` → `elegibles(perfil, beneficios)`

Devuelve solo los beneficios para los que el vecino cumple **todas** las reglas. `null` significa "sin
restricción", y los límites son inclusivos.

```bash
node --test test/reglas.test.js
```

✅ **Checkpoint:** los 6 tests en verde. Repite la pregunta del paso 1: el log ahora dice `8 de 14`… pero el
modelo **sigue sin conocer el catálogo**. Eso se arregla en el paso 3.

---

## Paso 3 · `lib/prompt.js` → `systemPrompt(perfil, beneficios)`

El system prompt debe incluir el perfil del vecino, **solo** los beneficios elegibles (id, nombre,
descripción y requisitos) y estas reglas para el modelo:

1. No inventar beneficios, montos ni fechas.
2. Máximo 120 palabras.
3. Al recomendar un beneficio, escribir su etiqueta `[[BENEFICIO:id]]` en una línea aparte. La app la
   convierte en una tarjeta con botón "Solicitar".

```bash
node --test test/prompt.test.js     # o todos:  npm test
```

✅ **Checkpoint:** `npm test` con los 11 tests en verde. Repite la pregunta: ahora solo nombra beneficios
**reales**, como **tarjetas**, y nunca "Control Niño Sano" (es de 0 a 6 años). Pregunta por un "subsidio de
arriendo": debe decir que no lo tiene.

<details><summary>💡 La idea clave del taller</summary>

El modelo **no puede recomendar lo que no ve**. Las reglas (código auditable y testeado) deciden quién
califica; el LLM solo conversa y explica. Eso reduce las alucinaciones y deja los criterios a la vista,
algo indispensable en un servicio público.
</details>

---

## ¿Te atrasaste?

Cada función tiene su solución en `soluciones/lib/`:

```bash
cp soluciones/lib/llm.js lib/       # paso 1
cp soluciones/lib/reglas.js lib/    # paso 2
cp soluciones/lib/prompt.js lib/    # paso 3
```

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| `⚠️ TODO paso N` en el chat | Esa función todavía no está implementada (o no reiniciaste el servidor) |
| `LLM 401` | Key mal copiada en `.env`, o sin crédito en OpenRouter |
| `fetch failed` | Sin internet, o la red bloquea openrouter.ai |
| `EADDRINUSE` | Ya hay un servidor en el puerto 3000: ciérralo o cambia `PORT` en `.env` |
| No aparecen las tarjetas | El prompt no pide `[[BENEFICIO:id]]`, o no le pasas los ids |

## Bonus para la casa

1. **Solicitudes con QR:** `soluciones/bonus/` trae un frontend completo (QR, catálogo, perfil). Pruébalo
   con `cp -r soluciones/bonus/. public/`.
2. **WhatsApp real:** conecta `/api/chat` a la WhatsApp Cloud API con un webhook.
3. **LLM local:** `ollama run llama3.2` y en `.env`: `BASE_URL=http://localhost:11434/v1` y `MODEL=llama3.2`.
4. **Evaluación:** escribe 10 preguntas trampa como tests y mide cuántas veces el modelo inventa.

---

Los datos de `data/beneficios.json` son **ficticios** y solo sirven para el taller. Licencia MIT.
