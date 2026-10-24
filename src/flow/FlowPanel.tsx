import { memo, useEffect, useMemo, useState } from 'react'
import {
  Background, BackgroundVariant, BaseEdge, EdgeLabelRenderer, Handle, Position, ReactFlow, ReactFlowProvider,
  getBezierPath, useReactFlow, type Edge, type EdgeProps, type Node, type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Clock3, Minus, Play, Plus, Scan, X } from 'lucide-react'
import { AGENT_BY_ID, type Agent, type FlowStep } from '../data/agents'
import { stepStatus, useCrew } from '../sim/store'
import { NodeIcon } from '../ui/icons'
import { useIsNarrow } from '../ui/useIsNarrow'

type St = 'done' | 'running' | 'pending'
type StepData = { step: FlowStep; agent: Agent; status: St; vertical: boolean; picked: boolean }
type EdgeData = { color: string; status: St; items: number; vertical: boolean }

const StepNode = memo(function StepNode({ data }: NodeProps<Node<StepData>>) {
  const { step, agent, status, vertical, picked } = data
  const tgt = vertical ? Position.Top : Position.Left
  const src = vertical ? Position.Bottom : Position.Right
  const wide = step.kind === 'ai'
  const handoff = step.kind === 'handoff' ? AGENT_BY_ID[agent.handoffTo ?? ''] : null
  return (
    <div className={`fnode ${status} ${picked ? 'picked' : ''} ${wide ? 'wide' : ''}`} style={{ ['--c' as string]: agent.color, ['--soft' as string]: agent.soft }}>
      {step.kind !== 'trigger' && <Handle type="target" position={tgt} className="fhandle" />}
      <div className={`fbox ${step.kind} ${wide ? 'wide' : ''}`}>
        {status === 'running' && <span className="fspin" />}
        <div className="fbox-in">
          {handoff ? (
            <span className="grid size-12 place-items-center overflow-hidden rounded-full" style={{ background: handoff.soft }}>
              <img src={handoff.avatar} alt="" className="size-full object-cover" />
            </span>
          ) : (
            <NodeIcon icon={step.icon} size={wide ? 30 : 34} color={agent.color} />
          )}
          {wide && (
            <span className="flex min-w-0 flex-col text-left">
              <span className="text-[14px] font-semibold leading-tight">{step.title}</span>
              <span className="text-[12px] text-[var(--muted)]">{step.subtitle}</span>
            </span>
          )}
        </div>
        {status === 'done' && (
          <span className="fbadge">
            <Check size={12} strokeWidth={3} />
          </span>
        )}
      </div>
      {!wide && (
        <div className="flabel">
          <span className="text-[13px] font-semibold leading-tight">{step.title}</span>
          <span className="text-[11.5px] text-[var(--muted)]">{step.subtitle}</span>
        </div>
      )}
      {step.kind !== 'handoff' && <Handle type="source" position={src} className="fhandle" />}
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
          strokeWidth: on ? 2.4 : 2,
          strokeDasharray: d.status === 'running' ? '6 6' : undefined,
          animation: d.status === 'running' ? 'dash 0.6s linear infinite' : undefined,
        }}
      />
      {d.status === 'running' && (
        <path d={path} pathLength={100} fill="none" stroke={d.color} strokeWidth={10} strokeLinecap="round" className="fdot" />
      )}
      {d.status === 'done' && (
        <EdgeLabelRenderer>
          <div className="fitems" style={{ transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`, ['--c' as string]: d.color }}>
            {d.items} {d.items === 1 ? 'ítem' : 'ítems'}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const nodeTypes = { step: StepNode }
const edgeTypes = { flow: FlowEdge }

function Graph({ agent, picked, onPick }: { agent: Agent; picked: string | null; onPick: (id: string | null) => void }) {
  const run = useCrew((s) => s.runs[agent.id])
  const vertical = useIsNarrow()
  const { fitView } = useReactFlow()

  const nodes = useMemo<Node<StepData>[]>(
    () =>
      agent.steps.map((s) => {
        const wide = s.kind === 'ai'
        const x = vertical ? s.lane * 150 - (wide ? 52 : 0) : s.col * 240 - (wide ? 50 : 0)
        const y = vertical ? s.col * 190 : s.lane * 165
        return {
          id: s.id,
          type: 'step',
          position: { x, y },
          data: { step: s, agent, status: stepStatus(agent, run, s.col), vertical, picked: picked === s.id },
          draggable: false,
        }
      }),
    [agent, run, vertical, picked],
  )

  const edges = useMemo<Edge<EdgeData>[]>(() => {
    const byId = Object.fromEntries(agent.steps.map((s) => [s.id, s]))
    return agent.edges.map((e) => {
      const from = byId[e.from]
      const to = byId[e.to]
      const sf = stepStatus(agent, run, from.col)
      const stT = stepStatus(agent, run, to.col)
      const status: St = sf === 'done' && stT === 'running' ? 'running' : sf === 'done' ? 'done' : 'pending'
      return { id: `${e.from}-${e.to}`, source: e.from, target: e.to, type: 'flow', data: { color: agent.color, status, items: from.items, vertical } }
    })
  }, [agent, run, vertical])

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: vertical ? 0.12 : 0.18, duration: 400 }), 60)
    return () => clearTimeout(t)
  }, [vertical, agent.id, fitView])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.18 }}
      minZoom={0.3}
      maxZoom={1.6}
      proOptions={{ hideAttribution: true }}
      nodesConnectable={false}
      onNodeClick={(_, n) => onPick(n.id === picked ? null : n.id)}
      onPaneClick={() => onPick(null)}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.6} color="var(--dots)" />
      <ZoomButtons />
    </ReactFlow>
  )
}

function ZoomButtons() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  return (
    <div className="absolute bottom-4 left-4 z-10 flex gap-1.5">
      <button className="zbtn" onClick={() => fitView({ padding: 0.18, duration: 300 })} aria-label="Ver todo"><Scan size={17} /></button>
      <button className="zbtn" onClick={() => zoomIn({ duration: 200 })} aria-label="Acercar"><Plus size={17} /></button>
      <button className="zbtn" onClick={() => zoomOut({ duration: 200 })} aria-label="Alejar"><Minus size={17} /></button>
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
      className="detail absolute bottom-4 right-4 left-4 z-20 sm:left-auto sm:w-[340px]"
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
      <div className="mt-3 rounded-2xl bg-[var(--soft)] p-3" style={{ ['--soft' as string]: agent.soft }}>
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
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 34 }}
          className="panel fixed inset-x-2 bottom-2 top-2 z-40 flex flex-col overflow-hidden sm:bottom-3 sm:top-[76px] sm:left-auto sm:right-3 sm:w-[min(1040px,calc(100vw-24rem))] max-sm:top-14"
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
  const [picked, setPicked] = useState<string | null>(null)
  const working = run.status === 'working'
  const next = agent.handoffTo ? AGENT_BY_ID[agent.handoffTo] : null
  const step = agent.steps.find((s) => s.id === picked) ?? null

  return (
    <>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[var(--line)] px-4 py-3.5 sm:px-6 sm:py-4">
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl sm:size-14" style={{ background: agent.soft }}>
          <img src={agent.avatar} alt="" className="size-full object-cover" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[22px] font-bold leading-none sm:text-[26px]">{agent.name}</h2>
          <p className="mt-1 text-[13.5px] text-[var(--muted)]">{agent.role}</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={working}
            onClick={() => start(agent.id, 'arrancó una ejecución a mano')}
            className="runbtn max-sm:hidden"
            style={{ ['--c' as string]: agent.color }}
          >
            {working ? <span className="runspin" /> : <Play size={15} fill="currentColor" />}
            {working ? 'Trabajando' : 'Ejecutar ahora'}
          </motion.button>
          <button onClick={onClose} className="ibtn" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <p className="w-full text-[14px] leading-snug sm:text-[14.5px]">{agent.mission}</p>
        <div className="grid w-full grid-cols-3 gap-2">
          <Stat label="Esta semana" value={`${run.runs} veces`} />
          <Stat label="Ahorra cada vez" value={`${agent.savedMinutes} min`} />
          <button className="stat text-left" onClick={() => next && select(next.id)} disabled={!next}>
            <span className="text-[11.5px] text-[var(--muted)]">Le pasa a</span>
            <span className="flex items-center gap-1.5 text-[15px] font-semibold">
              {next && <img src={next.avatar} alt="" className="size-6 rounded-full object-cover" style={{ background: next.soft }} />}
              {next?.name ?? 'Nadie'}
            </span>
          </button>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={working}
          onClick={() => start(agent.id, 'arrancó una ejecución a mano')}
          className="runbtn w-full justify-center sm:hidden"
          style={{ ['--c' as string]: agent.color }}
        >
          {working ? <span className="runspin" /> : <Play size={15} fill="currentColor" />}
          {working ? 'Trabajando' : 'Ejecutar ahora'}
        </motion.button>
      </header>
      <div className="relative flex-1 flow-bg">
        <ReactFlowProvider>
          <Graph agent={agent} picked={picked} onPick={setPicked} />
        </ReactFlowProvider>
        <AnimatePresence>{step && <StepDetail key={step.id} agent={agent} step={step} onClose={() => setPicked(null)} />}</AnimatePresence>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="text-[11.5px] text-[var(--muted)]">{label}</span>
      <span className="text-[15px] font-semibold tabular-nums">{value}</span>
    </div>
  )
}
