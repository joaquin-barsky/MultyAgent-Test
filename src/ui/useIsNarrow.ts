import { useEffect, useState } from 'react'

export function useIsNarrow(px = 640) {
  const q = `(max-width: ${px - 1}px)`
  const [narrow, setNarrow] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setNarrow(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [q])
  return narrow
}
