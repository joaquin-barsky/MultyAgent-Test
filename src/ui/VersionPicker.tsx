import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown } from 'lucide-react'
import { VERSION } from '../sim/mode'

/** estilos de oficina de la vidriera: cada uno vive en /v1, /v2… */
export const VERSIONS = [
  { n: 1, name: 'Planta libre', hint: 'Un piso abierto con las 8 áreas' },
  { n: 2, name: 'Edificio', hint: 'Dos torres pegadas, un piso por área' },
]

export const CURRENT = VERSIONS.find((v) => v.n === VERSION) ?? VERSIONS[0]

/** selector de versiones: cambia la dirección y la página carga solo esa oficina */
export function VersionPicker() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const out = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('pointerdown', out)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('pointerdown', out)
      window.removeEventListener('keydown', esc)
    }
  }, [open])

  const go = (n: number) => {
    setOpen(false)
    if (n !== CURRENT.n) location.href = `/v${n}`
  }

  return (
    <div ref={ref} className="cine-hide pointer-events-auto absolute left-2 top-2 z-30 sm:left-4 sm:top-4">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="glass flex h-[56px] items-center gap-3 rounded-[20px] pl-2 pr-4">
        <span className="grid size-10 place-items-center rounded-[14px] bg-[var(--ink)] font-display text-[17px] font-bold text-[var(--bg)]">{CURRENT.n}</span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[11.5px] text-[var(--muted)]">Versión {CURRENT.n} de {VERSIONS.length}</span>
          <span className="text-[15px] font-bold">{CURRENT.name}</span>
        </span>
        <ChevronDown size={17} className={`ml-1 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="glass absolute left-0 top-[64px] w-[320px] origin-top-left rounded-[20px] p-1.5"
            role="listbox"
            aria-label="Versiones de la oficina"
          >
            {VERSIONS.map((v) => {
              const on = v.n === CURRENT.n
              return (
                <li key={v.n}>
                  <button role="option" aria-selected={on} onClick={() => go(v.n)} className={`flex w-full items-center gap-3 rounded-[14px] px-2.5 py-2 text-left transition-colors ${on ? 'bg-[var(--ink)] text-[var(--bg)]' : 'hover:bg-[var(--line)]'}`}>
                    <span className={`grid size-9 shrink-0 place-items-center rounded-[11px] font-display text-[15px] font-bold ${on ? 'bg-[var(--bg)] text-[var(--ink)]' : 'bg-[var(--line)]'}`}>{v.n}</span>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="text-[14px] font-bold">{v.name}</span>
                      <span className={`truncate text-[12px] ${on ? 'opacity-70' : 'text-[var(--muted)]'}`}>{v.hint}</span>
                    </span>
                    {on && <Check size={16} strokeWidth={2.6} />}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
