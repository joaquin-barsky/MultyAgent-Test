import { memo, useEffect, useMemo } from 'react'
import { Background, BackgroundVariant, BaseEdge, Handle, Position, ReactFlow, getBezierPath, getSmoothStepPath, useReactFlow, useStore, type Edge, type EdgeProps, type Node, type NodeProps } from '@xyflow/react'
import { BookOpen, Brain, History, Lightbulb, type LucideIcon } from 'lucide-react'
import { AGENTS, AGENT_BY_ID, type Agent } from '../data/agents'
import { ASKS } from '../data/asks'
import { useCrew, type FeedItem, type Learned } from '../sim/store'
import { useIsNarrow } from '../ui/useIsNarrow'

// "Cerebro" del agente: lo que sabe (cómo está armado), lo que aprendió (de vos y de su trabajo) y lo que recuerda (lo último que hizo).

type Side = 'left' | 'right'
type Kind = 'sabe' | 'aprendio' | 'recuerda'
type CoreData = { agent: Agent; total: number }
type HubData = { agent: Agent; kind: Kind; side: Side; n: number }
type LeafData = { agent: Agent; side: Side; title: string; text: string; mine?: boolean; fresh?: boolean }

const HUB: Record<Kind, { title: string; icon: LucideIcon; hint: string }> = {
  sabe: { title: 'Lo que sabe', icon: BookOpen, hint: 'Cómo está armado' },
  aprendio: { title: 'Lo que aprendió', icon: Lightbulb, hint: 'De vos y de su trabajo' },
  recuerda: { title: 'Lo que recuerda', icon: History, hint: 'Lo último que hizo' },
}

const FIT = { padding: { top: '6%', right: '5%', left: '5%', bottom: '64px' }, duration: 400 } as const
const hhmm = (t: number) => new Date(t).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' })

const CoreNode = memo(function CoreNode({ data }: NodeProps<Node<CoreData>>) {
  const { agent, total } = data
  return (
    <div className="mcore" style={{ ['--c' as string]: agent.color, ['--soft' as string]: agent.soft }}>
      <Handle type="source" position={Position.Bottom} className="fhandle" />
      <span className="mcore-face">
        <img src={agent.avatar} alt="" className="size-full object-cover" />
        <span className="mcore-brain"><Brain size={15} strokeWidth={2.4} /></span>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[16px] font-bold">Memoria de {agent.name}</span>
        <span className="text-[12px] text-[var(--muted)]">{total} recuerdos guardados</span>
      </span>
    </div>
  )
})

const HubNode = memo(function HubNode({ data }: NodeProps<Node<HubData>>) {
  const h = HUB[data.kind]
  const Icon = h.icon
  return (
    <div className="mhub" style={{ ['--c' as string]: data.agent.color, ['--soft' as string]: data.agent.soft }}>
      <Handle type="target" position={Position.Top} className="fhandle" />
      <span className="mhub-ic"><Icon size={18} strokeWidth={2.3} /></span>
      <span className="flex flex-col leading-tight">
        <span className="text-[14px] font-bold">{h.title}</span>
        <span className="text-[11.5px] text-[var(--muted)]">{h.hint}</span>
      </span>
      <span className="mhub-n">{data.n}</span>
      <Handle type="source" position={Position.Bottom} className="fhandle" style={{ left: 30 }} />
    </div>
  )
})

const LeafNode = memo(function LeafNode({ data }: NodeProps<Node<LeafData>>) {
  return (
    <div className={`mleaf ${data.mine ? 'mine' : ''} ${data.fresh ? 'fresh' : ''}`} style={{ ['--c' as string]: data.agent.color, ['--soft' as string]: data.agent.soft }}>
      <Handle type="target" position={Position.Left} className="fhandle" />
      <span className="text-[11.5px] font-semibold" style={{ color: data.mine ? 'var(--need-ink)' : data.agent.color }}>{data.title}</span>
      <span className="mleaf-text">{data.text}</span>
    </div>
  )
})

function MemEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<Edge<{ color: string; strong?: boolean }>>) {
  // del centro a cada rama, curva; de la rama a cada recuerdo, en escalera como un índice
  const [path] = data?.strong
    ? getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
    : getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 12, offset: 0 })
  return <BaseEdge id={id} path={path} style={{ stroke: data?.color, strokeWidth: data?.strong ? 2.6 : 1.8, opacity: data?.strong ? 0.85 : 0.5 }} />
}

const nodeTypes = { core: CoreNode, hub: HubNode, leaf: LeafNode }
const edgeTypes = { mem: MemEdge }

type Leaf = Omit<LeafData, 'agent' | 'side'>

/** arma las tres ramas del cerebro con los datos del agente */
function branches(agent: Agent, learned: Learned[], feed: FeedItem[]): Record<Kind, Leaf[]> {
  const trig = agent.steps.find((s) => s.kind === 'trigger')?.subtitle.match(/^De (.+)$/)?.[1]
  const linked = AGENTS.filter((a) => a.handoffTo === agent.id).map((a) => a.name)
  const from = linked.length ? linked : trig && AGENTS.some((a) => a.name === trig) ? [trig] : []
  const next = agent.handoffTo ? AGENT_BY_ID[agent.handoffTo]?.name : null
  const models = [...new Set(agent.steps.flatMap((s) => s.subs ?? []).filter((x) => x.kind === 'model').map((x) => x.label))]
  const tools = [...new Set([...agent.steps.filter((s) => s.kind === 'action').map((s) => s.subtitle), ...agent.steps.flatMap((s) => s.subs ?? []).filter((x) => x.kind === 'tool').map((x) => x.label)])]
  const sabe: Leaf[] = [
    { title: 'Su trabajo', text: agent.mission },
    { title: 'Usa', text: tools.slice(0, 4).join(', ') },
    { title: 'Trabaja con', text: [from.length ? `Recibe de ${from.join(' y ')}` : 'Arranca solo', next ? `le pasa a ${next}` : 'no le pasa a nadie'].join(', ') + '.' },
  ]
  if (models.length) sabe.splice(1, 0, { title: 'Piensa con', text: models.join(' y ') + (agent.steps.some((s) => s.subs?.some((x) => x.kind === 'memory')) ? ', con la memoria del equipo' : '') })

  const mine: Leaf[] = learned.slice(0, 2).map((l, i) => ({ title: `Le enseñaste, ${hhmm(l.at)}`, text: `“${l.a}”${l.stop ? ', y frenó la tarea' : ''}`, mine: true, fresh: i === 0 && Date.now() - l.at < 60000 }))
  const fromWork: Leaf[] = agent.steps.filter((s) => s.kind === 'ai' || s.kind === 'if').map((s) => ({ title: s.title, text: s.output.join('. ') }))
  const aprendio = [...mine, ...fromWork].slice(0, 4)
  if (!mine.length && ASKS[agent.id]) aprendio.splice(Math.min(aprendio.length, 3), 1, { title: 'Te va a preguntar', text: 'Cuando frene a consultarte, lo que le contestes queda guardado acá.', mine: true })

  const live: Leaf[] = feed.filter((f) => f.from === agent.id).slice(0, 2).map((f) => ({ title: hhmm(f.at), text: `${f.text[0].toUpperCase()}${f.text.slice(1)}.` }))
  const work: Leaf[] = agent.steps.filter((s) => s.kind === 'action' || s.kind === 'trigger').map((s) => ({ title: s.title, text: s.output[0] }))
  const recuerda = [...live, ...work].slice(0, 4)
  return { sabe, aprendio, recuerda }
}

export const MemoryGraph = memo(function MemoryGraph({ agent }: { agent: Agent }) {
  const learned = useCrew((s) => s.learned[agent.id])
  const feedKey = useCrew((s) => s.feed.filter((f) => f.from === agent.id).slice(0, 2).map((f) => f.id).join(','))
  const narrow = useIsNarrow()
  const { fitView } = useReactFlow()

  const { nodes, edges } = useMemo(() => {
    const feed = useCrew.getState().feed
    const b = branches(agent, learned ?? [], feed)
    const nodes: Node[] = []
    const edges: Edge[] = []
    // tres columnas debajo del centro; en celular, una debajo de la otra
    const order: Kind[] = ['sabe', 'aprendio', 'recuerda']
    const total = b.sabe.length + b.aprendio.length + b.recuerda.length
    const COLW = 330
    nodes.push({ id: 'core', type: 'core', position: { x: -120, y: 0 }, data: { agent, total }, draggable: false })
    let y0 = 150
    order.forEach((k, ci) => {
      const leaves = b[k]
      const x = narrow ? -135 : (ci - 1) * COLW - 135
      const top = narrow ? y0 : 150
      nodes.push({ id: k, type: 'hub', position: { x, y: top }, data: { agent, kind: k, side: 'right', n: leaves.length }, draggable: false })
      if (!narrow || ci === 0) edges.push({ id: `core-${k}`, source: 'core', target: k, type: 'mem', data: { color: agent.color, strong: true } })
      leaves.forEach((l, i) => {
        const id = `${k}${i}`
        nodes.push({ id, type: 'leaf', position: { x: x + 54, y: top + 92 + i * 80 }, data: { agent, side: 'right', ...l }, draggable: false })
        edges.push({ id: `${k}-${id}`, source: k, target: id, type: 'mem', data: { color: agent.color } })
      })
      y0 = top + 92 + leaves.length * 80 + 50
    })
    return { nodes, edges }
  }, [agent, learned, feedKey, narrow])

  useEffect(() => {
    const t = setTimeout(() => fitView(FIT), 120)
    return () => clearTimeout(t)
  }, [agent.id, narrow, fitView])
  const paneW = useStore((s) => s.width)
  const paneH = useStore((s) => s.height)
  useEffect(() => {
    if (!paneW || !paneH) return
    const t = setTimeout(() => fitView({ ...FIT, duration: 250 }), 160)
    return () => clearTimeout(t)
  }, [paneW, paneH, fitView])

  return (
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={FIT} minZoom={0.2} maxZoom={1.6} proOptions={{ hideAttribution: true }} nodesConnectable={false}>
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.6} color="var(--dots)" />
    </ReactFlow>
  )
})
