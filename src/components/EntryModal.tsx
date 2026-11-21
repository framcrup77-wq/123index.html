import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from '@/components/ui/ToastProvider'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import {
  ACC,
  BOOKS,
  emptyForm,
  entryToForm,
  formToEntry,
  totals,
  validateEntry,
  type Book,
  type Entry,
  type EntryForm,
} from '@/lib/accounting'
import { money } from '@/lib/format'
import { useBooks } from '@/store/useBooks'

interface Props {
  open: boolean
  book: Book
  editing?: Entry | null
  onClose: () => void
}

export function EntryModal({ open, book, editing, onClose }: Props) {
  const company = useBooks((s) => s.company)
  const accounts = useBooks((s) => s.accounts)
  const parties = useBooks((s) => s.parties)
  const testMode = useBooks((s) => s.testMode)
  const addEntry = useBooks((s) => s.addEntry)
  const updateEntry = useBooks((s) => s.updateEntry)
  const addPartyQuick = useBooks((s) => s.addPartyQuick)

  const [form, setForm] = useState<EntryForm>(() => emptyForm(book, company.periodStart))
  const [newPartyName, setNewPartyName] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setForm(editing ? entryToForm(editing) : emptyForm(book, company.periodStart))
    setNewPartyName('')
    setErrors([])
  }, [open, book, editing, company.periodStart])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const debtors = useMemo(() => parties.filter((p) => p.kind === 'debtor'), [parties])
  const creditors = useMemo(() => parties.filter((p) => p.kind === 'creditor'), [parties])
  const nonCashAccounts = useMemo(() => accounts.filter((a) => a.code !== ACC.CASH), [accounts])

  const previewEntry = useMemo(() => formToEntry(form), [form])
  const previewTotals = useMemo(() => totals(previewEntry.lines), [previewEntry])

  const meta = BOOKS[book]

  const patch = (partial: Partial<EntryForm>) => setForm((prev) => ({ ...prev, ...partial }))

  const handleSave = () => {
    let workingForm = { ...form }

    // รองรับการพิมพ์ชื่อลูกหนี้/เจ้าหนี้ใหม่ทันที (เหมือนต้นฉบับ message (3).txt)
    if (newPartyName.trim() && (book === 'purchase' || book === 'sales' || book === 'receipt' || book === 'payment')) {
      const kind = book === 'purchase' || book === 'payment' ? 'creditor' : 'debtor'
      const created = addPartyQuick(kind, newPartyName.trim(), workingForm.terms || '2/10, n/30')
      workingForm = { ...workingForm, partyId: created.id }
    }

    const candidate = formToEntry(workingForm)
    const latestParties = useBooks.getState().parties
    const res = validateEntry(candidate, {
      accounts,
      parties: latestParties,
      periodStart: company.periodStart,
      periodEnd: company.periodEnd,
      testMode,
    })

    if (!res.ok) {
      setErrors(res.errors.map((e) => e.message))
      return
    }

    const isTest = res.warnings.length > 0
    if (editing) {
      updateEntry(editing.id, { ...candidate, isTest })
      toast.success('อัปเดตรายการบัญชีแล้ว')
    } else {
      addEntry({ ...candidate, isTest })
      if (isTest) {
        toast.warning('บันทึกรายการทดสอบ (ยอดไม่สมดุล) แล้ว — ตรวจสอบแจ้งเตือนได้ที่หน้างบทดลอง')
      } else {
        toast.success(`บันทึกใน${meta.name} และผ่านรายการอัตโนมัติแล้ว`)
      }
    }
    onClose()
  }

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
            <div className="modal-title">
              {editing ? `แก้ไขรายการ — ${meta.name}` : meta.addLabel}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-1)', marginTop: 2 }}>{meta.description}</div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="ปิด">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* วันที่ + เลขที่เอกสาร */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">วันที่ ({company.periodStart} ถึง {company.periodEnd})</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                min={company.periodStart}
                max={company.periodEnd}
                onChange={(e) => patch({ date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">เลขที่เอกสาร / ใบกำกับ</label>
              <input
                type="text"
                className="form-input"
                placeholder={
                  book === 'purchase'
                    ? 'เช่น PUR-003'
                    : book === 'sales'
                      ? 'เช่น INV-003'
                      : book === 'receipt'
                        ? 'เช่น RV-006'
                        : book === 'payment'
                          ? 'เช่น PV-007'
                          : 'เช่น JV-002'
                }
                value={form.docNo}
                onChange={(e) => patch({ docNo: e.target.value })}
              />
            </div>
          </div>

          {/* สมุดรายวันซื้อ / ขาย */}
          {(book === 'purchase' || book === 'sales') && (
            <>
              <div className="form-group">
                <label className="form-label">
                  {book === 'purchase' ? 'เจ้าหนี้การค้า' : 'ลูกหนี้การค้า'}
                </label>
                <div className="form-row">
                  <SelectDropdown
                    value={form.partyId}
                    placeholder={`-- เลือก${book === 'purchase' ? 'เจ้าหนี้' : 'ลูกหนี้'} --`}
                    options={(book === 'purchase' ? creditors : debtors).map((p) => ({
                      value: p.id,
                      label: `${p.id} · ${p.name}`,
                    }))}
                    onChange={(val) => {
                      const p = parties.find((x) => x.id === val)
                      patch({ partyId: val, terms: p?.terms || form.terms })
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`หรือพิมพ์ชื่อ${book === 'purchase' ? 'เจ้าหนี้' : 'ลูกหนี้'}ใหม่`}
                    value={newPartyName}
                    onChange={(e) => setNewPartyName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">จำนวนเงิน (บาท)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => patch({ amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">เงื่อนไขการชำระเงิน</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น 2/10, n/30"
                    value={form.terms}
                    onChange={(e) => patch({ terms: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {/* สมุดรายวันรับเงิน */}
          {book === 'receipt' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">เดบิต: เงินสด (1000)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.cash}
                    onChange={(e) => patch({ cash: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">เดบิต: ส่วนลดจ่าย (4020) — ถ้ามี</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.discount}
                    onChange={(e) => patch({ discount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">เครดิต: ลูกหนี้การค้า (1100)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.ar}
                    onChange={(e) => patch({ ar: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">เครดิต: ขายสด (4000)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.sales}
                    onChange={(e) => patch({ sales: e.target.value })}
                  />
                </div>
              </div>

              {Number(form.ar) > 0 && (
                <div className="form-group">
                  <label className="form-label">ชื่อลูกหนี้ที่ชำระเงิน</label>
                  <SelectDropdown
                    value={form.partyId}
                    placeholder="-- เลือกลูกหนี้ --"
                    options={debtors.map((d) => ({ value: d.id, label: `${d.id} · ${d.name}` }))}
                    onChange={(val) => patch({ partyId: val })}
                  />
                </div>
              )}

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    เครดิต: บัญชีอื่น ๆ (เช่น ทุน, รายได้อื่น)
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => patch({ others: [...form.others, { account: '3000', amount: '' }] })}
                  >
                    <Plus size={14} /> เพิ่มบัญชีอื่น
                  </button>
                </div>
                {form.others.map((o, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 36px', gap: 8, marginBottom: 8 }}>
                    <SelectDropdown
                      value={o.account}
                      placeholder="-- เลือกบัญชี --"
                      options={nonCashAccounts.map((a) => ({ value: a.code, label: `${a.code} · ${a.name}` }))}
                      onChange={(val) => {
                        const next = [...form.others]
                        next[idx] = { ...o, account: val }
                        patch({ others: next })
                      }}
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="จำนวนเงิน"
                      step="0.01"
                      min="0"
                      value={o.amount}
                      onChange={(e) => {
                        const next = [...form.others]
                        next[idx] = { ...o, amount: e.target.value }
                        patch({ others: next })
                      }}
                    />
                    <button
                      type="button"
                      className="row-action danger"
                      onClick={() => patch({ others: form.others.filter((_, i) => i !== idx) })}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* สมุดรายวันจ่ายเงิน */}
          {book === 'payment' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">เดบิต: เจ้าหนี้การค้า (2100)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.ap}
                    onChange={(e) => patch({ ap: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">เดบิต: ซื้อสด (5000)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.purchase}
                    onChange={(e) => patch({ purchase: e.target.value })}
                  />
                </div>
              </div>

              {Number(form.ap) > 0 && (
                <div className="form-group">
                  <label className="form-label">ชื่อเจ้าหนี้ที่จ่ายชำระ</label>
                  <SelectDropdown
                    value={form.partyId}
                    placeholder="-- เลือกเจ้าหนี้ --"
                    options={creditors.map((c) => ({ value: c.id, label: `${c.id} · ${c.name}` }))}
                    onChange={(val) => patch({ partyId: val })}
                  />
                </div>
              )}

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    เดบิต: บัญชีอื่น ๆ (เช่น ค่าเช่า, ค่าจ้าง, เงินฝากธนาคาร)
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => patch({ others: [...form.others, { account: '5100', amount: '' }] })}
                  >
                    <Plus size={14} /> เพิ่มบัญชีอื่น
                  </button>
                </div>
                {form.others.map((o, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 36px', gap: 8, marginBottom: 8 }}>
                    <SelectDropdown
                      value={o.account}
                      placeholder="-- เลือกบัญชี --"
                      options={nonCashAccounts.map((a) => ({ value: a.code, label: `${a.code} · ${a.name}` }))}
                      onChange={(val) => {
                        const next = [...form.others]
                        next[idx] = { ...o, account: val }
                        patch({ others: next })
                      }}
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="จำนวนเงิน"
                      step="0.01"
                      min="0"
                      value={o.amount}
                      onChange={(e) => {
                        const next = [...form.others]
                        next[idx] = { ...o, amount: e.target.value }
                        patch({ others: next })
                      }}
                    />
                    <button
                      type="button"
                      className="row-action danger"
                      onClick={() => patch({ others: form.others.filter((_, i) => i !== idx) })}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">เครดิต: เงินสด (1000)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.cash}
                    onChange={(e) => patch({ cash: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">เครดิต: ส่วนลดรับ (5020) — ถ้ามี</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.discount}
                    onChange={(e) => patch({ discount: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {/* สมุดรายวันทั่วไป */}
          {book === 'general' && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  รายการบัญชี (อย่างน้อย 2 บรรทัด)
                </label>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    patch({ lines: [...form.lines, { account: '', dr: '', cr: '', partyId: '' }] })
                  }
                >
                  <Plus size={14} /> เพิ่มบรรทัด
                </button>
              </div>
              {form.lines.map((row, idx) => {
                const needDebtor = row.account === ACC.AR
                const needCreditor = row.account === ACC.AP
                return (
                  <div key={idx} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 115px 115px 34px', gap: 8 }}>
                      <SelectDropdown
                        value={row.account}
                        placeholder="-- เลือกบัญชี --"
                        options={accounts.map((a) => ({ value: a.code, label: `${a.code} · ${a.name}` }))}
                        onChange={(val) => {
                          const next = [...form.lines]
                          next[idx] = { ...row, account: val, partyId: '' }
                          patch({ lines: next })
                        }}
                      />
                      <input
                        type="number"
                        className="form-input"
                        placeholder="เดบิต"
                        step="0.01"
                        min="0"
                        value={row.dr}
                        onChange={(e) => {
                          const next = [...form.lines]
                          next[idx] = { ...row, dr: e.target.value, cr: e.target.value ? '' : row.cr }
                          patch({ lines: next })
                        }}
                      />
                      <input
                        type="number"
                        className="form-input"
                        placeholder="เครดิต"
                        step="0.01"
                        min="0"
                        value={row.cr}
                        onChange={(e) => {
                          const next = [...form.lines]
                          next[idx] = { ...row, cr: e.target.value, dr: e.target.value ? '' : row.dr }
                          patch({ lines: next })
                        }}
                      />
                      <button
                        type="button"
                        className="row-action danger"
                        disabled={form.lines.length <= 2}
                        onClick={() => patch({ lines: form.lines.filter((_, i) => i !== idx) })}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {(needDebtor || needCreditor) && (
                      <div style={{ marginTop: 6 }}>
                        <SelectDropdown
                          value={row.partyId}
                          placeholder={`-- ระบุ${needDebtor ? 'ลูกหนี้' : 'เจ้าหนี้'}เพื่อผ่านบัญชีย่อย --`}
                          options={(needDebtor ? debtors : creditors).map((p) => ({
                            value: p.id,
                            label: `${p.id} · ${p.name}`,
                          }))}
                          onChange={(val) => {
                            const next = [...form.lines]
                            next[idx] = { ...row, partyId: val }
                            patch({ lines: next })
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* คำอธิบาย + เหตุผลการเลือกสมุด */}
          <div className="form-group">
            <label className="form-label">คำอธิบายรายการ</label>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น ซื้อสินค้าเครื่องเขียนเป็นเงินเชื่อ / จ่ายค่าเช่าร้าน"
              value={form.memo}
              onChange={(e) => patch({ memo: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">เหตุผลการเลือกสมุด (ถ้ามี)</label>
            <input
              type="text"
              className="form-input"
              placeholder="ระบุเหตุผลทางบัญชีว่าทำไมบันทึกรายการนี้ในสมุดเล่มนี้"
              value={form.reason}
              onChange={(e) => patch({ reason: e.target.value })}
            />
          </div>

          {/* Live Dr/Cr balance preview */}
          <div className="form-hint" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>
              รวมเดบิต: <strong>฿ {money(previewTotals.dr)}</strong> · รวมเครดิต:{' '}
              <strong>฿ {money(previewTotals.cr)}</strong>
            </span>
            {previewTotals.diff === 0 && previewTotals.dr > 0 ? (
              <span className="badge badge-green">สมดุล ✓</span>
            ) : previewTotals.diff !== 0 ? (
              <span className="badge badge-red">
                ไม่สมดุล (ต่าง ฿ {money(Math.abs(previewTotals.diff))})
                {testMode ? ' · โหมดทดสอบยอมให้บันทึก' : ''}
              </span>
            ) : null}
          </div>

          {errors.length > 0 && (
            <div className="form-errors">
              <strong>กรุณาตรวจสอบข้อมูล:</strong>
              <ul>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            {editing ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
