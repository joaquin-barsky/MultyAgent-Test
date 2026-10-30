import { Play } from 'lucide-react'
import { RESULTS } from '../data/results'

/** Lo último que produjo el agente: el posteo, el reel, la respuesta por WhatsApp, el informe */
export function ResultCard({ agentId, color, compact }: { agentId: string; color: string; compact?: boolean }) {
  const r = RESULTS[agentId]
  if (!r) return null
  switch (r.kind) {
    case 'post':
      return (
        <div className="flex gap-3">
          <img src={r.img} alt="" className={`${compact ? 'size-16' : 'size-20'} shrink-0 rounded-xl object-cover`} />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold leading-tight">{r.title}</p>
            <p className={`mt-1 text-[12.5px] leading-snug text-[var(--muted)] ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>{r.text}</p>
            <p className="mt-1 text-[11.5px] font-semibold" style={{ color }}>{r.meta}</p>
          </div>
        </div>
      )
    case 'video':
      return (
        <div className="flex items-center gap-3">
          <span className={`relative ${compact ? 'h-[72px] w-12' : 'h-[96px] w-[54px]'} shrink-0 overflow-hidden rounded-xl`}>
            <img src={r.img} alt="" className="size-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-black/25">
              <span className="grid size-7 place-items-center rounded-full bg-white/90 text-[#111]">
                <Play size={13} fill="currentColor" />
              </span>
            </span>
          </span>
          <div>
            <p className="text-[13.5px] font-semibold leading-tight">{r.title}</p>
            <p className="mt-1 text-[12.5px] text-[var(--muted)]">{r.meta}</p>
          </div>
        </div>
      )
    case 'gallery':
      return (
        <div>
          <div className="grid grid-cols-4 gap-1">
            {r.imgs.map((src) => (
              <img key={src} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
          <p className="mt-2 text-[13.5px] font-semibold leading-tight">{r.title}</p>
          <p className="text-[12.5px] text-[var(--muted)]">{r.meta}</p>
        </div>
      )
    case 'chat': {
      const msgs = compact ? r.msgs.slice(-3) : r.msgs
      return (
        <div>
          <p className="mb-1.5 text-[11.5px] text-[var(--muted)]">{r.with}</p>
          <div className="flex flex-col gap-1">
            {msgs.map((m, i) => (
              <span key={i} className={`max-w-[88%] rounded-2xl px-2.5 py-1.5 text-[12.5px] leading-snug ${m.me ? 'self-end text-white' : 'self-start bg-[var(--line)]'}`} style={m.me ? { background: color } : undefined}>
                {m.text}
              </span>
            ))}
          </div>
        </div>
      )
    }
    case 'doc':
      return (
        <div>
          <p className="text-[13.5px] font-semibold leading-tight">{r.title}</p>
          <ul className="mt-1.5 space-y-1">
            {(compact ? r.lines.slice(0, 3) : r.lines).map((l) => (
              <li key={l} className="flex gap-2 text-[12.5px] leading-snug">
                <span className="mt-[6px] size-1.5 shrink-0 rounded-full" style={{ background: color }} />
                {l}
              </li>
            ))}
          </ul>
        </div>
      )
    case 'stats':
      return (
        <div>
          <p className="text-[13.5px] font-semibold leading-tight">{r.title}</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {r.items.map((it) => (
              <span key={it.label} className="rounded-xl bg-[var(--flow)] px-2.5 py-1.5 ring-1 ring-[var(--line)]">
                <span className="block text-[11px] text-[var(--muted)]">{it.label}</span>
                <span className="block font-display text-[16px] font-bold leading-tight" style={{ color }}>{it.value}</span>
              </span>
            ))}
          </div>
        </div>
      )
  }
}
