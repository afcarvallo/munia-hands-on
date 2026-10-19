# Soluciones por paso

Cada carpeta deja el proyecto **exactamente** como debería quedar al final de ese paso. Úsalas si te
atrasaste o si algo se rompió y quieres partir limpio.

```bash
# desde la raíz del repo (sobrescribe server.js y public/, no toca tu .env)
cp -r soluciones/paso-3/. .
node server.js
```

| Carpeta | Contenido |
|---|---|
| `paso-1/` | `server.js` con proxy al LLM y system prompt **sin reglas** (el modelo puede inventar) |
| `paso-2/` | + `public/` con el registro en 4 pasos |
| `paso-3/` | + chat con streaming, tarjetas y **elegibilidad por reglas** en el servidor |
| `paso-4/` | Versión final: solicitudes con QR, catálogo, mis beneficios y perfil |

> Son *una* solución posible: lo que genere tu Claude Code puede verse distinto y estar igual de bien.
