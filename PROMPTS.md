# Prompts del hands-on

Estos son los prompts **originales** del taller, tal como se pegan en Claude Code. Para verlos en
VS Code: abre este archivo y presiona `Cmd+Shift+V` (vista previa de Markdown).

> Antes del Paso 1, Claude Code lee [`CLAUDE.md`](CLAUDE.md): ahí están las reglas del proyecto
> (Node sin dependencias, mobile-first, la key solo en `.env`, no inventar beneficios y elegibilidad por reglas).

---

## Paso 1 · La app completa en un prompt

```text
Lee CLAUDE.md. Crea la app completa:
(1) `server.js` en Node sin dependencias que lea `.env`, sirva `public/` y exponga `POST /api/chat`
como proxy con streaming a `${BASE_URL}/chat/completions` (la key nunca sale del servidor), más
`GET /api/beneficios`.
(2) En `public/`, con JS plano: un registro en 4 pasos (RUT con dígito verificador y nombre; fecha
de nacimiento y género; dirección e ingreso del hogar en tramos; intereses como chips), guardado en
localStorage.
(3) Después del registro, un chat estilo WhatsApp con streaming desde `/api/chat` y chips de
sugerencias. Mobile-first; en desktop, dentro de un marco de iPhone.
```

**Qué debería pasar:** Claude Code crea `server.js` y `public/` (unos 2 a 3 minutos). Con `node server.js`
y el RUT `11.111.111-1`, el chat responde con streaming, pero **puede inventar beneficios** porque todavía
no hay reglas.

---

## Paso 2 · Reglas antes del LLM

```text
En el servidor, filtra `data/beneficios.json` con **reglas en código** según el perfil (`edad_min`,
`edad_max`, `genero`, `ingreso_max`) y arma un system prompt con el perfil y **solo** los beneficios
filtrados. Reglas para el modelo: no inventar, máximo 120 palabras, y escribir `[[BENEFICIO:id]]` en
una línea aparte al recomendar uno (dale un ejemplo con un id real). En el chat, convierte cada etiqueta
en una tarjeta con botón "Solicitar", en el mismo lugar donde aparece. El parser debe ser tolerante:
los modelos a veces escriben `[[id]]` sin el prefijo.
```

**Qué debería pasar:** el servidor filtra el catálogo con reglas y el modelo solo ve lo que cumple el
vecino. Con una mujer de 70 años aparecen tarjetas (por ejemplo PAP y Mamografía) y **nunca** Control
Niño Sano. Si preguntas por un "subsidio de arriendo", responde que no lo tiene.

---

## Bonus · Solicitudes con QR (para la casa)

```text
"Solicitar" genera un código tipo `MUN-AB12CD`, lo guarda en localStorage y muestra una hoja
inferior con un QR (qrcodejs 1.0.0 desde cdnjs) y el lugar donde presentarlo. Agrega una barra
inferior con 4 pestañas: Chat; Beneficios (catálogo con filtros, separando "Recomendados para ti"
de "No cumples requisitos"); Mis beneficios (contadores y solicitudes con su QR); y Perfil (datos y
"Comenzar de nuevo").
```

---

## ¿Funcionan de verdad?

Se probaron el 19 de octubre de 2026 con Claude Code en una copia limpia de este repo:

| Paso | Tiempo de Claude Code | Resultado |
|---|---|---|
| 1 | ~2,5 min | Registro en 4 pasos y chat con streaming funcionando |
| 2 | ~1,5 min | Reglas en el servidor, tarjetas dentro del chat y sin "Control Niño Sano" |

Lo que generes puede verse distinto: es normal. Si te atrasas, usa [`soluciones/`](soluciones/).

## Bonus: el prompt que MUNIA usa por dentro

Mira la función `systemPrompt` en [`soluciones/paso-2/server.js`](soluciones/paso-2/server.js): recibe
el perfil y **solo** los beneficios que pasaron las reglas. Ese es el corazón del taller.
