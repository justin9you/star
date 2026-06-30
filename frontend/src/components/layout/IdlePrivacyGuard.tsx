import { useEffect, useRef, useState } from 'react'
import { Modal } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { usePrivacyStore } from '../../stores/privacyStore'

// 无操作多久后提示（5 分钟）
const IDLE_MS = 5 * 60 * 1000
// 弹框自动开启隐私模式的倒计时（秒）
const COUNTDOWN_SECONDS = 10

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const

/**
 * 空闲隐私守卫：
 * 当处于「复盘模式」（隐私关闭、敏感金额可见）且用户长时间无操作时，
 * 弹框询问是否开启隐私模式；10 秒倒计时结束或点击「是」自动开启，点击「否」则保持可见。
 */
export default function IdlePrivacyGuard() {
  const { isPrivacyMode, setPrivacyMode } = usePrivacyStore()
  const [open, setOpen] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const idleTimer = useRef<number | undefined>(undefined)

  // 监听用户操作，重置空闲计时；仅在「复盘模式」且弹框未弹出时计时
  useEffect(() => {
    const resetIdle = () => {
      window.clearTimeout(idleTimer.current)
      if (isPrivacyMode || open) return
      idleTimer.current = window.setTimeout(() => setOpen(true), IDLE_MS)
    }

    const onActivity = () => {
      if (!open) resetIdle()
    }

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    resetIdle()

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
      window.clearTimeout(idleTimer.current)
    }
  }, [isPrivacyMode, open])

  // 弹框倒计时
  useEffect(() => {
    if (!open) return
    setCountdown(COUNTDOWN_SECONDS)
    const id = window.setInterval(() => {
      setCountdown((c) => c - 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [open])

  // 倒计时结束 → 自动开启隐私模式
  useEffect(() => {
    if (open && countdown <= 0) {
      enablePrivacy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, countdown])

  const enablePrivacy = () => {
    setOpen(false)
    setPrivacyMode(true)
  }

  const decline = () => {
    // 保持复盘模式（金额可见），关闭弹框后会重新开始空闲计时
    setOpen(false)
  }

  return (
    <Modal
      open={open}
      title={
        <span>
          <LockOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          检测到你长时间没操作
        </span>
      }
      onOk={enablePrivacy}
      onCancel={decline}
      okText={`是，开启隐私（${countdown}s）`}
      cancelText="否，继续显示"
      closable={false}
      maskClosable={false}
      keyboard={false}
      centered
      okButtonProps={{ icon: <LockOutlined /> }}
    >
      <p style={{ margin: 0 }}>
        当前为复盘模式，进货价、毛利、成本等敏感信息正在显示。
      </p>
      <p style={{ marginTop: 8, marginBottom: 0 }}>
        是否开启隐私模式以隐藏这些信息？将在 <b style={{ color: '#1677ff' }}>{countdown}</b> 秒后自动开启。
      </p>
    </Modal>
  )
}
