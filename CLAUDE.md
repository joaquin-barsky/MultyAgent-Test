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
- **Agentes siempre sentados** (2026-10-30): sin caminatas ni café (le parecían infantiles). Cuando trabajan teclean y tienen una barrita de avance arriba; libres, quietos en la silla. **Miran hacia +z (al escritorio)**: el modelo Kenney ya mira así, no hay que girarlo (girarlo los dejó de espaldas).
- Escritorios más anchos; **sin lámparas** (no le gustaron). Equipos más juntos.
- **Sin la lista de pisos a la izquierda** (pedido de Joaquín). Se entra a los pisos tocando el edificio o las etiquetas de piso en 3D.
- **Recorrido cinematográfico**: arranca si no hacés clic ni tocás teclas por 12 s (antes 8, Joaquín pidió más margen) (mover el mouse solo lo posterga). Muestra **al equipo entero de un piso**, de costado, y cambia de piso cada 12 s con corte directo. Se esconde la interfaz; a la derecha aparece un panel con el equipo, el proceso del que va más adelantado y su último resultado. En la pared lateral del piso hay un cartel "Equipo de Marketing" (canvas con la tipografía de la página). **Solo se sale con un clic o una tecla** (pedido de Joaquín); una capa invisible evita que ese clic toque algo de abajo. En desarrollo: ?taz= ?tpol= ?tdist= y ?cam=x,y,z,tx,ty,tz.
- **Sentado en la silla** (medido el 2026-10-30): personaje en [0, 0.25, -0.6] escala 0.62, silla escala 0.75 en z -0.6. Ajustable en desarrollo con ?seat=y,z,escalaPersonaje,escalaSilla,zSilla.
- **"Te necesita"**: 6 agentes (Paz, Sol, Fran, Teo, Cata, Martín) a veces frenan en un paso y te hacen una pregunta (src/data/asks.ts); como mucho 2 a la vez. No siguen hasta que contestás. Se ve en amarillo: aro y pantallas del escritorio, cartelito con "!", etiqueta del piso, botón "Te necesita" arriba (te lleva al agente), aviso en el panel y mensaje de Bruno con botones. Se contesta con una opción o a mano; la última opción frena la tarea. En desarrollo: ?need=paz.
- **Último resultado** de cada agente (src/data/results.ts): posteo, reel, fotos, charla de WhatsApp, informe o números. Se ve en el panel del agente y en el panel del recorrido.
- **Contador grande: sacado** (2026-10-30, no le gustó nada cómo se veía).
- **Monitor curvo largo** en cada escritorio (src/three/CurvedMonitor.tsx), en lugar de dos monitores. Se enciende del color del agente cuando trabaja y amarillo cuando te necesita.
- **Cartel del equipo: variante 3 elegida** (2026-10-30): la pared lateral se pinta del color del área con "Equipo de" y el nombre grande. El nombre se achica solo para que entre siempre (antes "Administración" se cortaba).
- **Pantallas con contenido**: el monitor curvo muestra una mini pantalla con el trabajo del agente mientras trabaja (foto del posteo, globitos del chat, números), dibujada una vez por agente (src/three/screenTexture.ts).
- **Anillo de progreso** alrededor de cada puesto mientras trabaja, en lugar de la barrita flotante.
- **Fondo de entrada** con más profundidad (radial, más claro detrás del edificio) en día, amanecer y atardecer.
- **Variante planta libre** (?v=2, selector "Edificio / Planta libre" arriba a la derecha): un solo piso grande con 5 zonas por área (fondo: Dirección con la oficina de Bruno y Marketing; adelante: Finanzas, Administración y Ventas detrás de una pared baja), cada una con piso tintado y pared pintada con su nombre, separadores bajos de vidrio. Tocar una zona acerca la cámara; el recorrido panea de zona en zona sin cortes. Todos los agentes se animan siempre. **Quedan las dos** (pedido de Joaquín, 2026-10-30): planta libre es la vista de entrada, `?v=1` abre el edificio.
- **Diagrama más grande** (2026-10-30): encabezado compacto, último resultado y datos en una columna propia a la derecha, se reencuadra solo cuando cambia el espacio (por ejemplo cuando aparece el aviso amarillo).
- **Plantillas por rubro: sacadas** (2026-10-30). Se armaron desarrolladora, concesionaria, e-commerce y gastronomía con selector "Empresa", pero Joaquín no le vio sentido. Queda solo la inmobiliaria. Si se quiere volver, está en el commit 249da0e.
- **Dirección en planta libre con aire y sin paredes** (2026-10-30): zona más ancha (x -12 a -1), Bruno al medio atrás sin la oficina de vidrio (`SupervisorDesk walls={false}`), Mora y Tomi a los costados, Sol adelante. Sin separador de vidrio entre Dirección y Marketing.
- **Escritorios mejorados** (2026-10-30): espalda del monitor clara (es lo que ve la cámara) con una tira de luz del color del agente mientras trabaja (amarilla si te necesita), alfombrita del color del agente, taza y una o dos cosas propias en las esquinas (plantita, libros, parlante), distintas según el agente.
- **Memoria de cada agente** (2026-10-30): pestaña "Proceso / Memoria" en el panel del agente. Grafo con tres ramas: Lo que sabe (su trabajo, con qué piensa, qué usa, con quién trabaja), Lo que aprendió (tus respuestas cuando frenó a preguntarte, en amarillo, más lo que sacó su IA) y Lo que recuerda (lo último que hizo). Lo que le enseñás queda guardado en el navegador y Bruno lo sabe.
- **Repaso del día** (2026-10-30, solo pantallas grandes): botón abajo a la izquierda. Línea de 8:00 a ahora con una fila por área y un punto por tarea; se arrastra para ver qué pasó a cada hora, "Ver el día" lo recorre en 14 s, tocar una tarea abre al agente. Lo de antes de abrir la página es simulado (igual para todo el día), lo de la visita es real. Antes de las 9 muestra el día anterior.
- **Escritorio de Bruno distinto** (2026-10-30): madera oscura, planta, laptop y en el frente un tablero con una luz por agente (ordenadas por área): del color del agente si trabaja, amarilla titilando si te necesita, apagada si está libre (`src/three/StatusBoard.tsx`).
- **Vuelo de entrada** (2026-10-30): al abrir la página la cámara arranca lejos y arriba y, cuando terminan de cargar los modelos, baja girando (~70°) hasta la oficina en unos 4-5 s (la primera versión era tan rápida que no se sentía) (`src/scenes/intro.ts`). Una sola vez por visita; no corre con `?piso`, `?agente` o `?cam`, y se cancela si tocás un piso antes.
- **Tablero de tareas** (2026-10-30): tercera opción del selector de arriba a la derecha ("Planta libre / Edificio / Tablero"). Columnas En curso (paso actual y avance), Te espera (la pregunta con sus botones para contestar ahí) y Hecho hoy (mismos datos que el repaso del día); arriba, las caras de los que están libres. Tocar una tarjeta abre al agente. Con el tablero abierto no arranca el recorrido.
- **Modo noche, a prueba** (2026-10-30, "veamos cómo queda, de última lo sacamos"): botón "Modo noche" arriba (o `?noche`). Oficina casi a oscuras con una luz azul de frente para que se vean las caras; brillan las pantallas, la tira del monitor y un resplandor del color del agente en el escritorio y el piso (planos con mancha de luz, sin luces de verdad). De noche nadie queda libre más de unos segundos.
- **Planta libre sin cartelitos de zona** (2026-10-30): el nombre del área ya está en la pared. Se entra a una zona tocando el piso.
- **Hecho hoy** del tablero: una tarjeta por agente con cuántas tareas terminó y la última (antes era cada paso suelto, largo y repetido). Luces de Bruno más grandes: dos filas que ocupan el frente del escritorio.
- **Ideas descartadas** (2026-10-30): globitos de charla entre agentes y pared de resultados.
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
  - **Resumen diario por WhatsApp** (2026-10-30): todos los días a las 19 (cron de Vercel en `vercel.json`, 22:00 UTC; en Hobby puede salir dentro de esa hora) llama a `GET /api/whatsapp?cron=resumen` y manda a los números de `WHATSAPP_RESUMEN_TO` (separados por coma, sin el 9) el resumen: tareas, horas, 3 cosas importantes y qué te espera, con botón "Abrir la oficina". Si le escribiste a Bruno en las últimas 24 h va como mensaje con botón; si no, Meta obliga a usar la plantilla aprobada `resumen_diario` (utilidad, es_AR). Escribirle "resumen" a Bruno lo trae al toque, sin IA. Armado en `api/_resumen.ts`. `CRON_SECRET` en Vercel protege las rutas; `?admin=plantilla` crea la plantilla y `?admin=estado` muestra si Meta la aprobó (con `&key=`).
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
- Links directos: `?piso=marketing`, `?agente=lupa`, `?hora=noche`, `?v=1` (edificio), `?noche` (modo noche).
- Capturas sin el panel del navegador: hay un script de puppeteer-core con Chrome (en el scratchpad de la sesión); el panel oculto de Claude congela el 3D.

## Estructura
- `src/data/agents.ts` y `agents-extra.ts`: pisos, 19 agentes + supervisor, pasos, secciones, nodos de IA con sus herramientas, condiciones y vistas previas.
- `src/data/alerts.ts`: avisos de Bruno.
- `src/sim/store.ts`: simulación y memoria aprendida (`learned`). `src/sim/daylight.ts`: luz por hora. `src/sim/replay.ts` + `src/ui/DayReplay.tsx`: repaso del día.
- `src/flow/MemoryGraph.tsx`: memoria del agente. `src/scenes/OpenPlanScene.tsx`: planta libre.
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

## Referencias vistas en TikTok (2026-10-30)
- Hay una ola de "oficinas virtuales de agentes" en TikTok (sep-oct 2026), casi todas hechas por creadores de IA para vender cursos o agencias: Lautaro ("IA para vender más", oficina 3D con etiquetas por área), Anastasia Javurek (agentes con personajes de Betty la Fea), David Chavarin, Kōdo Factory, AXIAL STUDIO, Pixel Agents/Claude Office (pixel art, para programadores).
- **Kōdo Factory** es lo más parecido a nuestra idea: rascacielos donde cada piso es un agente, clima y hora reales, barra arriba con "trabajando / te necesitan / para revisar / dormidos", contador gigante de tokens tipo marcador, "centro de datos" y "central eléctrica" que miden el consumo. Es pixel art y más de juego.
- **AXIAL STUDIO** (20 mil likes): "los Sims para manejar agentes". Oficina 3D limpia con un tablero de tareas (En curso / En revisión / Hecho) con barras de progreso por agente.
- Comentarios repetidos en esos videos: "¿qué hacen realmente?", "es fundir tokens", "¿es open source?". La gente desconfía si no se ve un resultado concreto.

## Pendientes
- WhatsApp: cargar `WHATSAPP_APP_SECRET` para validar que los mensajes vienen de Meta (opcional para la demo).
- Renovar la clave `bruno-chat` antes del 27/11/2026.
- Órdenes a Bruno (que les pase tareas a los agentes): **más adelante**, cuando sea real (Joaquín, 2026-10-30).
- Aprovechar los USD 100 promocionales antes del 16/11 para probar agentes reales.
- Definir con Joaquín otra dirección de diseño (pixel art: **descartado**, no le gustó). Esperar su referencia o captura.
- Relevar con Joaquín qué problemas vio en Calle Real para elegir los primeros agentes reales.
- Próximo paso que quiere Joaquín: **hacerlo real con un cliente puntual**. Candidatos: Calle Real (lo va a plantear con Alan) y un amigo que tiene una concesionaria (idea para más adelante).
- Hacerlo real **más adelante**: Calle Real ya usa todos los días un sistema propio con mucha información (de ahí sacarían datos los agentes). Joaquín primero quiere entender bien cómo funciona y **tiene que hablarlo con el dueño** antes de avanzar.
