import { AlertTriangle, CheckCircle2, FileSpreadsheet, FlaskConical, Printer, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/ToastProvider'
import { exportExcel } from '@/lib/export'
import { dateLong, money, moneyBlank } from '@/lib/format'
import { useBooks } from '@/store/useBooks'
import { useLedger } from '@/hooks/useLedger'

export function TrialBalancePage() {
  const company = useBooks((s) => s.company)
  const accounts = useBooks((s) => s.accounts)
  const parties = useBooks((s) => s.parties)
  const entries = useBooks((s) => s.entries)
  const addEntry = useBooks((s) => s.addEntry)
  const removeTestEntries = useBooks((s) => s.removeTestEntries)
  const { tb, ar, ap, warnings } = useLedger()

  const hasTestEntries = entries.some((e) => e.isTest)

  const handleInjectUnbalancedTest = () => {
    addEntry({
      book: 'general',
      date: company.periodEnd,
      docNo: 'TEST-01',
      memo: 'รายการทดสอบ: บันทึกเดบิตไม่เท่ากับเครดิต (ทดสอบแจ้งเตือนงบทดลอง)',
      reason: 'จำลองข้อผิดพลาดตามขั้นตอนที่ 5.6 เพื่อทดสอบการแจ้งเตือนของระบบ',
      lines: [
        { account: '1300', dr: 500000, cr: 0, column: 'general' },
        { account: '2150', dr: 0, cr: 400000, column: 'general' },
      ],
      isTest: true,
    })
    toast.warning('เพิ่มรายการทดสอบที่ไม่สมดุล (ต่าง 1,000.00 บาท) แล้ว')
  }

  const handleCleanupTest = () => {
    removeTestEntries()
    toast.success('ลบรายการทดสอบทั้งหมดแล้ว งบทดลองกลับสู่สถานะปกติ')
  }

  return (
    <div>
      <div className="app-page-header no-print">
        <div>
          <div className="app-page-title">งบทดลอง</div>
          <div className="app-page-subtitle">
            {company.name} · ณ วันที่ {dateLong(company.periodEnd)}
          </div>
        </div>
        <div className="app-page-actions">
          {!hasTestEntries ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleInjectUnbalancedTest}>
              <FlaskConical size={15} /> ทดสอบงบไม่สมดุล
            </button>
          ) : (
            <button type="button" className="btn btn-danger btn-sm" onClick={handleCleanupTest}>
              <Trash2 size={15} /> ลบรายการทดสอบ
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              exportExcel({ company, accounts, parties, entries })
              toast.success('ส่งออกไฟล์ Excel (.xlsx) เรียบร้อยแล้ว')
            }}
          >
            <FileSpreadsheet size={15} /> ส่งออก Excel
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
            <Printer size={15} /> พิมพ์ / PDF
          </button>
        </div>
      </div>

      {/* แจ้งเตือนสถานะงบทดลอง (ซ่อนตอนพิมพ์เพื่อให้เอกสารทางการสะอาดตา) */}
      {warnings.map((w) => (
        <div
          key={w.code}
          className={`tb-alert no-print ${
            w.level === 'ok' ? 'success' : w.level === 'error' ? 'error' : 'warning'
          }`}
        >
          <div className="tb-alert-left">
            {w.level === 'ok' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <div>
              <strong>
                {w.title}
                {w.amount ? ` (ผลต่าง ฿ ${money(w.amount)})` : ''}
              </strong>
              {w.detail && <div style={{ fontSize: 14, marginTop: 2 }}>{w.detail}</div>}
            </div>
          </div>
        </div>
      ))}

      {/* เอกสารงบทดลองแบบทางการ (หัวกระดาษ 3 บรรทัด + เส้นคู่ใต้ยอดรวม) */}
      <div
        className="table-card print-plain"
        style={{ maxWidth: 900, margin: '0 auto 22px', padding: '32px 36px' }}
      >
        <div className="doc-header">
          <div className="doc-header-company">{company.name}</div>
          <div className="doc-header-title">งบทดลอง</div>
          <div className="doc-header-date">ณ วันที่ {dateLong(company.periodEnd)}</div>
        </div>

        <div className="table-scroll">
          {tb.rows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">ยังไม่มีข้อมูลสำหรับออกงบทดลอง</div>
              <div className="empty-state-desc">
                กดปุ่ม "โหลดตัวอย่าง" หรือบันทึกรายการในสมุดรายวันก่อน
              </div>
            </div>
          ) : (
            <table className="formal-ledger">
              <thead>
                <tr>
                  <th className="center" style={{ width: 96 }}>
                    เลขที่
                  </th>
                  <th>ชื่อบัญชี</th>
                  <th className="num" style={{ width: 170 }}>
                    เดบิต
                  </th>
                  <th className="num" style={{ width: 170 }}>
                    เครดิต
                  </th>
                </tr>
              </thead>
              <tbody>
                {tb.rows.map((r) => (
                  <tr key={r.code}>
                    <td className="center coa-item-code">{r.code}</td>
                    <td>
                      {r.name}
                      {r.wrongSide && (
                        <span className="badge badge-orange no-print" style={{ marginLeft: 8 }}>
                          ยอดผิดด้าน
                        </span>
                      )}
                    </td>
                    <td className="num">{moneyBlank(r.dr)}</td>
                    <td className="num">{moneyBlank(r.cr)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td />
                  <td style={{ textAlign: 'center' }}>รวม</td>
                  <td className="num" style={{ color: tb.balanced ? undefined : 'var(--red)' }}>
                    <div className="grand">{money(tb.totalDr)}</div>
                  </td>
                  <td className="num" style={{ color: tb.balanced ? undefined : 'var(--red)' }}>
                    <div className="grand">{money(tb.totalCr)}</div>
                  </td>
                </tr>
                {!tb.balanced && (
                  <tr>
                    <td />
                    <td style={{ textAlign: 'center', color: 'var(--red)' }}>ผลต่าง</td>
                    <td colSpan={2} className="num" style={{ color: 'var(--red)' }}>
                      {money(Math.abs(tb.diff))}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* สรุปการกระทบยอดบัญชีคุมกับบัญชีย่อย (แสดงเฉพาะบนหน้าจอ ไม่ปะปนในเอกสารพิมพ์) */}
      <div className="form-row no-print" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="dash-card">
          <div className="dash-card-label">กระทบยอดลูกหนี้การค้า (1100)</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--gray-2)' }}>
              บัญชีคุม: <strong>฿ {money(ar.control)}</strong> · บัญชีย่อย:{' '}
              <strong>฿ {money(ar.subTotal)}</strong>
            </div>
            <span className={`badge ${ar.ok ? 'badge-green' : 'badge-red'}`}>
              {ar.ok ? 'ตรงกัน ✓' : 'ไม่ตรง'}
            </span>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-card-label">กระทบยอดเจ้าหนี้การค้า (2100)</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--gray-2)' }}>
              บัญชีคุม: <strong>฿ {money(ap.control)}</strong> · บัญชีย่อย:{' '}
              <strong>฿ {money(ap.subTotal)}</strong>
            </div>
            <span className={`badge ${ap.ok ? 'badge-green' : 'badge-red'}`}>
              {ap.ok ? 'ตรงกัน ✓' : 'ไม่ตรง'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
