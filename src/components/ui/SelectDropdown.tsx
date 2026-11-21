import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

export interface DropdownOption {
  value: string
  label: string
}

interface SelectDropdownProps {
  value: string
  options: DropdownOption[]
  placeholder?: string
  onChange: (value: string) => void
  className?: string
  ariaLabel?: string
}

/**
 * Dropdown (select) — Motion Prompt #053
 * - Open: 0→1 over 0.25s with easeOutCubic [0.33, 1, 0.68, 1], drop 6px, shadow blur 18px
 * - Chevron rotates 180°, field border becomes 2px blue when open
 * - Close: 0.15s with easeInOutCubic [0.65, 0, 0.35, 1]
 * - Text cross-fades cleanly without overlap
 */
export function SelectDropdown({
  value,
  options,
  placeholder = '-- เลือกรายการ --',
  onChange,
  className = '',
  ariaLabel,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHoveredIdx((i) => Math.min(options.length - 1, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHoveredIdx((i) => Math.max(0, i - 1))
      } else if (e.key === 'Enter' && hoveredIdx >= 0 && options[hoveredIdx]) {
        e.preventDefault()
        onChange(options[hoveredIdx].value)
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, hoveredIdx, options, onChange])

  return (
    <div ref={rootRef} className={`mp-dropdown ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`mp-dropdown-trigger ${open ? 'open' : ''}`}
        onClick={() => {
          setOpen((prev) => {
            const next = !prev
            if (next) {
              const idx = options.findIndex((o) => o.value === value)
              setHoveredIdx(idx)
            }
            return next
          })
        }}
      >
        <div className="mp-dropdown-value-wrap">
          <AnimatePresence mode="wait" initial={false}>
            {selected ? (
              <motion.span
                key={`val-${selected.value}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="mp-dropdown-value"
              >
                {selected.label}
              </motion.span>
            ) : (
              <motion.span
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="mp-dropdown-placeholder"
              >
                {placeholder}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <motion.span
          className="mp-dropdown-chevron"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            className="mp-dropdown-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.25, ease: [0.33, 1, 0.68, 1] },
            }}
            exit={{
              opacity: 0,
              y: -6,
              transition: { duration: 0.15, ease: [0.65, 0, 0.35, 1] },
            }}
          >
            {options.length === 0 ? (
              <div className="mp-dropdown-empty">ไม่มีตัวเลือก</div>
            ) : (
              options.map((opt, idx) => {
                const isSelected = opt.value === value
                const isHighlighted = hoveredIdx === idx
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`mp-dropdown-option ${isHighlighted ? 'highlighted' : ''} ${
                      isSelected ? 'selected' : ''
                    }`}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                  >
                    <span className="mp-dropdown-option-label">{opt.label}</span>
                    {isSelected && <Check size={14} className="mp-dropdown-check" />}
                  </button>
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
