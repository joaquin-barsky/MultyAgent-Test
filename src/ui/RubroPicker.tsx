import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Building2, Car, Check, ChevronDown, HardHat, ShoppingBag, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { RUBRO_LIST, type RubroId } from '../data/kit'
import { RUBRO_ID } from '../data/rubros/index.js'

const ICON: Record<RubroId, LucideIcon> = {
  inmobiliaria: Building2,
  desarrolladora: HardHat,
  concesionaria: Car,
  ecommerce: ShoppingBag,
  gastronomia: UtensilsCrossed,
}

/** elegir qué empresa se muestra: cambia ?rubro= y vuelve a cargar con ese equipo */
export function RubroPicker() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cur = RUBRO_LIST.find((r) => r.id === RUBRO_ID)!
  const Icon = ICON[cur.id]

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

  const pick = (id: RubroId) => {
    setOpen(false)
    if (id === RUBRO_ID) return
    const u = new URL(location.href)
    if (id === 'inmobiliaria') u.searchParams.delete('rubro')
    else u.searchParams.set('rubro', id)
    for (const k of ['agente', 'piso', 'need']) u.searchParams.delete(k)
    location.href = u.toString()
  }

  return (
    <div ref={ref} className="pointer-events-auto relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="glass flex h-[52px] items-center gap-2.5 rounded-[20px] pl-3 pr-3.5">
        <span className="grid size-8 place-items-center rounded-[11px] bg-[var(--ink)] text-[var(--bg)]">
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-[11px] text-[var(--muted)]">Empresa</span>
          <span className="text-[14.5px] font-bold">{cur.name}</span>
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="glass absolute left-0 top-[60px] w-[264px] origin-top-left rounded-[20px] p-1.5 max-sm:fixed max-sm:inset-x-2 max-sm:top-[64px] max-sm:w-auto"
            role="listbox"
          >
            {RUBRO_LIST.map((r) => {
              const I = ICON[r.id]
              const on = r.id === RUBRO_ID
              return (
                <li key={r.id}>
                  <button role="option" aria-selected={on} onClick={() => pick(r.id)} className={`flex w-full items-center gap-3 rounded-[14px] px-2.5 py-2 text-left transition-colors ${on ? 'bg-[var(--ink)] text-[var(--bg)]' : 'hover:bg-[var(--line)]'}`}>
                    <span className={`grid size-8 shrink-0 place-items-center rounded-[10px] ${on ? 'bg-[var(--bg)] text-[var(--ink)]' : 'bg-[var(--line)]'}`}>
                      <I size={16} strokeWidth={2.2} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="text-[14px] font-bold">{r.name}</span>
                      <span className={`truncate text-[12px] ${on ? 'opacity-70' : 'text-[var(--muted)]'}`}>{r.hint}</span>
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
