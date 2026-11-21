import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Download,
  Inbox,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from 'lucide-react'
import { animate, motion } from 'motion/react'
import { toast } from '@/components/ui/ToastProvider'
import { ACC, BOOKS, balanceOf, sortEntries, totals } from '@/lib/accounting'
import { dateShort, money, monthLong } from '@/lib/format'
import { useBooks } from '@/store/useBooks'
import { useLedger } from '@/hooks/useLedger'

function CountUp({ value }: { value: number }) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setV(Math.round(latest)),
    })
    return () => controls.stop()
  }, [value])
  return <>{money(v)}</>
}

export function DashboardPage() {
  const navigate = useNavigate()
  const company = useBooks((s) => s.company)
  const entries = useBooks((s) => s.entries)
  const parties = useBooks((s) => s.parties)
  const loadSample = useBooks((s) => s.loadSample)
  const { gl, tb, ar, ap, warnings, healthy } = useLedger()

  const sumBook = (book: 'purchase' | 'sales' | 'receipt' | 'payment') =>
    entries
      .filter((e) => e.book === book)
      .reduce((s, e) => s + totals(e.lines).dr, 0)

  const totalSales = -balanceOf(gl[ACC.SALES])
  const totalPurchases = balanceOf(gl[ACC.PURCHASE])
  const totalReceipts = sumBook('receipt')
  const totalPayments = sumBook('payment')
  const cashBalance = balanceOf(gl[ACC.CASH])
  const bankBalance = balanceOf(gl[ACC.BANK])

  const debtorsCount = parties.filter((p) => p.kind === 'debtor').length
  const creditorsCount = parties.filter((p) => p.kind === 'creditor').length

  const recent = sortEntries(entries).reverse().slice(0, 10)

  const handleLoadSample = () => {
    if (
      entries.length > 0 &&
      !confirm('การโหลดตัวอย่างจะแทนที่ข้อมูลปัจจุบัน ต้องการดำเนินการต่อหรือไม่?')
    ) {
      return
    }
    loadSample()
    toast.success('โหลดข้อมูลตัวอย่าง 18 รายการแล้ว')
  }

  return (
    <div>
      <div className="app-page-header">
        <div>
          <div className="app-page-title">แดชบอร์ด</div>
          <div className="app-page-subtitle">
            {company.name} · งวด {monthLong(company.periodStart)} · ไม่มีภาษีมูลค่าเพิ่ม
          </div>
        </div>
        <div className="app-page-actions">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary"
            onClick={handleLoadSample}
          >
            <Download size={16} /> โหลดตัวอย่าง (18 รายการ)
          </motion.button>
        </div>
      </div>

      {/* สถานะงบทดลอง */}
      {entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`tb-alert ${healthy ? 'success' : 'error'}`}
        >
          <div className="tb-alert-left">
            {healthy ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <div>
              <strong>{warnings[0].title}</strong>
              {!healthy && (
                <div style={{ fontSize: 14, marginTop: 2 }}>
                  ผลต่าง ฿ {money(Math.abs(tb.diff))} — ตรวจสอบรายละเอียดที่หน้างบทดลอง
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/app/trial-balance')}
          >
            ดูงบทดลอง
          </button>
        </motion.div>
      )}

      {/* แถวที่ 1: สรุปยอดซื้อ-ขาย-รับ-จ่าย */}
      <div className="dash-grid">
        {[
          {
            label: 'ยอดขายรวม (สด+เชื่อ)',
            value: totalSales,
            cls: 'positive',
            sub: `ขายเชื่อ ${entries.filter((e) => e.book === 'sales').length} รายการ`,
            icon: Store,
            color: '#1EA347',
            to: '/app/journal/sales',
          },
          {
            label: 'ยอดซื้อรวม (สด+เชื่อ)',
            value: totalPurchases,
            cls: '',
            sub: `ซื้อเชื่อ ${entries.filter((e) => e.book === 'purchase').length} รายการ`,
            icon: ShoppingCart,
            color: '#0066CC',
            to: '/app/journal/purchase',
          },
          {
            label: 'เงินสดรับ (สมุดรับเงิน)',
            value: totalReceipts,
            cls: 'positive',
            sub: `${entries.filter((e) => e.book === 'receipt').length} รายการ`,
            icon: ArrowDownLeft,
            color: '#FF9F0A',
            to: '/app/journal/receipt',
          },
          {
            label: 'เงินสดจ่าย (สมุดจ่ายเงิน)',
            value: totalPayments,
            cls: 'negative',
            sub: `${entries.filter((e) => e.book === 'payment').length} รายการ`,
            icon: ArrowUpRight,
            color: '#BF5AF2',
            to: '/app/journal/payment',
          },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              className="dash-card"
              style={{ cursor: 'pointer' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: i * 0.05 }}
              onClick={() => navigate(card.to)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="dash-card-label">{card.label}</div>
                <Icon size={17} color={card.color} />
              </div>
              <div className={`dash-card-value ${card.cls}`}>
                ฿ <CountUp value={card.value} />
              </div>
              <div className="dash-card-sub">{card.sub}</div>
            </motion.div>
          )
        })}
      </div>

      {/* แถวที่ 2: ยอดคงเหลือบัญชีคุมสำคัญ */}
      <div className="dash-grid-3">
        <motion.div
          className="dash-card"
          style={{ cursor: 'pointer' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.2 }}
          onClick={() => navigate('/app/ledger')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="dash-card-label">เงินสดคงเหลือ / ธนาคาร</div>
            <Wallet size={17} color="#0066CC" />
          </div>
          <div className="dash-card-value">
            ฿ <CountUp value={cashBalance} />
          </div>
          <div className="dash-card-sub">เงินฝากธนาคาร: ฿ {money(bankBalance)}</div>
        </motion.div>

        <motion.div
          className="dash-card"
          style={{ cursor: 'pointer' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.25 }}
          onClick={() => navigate('/app/ledger')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="dash-card-label">ลูกหนี้การค้า (บัญชีคุม 1100)</div>
            <Users size={17} color="#0066CC" />
          </div>
          <div className="dash-card-value">
            ฿ <CountUp value={ar.control} />
          </div>
          <div className="dash-card-sub">
            {debtorsCount} ราย · บัญชีย่อย {ar.ok ? 'ตรงกัน ✓' : 'ไม่ตรง!'}
          </div>
        </motion.div>

        <motion.div
          className="dash-card"
          style={{ cursor: 'pointer' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.3 }}
          onClick={() => navigate('/app/ledger')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="dash-card-label">เจ้าหนี้การค้า (บัญชีคุม 2100)</div>
            <Building2 size={17} color="#FF9F0A" />
          </div>
          <div className="dash-card-value">
            ฿ <CountUp value={ap.control} />
          </div>
          <div className="dash-card-sub">
            {creditorsCount} ราย · บัญชีย่อย {ap.ok ? 'ตรงกัน ✓' : 'ไม่ตรง!'}
          </div>
        </motion.div>
      </div>

      {/* รายการล่าสุด */}
      <div className="table-card">
        <div className="table-card-header">
          <div className="table-card-title">รายการล่าสุด</div>
          <div className="muted">ทั้งหมด {entries.length} รายการ</div>
        </div>
        <div className="table-scroll">
          {recent.length === 0 ? (
            <div className="empty-state">
              <div style={{ marginBottom: 10, opacity: 0.45 }}>
                <Inbox size={44} />
              </div>
              <div className="empty-state-title">ยังไม่มีรายการค้าในระบบ</div>
              <div className="empty-state-desc">
                <strong>กดปุ่มโหลดตัวอย่างเพื่อดูรายการค้า</strong> ทั้ง 18 รายการ (ครบ 5 สมุดรายวัน พร้อมเหตุผลการเลือกสมุด)
              </div>
              <button type="button" className="btn btn-primary" onClick={handleLoadSample}>
                <Download size={16} /> กดปุ่มโหลดตัวอย่างเพื่อดูรายการค้า
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>สมุดรายวัน</th>
                  <th>เลขที่</th>
                  <th>รายละเอียดและเหตุผลการเลือกสมุด</th>
                  <th className="num">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((e) => {
                  const meta = BOOKS[e.book]
                  const amt = Math.max(totals(e.lines).dr, totals(e.lines).cr)
                  return (
                    <tr
                      key={e.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/app/journal/${e.book}`)}
                    >
                      <td className="date">{dateShort(e.date)}</td>
                      <td>
                        <span className={`badge ${meta.badgeClass}`}>{meta.short}</span>
                        {e.isTest && (
                          <span className="badge badge-red" style={{ marginLeft: 4 }}>
                            ทดสอบ
                          </span>
                        )}
                      </td>
                      <td className="muted">{e.docNo || '-'}</td>
                      <td>
                        <div className="desc">{e.memo}</div>
                        {e.reason && (
                          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                            {e.reason}
                          </div>
                        )}
                      </td>
                      <td className="num">฿ {money(amt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
