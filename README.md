# MUNIA · Hands-on: de un chat que inventa a uno confiable

Tres pasos, **sin escribir código**, para ver cómo un asistente municipal con LLM pasa de inventar
beneficios a recomendar solo los que existen y le corresponden al vecino. Cada paso se activa con un
comando; después vuelves a preguntar en el chat y ves la diferencia.

<p align="center">
  <img src="docs/img/munia_registro.png" width="160" />
  <img src="docs/img/munia_chat.png" width="160" />
</p>

> **Producción vs. taller.** MUNIA funciona por WhatsApp y su LLM corre local en la municipalidad. Aquí
> usamos la API de OpenAI (GPT-4.1 mini). OpenRouter, Ollama y vLLM implementan la misma API: cambiar
> de proveedor es editar `BASE_URL` y `MODEL` en `.env`.

## Preparar (2 minutos)

Solo necesitas **Node 18 o superior**. No hay dependencias.

```bash
git clone https://github.com/afcarvallo/munia-hands-on.git
cd munia-hands-on
cp .env.example .env     # pega tu key de OpenAI en API_KEY
npm start                # http://localhost:3000
```

Abre `http://localhost:3000` y regístrate como **Ana**: RUT de prueba `11.111.111-1`, nacida en 1956,
género Femenino y el ingreso más bajo. Escribe algo en el chat: responde
**"⚠️ TODO paso 1"**, porque todavía no está conectado a nada.

## Los 3 pasos

Deja el servidor corriendo. En **otra terminal** aplica cada paso y luego vuelve a preguntar en el chat
**"¿qué beneficios de salud tengo?"**. No hace falta reiniciar: el servidor recarga el código en cada consulta.

| Comando | Qué cambia | Qué vas a ver |
|---|---|---|
| `npm run paso1` | `lib/llm.js`: MUNIA se conecta al LLM | Responde… pero **inventa** beneficios que no existen. El log dice `14 de 14 beneficios elegibles` |
| `npm run paso2` | `lib/reglas.js`: reglas de elegibilidad (edad, género, ingreso), con tests | El log baja a `8 de 14`, pero la respuesta **sigue inventando**: el modelo aún no ve la lista |
| `npm run paso3` | `lib/prompt.js`: el prompt incluye **solo** lo elegible y prohíbe inventar | **Solo beneficios reales, en tarjetas**. Ante un "subsidio de arriendo", dice que no existe |

Para volver al inicio y repetirlo: `npm run paso0`.

### La idea clave

El modelo **no puede recomendar lo que no ve**. Las reglas, en código auditable y con tests
(`npm test`), deciden quién califica; el LLM solo conversa y explica. Eso reduce las alucinaciones y
deja los criterios a la vista, algo indispensable en un servicio público.

## ¿Quieres programarlo tú?

Con `npm run paso0` los tres archivos de `lib/` quedan con sus **TODO** y su documentación. Impleméntalos en
orden (`llm.js`, `reglas.js`, `prompt.js`) y verifica con `npm test`, que trae 11 tests. Las soluciones están
en `soluciones/lib/`.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| `⚠️ TODO paso N` en el chat | Ese paso aún no se aplicó |
| `LLM 401` | Key mal copiada o vencida en `.env` |
| `LLM 429` | Sin crédito o límite de uso alcanzado |
| `fetch failed` | Sin internet, o la red bloquea la API |
| `EADDRINUSE` | Ya hay un servidor en el puerto 3000: ciérralo o cambia `PORT` en `.env` |

## Bonus para la casa

1. **Solicitudes con QR:** `cp -r soluciones/bonus/. public/` agrega catálogo, QR y perfil.
2. **WhatsApp real:** conecta `/api/chat` a la WhatsApp Cloud API con un webhook.
3. **LLM local:** `ollama run llama3.2` y en `.env`: `BASE_URL=http://localhost:11434/v1` y `MODEL=llama3.2`.
4. **Evaluación:** escribe 10 preguntas trampa como tests y mide cuántas veces el modelo inventa.

---

Los datos de `data/beneficios.json` son **ficticios** y solo sirven para el taller. Licencia MIT.
