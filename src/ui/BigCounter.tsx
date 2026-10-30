import { useCrew } from '../sim/store'

// Contador grande tipo marcador: tareas hechas en el mes, sube en vivo cuando un agente termina
const MONTH_BASE = 2870 // tareas del mes antes de esta semana (simulado)

function Digit({ d }: { d: string }) {
  if (!/\d/.test(d)) return <span className="bc-sep">{d}</span>
  return (
    <span className="bc-digit">
      <span className="bc-reel" style={{ transform: `translateY(${-Number(d) * 10}%)` }}>
        {'0123456789'.split('').map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  )
}

export function BigCounter() {
  const tasks = useCrew((s) => s.tasks)
  const minutes = useCrew((s) => s.minutes)
  const floor = useCrew((s) => s.floor)
  const total = (MONTH_BASE + tasks).toLocaleString('es-AR')
  const hours = Math.round(460 + minutes / 60).toLocaleString('es-AR')
  if (floor) return null
  return (
    <div className="cine-hide pointer-events-none absolute bottom-4 left-4 z-10 hidden lg:block">
      <div className="bigcounter">
        <p className="text-[12.5px] font-semibold text-[var(--muted)]">Tareas hechas este mes</p>
        <p className="bc-num" aria-label={total}>
          {total.split('').map((d, i) => (
            <Digit key={total.length - i} d={d} />
          ))}
        </p>
        <p className="text-[13px]">
          <b className="font-semibold">{hours} horas</b> <span className="text-[var(--muted)]">de trabajo que el equipo no tuvo que hacer</span>
        </p>
      </div>
    </div>
  )
}
