# Orik Crew

## Qué es y para quién
Idea de Joaquín (Orik Studio): un equipo de "trabajadores" hechos con agentes de IA que se comunican entre sí y funcionan como una pequeña empresa. Ejemplos de puestos: analista de competencia (mira videos y redes de otros), especialista en redes (arma contenido), editor de video, finanzas.

Se ven en una página con una oficina en formato 3D: cada agente con lo que está haciendo, y al tocarlo se abre su proceso dibujado como un flujo estilo n8n (nodos y conexiones), con diseño de primer nivel.

## Estado actual
- Etapa de **investigación**: ver qué se puede hacer y el potencial. Todavía no se define si es servicio para clientes o producto propio.
- Joaquín vio dentro de Calle Real (inmobiliaria, cliente principal) problemas que esto podría resolver. Calle Real es el candidato natural para el piloto.
- Primer paso elegido: **arrancar por el diseño** (la oficina 3D + el flujo estilo n8n), con datos simulados, para entenderlo visualmente.

## Decisiones tomadas
- Nombre: **Orik Crew** (submarca de Orik Studio).
- Planteo comercial: no "reemplazar personas", sino "un equipo que trabaja mientras tu gente duerme".
- La charla entre agentes va como circuito definido (uno le pasa trabajo al otro), no conversación libre.

## Costos (charlado el 2026-10-24)
- La demo visual con datos simulados: gratis (Vercel Hobby).
- Agentes que trabajen de verdad: costo variable por uso de la API de Claude. Precios por millón de tokens (entrada/salida): Haiku 5.5 USD 0,10/0,50; Sonnet 5.5 USD 2/10; Opus 5.5 USD 4/20. Batch = 50% off; caché abarata lo repetido.
- Para venderlo a clientes hace falta API (no se puede usar la suscripción personal de Claude para darle servicio a terceros).

## Cómo se corre y se deploya
Todavía no hay código. Stack por defecto cuando arranque: Vite + React 19 + TS + Tailwind v4 + motion/react + lucide; 3D con React Three Fiber; flujos con React Flow (xyflow).

## Le gustó / no tocar
- (vacío por ahora)

## Pendientes
- Diseño de la oficina 3D + vista de proceso estilo n8n, en 2-3 variantes conmutables.
- Relevar con Joaquín qué problemas vio en Calle Real para elegir los primeros agentes.
