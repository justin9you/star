import type { ReactNode } from 'react'
import { useCountUp } from '../hooks/useCountUp'
import styles from './KpiCard.module.css'

export type KpiColor = 'green' | 'blue' | 'cyan' | 'orange' | 'red' | 'purple'

const GRAD: Record<KpiColor, string> = {
  green: styles.gradGreen,
  blue: styles.gradBlue,
  cyan: styles.gradCyan,
  orange: styles.gradOrange,
  red: styles.gradRed,
  purple: styles.gradPurple,
}

const fmtMoney = (n: number) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtInt = (n: number) => Math.round(n).toLocaleString('zh-CN')

interface KpiCardProps {
  label: string
  value: number
  color: KpiColor
  icon: ReactNode
  money?: boolean
  masked?: boolean
  delay?: number
  onClick?: () => void
}

export function KpiCard({ label, value, color, icon, money, masked, delay = 0, onClick }: KpiCardProps) {
  const animated = useCountUp(masked ? 0 : value)
  const display = masked ? '***' : money ? fmtMoney(animated) : fmtInt(animated)
  return (
    <div
      className={`${styles.kpiCard} ${GRAD[color]} ${styles['d' + delay]} ${onClick ? styles.kpiClickable : ''}`}
      onClick={onClick}
    >
      <span className={styles.kpiIcon}>{icon}</span>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>
        {money && !masked && <span className={styles.kpiUnit}>¥</span>}
        {display}
      </div>
    </div>
  )
}
