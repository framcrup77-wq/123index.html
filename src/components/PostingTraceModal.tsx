import { ArrowRight, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { BOOKS, traceEntry, type Entry } from '@/lib/accounting'
import { dateShort, money } from '@/lib/format'
import { useBooks } from '@/store/useBooks'

interface Props {
  entry: Entry | null
  onClose: () => void
}

export function PostingTraceModal({ entry, onClose }: Props) {
  const accounts = useBooks((s) => s.accounts)
  const parties = useBooks((s) => s.parties)

  const steps = entry ? traceEntry(entry, accounts, parties) : []
  const meta = entry ? BOOKS[entry.book] : null

  return (
    <AnimatePresence>
      {entry && meta && (
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
                <div className="modal-title">การผ่านรายการอัตโนมัติ</div>
                <div style={{ fontSize: 14, color: 'var(--gray-1)', marginTop: 2 }}>
                  {meta.name} · {dateShort(entry.date)} · {entry.docNo || '-'}
                </div>
              </div>
              <button type="button" className="modal-close" onClick={onClose}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{entry.memo}</div>
                {entry.reason && (
                  <div style={{ fontSize: 14, color: 'var(--gray-2)', marginTop: 4 }}>
                    <strong>เหตุผลการเลือกสมุด:</strong> {entry.reason}
                  </div>
                )}
              </div>

              <div
                className="table-scroll"
                style={{ border: '1px solid var(--gray-4)', borderRadius: 12 }}
              >
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>บัญชีแยกประเภททั่วไป</th>
                      <th>ด้าน</th>
                      <th className="num">จำนวนเงิน</th>
                      <th>วิธีผ่านรายการ</th>
                      <th>บัญชีย่อย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {steps.map((s, i) => (
                      <tr key={i}>
                        <td>
                          <span className="coa-item-code" style={{ marginRight: 6 }}>
                            {s.account}
                          </span>
                          <strong>{s.accountName}</strong>
                        </td>
                        <td>
                          <span className={`badge ${s.side === 'dr' ? 'badge-blue' : 'badge-purple'}`}>
                            {s.side === 'dr' ? 'เดบิต' : 'เครดิต'}
                          </span>
                        </td>
                        <td className="num">฿ {money(s.amount)}</td>
                        <td>
                          <span className={`badge ${s.mode === 'total' ? 'badge-gray' : 'badge-green'}`}>
                            {s.mode === 'total' ? 'รวมยอดสิ้นเดือน' : 'ผ่านรายตัว'}
                          </span>
                        </td>
                        <td>
                          {s.party ? (
                            <span
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14 }}
                            >
                              <ArrowRight size={13} /> {s.party.name}
                            </span>
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                ปิดหน้าต่าง
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
