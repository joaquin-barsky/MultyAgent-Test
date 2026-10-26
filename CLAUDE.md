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
- Local: `preview_start` con el nombre `orik-crew` (puerto 5191). Está en `C:\Users\joaqu\.claude\launch.json`.
- Producción: https://orik-crew.vercel.app (proyecto Vercel `orik-crew`).
- Repo: https://github.com/joaquin-barsky/MultyAgent-Test (rama `main`). Vercel está conectado al repo: push a `main` despliega solo.
- Stack: Vite 8 + React 19 + TS + Tailwind v4 + motion/react + lucide; 3D con React Three Fiber + drei; diagramas con React Flow (@xyflow/react); estado con zustand; íconos de marcas con simple-icons.
- Modelos 3D: Kenney Furniture Kit y Mini Characters (licencia CC0) en `public/models`. Avatares en `public/avatars/face-*.png`, sacados de los mismos modelos con `/?gen=avatars` (solo en dev, guarda vía el plugin de `vite.config.ts`).

## Estructura
- `src/data/agents.ts`: los 6 agentes (Mora coordinadora, Lupa competencia, Cata redes, Rolo video, Leo consultas, Nina finanzas), sus pasos y a quién le pasan el trabajo. Datos simulados, nada de datos reales de clientes.
- `src/sim/store.ts`: simulación (cada agente avanza por columnas de su diagrama; al terminar le manda un "paquete" al siguiente).
- `src/scenes/`: las 3 variantes (`?v=1` Oficina de día, `?v=2` Edificio de noche por pisos, `?v=3` Islas flotantes). Selector temporal arriba a la derecha.
- `src/flow/FlowPanel.tsx`: panel estilo n8n (horizontal en desktop, vertical en celular), con detalle de cada paso y botón "Ejecutar ahora".
- Circuito: Mora → Lupa → Cata → Rolo → Mora; Leo (arranca solo con consultas) → Nina → Mora.

## Le gustó / no tocar
- Le gustó la demo en general (3 variantes + panel estilo n8n). Todavía no eligió variante.

## Pendientes
- Antes de configurar agentes reales, Joaquín quiere **definir bien la idea y el diseño**. Va a pasar indicaciones.
- Que Joaquín elija variante (1, 2 o 3) y sacar el selector.
- Relevar con Joaquín qué problemas vio en Calle Real para elegir los primeros agentes reales.
- Ojo: el panel del navegador de Claude oculto frena la carga 3D (no es un problema real del sitio: con el panel visible carga en ~1 s).
