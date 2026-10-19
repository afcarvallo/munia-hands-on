# Soluciones por paso

Cada carpeta deja el proyecto **exactamente** como debería quedar al final de ese paso. Úsalas si te
atrasaste o si algo se rompió y quieres partir limpio.

```bash
# desde la raíz del repo (sobrescribe server.js y public/, no toca tu .env)
cp -r soluciones/paso-1/. .
node server.js
```

| Carpeta | Contenido |
|---|---|
| `paso-1/` | Servidor con proxy al LLM + registro + chat estilo WhatsApp. **Sin reglas**: el modelo puede inventar |
| `paso-2/` | + elegibilidad por **reglas** en el servidor y tarjetas de beneficio dentro del chat |
| `paso-3/` | Bonus, versión final: solicitudes con QR, catálogo, mis beneficios y perfil |

> Son *una* solución posible: lo que genere tu Claude Code puede verse distinto y estar igual de bien.
