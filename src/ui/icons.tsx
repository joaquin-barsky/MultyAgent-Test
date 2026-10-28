import {
  siClaude, siElevenlabs, siGmail, siGooglecalendar, siGoogledocs, siGoogledrive, siGooglesheets,
  siInstagram, siMeta, siTiktok, siWhatsapp, siYoutube, type SimpleIcon,
} from 'simple-icons'
import {
  AlarmClock, Building2, Calculator, Captions, ChartLine, Check, Clapperboard, Filter, Globe, Image, Inbox,
  Layers, List, Merge, Mic, Music2, Route, Search, Send, BellRing, UserRound, Split, BrainCircuit, Database, KeyRound,
  FileText, PenLine, Wallet, Repeat, Phone, MapPin, ShieldCheck, type LucideIcon,
} from 'lucide-react'
import type { IconKey } from '../data/agents'

const BRANDS: Partial<Record<IconKey, SimpleIcon>> = {
  whatsapp: siWhatsapp,
  instagram: siInstagram,
  tiktok: siTiktok,
  youtube: siYoutube,
  claude: siClaude,
  sheets: siGooglesheets,
  calendar: siGooglecalendar,
  gmail: siGmail,
  docs: siGoogledocs,
  drive: siGoogledrive,
  elevenlabs: siElevenlabs,
  meta: siMeta,
}

const LUCIDE: Partial<Record<IconKey, LucideIcon>> = {
  clock: AlarmClock, globe: Globe, building: Building2, mic: Mic, film: Clapperboard, image: Image,
  captions: Captions, music: Music2, search: Search, merge: Merge, filter: Filter, bell: BellRing,
  calc: Calculator, chart: ChartLine, user: UserRound, send: Send, list: List, layers: Layers,
  inbox: Inbox, route: Route, check: Check, split: Split, brain: BrainCircuit, database: Database, key: KeyRound,
  file: FileText, pen: PenLine, wallet: Wallet, repeat: Repeat, phone: Phone, map: MapPin, shield: ShieldCheck,
}

/** color de marca, o el del agente para íconos genéricos */
export function iconColor(key: IconKey, fallback: string) {
  const b = BRANDS[key]
  if (!b) return fallback
  if (key === 'tiktok' || key === 'elevenlabs') return '#111111'
  return `#${b.hex}`
}

export function NodeIcon({ icon, size = 28, color }: { icon: IconKey; size?: number; color: string }) {
  const b = BRANDS[icon]
  if (b) {
    return (
      <svg role="img" viewBox="0 0 24 24" width={size} height={size} fill={iconColor(icon, color)} aria-label={b.title}>
        <path d={b.path} />
      </svg>
    )
  }
  const L = LUCIDE[icon] ?? Check
  return <L size={size} color={color} strokeWidth={2} />
}
