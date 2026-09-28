import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import 'echarts-gl'
import type { EChartsOption } from 'echarts'

interface ChartProps {
  option: EChartsOption
  className?: string
}

export function Chart({ option, className = '' }: ChartProps) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!elementRef.current) return

    const chart = echarts.init(elementRef.current, undefined, {
      renderer: 'canvas',
    })
    chart.setOption(option, true)

    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(elementRef.current)

    return () => {
      observer.disconnect()
      chart.dispose()
    }
  }, [option])

  return <div ref={elementRef} className={`chart ${className}`} />
}
