import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Info, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

export type ToastKind = 'success' | 'info' | 'warning' | 'error'

interface ToastItem {
  id: string
  kind: ToastKind
  message: string
  durationMs: number
}

type Listener = (items: ToastItem[]) => void

let items: ToastItem[] = []
const listeners = new Set<Listener>()
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function emit() {
  for (const fn of listeners) fn([...items])
}

function dismiss(id: string) {
  const t = timers.get(id)
  if (t) clearTimeout(t)
  timers.delete(id)
  items = items.filter((x) => x.id !== id)
  emit()
}

function push(kind: ToastKind, message: string, durationMs = 2600) {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  items = [...items.slice(-2), { id, kind, message, durationMs }]
  emit()
  // Enter (350ms) + linear bar (durationMs) before exit slide-out
  const timer = setTimeout(() => dismiss(id), 350 + durationMs)
  timers.set(id, timer)
}

export const toast = {
  success: (message: string) => push('success', message, 2200),
  info: (message: string) => push('info', message, 2600),
  warning: (message: string) => push('warning', message, 3200),
  error: (message: string) => push('error', message, 3200),
}

const CIRCLE_BG: Record<ToastKind, string> = {
  success: '#0A84FF',
  info: '#0A84FF',
  warning: '#FF9F0A',
  error: '#FF453A',
}

/**
 * Toast notification — Motion Prompt #056
 * - Dark surface #26282c, radius 10px, 18px from right, 16px from bottom
 * - Enter: slides in 240px from right over 0.35s with easeOutCubic [0.33, 1, 0.68, 1]
 * - Progress bar: 3px tall along bottom shrinking linearly from 100% → 0%
 * - Exit: slides out 240px to right over 0.35s with easeInOutCubic [0.65, 0, 0.35, 1]
 */
export function ToastViewport() {
  const [list, setList] = useState<ToastItem[]>([])

  useEffect(() => {
    listeners.add(setList)
    return () => {
      listeners.delete(setList)
    }
  }, [])

  return (
    <div className="mp-toast-viewport no-print" aria-live="polite" aria-atomic="true">
      <AnimatePresence initial={false}>
        {list.map((t) => (
          <motion.div
            key={t.id}
            layout
            className="mp-toast"
            initial={{ x: 240, opacity: 0 }}
            animate={{
              x: 0,
              opacity: 1,
              transition: { duration: 0.35, ease: [0.33, 1, 0.68, 1] },
            }}
            exit={{
              x: 240,
              opacity: 0,
              transition: { duration: 0.35, ease: [0.65, 0, 0.35, 1] },
            }}
            onClick={() => dismiss(t.id)}
          >
            <span className="mp-toast-circle" style={{ background: CIRCLE_BG[t.kind] }}>
              {t.kind === 'success' && <Check size={14} strokeWidth={3} color="#FFFFFF" />}
              {t.kind === 'info' && <Info size={14} strokeWidth={2.5} color="#FFFFFF" />}
              {t.kind === 'warning' && <AlertTriangle size={13} strokeWidth={2.5} color="#FFFFFF" />}
              {t.kind === 'error' && <X size={14} strokeWidth={3} color="#FFFFFF" />}
            </span>
            <span className="mp-toast-text">{t.message}</span>
            <div className="mp-toast-bar-track">
              <motion.div
                className="mp-toast-bar"
                style={{ background: CIRCLE_BG[t.kind] }}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{
                  delay: 0.35,
                  duration: t.durationMs / 1000,
                  ease: 'linear',
                }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
