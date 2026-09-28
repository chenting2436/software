import { Mountain, RadioTower } from 'lucide-react'

interface BrandProps {
  compact?: boolean
  inverse?: boolean
}

export function Brand({ compact = false, inverse = false }: BrandProps) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''} ${inverse ? 'brand--inverse' : ''}`}>
      <div className="brand__mark" aria-hidden="true">
        <Mountain size={compact ? 20 : 25} strokeWidth={2.4} />
        <RadioTower className="brand__signal" size={compact ? 9 : 11} strokeWidth={2.5} />
      </div>
      <div className="brand__text">
        <strong>矿大</strong>
        {!compact && <span>土行孙 V2</span>}
      </div>
    </div>
  )
}
