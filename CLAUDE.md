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
- Pisos (de arriba a abajo), 19 agentes + Bruno: 5 Dirección (Mora, Tomi, Sol + Bruno), 4 Marketing (Lupa, Cata, Rolo, Fran, Mica), 3 Finanzas (Nina, Teo, Gaby), 2 Administración (Juli, Paz, Lucas, Ana), 1 Ventas (Leo, Vale, Martín, Caro). Software NO va. Pisos profundos con dos filas de escritorios.
- Al tocar un piso: se ve **solo ese piso, desde arriba**, con fondo del color del área; flechas (y teclas ↑ ↓) para cambiar de piso; "Edificio" o Escape para volver.
- Para que no pese: solo se animan los personajes del piso que estás mirando; no hay luces por escritorio (una sola por piso).
- **Agentes siempre sentados** (2026-10-30): se sacaron las caminatas y el café, le parecían infantiles e innecesarios. Cuando trabajan mueven las manos (tecleo) y tienen una barrita de avance arriba; cuando están libres quedan quietos en la silla. Los personajes miran al escritorio (antes estaban de espaldas por error).
- **Recorrido cinematográfico**: si no tocás nada por 8 s, la cámara va de cerca, de perfil, a un trabajador (de preferencia uno que esté trabajando) y cambia cada ~6,5 s; se ve solo su piso y **se esconde toda la interfaz** (métricas, pisos, chat, barra del piso). Cualquier movimiento del mouse, tecla o toque lo corta y vuelve a donde estabas. No arranca con un panel o el chat del celular abiertos. En desarrollo se puede ajustar el ángulo con .
- **Bruno presente**: cada ~1 minuto manda solo un aviso corto en el chat (novedades de la actividad o alertas). Se arman en el navegador, no usan la IA ni gastan crédito. Máximo 8 por visita, no interrumpe si estás escribiendo. Contador de sin leer en la pestaña y en el botón del celular.
- **Entorno con ciudad (calle, autos, árboles, vecinos): descartado**, lo vio infantil. Queda el edificio solo sobre su base.
- La luz del edificio sigue la hora real de Buenos Aires (madrugada, amanecer, día, atardecer, noche). Para probar: `?hora=noche` (o madrugada, amanecer, dia, atardecer).
- El chat responde de verdad con Claude Haiku 5.5 (el más barato), respuestas cortas (máx. 350 tokens), sin "pensamiento", límite de 25 preguntas cada 10 min por visitante. Sin clave, contesta en modo automático con datos de la simulación y lo avisa.
- **Celular: por ahora no invertir tiempo en el diseño mobile** (pedido de Joaquín, 2026-10-28). Funciona, pero no se pule.
- **Prioridad: que cargue rápido y se mueva fluido**, antes que el detalle del entorno. Si algo pesa o traba, se saca (prefiere fondo liso a algo trabado). Modelos comprimidos con meshopt; el diagrama se carga recién al abrir un agente.
- **Solo se habla con Bruno**: el usuario no le habla a Lupa, Cata, etc. Bruno sabe lo que hacen todos y responde. Más adelante podría pasarles órdenes.
- En la interfaz **no se muestran costos** (eran estimados, no reales).
- En 3D no hay etiquetas fijas de qué hace cada agente: el nombre aparece al pasar el mouse y el detalle al tocarlo.
- **Bruno por WhatsApp** (2026-10-28): API oficial de Meta (Cloud API), sin QR ni número personal. Función `api/whatsapp.ts`, comparte personalidad con la web vía `api/_bruno.ts`. Desde WhatsApp no ve la simulación en vivo: usa los datos de la semana de `src/data/agents.ts`. Memoria corta y límite de 25 mensajes cada 10 min por número (en memoria de la función).
  - App de Meta **Bruno Crew** (id 1684010846573731), portfolio JoaquinBarskys (no verificado), **publicada** (si no, Meta no manda los mensajes reales). Número de prueba **+1 555 650 0715** (Phone Number ID 1396846246846902). Hasta 5 destinatarios, editables en Caso de uso > Paso 1. Probar. Cargado: el celular de Joaquín.
  - **Funciona** (probado el 2026-10-28: Joaquín le escribió y Bruno contestó). Ojo: el panel de Meta no conecta solo la cuenta de WhatsApp (WABA 2470685390090126) a la app; hubo que hacer `POST /2470685390090126/subscribed_apps` con la clave. Sin eso no llega ningún mensaje.
  - Clave: la del Paso 1 de Meta vence en horas (pasó el 29/10). Desde el 29/10 `WHATSAPP_TOKEN` es una **clave fija que no vence**, del usuario del sistema **Bruno** (portfolio JoaquinBarskys > Usuarios del sistema), con acceso a la app (desarrollar), a la cuenta de WhatsApp "Test WhatsApp Account" (Todo) y a la **cuenta de mensajes** "Test Messaging Account" 2470685390090126 (Todo). Meta separa número y cuenta de mensajes: sin la segunda da el error "Viewer cannot access the provided Paid Message Account". Si cambian los accesos, hay que generar la clave de nuevo.
  - Números argentinos: WhatsApp los manda con 549…, para contestar se saca el 9 (lo hace la función). En la lista de destinatarios se cargan sin el 9.
  - Variables en Vercel: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN` (la misma va en Meta > Paso 2 > Webhooks), opcional `WHATSAPP_APP_SECRET`. `GET /api/whatsapp` muestra cuáles están cargadas.
  - Página de privacidad para Meta: `public/privacidad.html` (contacto: Gmail de Joaquín).
  - Política de Meta desde ene-2026: no permite asistentes de IA "para todo"; sí bots de una empresa sobre su negocio.

## Costos
- Página: gratis (Vercel Hobby, 1 función usada de 12).
- Chat de Bruno: cada pregunta gasta ~3.000 tokens de entrada y ~300 de salida con Haiku 5.5 → unos USD 0,0005. USD 5 de crédito alcanzan para ~10.000 preguntas.
- El plan Max de Joaquín trae **USD 100 por mes de crédito de API** vinculado a su organización (se acredita mes a mes, el próximo el 14/11/2026; cada crédito vence antes del siguiente). No consume el uso del plan en Claude Code. Sirve para API, Batch, Agent SDK, Playground y Managed Agents. No hay tarjeta cargada en la consola ni crédito comprado. Límite de la organización: USD 500/mes (no tocado).
- Precios por millón de tokens (entrada/salida): Haiku 5.5 USD 0,10/0,50; Sonnet 5.5 USD 2/10; Opus 5.5 USD 4/20. Batch = 50% off.
- Para venderlo a clientes hace falta API (la suscripción personal no sirve para dar servicio a terceros).
- **WhatsApp (Meta), Argentina, desde 1/10/2026**: cada respuesta del bot se cobra USD 0,026 (~ARS 37,7) pasando las **1.000 gratis por mes por número**. Plantillas que inicia el negocio: marketing USD 0,0618 (~ARS 89,6), utilidad USD 0,026. Si el cliente llega desde un anuncio "clic a WhatsApp" (en el celular), los mensajes son gratis por 7 días. Sin medio de pago cargado, pasadas las 1.000 no se entregan.
- Estimación de costo mensual (charlado con Joaquín el 30/10/2026, sin mano de obra): concesionaria mediana (~600 charlas/mes) USD 90-150; desarrolladora (~300 charlas largas) USD 80-130; negocio chico (<1.000 respuestas/mes) USD 0-25. Lo grande es Meta, no la IA (Haiku cuesta USD 5-15/mes en esos volúmenes). Para cliente comercial, Vercel Hobby no sirve (es no comercial): Vercel Pro USD 20 o Cloudflare Workers gratis.

## Cómo se corre y se deploya
- Local: `preview_start` con el nombre `orik-crew` (puerto 5191). Está en `C:\Users\joaqu\.claude\launch.json`. En dev, `/api/chat` lo sirve un plugin de `vite.config.ts`.
- Producción: https://orik-crew.vercel.app (proyecto Vercel `orik-crew`).
- Repo: https://github.com/joaquin-barsky/MultyAgent-Test (rama `main`). Push a `main` despliega solo.
- Clave de IA: variable `ANTHROPIC_API_KEY` en Vercel (Production), cargada el 2026-10-28. Es la clave `bruno-chat` del espacio de trabajo **Orik Crew demo** de la consola (platform.claude.com), con tope de **USD 5 por mes**. **Vence el 27/11/2026**: hay que crear otra y cargarla antes. Si vence, el chat pasa solo al modo automático.
- Stack: Vite 8 + React 19 + TS + Tailwind v4 + motion/react + lucide; 3D con React Three Fiber + drei (CameraControls); diagramas con React Flow (@xyflow/react); estado con zustand; íconos de marcas con simple-icons; `@anthropic-ai/sdk` en la función.
- Chequeo de tipos de la función: `npx tsc -p tsconfig.api.json`.
- Modelos 3D: Kenney Furniture Kit y Mini Characters (CC0) en `public/models`. Fotos de propiedades de Unsplash en `public/img`. Avatares `public/avatars/face-*.png` generados con `/?gen=avatars` (solo dev).
- Links directos: `?piso=marketing`, `?agente=lupa`, `?hora=noche`.
- Capturas sin el panel del navegador: hay un script de puppeteer-core con Chrome (en el scratchpad de la sesión); el panel oculto de Claude congela el 3D.

## Estructura
- `src/data/agents.ts` y `agents-extra.ts`: pisos, 19 agentes + supervisor, pasos, secciones, nodos de IA con sus herramientas, condiciones y vistas previas.
- `src/sim/store.ts`: simulación. `src/sim/daylight.ts`: luz por hora.
- `src/scenes/BuildingScene.tsx`: edificio, pisos, cámara (encuadre según el espacio libre entre paneles).
- `src/flow/FlowPanel.tsx`: panel estilo n8n con secciones, sub nodos, vistas previas y barra de ejecución.
- `src/chat/`: chat con Bruno y la "foto" del equipo que se le manda. `api/chat.ts`: función de Vercel.
- Circuito: Mora → Lupa → Cata → Rolo → Sol → Mora. Leo → Juli → Vale → Paz → Gaby → Nina → Mora. Caro → Martín → Mica → Ana → Fran → Gaby. Teo → Nina. Lucas → Nina. Tomi → Mora.

## Le gustó / no tocar
- Le gustó la primera demo (oficina 3D + panel estilo n8n) y cómo responde Bruno.
- **Eligió el estilo Vidrio** (2026-10-28). Maqueta se sacó: no le gustaban los personajes blancos.
- Pidió: menos jueguito, sin marca, edificio por pisos, diagrama más completo, supervisor con chat. Hecho.
- **Los personajes (Kenney a color) le gustan**: no cambiarlos.
- Diagrama: sin líneas punteadas que se mueven ni bordes girando (se veía trabado). Se redibuja solo cuando un paso termina.
- Todavía no está convencido del diseño general. **Pixel art: NO** (lo vio y no le gustó, 2026-10-28).

## Pendientes
- WhatsApp: cargar `WHATSAPP_APP_SECRET` para validar que los mensajes vienen de Meta (opcional para la demo).
- Renovar la clave `bruno-chat` antes del 27/11/2026.
- Aprovechar los USD 100 promocionales antes del 16/11 para probar agentes reales.
- Definir con Joaquín otra dirección de diseño (pixel art: **descartado**, no le gustó). Esperar su referencia o captura.
- Relevar con Joaquín qué problemas vio en Calle Real para elegir los primeros agentes reales.
- Próximo paso que quiere Joaquín: **hacerlo real con un cliente puntual**. Candidatos: Calle Real (lo va a plantear con Alan) y un amigo que tiene una concesionaria (idea para más adelante).
- Hacerlo real **más adelante**: Calle Real ya usa todos los días un sistema propio con mucha información (de ahí sacarían datos los agentes). Joaquín primero quiere entender bien cómo funciona y **tiene que hablarlo con el dueño** antes de avanzar.
