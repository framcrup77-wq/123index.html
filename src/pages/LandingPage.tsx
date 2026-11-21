import { useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Download,
  Leaf,
  Lock,
  NotebookPen,
  ShoppingCart,
  Store,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from '@/components/ui/ToastProvider'
import { useBooks } from '@/store/useBooks'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export function LandingPage() {
  const navigate = useNavigate()
  const loadSample = useBooks((s) => s.loadSample)

  const handleTryWithSample = () => {
    loadSample()
    toast.success('โหลดข้อมูลตัวอย่าง 18 รายการ (ร้านใบไม้เครื่องเขียน) แล้ว')
    navigate('/app/dashboard')
  }

  return (
    <div>
      {/* HERO */}
      <header className="hero">
        <div className="container">
          <motion.div
            className="hero-eyebrow"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <span className="dot" />
            <span>AC101 · กิจการสมมติ · ร้านค้าปลีก ซื้อมาขายไป (ไม่มี VAT)</span>
          </motion.div>

          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={0.08}>
            บัญชีร้านใบไม้<span className="gradient">.</span>
          </motion.h1>

          <motion.p
            className="hero-sub"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.16}
          >
            ระบบบัญชีสมุดรายวันเฉพาะ 5 เล่ม สำหรับกิจการร้านค้าปลีก
            <br />
            ผ่านรายการไปบัญชีแยกประเภท บัญชีย่อย และงบทดลองโดยอัตโนมัติ
          </motion.p>

          <motion.div
            className="hero-ctas"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.22}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/app/dashboard')}
            >
              เริ่มต้นใช้งาน <ArrowRight size={18} />
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-ghost btn-lg"
              onClick={handleTryWithSample}
            >
              <Download size={17} /> กดปุ่มโหลดตัวอย่างเพื่อดูรายการค้า
            </motion.button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() =>
                document.getElementById('bento')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              ดูคุณสมบัติ <ArrowRight size={18} className="arrow" />
            </button>
          </motion.div>

          {/* Browser Mockup */}
          <motion.div
            className="product-stage"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
          >
            <div className="product-mockup">
              <div className="browser-chrome">
                <div className="browser-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="browser-url">baibai-accounting.app / สมุดรายวันขาย</div>
              </div>
              <div className="app-window">
                <aside className="app-sidebar-mock">
                  <div className="app-sidebar-title">สมุดรายวัน 5 เล่ม</div>
                  <div className="app-sidebar-item">
                    <span className="app-sidebar-icon" style={{ background: '#0066CC' }}>
                      <ShoppingCart size={13} />
                    </span>
                    สมุดรายวันซื้อ
                  </div>
                  <div className="app-sidebar-item active">
                    <span className="app-sidebar-icon" style={{ background: '#30D158' }}>
                      <Store size={13} />
                    </span>
                    สมุดรายวันขาย
                  </div>
                  <div className="app-sidebar-item">
                    <span className="app-sidebar-icon" style={{ background: '#FF9F0A' }}>
                      <ArrowDownLeft size={13} />
                    </span>
                    สมุดรายวันรับเงิน
                  </div>
                  <div className="app-sidebar-item">
                    <span className="app-sidebar-icon" style={{ background: '#BF5AF2' }}>
                      <ArrowUpRight size={13} />
                    </span>
                    สมุดรายวันจ่ายเงิน
                  </div>
                  <div className="app-sidebar-item">
                    <span className="app-sidebar-icon" style={{ background: '#FF375F' }}>
                      <NotebookPen size={13} />
                    </span>
                    สมุดรายวันทั่วไป
                  </div>
                </aside>
                <main className="app-main-mock">
                  <div className="app-header-mock">
                    <div>
                      <div className="app-title-mock">สมุดรายวันขาย</div>
                      <div className="app-subtitle-mock">
                        ร้านใบไม้เครื่องเขียน · พฤศจิกายน 2569
                      </div>
                    </div>
                  </div>
                  <div className="app-stats-mock">
                    <div className="app-stat-mock">
                      <div className="app-stat-label">ยอดขายเชื่อ</div>
                      <div className="app-stat-value positive">฿ 40,500.00</div>
                    </div>
                    <div className="app-stat-mock">
                      <div className="app-stat-label">ลูกหนี้คงเหลือ</div>
                      <div className="app-stat-value">฿ 13,500.00</div>
                    </div>
                    <div className="app-stat-mock">
                      <div className="app-stat-label">งบทดลอง</div>
                      <div className="app-stat-value positive">สมดุล ✓</div>
                    </div>
                  </div>
                  <div className="app-table-mock">
                    <div className="app-table-header-mock">
                      <div>วันที่</div>
                      <div>ลูกหนี้การค้า</div>
                      <div>เลขที่</div>
                      <div style={{ textAlign: 'right' }}>จำนวนเงิน</div>
                      <div style={{ textAlign: 'right' }}>เงื่อนไข</div>
                    </div>
                    <div className="app-table-row-mock">
                      <div style={{ color: 'var(--gray-1)' }}>5 พ.ย.</div>
                      <div style={{ fontWeight: 700 }}>นาย สมชาย ใจดี</div>
                      <div style={{ color: 'var(--gray-2)' }}>INV-001</div>
                      <div
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        18,500.00
                      </div>
                      <div style={{ textAlign: 'right', color: 'var(--gray-1)' }}>2/10, n/30</div>
                    </div>
                    <div className="app-table-row-mock">
                      <div style={{ color: 'var(--gray-1)' }}>18 พ.ย.</div>
                      <div style={{ fontWeight: 700 }}>นาง สมหญิง รักเรียน</div>
                      <div style={{ color: 'var(--gray-2)' }}>INV-002</div>
                      <div
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        22,000.00
                      </div>
                      <div style={{ textAlign: 'right', color: 'var(--gray-1)' }}>2/10, n/30</div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* STATEMENT */}
      <section className="statement">
        <motion.div
          className="container"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
        >
          <h2>
            สมุดรายวันเฉพาะ 5 เล่ม
            <br />
            <span className="muted">ผ่านรายการอัตโนมัติ.</span>
          </h2>
        </motion.div>
      </section>

      {/* BENTO */}
      <section className="bento" id="bento">
        <div className="container-wide">
          <motion.div
            className="text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="section-eyebrow">คุณสมบัติทั้งหมด</div>
            <h2 className="section-title">
              ทุกอย่างที่คุณต้องการ
              <br />
              ในหนึ่งเดียว
            </h2>
            <p className="section-subtitle mx-auto">
              ออกแบบมาเพื่อร้านค้าปลีกรูปแบบซื้อมาขายไปโดยเฉพาะ ครบตามหลักการบัญชี AC101
            </p>
          </motion.div>

          <div className="bento-grid">
            <motion.div
              className="bento-card size-2x2"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              custom={0}
            >
              <div>
                <div className="bento-icon blue">
                  <BookOpen size={24} />
                </div>
                <h3 className="bento-title">สมุดรายวันเฉพาะ 5 เล่ม</h3>
                <p className="bento-desc">
                  แยกเมนูบันทึกรายการ สมุดรายวันซื้อ ขาย รับเงิน จ่ายเงิน และทั่วไป
                  พร้อมตรวจสอบความถูกต้องและผ่านรายการไปบัญชีแยกประเภทอัตโนมัติ
                </p>
              </div>
              <div className="bento-visual">
                <div className="mini-journal">
                  <div className="mini-journal-row header">
                    <div>วันที่</div>
                    <div>รายการ</div>
                    <div style={{ textAlign: 'right' }}>เดบิต</div>
                    <div style={{ textAlign: 'right' }}>เครดิต</div>
                  </div>
                  <div className="mini-journal-row">
                    <div>01/11</div>
                    <div>เงินสด / ทุน (สมุดรับเงิน)</div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>200,000</div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>200,000</div>
                  </div>
                  <div className="mini-journal-row">
                    <div>03/11</div>
                    <div>ซื้อ / เจ้าหนี้ (สมุดซื้อ)</div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>45,000</div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>45,000</div>
                  </div>
                  <div className="mini-journal-row">
                    <div>05/11</div>
                    <div>ลูกหนี้ / ขาย (สมุดขาย)</div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>18,500</div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>18,500</div>
                  </div>
                  <div className="mini-journal-row">
                    <div>08/11</div>
                    <div>ค่าเช่า / เงินสด (สมุดจ่ายเงิน)</div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>12,000</div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>12,000</div>
                  </div>
                  <div className="mini-journal-row">
                    <div>17/11</div>
                    <div>อุปกรณ์ / เจ้าหนี้อื่น (สมุดทั่วไป)</div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>8,000</div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>8,000</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bento-card size-2x1"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              custom={0.08}
            >
              <div className="bento-icon green">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="bento-title">บัญชีแยกประเภท</h3>
                <p className="bento-desc">
                  ทั้งบัญชีแยกประเภททั่วไปและบัญชีย่อยลูกหนี้/เจ้าหนี้ พร้อมเทียบยอดกับบัญชีคุมอัตโนมัติ
                </p>
              </div>
            </motion.div>

            <motion.div
              className="bento-card size-2x1 dark"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              custom={0.14}
            >
              <div className="bento-icon">
                <ClipboardCheck size={24} />
              </div>
              <div>
                <h3 className="bento-title">งบทดลองอัจฉริยะ</h3>
                <p className="bento-desc">
                  คำนวณจากยอดคงเหลือบัญชีแยกประเภท พร้อมแจ้งเตือนทันทีเมื่อยอดเดบิตไม่เท่ากับเครดิต
                </p>
              </div>
            </motion.div>

            <motion.div
              className="bento-card size-3x2 gradient-blue"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              custom={0.08}
            >
              <div>
                <div className="bento-icon">
                  <TrendingUp size={24} />
                </div>
                <h3 className="bento-title">รายงานครบจบในหน้าเดียว</h3>
                <p className="bento-desc">
                  สรุปยอดขาย ยอดซื้อ เงินสดรับ-จ่าย ยอดลูกหนี้-เจ้าหนี้ และส่งออกเป็นไฟล์ Excel (.xlsx) ได้ทันที
                </p>
              </div>
              <div className="bento-visual">
                <div className="mini-chart">
                  {[42, 65, 52, 80, 68, 95, 84].map((h, i) => (
                    <motion.div
                      key={i}
                      className="mini-chart-bar"
                      initial={{ height: '0%' }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bento-card size-3x2"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              custom={0.14}
            >
              <div>
                <div className="bento-icon teal">
                  <Lock size={24} />
                </div>
                <h3 className="bento-title">ปลอดภัยในเบราว์เซอร์</h3>
                <p className="bento-desc">
                  ข้อมูลเก็บใน LocalStorage ของเครื่องคุณ ไม่ส่งข้อมูลออกไปเซิร์ฟเวอร์ภายนอก
                </p>
              </div>
              <div className="bento-visual">
                <div className="mini-ledger">
                  <div className="mini-ledger-item">
                    <strong>LocalStorage</strong>
                    <span style={{ color: 'var(--green-dark)', fontWeight: 700 }}>Active</span>
                  </div>
                  <div className="mini-ledger-item">
                    <strong>ความเป็นส่วนตัว</strong>
                    <span style={{ color: 'var(--gray-2)' }}>ข้อมูลสมมติ 100%</span>
                  </div>
                  <div className="mini-ledger-item">
                    <strong>ส่งออกรายงาน</strong>
                    <span style={{ color: 'var(--gray-2)' }}>Excel & JSON</span>
                  </div>
                  <div className="mini-ledger-item">
                    <strong>รองรับทุกหน้าจอ</strong>
                    <span style={{ color: 'var(--gray-2)' }}>Desktop · Tablet · Mobile</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bento-card size-3x1 gradient-green"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              custom={0.08}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div className="big-number">AC101</div>
                <div>
                  <h3 className="bento-title">ออกแบบเพื่อการเรียนรู้</h3>
                  <p className="bento-desc">
                    ดูเส้นทางการผ่านรายการได้ทุกรายการ พร้อมเหตุผลการเลือกสมุดรายวัน
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bento-card size-3x1"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              custom={0.14}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div className="bento-icon orange" style={{ width: 58, height: 58, marginBottom: 0 }}>
                  <Leaf size={26} />
                </div>
                <div>
                  <h3 className="bento-title">ไม่มีภาษีมูลค่าเพิ่ม</h3>
                  <p className="bento-desc">
                    กิจการร้านค้าปลีกซื้อมาขายไป โฟกัสที่หลักการบันทึกบัญชีสมุดรายวันเฉพาะ
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DARK FEATURE */}
      <section className="dark-feature">
        <motion.div
          className="container"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2>
            ไม่ต้องติดตั้ง
            <br />
            ไม่ต้องตั้งค่า
            <br />
            ไม่ต้องรอ
          </h2>
          <p>เปิดเบราว์เซอร์ แล้วเริ่มบันทึกรายการค้าของร้านใบไม้เครื่องเขียนได้ทันที</p>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="stats" id="specs">
        <div className="container">
          <div className="text-center">
            <div className="section-eyebrow">สเปกโดยสังเขป</div>
            <h2 className="section-title">ตัวเลขที่พูดแทนทุกอย่าง</h2>
          </div>
          <div className="stats-grid">
            {[
              { n: '5', label: 'สมุดรายวันเฉพาะและทั่วไป' },
              { n: '18', label: 'รายการค้าตัวอย่างพร้อมเหตุผล' },
              { n: '100%', label: 'ผ่านรายการอัตโนมัติ' },
              { n: '0', label: 'การติดตั้งที่จำเป็น' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="stat-item"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                custom={i * 0.08}
              >
                <div className="stat-number">{s.n}</div>
                <div className="stat-label">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta" id="try">
        <motion.div
          className="container"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2>พร้อมที่จะเริ่มต้นหรือยัง?</h2>
          <p>
            กดปุ่มด้านล่างเพื่อเข้าสู่ระบบบัญชี
            <br />
            หรือ <strong>"กดปุ่มโหลดตัวอย่างเพื่อดูรายการค้า"</strong> ทั้ง 18 รายการได้ทันที
          </p>
          <div className="hero-ctas" style={{ marginBottom: 0 }}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/app/dashboard')}
            >
              เริ่มใช้งาน <ArrowRight size={18} />
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-success btn-lg"
              onClick={handleTryWithSample}
            >
              <Download size={17} /> โหลดตัวอย่างเพื่อดูรายการค้า
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="nav-logo">
                <span className="nav-logo-mark">
                  <Leaf size={14} />
                </span>
                <span>บัญชีร้านใบไม้</span>
              </div>
              <p>
                กิจการสมมติ · ร้านใบไม้เครื่องเขียน · ร้านค้าปลีก ซื้อมาขายไป · ไม่มีภาษีมูลค่าเพิ่ม ·
                สร้างขึ้นเพื่อการเรียนรู้รายวิชา AC101 การบัญชีเบื้องต้น
              </p>
            </div>
            <div className="footer-col">
              <h4>สมุดรายวัน</h4>
              <ul>
                <li>
                  <button type="button" onClick={() => navigate('/app/journal/purchase')}>
                    สมุดรายวันซื้อ
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/app/journal/sales')}>
                    สมุดรายวันขาย
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/app/journal/receipt')}>
                    สมุดรายวันรับเงิน
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/app/journal/payment')}>
                    สมุดรายวันจ่ายเงิน
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/app/journal/general')}>
                    สมุดรายวันทั่วไป
                  </button>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>รายงาน</h4>
              <ul>
                <li>
                  <button type="button" onClick={() => navigate('/app/ledger')}>
                    บัญชีแยกประเภท
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/app/trial-balance')}>
                    งบทดลอง
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/app/chart')}>
                    ผังบัญชี & คู่ค้า
                  </button>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>เริ่มต้นเร็ว</h4>
              <ul>
                <li>
                  <button type="button" onClick={handleTryWithSample}>
                    โหลดตัวอย่าง 18 รายการ
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/app/dashboard')}>
                    เปิดแดชบอร์ด
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© 2569 ร้านใบไม้เครื่องเขียน · กิจการสมมติเพื่อการศึกษาวิชา AC101</div>
            <div>ข้อมูลทั้งหมดเป็นข้อมูลสมมติ · เก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
