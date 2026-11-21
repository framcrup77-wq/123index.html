import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, Home, Leaf, Moon, Sun } from 'lucide-react'
import { useBooks } from '@/store/useBooks'
import { useLedger } from '@/hooks/useLedger'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const company = useBooks((s) => s.company)
  const entries = useBooks((s) => s.entries)
  const theme = useBooks((s) => s.theme)
  const setTheme = useBooks((s) => s.setTheme)
  const { healthy, tb } = useLedger()
  const isApp = location.pathname.startsWith('/app')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    if (isApp) {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className={`nav-inner ${isApp ? 'is-app' : ''}`}>
        <div className="nav-logo" onClick={() => navigate('/')}>
          <span className="nav-logo-mark">
            <Leaf size={15} strokeWidth={2.4} />
          </span>
          <span>{company.shortName}</span>
        </div>

        <ul className="nav-links">
          {!isApp ? (
            <>
              <li>
                <button type="button" onClick={() => scrollTo('bento')}>
                  คุณสมบัติ
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('specs')}>
                  สเปก
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('try')}>
                  ทดลองใช้
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="theme-toggle-btn"
                  style={{ opacity: 1 }}
                  onClick={toggleTheme}
                  aria-label="สลับโหมดสี"
                  title={theme === 'dark' ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'}
                >
                  {theme === 'dark' ? <Sun size={16} color="#FF9F0A" /> : <Moon size={16} />}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/app/dashboard')}
                  style={{ opacity: 1, color: '#FFFFFF' }}
                >
                  เข้าสู่ระบบบัญชี <ArrowRight size={14} />
                </button>
              </li>
            </>
          ) : (
            <>
              {entries.length > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/app/trial-balance')}
                    className={`badge ${healthy ? 'badge-green' : 'badge-red'}`}
                    style={{ opacity: 1, padding: '4px 12px', fontSize: 13 }}
                  >
                    {healthy ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {healthy ? 'งบทดลองสมดุล' : tb.balanced ? 'มีคำเตือน' : 'งบทดลองไม่สมดุล'}
                  </button>
                </li>
              )}
              <li>
                <span style={{ fontSize: 14, color: 'var(--gray-1)' }}>
                  {company.name} · ไม่มี VAT
                </span>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Home size={14} /> หน้าแรก
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="theme-toggle-btn"
                  style={{ opacity: 1 }}
                  onClick={toggleTheme}
                  aria-label="สลับโหมดสี"
                  title={theme === 'dark' ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'}
                >
                  {theme === 'dark' ? <Sun size={16} color="#FF9F0A" /> : <Moon size={16} />}
                </button>
              </li>
            </>
          )}
        </ul>

        {/* ปุ่มลัดสำหรับหน้าจอมือถือบน Navbar */}
        <div className="mobile-menu-btn" style={{ width: 'auto', gap: 8 }}>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="สลับโหมดสี"
          >
            {theme === 'dark' ? <Sun size={16} color="#FF9F0A" /> : <Moon size={16} />}
          </button>
          {!isApp ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 14px', color: '#fff' }}
              onClick={() => navigate('/app/dashboard')}
            >
              เข้าสู่ระบบ
            </button>
          ) : entries.length > 0 ? (
            <button
              type="button"
              className={`badge ${healthy ? 'badge-green' : 'badge-red'}`}
              style={{ padding: '4px 10px' }}
              onClick={() => navigate('/app/trial-balance')}
            >
              {healthy ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {healthy ? 'สมดุล' : 'ไม่สมดุล'}
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
