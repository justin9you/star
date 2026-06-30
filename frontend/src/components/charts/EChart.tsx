import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface EChartProps {
  option: echarts.EChartsCoreOption
  height?: number | string
  /** 依赖变化时重新设置 option（默认根据 option 引用变化） */
  className?: string
}

/**
 * 轻量 ECharts 封装：用 ref 直接驱动实例，避免引入额外的 react 包装库
 * （echarts 本身无 react peer 依赖，兼容 React 19）。
 */
export default function EChart({ option, height = 300, className }: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = echarts.init(containerRef.current)
    chartRef.current = chart

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, true)
  }, [option])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height }}
    />
  )
}
