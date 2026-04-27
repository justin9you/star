import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PrivacyState {
  // 隐私模式开启时，隐藏敏感信息（进货价、毛利、成本等）
  isPrivacyMode: boolean
  togglePrivacyMode: () => void
  setPrivacyMode: (value: boolean) => void
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      isPrivacyMode: true, // 默认开启隐私模式，保护敏感信息
      togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),
      setPrivacyMode: (value) => set({ isPrivacyMode: value }),
    }),
    {
      name: 'privacy-mode-storage',
    }
  )
)

// 工具函数：隐藏金额显示
export function hideAmount(value: number | string | undefined, showStar = true): string {
  if (showStar) {
    return '***'
  }
  return value !== undefined ? String(value) : '-'
}

// 工具函数：格式化金额（根据隐私模式）
export function formatAmount(value: number | undefined, isPrivacyMode: boolean): string {
  if (isPrivacyMode) {
    return '***'
  }
  if (value === undefined || value === null) {
    return '-'
  }
  return `¥${value.toFixed(2)}`
}