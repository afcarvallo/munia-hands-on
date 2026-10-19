# MUNIA: asistente municipal (hands-on UAI)

Estamos construyendo un prototipo móvil de chatbot municipal. Los vecinos se registran, conversan con un
LLM y solicitan beneficios de su municipalidad.

## Restricciones
- Stack: Node 18+ **sin dependencias npm** (http, fs y fetch nativos) + HTML/CSS/JS plano en `public/`. Sin build.
- Diseño **mobile-first** (390×844). En pantallas anchas, mostrar la app dentro de un marco de teléfono.
- Todo en español de Chile.
- La API key se lee de `.env` en el servidor y **nunca** se envía al navegador ni se escribe en el código.
- LLM: endpoint compatible con OpenAI en `BASE_URL` (por defecto OpenRouter) con el modelo `MODEL`.
- Catálogo de beneficios: `data/beneficios.json`. **No inventar beneficios**.
- La elegibilidad (edad, género, ingreso) se decide con **reglas en código**. El LLM solo conversa y explica.

## Cómo correr
```
cp .env.example .env    # y pega tu key
node server.js          # http://localhost:3000
```

## Cómo trabajamos (taller paso a paso)
- Implementa **solo** lo que pide el prompt actual; los pasos siguientes vienen después.
- **No leas ni copies `soluciones/`** salvo que el usuario lo pida explícitamente: es la red de seguridad del taller.
- Al terminar cada paso, explica en 3-4 líneas qué archivos creaste y cómo probarlo.
