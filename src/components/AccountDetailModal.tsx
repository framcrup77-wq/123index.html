import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Posting, Side } from '@/lib/accounting'
import { dateShort, money } from '@/lib/format'

interface Props {
  title: string
  subtitle: string
  normal: Side
  postings: Posting[]
  open: boolean
  onClose: () => void
}

export function AccountDetailModal({ title, subtitle, normal, postings, open, onClose }: Props) {
  const sign = normal === 'dr' ? 1 : -1
  let running = 0
  const rows = postings.map((p) => {
    running += sign * (p.dr - p.cr)
    return { ...p, running }
  })

  const totalDr = postings.reduce((s, p) => s + p.dr, 0)
  const totalCr = postings.reduce((s, p) => s + p.cr, 0)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            className="modal modal-lg"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          >
            <div className="modal-header">
              <div>
                <div className="modal-title">{title}</div>
                <div style={{ fontSize: 14, color: 'var(--gray-1)', marginTop: 2 }}>{subtitle}</div>
              </div>
              <button type="button" className="modal-close" onClick={onClose}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--gray-1)' }}>
                  ยอดคงเหลือ (ด้านปกติ: {normal === 'dr' ? 'เดบิต' : 'เครดิต'})
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  ฿ {money(running)}
                </div>
              </div>

              <div
                className="table-scroll"
                style={{ border: '1px solid var(--gray-4)', borderRadius: 12 }}
              >
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>วันที่</th>
                      <th>รายการ</th>
                      <th>หน้าบัญชี</th>
                      <th className="num">เดบิต</th>
                      <th className="num">เครดิต</th>
                      <th className="num">คงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                          ยังไม่มีรายการเคลื่อนไหว
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.key}>
                          <td className="date">{dateShort(r.date)}</td>
                          <td>
                            <div className="desc">{r.description}</div>
                            {r.memo && r.memo !== r.description && (
                              <div className="muted" style={{ fontSize: 13 }}>
                                {r.memo}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-gray">{r.ref}</span>
                          </td>
                          <td className="num">{r.dr ? `฿ ${money(r.dr)}` : '-'}</td>
                          <td className="num">{r.cr ? `฿ ${money(r.cr)}` : '-'}</td>
                          <td className="num">
                            <strong>฿ {money(r.running)}</strong>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {rows.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'right' }}>
                          รวม
                        </td>
                        <td className="num">฿ {money(totalDr)}</td>
                        <td className="num">฿ {money(totalCr)}</td>
                        <td className="num">฿ {money(running)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                ปิด
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
