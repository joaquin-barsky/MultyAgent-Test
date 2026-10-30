import { memo, useEffect, useMemo, useState } from 'react'
import {
  Background, BackgroundVariant, BaseEdge, EdgeLabelRenderer, Handle, Position, ReactFlow, ReactFlowProvider,
  getBezierPath, useReactFlow, useStore, type Edge, type EdgeProps, type Node, type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Clock3, Minus, Play, Plus, Repeat2, Scan, Timer, X, Zap } from 'lucide-react'
import { AGENT_BY_ID, FLOORS, type Agent, type FlowStep, type Preview, type Sub } from '../data/agents'
import { colSecs, stepStatus, useCrew, type AgentRun } from '../sim/store'
import { NodeIcon, iconColor } from '../ui/icons'
import { useIsNarrow } from '../ui/useIsNarrow'
import { AskCard } from '../ui/AskCard'
import { ResultCard } from '../ui/ResultCard'
import { MemoryGraph } from './MemoryGraph'

type St = 'done' | 'running' | 'pending'
type StepData = { step: FlowStep; agent: Agent; status: St; vertical: boolean; picked: boolean; waiting: boolean }
type SubData = { sub: Sub; agent: Agent; active: boolean }
type SectionData = { title: string; n: number; agent: Agent; w: number; h: number; active: boolean }
type EdgeData = { color: string; status: St; items: number; label?: string; dashed?: boolean }

const COL = 228
const FIT = { padding: { top: '4%', right: '4%', left: '4%', bottom: '68px' }, duration: 400 } as const
const LANE = 180
const maxCol = (a: Agent) => Math.max(...a.steps.map((s) => s.col))

function PreviewCard({ p, color }: { p: Preview; color: string }) {
  switch (p.type) {
    case 'thumbs':
      return (
        <div className="fprev flex gap-1">
          {p.imgs.map((src) => (
            <img key={src} src={src} alt="" className="size-[42px] rounded-lg object-cover" />
          ))}
        </div>
      )
    case 'chart': {
      const max = Math.max(...p.data)
      return (
        <div className="fprev flex h-[50px] items-end gap-[3px]">
          {p.data.map((v, i) => (
            <span key={i} className="flex-1 rounded-sm" style={{ height: `${(v / max) * 100}%`, background: color, opacity: 0.35 + (i / p.data.length) * 0.65 }} />
          ))}
        </div>
      )
    }
    case 'text':
      return <div className="fprev line-clamp-3 text-left text-[11px] italic leading-snug text-[var(--muted)]">{p.text}</div>
    case 'chips':
      return (
        <div className="fprev flex flex-wrap justify-center gap-1">
          {p.items.map((c) => (
            <span key={c} className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>{c}</span>
          ))}
        </div>
      )
    case 'stat':
      return (
        <div className="fprev flex items-baseline justify-center gap-1.5">
          <span className="font-display text-[22px] font-bold leading-none" style={{ color }}>{p.value}</span>
          <span className="text-[10.5px] text-[var(--muted)]">{p.label}</span>
        </div>
      )
  }
}

const StepNode = memo(function StepNode({ data }: NodeProps<Node<StepData>>) {
  const { step, agent, status, vertical, picked } = data
  const tgt = vertical ? Position.Top : Position.Left
  const src = vertical ? Position.Bottom : Position.Right
  const wide = step.kind === 'ai'
  const handoff = step.kind === 'handoff' ? AGENT_BY_ID[agent.handoffTo ?? ''] : null
  return (
    <div className={`fnode ${status} ${picked ? 'picked' : ''} ${wide ? 'wide' : ''} ${data.waiting && status === 'running' ? 'waiting' : ''}`} style={{ ['--c' as string]: agent.color, ['--soft' as string]: agent.soft }}>
      {step.kind !== 'trigger' && <Handle type="target" position={tgt} className="fhandle" />}
      <div className={`fbox ${step.kind} ${wide ? 'wide' : ''}`}>
        <div className="fbox-in">
          {handoff ? (
            <span className="size-12 overflow-hidden rounded-full" style={{ background: handoff.soft }}>
              <img src={handoff.avatar} alt="" className="size-full object-cover" />
            </span>
          ) : wide ? (
            <span className="grid size-12 place-items-center rounded-2xl" style={{ background: agent.soft }}>
              <NodeIcon icon={step.icon} size={26} color={agent.color} />
            </span>
          ) : (
            <NodeIcon icon={step.icon} size={32} color={agent.color} />
          )}
          {wide && (
            <span className="flex min-w-0 flex-col text-left">
              <span className="text-[14.5px] font-semibold leading-tight">{step.title}</span>
              <span className="text-[12px] text-[var(--muted)]">{step.subtitle}</span>
              {vertical && step.subs && (
                <span className="mt-1 flex flex-wrap gap-1">
                  {step.subs.map((s) => (
                    <span key={s.label} className="rounded-md bg-[var(--flow)] px-1.5 py-0.5 text-[10px] font-semibold">{s.label}</span>
                  ))}
                </span>
              )}
            </span>
          )}
        </div>
        {step.kind === 'trigger' && <span className="fbolt"><Zap size={11} fill="currentColor" /></span>}
        {status === 'done' && (
          <span className="fbadge">
            <Check size={12} strokeWidth={3} />
          </span>
        )}
        {wide && !vertical && step.subs && <Handle type="source" id="subs" position={Position.Bottom} className="fhandle fhandle-sub" />}
      </div>
      {!wide && (
        <div className="flabel">
          <span className="text-[13px] font-semibold leading-tight">{step.title}</span>
          <span className="text-[11.5px] text-[var(--muted)]">{step.subtitle}</span>
        </div>
      )}
      {step.preview && <PreviewCard p={step.preview} color={agent.color} />}
      {step.kind !== 'handoff' && <Handle type="source" position={src} className="fhandle" />}
    </div>
  )
})

const SubNode = memo(function SubNode({ data }: NodeProps<Node<SubData>>) {
  const { sub, agent, active } = data
  const tag = sub.kind === 'model' ? 'Modelo' : sub.kind === 'memory' ? 'Memoria' : 'Herramienta'
  return (
    <div className={`fsub ${active ? 'on' : ''}`} style={{ ['--c' as string]: agent.color }}>
      <Handle type="target" position={Position.Top} className="fhandle fhandle-sub" />
      <span className="fsub-dot">
        <NodeIcon icon={sub.icon} size={20} color={iconColor(sub.icon, agent.color)} />
      </span>
      <span className="text-[11.5px] font-semibold leading-tight">{sub.label}</span>
      <span className="text-[10px] text-[var(--muted)]">{tag}</span>
    </div>
  )
})

const SectionNode = memo(function SectionNode({ data }: NodeProps<Node<SectionData>>) {
  return (
    <div className={`fsection ${data.active ? 'on' : ''}`} style={{ width: data.w, height: data.h, ['--c' as string]: data.agent.color }}>
      <span className="fsection-title">
        <span className="fsection-n">{data.n}</span>
        {data.title}
      </span>
    </div>
  )
})

function FlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<Edge<EdgeData>>) {
  const [path, lx, ly] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, curvature: 0.35 })
  const d = data!
  const on = d.status !== 'pending'
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: on ? d.color : 'var(--edge)',
          strokeWidth: d.dashed ? 1.6 : on ? 2.4 : 2,
          strokeDasharray: d.dashed ? '4 5' : undefined,
          opacity: d.status === 'running' ? 0.55 : 1,
          transition: 'stroke 0.3s, opacity 0.3s',
        }}
      />
      {(d.label || (d.status === 'done' && !d.dashed)) && (
        <EdgeLabelRenderer>
          <div className={`fitems ${d.label ? 'cond' : ''}`} style={{ transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`, ['--c' as string]: d.color }}>
            {d.label ?? `${d.items} ${d.items === 1 ? 'ítem' : 'ítems'}`}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const nodeTypes = { step: StepNode, sub: SubNode, section: SectionNode }
const edgeTypes = { flow: FlowEdge }

const Graph = memo(function Graph({ agent, picked, onPick }: { agent: Agent; picked: string | null; onPick: (id: string | null) => void }) {
  const key = useCrew((s) => { const r = s.runs[agent.id]; return `${r.status}|${r.col}|${r.runs}` })
  const run = useMemo<AgentRun>(() => { const [status, col, runs] = key.split('|'); return { status: status as AgentRun['status'], col: Number(col), runs: Number(runs), t: 0, idleFor: 0 } }, [key])
  const vertical = useIsNarrow()
  const { fitView, setViewport } = useReactFlow()
  const lanes = Math.max(...agent.steps.map((s) => s.lane)) + 1

  const nodes = useMemo<Node[]>(() => {
    const out: Node[] = []
    const pos = (col: number, lane: number) => (vertical ? { x: lane * 175, y: col * 270 } : { x: col * COL, y: lane * LANE })
    agent.sections.forEach((sec, i) => {
      const a = pos(sec.from, 0)
      const span = sec.to - sec.from + 1
      const active = run.status === 'working' && run.col >= sec.from && run.col <= sec.to
      out.push({
        id: `sec${i}`,
        type: 'section',
        position: vertical ? { x: -40, y: a.y - 56 } : { x: a.x - 45, y: -60 },
        data: { title: sec.title, n: i + 1, agent, active, w: vertical ? lanes * 175 + 60 : span * COL - 20, h: vertical ? span * 270 - 18 : lanes * LANE + 70 },
        draggable: false,
        selectable: false,
        zIndex: -1,
      })
    })
    for (const s of agent.steps) {
      const wide = s.kind === 'ai'
      const p = pos(s.col, s.lane)
      out.push({
        id: s.id,
        type: 'step',
        position: { x: p.x - (wide ? 55 : 0), y: p.y },
        data: { step: s, agent, status: stepStatus(agent, run, s.col), vertical, picked: picked === s.id, waiting: run.status === 'waiting' },
        draggable: false,
      })
      if (wide && !vertical && s.subs) {
        s.subs.forEach((sub, k) => {
          out.push({
            id: `${s.id}-sub${k}`,
            type: 'sub',
            position: { x: p.x - 40 + k * 95 - ((s.subs!.length - 1) * 95) / 2 + 40, y: p.y + 160 },
            data: { sub, agent, active: stepStatus(agent, run, s.col) === 'running' },
            draggable: false,
            selectable: false,
          })
        })
      }
    }
    return out
  }, [agent, run, vertical, picked, lanes])

  const edges = useMemo<Edge<EdgeData>[]>(() => {
    const byId = Object.fromEntries(agent.steps.map((s) => [s.id, s]))
    const list: Edge<EdgeData>[] = agent.edges.map((e) => {
      const from = byId[e.from]
      const to = byId[e.to]
      const sf = stepStatus(agent, run, from.col)
      const stT = stepStatus(agent, run, to.col)
      const status: St = sf === 'done' && stT === 'running' ? 'running' : sf === 'done' ? 'done' : 'pending'
      return { id: `${e.from}-${e.to}`, source: e.from, target: e.to, type: 'flow', data: { color: agent.color, status, items: from.items, label: e.label } }
    })
    if (!vertical) {
      for (const s of agent.steps) {
        if (s.kind !== 'ai' || !s.subs) continue
        const st = stepStatus(agent, run, s.col)
        s.subs.forEach((_, k) => list.push({ id: `${s.id}-s${k}`, source: s.id, sourceHandle: 'subs', target: `${s.id}-sub${k}`, type: 'flow', data: { color: agent.color, status: st, items: 0, dashed: true } }))
      }
    }
    return list
  }, [agent, run, vertical])

  useEffect(() => {
    // en celular arranca con zoom sobre los primeros pasos; el resto se ve deslizando
    const t = setTimeout(() => {
      if (!vertical) return fitView(FIT)
      const w = document.querySelector('.flow-bg')?.clientWidth ?? 360
      const zoom = 0.78
      const mid = ((lanes - 1) * 175) / 2 + 75
      setViewport({ x: w / 2 - mid * zoom + 14, y: 40, zoom }, { duration: 400 })
    }, 120)
    return () => clearTimeout(t)
  }, [vertical, agent.id, fitView, setViewport, lanes])

  // si cambia el alto del lienzo (por ejemplo aparece el aviso amarillo), se vuelve a encuadrar
  const paneW = useStore((s) => s.width)
  const paneH = useStore((s) => s.height)
  useEffect(() => {
    if (vertical || !paneW || !paneH) return
    const t = setTimeout(() => fitView({ ...FIT, duration: 250 }), 160)
    return () => clearTimeout(t)
  }, [paneW, paneH, vertical, fitView])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView={!vertical}
      fitViewOptions={FIT}
      minZoom={0.2}
      maxZoom={1.6}
      proOptions={{ hideAttribution: true }}
      nodesConnectable={false}
      onNodeClick={(_, n) => n.type === 'step' && onPick(n.id === picked ? null : n.id)}
      onPaneClick={() => onPick(null)}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.6} color="var(--dots)" />
      <ZoomButtons />
    </ReactFlow>
  )
})

function ZoomButtons() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  return (
    <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
      <button className="zbtn" onClick={() => fitView({ ...FIT, duration: 300 })} aria-label="Ver todo"><Scan size={17} /></button>
      <button className="zbtn" onClick={() => zoomIn({ duration: 200 })} aria-label="Acercar"><Plus size={17} /></button>
      <button className="zbtn" onClick={() => zoomOut({ duration: 200 })} aria-label="Alejar"><Minus size={17} /></button>
    </div>
  )
}

/** barra de abajo: ejecución actual, tiempos por etapa e historial */
function RunBar({ agent, run }: { agent: Agent; run: AgentRun }) {
  const cols = Array.from({ length: maxCol(agent) + 1 }, (_, i) => i)
  const total = cols.reduce((s, c) => s + colSecs(agent, c), 0)
  const working = run.status === 'working'
  const elapsed = working ? cols.filter((c) => c < run.col).reduce((s, c) => s + colSecs(agent, c), 0) + run.t : 0
  const history = useMemo(
    () => Array.from({ length: 5 }, (_, i) => ({ n: run.runs - i, secs: total * (0.85 + ((run.runs * 7 + i * 13) % 30) / 100) })),
    [run.runs, total],
  )
  return (
    <div className="runbar">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${working ? 'text-white' : ''}`} style={{ background: working ? agent.color : 'var(--flow)' }}>
          {working ? <span className="runspin" /> : <Check size={16} strokeWidth={3} className="text-[#22b35e]" />}
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold">Ejecución {working ? run.runs + 1 : run.runs}</span>
          <span className="text-[11.5px] text-[var(--muted)]">{working ? `Corriendo, ${elapsed.toFixed(1)} s de ${total.toFixed(0)} s` : 'Terminó bien'}</span>
        </div>
      </div>
      <div className="runbar-track" aria-label="Tiempo por etapa">
        {cols.map((c) => {
          const st = !working ? 'done' : c < run.col ? 'done' : c === run.col ? 'running' : 'pending'
          const prog = st === 'running' ? Math.min(1, run.t / Math.max(0.1, colSecs(agent, c))) : st === 'done' ? 1 : 0
          return (
            <span key={c} className="runbar-seg" style={{ flex: colSecs(agent, c) }}>
              <span style={{ width: `${prog * 100}%`, background: agent.color }} />
            </span>
          )
        })}
      </div>
      <div className="flex items-center gap-4 text-[12px]">
        <span className="flex items-center gap-1.5"><Timer size={14} className="text-[var(--muted)]" />{total.toFixed(0)} s</span>
      </div>
      <div className="hidden items-center gap-1 xl:flex">
        <Repeat2 size={14} className="mr-1 text-[var(--muted)]" />
        {history.map((h) => (
          <span key={h.n} className="runbar-hist" title={`Ejecución ${h.n}`}>
            <Check size={10} strokeWidth={3} />
            {h.secs.toFixed(0)} s
          </span>
        ))}
      </div>
    </div>
  )
}

function StepDetail({ agent, step, onClose }: { agent: Agent; step: FlowStep; onClose: () => void }) {
  const run = useCrew((s) => s.runs[agent.id])
  const st = stepStatus(agent, run, step.col)
  const label = st === 'done' ? 'Terminado' : st === 'running' ? 'Trabajando ahora' : 'Esperando'
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="detail absolute bottom-3 right-3 left-3 z-20 sm:left-auto sm:top-3 sm:bottom-auto sm:w-[340px]"
      style={{ ['--c' as string]: agent.color }}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--card)] shadow-sm ring-1 ring-[var(--line)]">
          <NodeIcon icon={step.icon} size={24} color={agent.color} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold leading-tight">{step.title}</p>
          <p className="text-[12.5px] text-[var(--muted)]">{step.subtitle}</p>
        </div>
        <button onClick={onClose} className="ibtn -mr-1 -mt-1" aria-label="Cerrar detalle"><X size={16} /></button>
      </div>
      <p className="mt-3 text-[13.5px] leading-relaxed">{step.what}</p>
      <div className="mt-3 flex items-center gap-2 text-[12.5px] font-medium">
        <span className={`sdot ${st}`} />
        {label}
        <span className="ml-auto flex items-center gap-1 text-[var(--muted)]"><Clock3 size={13} /> {step.secs.toFixed(1)} s</span>
      </div>
      {step.subs && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {step.subs.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 rounded-lg bg-[var(--flow)] px-2 py-1 text-[12px] font-medium ring-1 ring-[var(--line)]">
              <NodeIcon icon={s.icon} size={13} color={iconColor(s.icon, agent.color)} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 rounded-2xl p-3" style={{ background: agent.soft }}>
        <p className="mb-1.5 text-[12px] font-semibold" style={{ color: agent.color }}>Último resultado</p>
        <ul className="space-y-1">
          {step.output.map((o) => (
            <li key={o} className="flex gap-2 text-[13px] leading-snug text-[#1F1A17]">
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full" style={{ background: agent.color }} />
              {o}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

export function FlowPanel() {
  const selected = useCrew((s) => s.selected)
  const select = useCrew((s) => s.select)
  const agent = selected ? AGENT_BY_ID[selected] : null

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && select(null)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [select])

  return (
    <AnimatePresence>
      {agent && (
        <motion.aside
          key="panel"
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 34 }}
          className="panel fixed inset-x-2 bottom-2 top-2 z-40 flex flex-col overflow-hidden sm:inset-4 sm:top-[76px]"
        >
          <PanelBody key={agent.id} agent={agent} onClose={() => select(null)} />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function PanelBody({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const run = useCrew((s) => s.runs[agent.id])
  const start = useCrew((s) => s.start)
  const select = useCrew((s) => s.select)
  const setFloor = useCrew((s) => s.setFloor)
  const [picked, setPicked] = useState<string | null>(null)
  const [tab, setTab] = useState<'proceso' | 'memoria'>('proceso')
  const learnedN = useCrew((s) => s.learned[agent.id]?.length ?? 0)
  const working = run.status === 'working'
  const next = agent.handoffTo ? AGENT_BY_ID[agent.handoffTo] : null
  const step = agent.steps.find((s) => s.id === picked) ?? null
  const floor = FLOORS.find((f) => f.id === agent.floor)!
  const tools = useMemo(() => {
    const keys = new Set<string>()
    agent.steps.forEach((s) => {
      keys.add(s.icon)
      s.subs?.forEach((x) => keys.add(x.icon))
    })
    return [...keys].filter((k) => ['whatsapp', 'instagram', 'tiktok', 'claude', 'sheets', 'calendar', 'gmail', 'docs', 'drive', 'elevenlabs', 'meta'].includes(k))
  }, [agent])
  const RunBtn = ({ className = '' }: { className?: string }) => (
    <motion.button whileTap={{ scale: 0.96 }} disabled={working} onClick={() => start(agent.id, 'arrancó una ejecución a mano')} className={`runbtn ${className}`} style={{ ['--c' as string]: agent.color }}>
      {working ? <span className="runspin" /> : <Play size={15} fill="currentColor" />}
      {working ? 'Trabajando' : 'Ejecutar ahora'}
    </motion.button>
  )

  return (
    <>
      {/* encabezado compacto: el alto queda para el diagrama */}
      <header className="panel-head relative overflow-hidden border-b border-[var(--line)] px-4 py-3 sm:px-5" style={{ ['--c' as string]: agent.color }}>
        <div className="flex items-center gap-3">
          <span className="size-11 shrink-0 overflow-hidden rounded-2xl ring-4 ring-[var(--card)] sm:size-12" style={{ background: agent.soft }}>
            <img src={agent.avatar} alt="" className="size-full object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h2 className="font-display text-[21px] font-bold leading-none sm:text-[24px]">{agent.name}</h2>
              <span className="text-[13.5px] text-[var(--muted)]">{agent.role}</span>
              <span className="rounded-lg px-2 py-0.5 text-[11.5px] font-semibold text-white" style={{ background: floor.tint }}>Piso {floor.n}, {floor.name}</span>
            </div>
            <p className="mt-1 truncate text-[13.5px] leading-snug max-lg:hidden">{agent.mission}</p>
          </div>
          <div className="ptabs shrink-0" role="tablist" aria-label="Qué ver">
            {(['proceso', 'memoria'] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setPicked(null) }} className="relative flex h-9 items-center gap-1.5 rounded-[11px] px-3 text-[13.5px] font-semibold">
                {tab === t && <motion.span layoutId={`ptab-${agent.id}`} className="absolute inset-0 rounded-[11px] bg-[var(--card)] shadow-[0_2px_8px_-3px_rgba(0,0,0,0.25)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className="relative">{t === 'proceso' ? 'Proceso' : 'Memoria'}</span>
                {t === 'memoria' && learnedN > 0 && <span className="relative grid size-5 place-items-center rounded-full bg-[var(--need)] text-[11px] font-bold text-[#3A2A00]">{learnedN}</span>}
              </button>
            ))}
          </div>
          <RunBtn className="max-sm:hidden" />
          <button onClick={onClose} className="ibtn" aria-label="Cerrar"><X size={18} /></button>
        </div>
        {/* en pantallas chicas los datos van acá; en grandes, en la columna de la derecha */}
        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:hidden">
          <Stat label="Esta semana" value={`${run.runs} vueltas`} />
          <Stat label="Ahorra cada vez" value={`${agent.savedMinutes} min`} className="max-sm:hidden" />
          <button
            className="stat text-left"
            onClick={() => {
              if (!next) return
              setFloor(next.floor)
              select(next.id)
            }}
            disabled={!next}
          >
            <span className="text-[11.5px] text-[var(--muted)]">Le pasa a</span>
            <span className="flex items-center gap-1.5 text-[15px] font-semibold">
              {next && <img src={next.avatar} alt="" className="size-6 rounded-full object-cover" style={{ background: next.soft }} />}
              {next?.name ?? 'Nadie'}
            </span>
          </button>
        </div>
        <RunBtn className="mt-2.5 w-full justify-center sm:hidden" />
      </header>
      {run.status === 'waiting' && (
        <div className="border-b border-[var(--line)] px-4 py-3 sm:px-5">
          <AskCard agentId={agent.id} />
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 flow-bg">
          {tab === 'proceso' ? (
            <ReactFlowProvider key="proceso">
              <Graph agent={agent} picked={picked} onPick={setPicked} />
            </ReactFlowProvider>
          ) : (
            <ReactFlowProvider key="memoria">
              <MemoryGraph agent={agent} />
            </ReactFlowProvider>
          )}
          <AnimatePresence>{tab === 'proceso' && step && <StepDetail key={step.id} agent={agent} step={step} onClose={() => setPicked(null)} />}</AnimatePresence>
        </div>
        {/* columna propia: ya no tapa el diagrama */}
        <aside className="noscroll hidden w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[var(--line)] p-4 lg:flex">
          <div>
            <p className="mb-2 text-[12px] font-semibold" style={{ color: agent.color }}>Último resultado</p>
            <ResultCard agentId={agent.id} color={agent.color} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Esta semana" value={`${run.runs} vueltas`} />
              <Stat label="Ahorra cada vez" value={`${agent.savedMinutes} min`} />
            </div>
            <button
            className="stat text-left"
            onClick={() => {
              if (!next) return
              setFloor(next.floor)
              select(next.id)
            }}
            disabled={!next}
          >
            <span className="text-[11.5px] text-[var(--muted)]">Le pasa a</span>
            <span className="flex items-center gap-1.5 text-[15px] font-semibold">
              {next && <img src={next.avatar} alt="" className="size-6 rounded-full object-cover" style={{ background: next.soft }} />}
              {next?.name ?? 'Nadie'}
            </span>
          </button>
          </div>
          <div>
            <p className="mb-1.5 text-[12px] font-semibold text-[var(--muted)]">Qué hace</p>
            <p className="text-[13.5px] leading-snug">{agent.mission}</p>
          </div>
          {tools.length > 0 && (
            <div>
              <p className="mb-1.5 text-[12px] font-semibold text-[var(--muted)]">Conectado a</p>
              <div className="flex flex-wrap gap-1.5">
                {tools.map((t) => (
                  <span key={t} className="grid size-9 place-items-center rounded-xl bg-[var(--card)] ring-1 ring-[var(--line)]">
                    <NodeIcon icon={t as FlowStep['icon']} size={17} color={iconColor(t as FlowStep['icon'], agent.color)} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      <RunBar agent={agent} run={run} />
    </>
  )
}

function Stat({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`stat ${className}`}>
      <span className="text-[11.5px] text-[var(--muted)]">{label}</span>
      <span className="text-[15px] font-semibold tabular-nums">{value}</span>
    </div>
  )
}
