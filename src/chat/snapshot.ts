import { AGENTS, FLOORS, AGENT_BY_ID } from '../data/agents'
import { currentStep, useCrew } from '../sim/store'

const hhmm = (t: number) => new Date(t).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })

/** foto del equipo en texto, para que el supervisor sepa qué pasó */
export function teamSnapshot() {
  const s = useCrew.getState()
  const lines: string[] = []
  lines.push(`Hora en Buenos Aires: ${hhmm(Date.now())}. Tareas hechas esta semana: ${s.tasks}. Horas ahorradas esta semana: ${Math.round(s.minutes / 60)}.`)
  for (const f of FLOORS) {
    lines.push(`\nPiso ${f.n}, ${f.name}:`)
    for (const a of AGENTS.filter((x) => x.floor === f.id)) {
      const r = s.runs[a.id]
      const step = currentStep(a, r)
      const last = a.steps.filter((x) => x.kind === 'ai' || x.kind === 'if').flatMap((x) => x.output).slice(0, 3).join('; ')
      lines.push(
        `- ${a.name} (${a.role}): ${r.status === 'waiting' ? `FRENADO esperando tu respuesta en "${step?.title}"` : step ? `trabajando ahora en "${step.title}"` : 'libre'}. ${r.runs} vueltas esta semana. Ahorra ${a.savedMinutes} min por vuelta. Le pasa el trabajo a ${a.handoffTo ? AGENT_BY_ID[a.handoffTo].name : 'nadie'}. Últimos resultados: ${last}.`,
      )
    }
  }
  lines.push('\nÚltimos movimientos (más nuevo primero):')
  for (const f of s.feed.slice(0, 25)) {
    lines.push(`- ${hhmm(f.at)} ${AGENT_BY_ID[f.from].name} ${f.text}`)
  }
  if (!s.feed.length) lines.push('- Todavía no hubo movimientos en esta sesión.')
  return lines.join('\n')
}

/** respuesta armada en el navegador cuando todavía no hay clave de IA */
export function localAnswer(q: string) {
  const s = useCrew.getState()
  const t = q.toLowerCase()
  const floor = FLOORS.find((f) => t.includes(f.name.toLowerCase().slice(0, 5)))
  const working = AGENTS.filter((a) => s.runs[a.id].status === 'working')

  if (floor) {
    const list = AGENTS.filter((a) => a.floor === floor.id)
    return `En **${floor.name}** están ${list.map((a) => a.name).join(', ')}. ` +
      list.map((a) => {
        const st = currentStep(a, s.runs[a.id])
        return `${a.name} ${st ? `está en "${st.title}"` : 'está libre'} y lleva ${s.runs[a.id].runs} vueltas esta semana.`
      }).join(' ')
  }
  if (/problema|alerta|error|atras|falta/.test(t)) {
    return 'Lo que hay que mirar: **Nina** encontró una transferencia sin comprobante y que la publicidad subió 18%. **Teo** tiene 3 alquileres atrasados y ya mandó el segundo aviso. **Paz** está esperando el informe de dominio para una reserva.'
  }
  if (/ahora|trabajando|quién|quien/.test(t)) {
    return working.length
      ? `Ahora mismo están trabajando ${working.map((a) => `**${a.name}** (${currentStep(a, s.runs[a.id])?.title ?? ''})`).join(', ')}.`
      : 'En este momento están todos libres, esperando trabajo.'
  }
  const last = s.feed.slice(0, 3).map((f) => `${AGENT_BY_ID[f.from].name} ${f.text}`)
  return `Esta semana el equipo hizo **${s.tasks} tareas** y te ahorró unas **${Math.round(s.minutes / 60)} horas**. ` +
    (last.length ? `Lo último: ${last.join('; ')}.` : 'Recién arranca el día, todavía no hubo movimientos.')
}
