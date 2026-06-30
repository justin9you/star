import type { ReactNode } from 'react'

/** 步骤底部固定操作栏：滚动时贴底常驻，右对齐放置上一步/下一步等按钮 */
export function StepFooter({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 24,
        padding: '14px 0 2px',
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        zIndex: 5,
      }}
    >
      {children}
    </div>
  )
}
