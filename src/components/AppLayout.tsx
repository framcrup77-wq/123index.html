import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  Database,
  Download,
  FileSpreadsheet,
  FlaskConical,
  FolderTree,
  Home,
  LayoutDashboard,
  Leaf,
  Menu,
  NotebookPen,
  Scale,
  ShoppingCart,
  Store,
  Trash2,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from '@/components/ui/ToastProvider'
import { BOOKS, type Book } from '@/lib/accounting'
import { exportExcel, exportJSON } from '@/lib/export'
import { useBooks } from '@/store/useBooks'
import { useLedger } from '@/hooks/useLedger'

const JOURNAL_ICONS: Record<Book, typeof ShoppingCart> = {
  purchase: ShoppingCart,
  sales: Store,
  receipt: ArrowDownLeft,
  payment: ArrowUpRight,
  general: NotebookPen,
}

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const entries = useBooks((s) => s.entries)
  const accounts = useBooks((s) => s.accounts)
  const parties = useBooks((s) => s.parties)
  const company = useBooks((s) => s.company)
  const testMode = useBooks((s) => s.testMode)
  const setTestMode = useBooks((s) => s.setTestMode)
  const loadSample = useBooks((s) => s.loadSample)
  const clearEntries = useBooks((s) => s.clearEntries)
  const { healthy } = useLedger()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0 })
    setDrawerOpen(false)
  }, [location.pathname])

  const countByBook = (b: Book) => entries.filter((e) => e.book === b).length

  const handleLoadSample = () => {
    if (
      entries.length > 0 &&
      !confirm('การโหลดตัวอย่างจะแทนที่ข้อมูลปัจจุบันทั้งหมด ต้องการดำเนินการต่อหรือไม่?')
    ) {
      return
    }
    loadSample()
    setDrawerOpen(false)
    toast.success('โหลดข้อมูลตัวอย่าง 18 รายการ (ครบทั้ง 5 สมุด) แล้ว')
  }

  const handleClear = () => {
    if (entries.length === 0) {
      toast.info('ยังไม่มีรายการให้ล้าง')
      return
    }
    if (!confirm('ต้องการล้างรายการบัญชีทั้งหมดหรือไม่?')) return
    clearEntries()
    setDrawerOpen(false)
    toast.success('ล้างข้อมูลรายการทั้งหมดแล้ว')
  }

  const handleExportExcel = async () => {
    try {
      await exportExcel({ company, accounts, parties, entries })
      toast.success('ส่งออกไฟล์ Excel (.xlsx) เรียบร้อยแล้ว')
    } catch {
      toast.error('ไม่สามารถส่งออกไฟล์ Excel ได้')
    }
  }

  const renderNavSections = (showLayoutId: boolean) => (
    <>
      <div className="app-sidebar-section">
        <div className="app-sidebar-section-title">ภาพรวม</div>
        <div className="app-sidebar-items">
          <NavLink
            to="/app/dashboard"
            className={({ isActive }) => `app-sidebar-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {isActive && showLayoutId && (
                  <motion.span layoutId="sidebar-active-bar" className="sidebar-active-bar" />
                )}
                <span
                  className="app-sidebar-icon"
                  style={{ background: 'linear-gradient(135deg,#0066CC,#00A3FF)' }}
                >
                  <LayoutDashboard size={14} />
                </span>
                แดชบอร์ด
              </>
            )}
          </NavLink>
        </div>
      </div>

      <div className="app-sidebar-section">
        <div className="app-sidebar-section-title">สมุดรายวัน 5 เล่ม</div>
        <div className="app-sidebar-items">
          {(['purchase', 'sales', 'receipt', 'payment', 'general'] as Book[]).map((book) => {
            const Icon = JOURNAL_ICONS[book]
            const meta = BOOKS[book]
            return (
              <NavLink
                key={book}
                to={`/app/journal/${book}`}
                className={({ isActive }) => `app-sidebar-item ${isActive ? 'active' : ''}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && showLayoutId && (
                      <motion.span layoutId="sidebar-active-bar" className="sidebar-active-bar" />
                    )}
                    <span className="app-sidebar-icon" style={{ background: meta.color }}>
                      <Icon size={14} />
                    </span>
                    {meta.name}
                    <span className="app-sidebar-badge">{countByBook(book)}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </div>

      <div className="app-sidebar-section">
        <div className="app-sidebar-section-title">รายงานและผังบัญชี</div>
        <div className="app-sidebar-items">
          <NavLink
            to="/app/ledger"
            className={({ isActive }) => `app-sidebar-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {isActive && showLayoutId && (
                  <motion.span layoutId="sidebar-active-bar" className="sidebar-active-bar" />
                )}
                <span className="app-sidebar-icon" style={{ background: '#5AC8FA' }}>
                  <BookOpen size={14} />
                </span>
                บัญชีแยกประเภท
              </>
            )}
          </NavLink>
          <NavLink
            to="/app/trial-balance"
            className={({ isActive }) => `app-sidebar-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {isActive && showLayoutId && (
                  <motion.span layoutId="sidebar-active-bar" className="sidebar-active-bar" />
                )}
                <span
                  className="app-sidebar-icon"
                  style={{ background: healthy ? '#6E6E73' : '#FF3B30' }}
                >
                  <ClipboardCheck size={14} />
                </span>
                งบทดลอง
                {!healthy && entries.length > 0 && (
                  <span className="app-sidebar-badge" style={{ background: '#FF3B30', color: '#fff' }}>
                    !
                  </span>
                )}
              </>
            )}
          </NavLink>
          <NavLink
            to="/app/chart"
            className={({ isActive }) => `app-sidebar-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {isActive && showLayoutId && (
                  <motion.span layoutId="sidebar-active-bar" className="sidebar-active-bar" />
                )}
                <span className="app-sidebar-icon" style={{ background: '#86868B' }}>
                  <FolderTree size={14} />
                </span>
                ผังบัญชี & คู่ค้า
              </>
            )}
          </NavLink>
        </div>
      </div>

      <div className="app-sidebar-section">
        <div className="app-sidebar-section-title">ข้อมูลและทดสอบ</div>
        <div className="app-sidebar-items">
          <button type="button" className="app-sidebar-item" onClick={handleLoadSample}>
            <span className="app-sidebar-icon" style={{ background: '#1EA347' }}>
              <Download size={14} />
            </span>
            โหลดตัวอย่าง (18 รายการ)
          </button>

          <button
            type="button"
            className="switch-row"
            style={{ width: '100%' }}
            onClick={() => {
              setTestMode(!testMode)
              toast.info(
                !testMode
                  ? 'เปิดโหมดทดสอบ: สามารถบันทึกรายการไม่สมดุลเพื่อทดสอบงบทดลองได้'
                  : 'ปิดโหมดทดสอบ: ระบบบังคับยอดเดบิตเท่ากับเครดิตตามปกติ',
              )
            }}
            title="อนุญาตให้บันทึกรายการเดบิตไม่เท่าเครดิตเพื่อทดสอบแจ้งเตือนงบทดลอง"
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: testMode ? 700 : 500,
                color: testMode ? '#B86E00' : undefined,
              }}
            >
              <FlaskConical size={15} />
              โหมดทดสอบระบบ
            </span>
            <span className={`switch-pill ${testMode ? 'on' : ''}`} />
          </button>

          <button type="button" className="app-sidebar-item" onClick={handleExportExcel}>
            <span className="app-sidebar-icon" style={{ background: '#0066CC' }}>
              <FileSpreadsheet size={14} />
            </span>
            ส่งออก Excel (.xlsx)
          </button>

          <button
            type="button"
            className="app-sidebar-item"
            onClick={() => {
              exportJSON({ company, accounts, parties, entries })
              toast.success('สำรองไฟล์ JSON แล้ว')
            }}
          >
            <span className="app-sidebar-icon" style={{ background: '#6E6E73' }}>
              <Database size={14} />
            </span>
            สำรอง JSON
          </button>

          <button type="button" className="app-sidebar-item" onClick={handleClear}>
            <span className="app-sidebar-icon" style={{ background: '#FF3B30' }}>
              <Trash2 size={14} />
            </span>
            ล้างรายการทั้งหมด
          </button>

          <button type="button" className="app-sidebar-item" onClick={() => navigate('/')}>
            <span className="app-sidebar-icon" style={{ background: '#86868B' }}>
              <Home size={14} />
            </span>
            กลับหน้าแรก
          </button>
        </div>
      </div>
    </>
  )

  const isJournalRoute = location.pathname.startsWith('/app/journal')

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="app-sidebar">{renderNavSections(true)}</aside>

      {/* Mobile Slide-In Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="mobile-drawer-backdrop no-print"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="mobile-drawer no-print"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <div className="mobile-drawer-header">
                <div className="nav-logo" onClick={() => navigate('/')}>
                  <span className="nav-logo-mark">
                    <Leaf size={14} />
                  </span>
                  <span>{company.shortName}</span>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="ปิดเมนู"
                >
                  <X size={16} />
                </button>
              </div>
              {renderNavSections(false)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content with smooth Motion page transition */}
      <main className="app-content">
        {testMode && (
          <div className="tb-alert warning no-print" style={{ marginBottom: 16 }}>
            <div className="tb-alert-left">
              <FlaskConical size={18} />
              <div>
                <strong>โหมดทดสอบเปิดอยู่</strong> — อนุญาตให้บันทึกรายการไม่สมดุลเพื่อทดสอบแจ้งเตือนงบทดลอง
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setTestMode(false)}
            >
              ปิดโหมดทดสอบ
            </button>
          </div>
        )}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav no-print" aria-label="เมนูหลักมือถือ">
        <NavLink
          to="/app/dashboard"
          className={({ isActive }) => `mobile-bottom-tab ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>ภาพรวม</span>
        </NavLink>
        <NavLink
          to="/app/journal/purchase"
          className={`mobile-bottom-tab ${isJournalRoute ? 'active' : ''}`}
        >
          <NotebookPen size={20} />
          <span>สมุด 5 เล่ม</span>
        </NavLink>
        <NavLink
          to="/app/ledger"
          className={({ isActive }) => `mobile-bottom-tab ${isActive ? 'active' : ''}`}
        >
          <BookOpen size={20} />
          <span>แยกประเภท</span>
        </NavLink>
        <NavLink
          to="/app/trial-balance"
          className={({ isActive }) => `mobile-bottom-tab ${isActive ? 'active' : ''}`}
        >
          <Scale size={20} />
          <span>งบทดลอง</span>
        </NavLink>
        <button
          type="button"
          className="mobile-bottom-tab"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={20} />
          <span>เพิ่มเติม</span>
        </button>
      </nav>
    </div>
  )
}
