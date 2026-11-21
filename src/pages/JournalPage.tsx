import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRightLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/ToastProvider'
import {
  BOOKS,
  BOOK_ORDER,
  accountName,
  sortEntries,
  totals,
  type Book,
  type Entry,
} from '@/lib/accounting'
import { dateShort, money } from '@/lib/format'
import { useBooks } from '@/store/useBooks'
import { EntryModal } from '@/components/EntryModal'
import { PostingTraceModal } from '@/components/PostingTraceModal'

const VALID_BOOKS: Book[] = ['purchase', 'sales', 'receipt', 'payment', 'general']

export function JournalPage() {
  const navigate = useNavigate()
  const { book: param } = useParams<{ book: string }>()
  const book: Book = VALID_BOOKS.includes(param as Book) ? (param as Book) : 'purchase'

  const entries = useBooks((s) => s.entries)
  const accounts = useBooks((s) => s.accounts)
  const parties = useBooks((s) => s.parties)
  const deleteEntry = useBooks((s) => s.deleteEntry)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [tracing, setTracing] = useState<Entry | null>(null)

  const meta = BOOKS[book]
  const list = sortEntries(entries.filter((e) => e.book === book))
  const partyName = (id?: string) => parties.find((p) => p.id === id)?.name ?? '-'

  const handleDelete = (e: Entry) => {
    if (!confirm(`ต้องการลบรายการ "${e.memo}" หรือไม่?`)) return
    deleteEntry(e.id)
    toast.success('ลบรายการบัญชีแล้ว')
  }

  const colSum = (e: Entry, col: string) =>
    e.lines.filter((l) => l.column === col).reduce((s, l) => s + (l.dr || l.cr), 0)

  const totalBookAmount = list.reduce((s, e) => s + totals(e.lines).dr, 0)

  const renderActions = (e: Entry) => (
    <div className="row-actions">
      <button
        type="button"
        className="row-action"
        title="ดูการผ่านรายการอัตโนมัติ"
        onClick={() => setTracing(e)}
      >
        <ArrowRightLeft size={15} />
      </button>
      <button
        type="button"
        className="row-action"
        title="แก้ไขรายการ"
        onClick={() => {
          setEditing(e)
          setModalOpen(true)
        }}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        className="row-action danger"
        title="ลบรายการ"
        onClick={() => handleDelete(e)}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )

  return (
    <div>
      {/* แถบสลับสมุด 5 เล่มอย่างเร็วบนมือถือ/แท็บเล็ต */}
      <div className="mobile-book-pills no-print">
        {BOOK_ORDER.map((b) => {
          const m = BOOKS[b]
          const cnt = entries.filter((e) => e.book === b).length
          return (
            <button
              key={b}
              type="button"
              className={`mobile-book-pill ${b === book ? 'active' : ''}`}
              onClick={() => navigate(`/app/journal/${b}`)}
            >
              {m.short} ({cnt})
            </button>
          )
        })}
      </div>

      <div className="app-page-header">
        <div>
          <div className="app-page-title">{meta.name}</div>
          <div className="app-page-subtitle">{meta.description}</div>
        </div>
        <div className="app-page-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <Plus size={16} /> {meta.addLabel}
          </button>
        </div>
      </div>

      <div className="table-card">
        {/* มุมมองการ์ดสำหรับมือถือ (< 720px) อ่านง่ายทุกบรรทัดโดยไม่ต้องเลื่อนตาราง */}
        {list.length > 0 && (
          <div className="mobile-journal-cards">
            {list.map((e) => {
              const sortedLines = [...e.lines].sort((a, b) => (b.dr ? 1 : 0) - (a.dr ? 1 : 0))
              const partyLine = e.lines.find((l) => l.partyId)
              return (
                <div key={e.id} className={`journal-card ${e.isTest ? 'is-test' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-2)' }}>
                        <strong style={{ color: 'var(--black)' }}>{dateShort(e.date)}</strong>
                        {e.docNo && <span className="badge badge-gray">{e.docNo}</span>}
                        {e.terms && <span>· {e.terms}</span>}
                        {e.isTest && <span className="badge badge-red">ทดสอบ</span>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                        {partyLine?.partyId ? partyName(partyLine.partyId) : e.memo}
                      </div>
                      {partyLine?.partyId && e.memo && (
                        <div className="muted" style={{ fontSize: 13 }}>{e.memo}</div>
                      )}
                      {e.reason && (
                        <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{e.reason}</div>
                      )}
                    </div>
                    {renderActions(e)}
                  </div>
                  <div className="journal-card-lines">
                    {sortedLines.map((l, i) => (
                      <div key={i} className="journal-card-line">
                        <div style={{ paddingLeft: l.cr ? 14 : 0, color: l.cr ? 'var(--gray-2)' : 'var(--black)', fontWeight: l.dr ? 600 : 400 }}>
                          <span className="coa-item-code" style={{ marginRight: 6 }}>{l.account}</span>
                          {accountName(accounts, l.account)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span className={`badge ${l.dr ? 'badge-blue' : 'badge-purple'}`} style={{ fontSize: 11, padding: '1px 6px' }}>
                            {l.dr ? 'Dr' : 'Cr'}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {money(l.dr || l.cr)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className={`table-scroll ${list.length > 0 ? 'desktop-only-table' : ''}`}>
          {list.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">ยังไม่มีรายการใน{meta.name}</div>
              <div className="empty-state-desc">
                กดปุ่ม "{meta.addLabel}" ด้านบนเพื่อเริ่มบันทึก หรือกด "โหลดตัวอย่าง" จากเมนูด้านซ้าย
              </div>
            </div>
          ) : book === 'purchase' || book === 'sales' ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>เลขที่</th>
                  <th>{book === 'purchase' ? 'เจ้าหนี้การค้า' : 'ลูกหนี้การค้า'}</th>
                  <th>เงื่อนไข</th>
                  <th>รายละเอียด</th>
                  <th className="num">จำนวนเงิน</th>
                  <th style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {list.map((e) => {
                  const partyLine = e.lines.find((l) => l.partyId)
                  const amt = totals(e.lines).dr
                  return (
                    <tr key={e.id}>
                      <td className="date">{dateShort(e.date)}</td>
                      <td className="muted">{e.docNo || '-'}</td>
                      <td className="desc">{partyName(partyLine?.partyId)}</td>
                      <td className="muted">{e.terms || '-'}</td>
                      <td>
                        <div>{e.memo}</div>
                        {e.reason && (
                          <div className="muted" style={{ fontSize: 13 }}>
                            {e.reason}
                          </div>
                        )}
                      </td>
                      <td className="num">฿ {money(amt)}</td>
                      <td>{renderActions(e)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ textAlign: 'right' }}>
                    รวมยอดผ่านสิ้นเดือน ({book === 'purchase' ? 'Dr ซื้อ / Cr เจ้าหนี้การค้า' : 'Dr ลูกหนี้การค้า / Cr ขาย'})
                  </td>
                  <td className="num">฿ {money(totalBookAmount)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          ) : book === 'receipt' ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>เลขที่</th>
                  <th>รายการ / ลูกหนี้</th>
                  <th className="num">Dr เงินสด</th>
                  <th className="num">Dr ส่วนลดจ่าย</th>
                  <th className="num">Cr ลูกหนี้</th>
                  <th className="num">Cr ขาย</th>
                  <th className="num">Cr บัญชีอื่น ๆ</th>
                  <th style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {list.map((e) => {
                  const arLine = e.lines.find((l) => l.column === 'ar')
                  const others = e.lines.filter((l) => l.column === 'other')
                  return (
                    <tr key={e.id}>
                      <td className="date">{dateShort(e.date)}</td>
                      <td className="muted">{e.docNo || '-'}</td>
                      <td>
                        <div className="desc">{e.memo}</div>
                        {arLine?.partyId && (
                          <div className="muted" style={{ fontSize: 13 }}>
                            ลูกหนี้: {partyName(arLine.partyId)}
                          </div>
                        )}
                        {others.length > 0 && (
                          <div className="muted" style={{ fontSize: 13 }}>
                            บัญชีอื่น: {others.map((o) => `${o.account} ${accountName(accounts, o.account)}`).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="num">{colSum(e, 'cash') ? money(colSum(e, 'cash')) : '-'}</td>
                      <td className="num">{colSum(e, 'discAllowed') ? money(colSum(e, 'discAllowed')) : '-'}</td>
                      <td className="num">{colSum(e, 'ar') ? money(colSum(e, 'ar')) : '-'}</td>
                      <td className="num">{colSum(e, 'sales') ? money(colSum(e, 'sales')) : '-'}</td>
                      <td className="num">{colSum(e, 'other') ? money(colSum(e, 'other')) : '-'}</td>
                      <td>{renderActions(e)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right' }}>
                    รวม
                  </td>
                  <td className="num">{money(list.reduce((s, e) => s + colSum(e, 'cash'), 0))}</td>
                  <td className="num">{money(list.reduce((s, e) => s + colSum(e, 'discAllowed'), 0))}</td>
                  <td className="num">{money(list.reduce((s, e) => s + colSum(e, 'ar'), 0))}</td>
                  <td className="num">{money(list.reduce((s, e) => s + colSum(e, 'sales'), 0))}</td>
                  <td className="num">{money(list.reduce((s, e) => s + colSum(e, 'other'), 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          ) : book === 'payment' ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>เลขที่</th>
                  <th>รายการ / เจ้าหนี้</th>
                  <th className="num">Dr เจ้าหนี้</th>
                  <th className="num">Dr ซื้อ</th>
                  <th className="num">Dr บัญชีอื่น ๆ</th>
                  <th className="num">Cr ส่วนลดรับ</th>
                  <th className="num">Cr เงินสด</th>
                  <th style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {list.map((e) => {
                  const apLine = e.lines.find((l) => l.column === 'ap')
                  const others = e.lines.filter((l) => l.column === 'other')
                  return (
                    <tr key={e.id}>
                      <td className="date">{dateShort(e.date)}</td>
                      <td className="muted">{e.docNo || '-'}</td>
                      <td>
                        <div className="desc">{e.memo}</div>
                        {apLine?.partyId && (
                          <div className="muted" style={{ fontSize: 13 }}>
                            เจ้าหนี้: {partyName(apLine.partyId)}
                          </div>
                        )}
                        {others.length > 0 && (
                          <div className="muted" style={{ fontSize: 13 }}>
                            บัญชีอื่น: {others.map((o) => `${o.account} ${accountName(accounts, o.account)}`).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="num">{colSum(e, 'ap') ? money(colSum(e, 'ap')) : '-'}</td>
                      <td className="num">{colSum(e, 'purchase') ? money(colSum(e, 'purchase')) : '-'}</td>
                      <td className="num">{colSum(e, 'other') ? money(colSum(e, 'other')) : '-'}</td>
                      <td className="num">{colSum(e, 'discReceived') ? money(colSum(e, 'discReceived')) : '-'}</td>
                      <td className="num">{colSum(e, 'cash') ? money(colSum(e, 'cash')) : '-'}</td>
                      <td>{renderActions(e)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right' }}>
                    รวม
                  </td>
                  <td className="num">{money(list.reduce((s, e) => s + colSum(e, 'ap'), 0))}</td>
                  <td className="num">{money(list.reduce((s, e) => s + colSum(e, 'purchase'), 0))}</td>
                  <td className="num">{money(list.reduce((s, e) => s + colSum(e, 'other'), 0))}</td>
                  <td className="num">{money(list.reduce((s, e) => s + colSum(e, 'discReceived'), 0))}</td>
                  <td className="num">{money(list.reduce((s, e) => s + colSum(e, 'cash'), 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>เลขที่</th>
                  <th>รายละเอียด</th>
                  <th>ชื่อบัญชี</th>
                  <th className="num">เดบิต</th>
                  <th className="num">เครดิต</th>
                  <th style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td className="date">{dateShort(e.date)}</td>
                    <td className="muted">{e.docNo || '-'}</td>
                    <td>
                      <div className="desc">
                        {e.memo}{' '}
                        {e.isTest && <span className="badge badge-red">รายการทดสอบ</span>}
                      </div>
                      {e.reason && (
                        <div className="muted" style={{ fontSize: 13 }}>
                          {e.reason}
                        </div>
                      )}
                    </td>
                    <td>
                      {e.lines.map((l, i) => (
                        <div key={i} style={{ paddingLeft: l.cr > 0 ? 18 : 0, marginBottom: 2 }}>
                          <span className="coa-item-code" style={{ marginRight: 6 }}>
                            {l.account}
                          </span>
                          {accountName(accounts, l.account)}
                          {l.partyId && (
                            <span className="muted" style={{ fontSize: 13 }}>
                              {' '}
                              ({partyName(l.partyId)})
                            </span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="num">
                      {e.lines.map((l, i) => (
                        <div key={i} style={{ marginBottom: 2 }}>
                          {l.dr ? money(l.dr) : '-'}
                        </div>
                      ))}
                    </td>
                    <td className="num">
                      {e.lines.map((l, i) => (
                        <div key={i} style={{ marginBottom: 2 }}>
                          {l.cr ? money(l.cr) : '-'}
                        </div>
                      ))}
                    </td>
                    <td>{renderActions(e)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <EntryModal
        open={modalOpen}
        book={book}
        editing={editing}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
      />

      <PostingTraceModal entry={tracing} onClose={() => setTracing(null)} />
    </div>
  )
}
