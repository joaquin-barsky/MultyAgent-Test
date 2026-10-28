# Orik Crew

## Qué es y para quién
Idea de Joaquín (Orik Studio): un equipo de "trabajadores" hechos con agentes de IA que se comunican entre sí y funcionan como una pequeña empresa.

Se ve en una página con un **edificio 3D de 5 pisos, un piso por área**. Tocás un piso y la cámara entra a esa oficina; tocás un agente y se abre su proceso dibujado como un flujo estilo n8n. A la derecha hay un **chat con Bruno, el supervisor**: entiende todo lo que hicieron los agentes y te lo cuenta, pero no hace tareas.

## Estado actual
- Etapa de **investigación y diseño**. Joaquín estudia agentes en paralelo. Todavía no se define si es servicio para clientes o producto propio.
- La empresa simulada es una inmobiliaria (Calle Real es el candidato natural para el piloto). Datos simulados, nada de datos reales de clientes.

## Decisiones tomadas
- Nombre interno: Orik Crew. **En la interfaz no aparece ninguna marca** (pedido de Joaquín).
- Planteo comercial: no "reemplazar personas", sino "un equipo que trabaja mientras tu gente duerme".
- La charla entre agentes va como circuito definido (uno le pasa trabajo al otro), no conversación libre.
- Pisos (de arriba a abajo): 5 Dirección (Mora + Bruno), 4 Marketing (Lupa, Cata, Rolo), 3 Finanzas (Nina, Teo), 2 Administración (Juli, Paz), 1 Ventas (Leo, Vale). Software NO va.
- La luz del edificio sigue la hora real de Buenos Aires (madrugada, amanecer, día, atardecer, noche). Para probar: `?hora=noche` (o madrugada, amanecer, dia, atardecer).
- El chat responde de verdad con Claude Haiku 5.5 (el más barato), respuestas cortas (máx. 350 tokens), sin "pensamiento", límite de 25 preguntas cada 10 min por visitante. Sin clave, contesta en modo automático con datos de la simulación y lo avisa.
- **Celular: por ahora no invertir tiempo en el diseño mobile** (pedido de Joaquín, 2026-10-28). Funciona, pero no se pule.

## Costos
- Página: gratis (Vercel Hobby, 1 función usada de 12).
- Chat de Bruno: cada pregunta gasta ~3.000 tokens de entrada y ~300 de salida con Haiku 5.5 → unos USD 0,0005. USD 5 de crédito alcanzan para ~10.000 preguntas.
- La API se paga aparte del plan de Claude de USD 100/mes: el chat **no consume nada** de ese plan.
- En la consola hay **USD 100 de crédito promocional** (dado el 28/10/2026, **vence el 16/11/2026**, una sola vez, no es mensual). Sirve para API, Batch, Agent SDK, Playground y Managed Agents. No hay tarjeta cargada ni crédito comprado. Límite de la organización: USD 500/mes (no tocado).
- Precios por millón de tokens (entrada/salida): Haiku 5.5 USD 0,10/0,50; Sonnet 5.5 USD 2/10; Opus 5.5 USD 4/20. Batch = 50% off.
- Para venderlo a clientes hace falta API (la suscripción personal no sirve para dar servicio a terceros).

## Cómo se corre y se deploya
- Local: `preview_start` con el nombre `orik-crew` (puerto 5191). Está en `C:\Users\joaqu\.claude\launch.json`. En dev, `/api/chat` lo sirve un plugin de `vite.config.ts`.
- Producción: https://orik-crew.vercel.app (proyecto Vercel `orik-crew`).
- Repo: https://github.com/joaquin-barsky/MultyAgent-Test (rama `main`). Push a `main` despliega solo.
- Clave de IA: variable `ANTHROPIC_API_KEY` en Vercel (Production), cargada el 2026-10-28. Es la clave `bruno-chat` del espacio de trabajo **Orik Crew demo** de la consola (platform.claude.com), con tope de **USD 5 por mes**. **Vence el 27/11/2026**: hay que crear otra y cargarla antes. Si vence, el chat pasa solo al modo automático.
- Stack: Vite 8 + React 19 + TS + Tailwind v4 + motion/react + lucide; 3D con React Three Fiber + drei (CameraControls); diagramas con React Flow (@xyflow/react); estado con zustand; íconos de marcas con simple-icons; `@anthropic-ai/sdk` en la función.
- Chequeo de tipos de la función: `npx tsc -p tsconfig.api.json`.
- Modelos 3D: Kenney Furniture Kit y Mini Characters (CC0) en `public/models`. Fotos de propiedades de Unsplash en `public/img`. Avatares `public/avatars/face-*.png` generados con `/?gen=avatars` (solo dev).
- Links directos: `?piso=marketing`, `?agente=lupa`, `?v=1` (Maqueta) o `?v=2` (Vidrio).
- Capturas sin el panel del navegador: hay un script de puppeteer-core con Chrome (en el scratchpad de la sesión); el panel oculto de Claude congela el 3D.

## Estructura
- `src/data/agents.ts`: pisos, 10 agentes + supervisor, pasos, secciones, nodos de IA con sus herramientas, condiciones y vistas previas.
- `src/sim/store.ts`: simulación. `src/sim/daylight.ts`: luz por hora.
- `src/scenes/BuildingScene.tsx`: edificio, pisos, cámara (encuadre según el espacio libre entre paneles).
- `src/flow/FlowPanel.tsx`: panel estilo n8n con secciones, sub nodos, vistas previas y barra de ejecución.
- `src/chat/`: chat con Bruno y la "foto" del equipo que se le manda. `api/chat.ts`: función de Vercel.
- Circuito: Mora → Lupa → Cata → Rolo → Mora. Leo → Juli → Vale → Paz → Nina → Mora. Teo → Nina.

## Le gustó / no tocar
- Le gustó la primera demo (oficina 3D + panel estilo n8n).
- Pidió: menos "jueguito", sin marca, formato edificio con un piso por área, diagrama más marketinero y complejo, y supervisor con chat. Hecho el 2026-10-28; falta que lo vea y elija estilo (Maqueta o Vidrio).

## Pendientes
- Renovar la clave `bruno-chat` antes del 27/11/2026.
- Aprovechar los USD 100 promocionales antes del 16/11 para probar agentes reales.
- Que Joaquín elija Maqueta o Vidrio y sacar el selector.
- Relevar con Joaquín qué problemas vio en Calle Real para elegir los primeros agentes reales.
