# MUNIA · Hands-on: un asistente municipal con vibe coding

Construye **paso a paso** un prototipo de chatbot municipal que conversa con un **LLM abierto**
(Llama 3.3 70B vía OpenRouter) y recomienda solo los beneficios a los que cada vecino tiene derecho.
Todo se escribe con prompts a **Claude Code**.

<p align="center">
  <img src="docs/img/munia_registro.png" width="160" />
  <img src="docs/img/munia_chat.png" width="160" />
  <img src="docs/img/munia_qr.png" width="160" />
  <img src="docs/img/munia_beneficios.png" width="160" />
</p>

> **Producción vs. hands-on.** MUNIA funciona **por WhatsApp** y su LLM corre **local** en la
> municipalidad, así que los datos de los vecinos no salen de ahí. Aquí construimos el mismo cerebro
> con una interfaz web estilo WhatsApp, para iterar rápido en clase. Como la API es compatible con
> OpenAI, pasar a un servidor local (Ollama o vLLM) es cambiar `BASE_URL`.

| Paso | Qué construyes | Tiempo |
|---|---|---|
| [0](#paso-0--clonar-y-configurar) | Clonar, pegar tu API key y abrir Claude Code | 3 min |
| [1](#paso-1--la-app-completa-en-un-prompt) | La app completa en un prompt: servidor, registro y chat | 5 min |
| [2](#paso-2--reglas-antes-del-llm) | **Reglas de elegibilidad**: que el modelo deje de inventar | 4 min |
| [Bonus](#bonus--solicitudes-con-qr) | Solicitudes con QR, catálogo y perfil (para la casa) | 10 min |

**¿Te atrasaste?** Cada paso tiene su solución en [`soluciones/`](soluciones/):

```bash
cp -r soluciones/paso-1/. .     # deja tu proyecto exactamente como al final del paso 1
```

---

## Antes de la clase (hazlo en tu casa: 5 min)

| Necesitas | Cómo |
|---|---|
| Node 18 o superior | `node -v` (si no lo tienes: [nodejs.org](https://nodejs.org)) |
| Claude Code | `npm install -g @anthropic-ai/claude-code`, luego ejecuta `claude` una vez para iniciar sesión |
| API key de OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys). Carga ~US$1: alcanza para cientos de conversaciones |

---

## Paso 0 · Clonar y configurar

```bash
git clone https://github.com/afcarvallo/munia-hands-on.git
cd munia-hands-on
cp .env.example .env        # abre .env y reemplaza PEGA_AQUI_TU_API_KEY por tu key
claude                       # abre Claude Code en esta carpeta (leerá CLAUDE.md)
```

> ⚠️ **La key es como una contraseña.** Va solo en `.env`, que ya está en `.gitignore`. Nunca la
> pegues en el código, en un commit ni en el chat del curso.

Lo que ya trae el repo:

```
CLAUDE.md             reglas del proyecto: Claude Code lo lee al iniciar
.env.example          plantilla de configuración (copia a .env)
data/beneficios.json  14 beneficios municipales ficticios
soluciones/           una solución por paso, por si te atrasas
```

---

## Paso 1 · La app completa en un prompt

Pega este prompt en Claude Code:

> Lee CLAUDE.md. Crea la app completa:
> (1) `server.js` en Node sin dependencias que lea `.env`, sirva `public/` y exponga `POST /api/chat`
> como proxy con streaming a `${BASE_URL}/chat/completions` (la key nunca sale del servidor), más
> `GET /api/beneficios`.
> (2) En `public/`, con JS plano: un registro en 4 pasos (RUT con dígito verificador y nombre; fecha
> de nacimiento y género; dirección e ingreso del hogar en tramos; intereses como chips), guardado en
> localStorage.
> (3) Después del registro, un chat estilo WhatsApp con streaming desde `/api/chat` y chips de
> sugerencias. Mobile-first; en desktop, dentro de un marco de iPhone.

✅ **Checkpoint:** `node server.js` → abre `http://localhost:3000`, regístrate con el RUT de prueba
`11.111.111-1` como una mujer de 70 años y pregunta **"¿qué beneficios de salud tengo?"**.
Anota qué responde: probablemente **invente** beneficios que no existen en el catálogo.

---

## Paso 2 · Reglas antes del LLM

> En el servidor, filtra `data/beneficios.json` con **reglas en código** según el perfil (`edad_min`,
> `edad_max`, `genero`, `ingreso_max`) y arma un system prompt con el perfil y **solo** los beneficios
> filtrados. Reglas para el modelo: no inventar, máximo 120 palabras, y escribir `[[BENEFICIO:id]]` en
> una línea aparte al recomendar uno. En el chat, convierte cada etiqueta en una tarjeta con botón
> "Solicitar", en el mismo lugar donde aparece.

✅ **Checkpoint:** repite la pregunta del paso 1. Ahora solo debería nombrar beneficios **reales**,
en tarjetas, y nunca *Control Niño Sano*, que es para menores de 6 años. Luego pregunta por un
"subsidio de arriendo", que no existe: debe decir que no lo tiene.

<details><summary>💡 La idea clave del taller</summary>

```js
// La elegibilidad la deciden reglas, no el LLM
function elegibles(perfil) {
  return BENEFICIOS.filter((b) =>
    (b.edad_min == null || edad >= b.edad_min) &&
    (b.edad_max == null || edad <= b.edad_max) &&
    (b.genero == null || b.genero === perfil.genero) &&
    (b.ingreso_max == null || ingreso <= b.ingreso_max));
}
```

El modelo **no puede recomendar lo que no ve**. Así hay menos alucinaciones y los criterios se
pueden auditar, algo indispensable en un servicio público.
</details>

---

## Bonus · Solicitudes con QR

> "Solicitar" genera un código tipo `MUN-AB12CD`, lo guarda en localStorage y muestra una hoja
> inferior con un QR (qrcodejs 1.0.0 desde cdnjs) y el lugar donde presentarlo. Agrega una barra
> inferior con 4 pestañas: Chat; Beneficios (catálogo con filtros, separando "Recomendados para ti"
> de "No cumples requisitos"); Mis beneficios (contadores y solicitudes con su QR); y Perfil (datos y
> "Comenzar de nuevo").

**Pruébalo en tu teléfono:** conéctate a la misma Wi-Fi que el notebook y abre `http://<IP>:3000`.
Para ver la IP: `ipconfig getifaddr en0` en macOS o `ipconfig` en Windows.

### Más desafíos

1. 💬 **WhatsApp real:** conecta el servidor a la WhatsApp Cloud API (Meta) con un webhook que reciba el
   mensaje, llame a la misma lógica de `/api/chat` y responda. Para probar en local, expón tu servidor con un túnel.
2. ♿ **Accesibilidad:** modo letra grande y alto contraste para adultos mayores.
3. 📄 **RAG:** carga un PDF de una ordenanza, divídelo en fragmentos y cita la fuente en cada respuesta.
4. 💻 **LLM local:** `ollama run llama3.2` y luego en `.env`: `BASE_URL=http://localhost:11434/v1` y `MODEL=llama3.2`.
5. 🧪 **Evaluación:** escribe 10 preguntas trampa y mide cuántas veces el modelo inventa un beneficio.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| "Falta tu API key" | No copiaste `.env.example` a `.env` o no reemplazaste el placeholder |
| `401` en el chat | Key mal copiada o sin crédito en OpenRouter |
| `fetch failed` | Sin internet o la red bloquea openrouter.ai |
| `EADDRINUSE` | Ya hay un servidor en el puerto 3000: ciérralo o cambia `PORT` en `.env` |
| No aparecen las tarjetas | El modelo escribió `[[id]]` sin `BENEFICIO:`: pide a Claude Code un parser tolerante |

**Pedirle a Claude Code que arregle algo:** pega el error **completo** y explica qué esperabas que pasara.

---

Los datos de `data/beneficios.json` y la "Municipalidad de Villa Esperanza" son **ficticios** y solo
sirven para el taller. Licencia MIT.
