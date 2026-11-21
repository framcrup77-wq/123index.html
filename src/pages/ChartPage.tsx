import { useRef, useState } from 'react'
import { Building2, Landmark, Plus, Receipt, Scale, Trash2, TrendingUp, Upload, User, Wallet } from 'lucide-react'
import { toast } from '@/components/ui/ToastProvider'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import {
  ACCOUNT_TYPE_META,
  SYSTEM_ACCOUNTS,
  normalBalanceOf,
  type Account,
  type AccountType,
  type PartyKind,
} from '@/lib/accounting'
import { readJSON } from '@/lib/export'
import { money } from '@/lib/format'
import { useBooks } from '@/store/useBooks'
import { useLedger } from '@/hooks/useLedger'

const TYPE_ICON: Record<AccountType, typeof Wallet> = {
  asset: Wallet,
  liability: Scale,
  equity: Landmark,
  revenue: TrendingUp,
  expense: Receipt,
}

type Tab = 'accounts' | 'parties' | 'settings'

export function ChartPage() {
  const company = useBooks((s) => s.company)
  const accounts = useBooks((s) => s.accounts)
  const parties = useBooks((s) => s.parties)
  const entries = useBooks((s) => s.entries)
  const upsertAccount = useBooks((s) => s.upsertAccount)
  const deleteAccount = useBooks((s) => s.deleteAccount)
  const addPartyQuick = useBooks((s) => s.addPartyQuick)
  const deleteParty = useBooks((s) => s.deleteParty)
  const setCompany = useBooks((s) => s.setCompany)
  const importData = useBooks((s) => s.importData)
  const { gl } = useLedger()

  const [tab, setTab] = useState<Tab>('accounts')
  const [newAcc, setNewAcc] = useState<Account>({
    code: '',
    name: '',
    type: 'expense',
    normal: 'dr',
  })
  const [newPartyKind, setNewPartyKind] = useState<PartyKind>('debtor')
  const [newPartyName, setNewPartyName] = useState('')
  const [newPartyTerms, setNewPartyTerms] = useState('2/10, n/30')
  const fileRef = useRef<HTMLInputElement>(null)

  const groups: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense']

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault()
    const code = newAcc.code.trim()
    const name = newAcc.name.trim()
    if (!code || !name) {
      toast.error('กรุณากรอกเลขที่บัญชีและชื่อบัญชี')
      return
    }
    if (accounts.some((a) => a.code === code)) {
      toast.error(`มีเลขที่บัญชี ${code} อยู่แล้ว`)
      return
    }
    upsertAccount({ ...newAcc, code, name })
    setNewAcc({ code: '', name: '', type: 'expense', normal: 'dr' })
    toast.success(`เพิ่มบัญชี ${code} ${name} แล้ว`)
  }

  const handleDeleteAccount = (code: string) => {
    if (SYSTEM_ACCOUNTS.includes(code)) {
      toast.error('ไม่สามารถลบบัญชีหลักของระบบได้')
      return
    }
    if (entries.some((e) => e.lines.some((l) => l.account === code))) {
      toast.error('ไม่สามารถลบบัญชีที่มีการบันทึกรายการแล้ว')
      return
    }
    deleteAccount(code)
    toast.success(`ลบบัญชี ${code} แล้ว`)
  }

  const handleAddParty = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPartyName.trim()) {
      toast.error('กรุณากรอกชื่อลูกหนี้หรือเจ้าหนี้')
      return
    }
    const created = addPartyQuick(newPartyKind, newPartyName.trim(), newPartyTerms.trim() || 'n/30')
    setNewPartyName('')
    toast.success(`เพิ่ม ${created.name} (${created.id}) แล้ว`)
  }

  const handleDeleteParty = (id: string) => {
    if (entries.some((e) => e.lines.some((l) => l.partyId === id))) {
      toast.error('ไม่สามารถลบคู่ค้าที่มีรายการบัญชีอ้างอิงอยู่แล้ว')
      return
    }
    deleteParty(id)
    toast.success('ลบรายชื่อคู่ค้าแล้ว')
  }

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await readJSON(file)
      importData(data)
      toast.success('นำเข้าข้อมูลจากไฟล์ JSON เรียบร้อยแล้ว')
    } catch {
      toast.error('ไฟล์ JSON ไม่ถูกต้อง')
    }
    e.target.value = ''
  }

  return (
    <div>
      <div className="app-page-header">
        <div>
          <div className="app-page-title">ผังบัญชี & คู่ค้า</div>
          <div className="app-page-subtitle">โครงสร้างบัญชี รายชื่อลูกหนี้/เจ้าหนี้ และข้อมูลกิจการสมมติ</div>
        </div>
      </div>

      <div className="seg-tabs">
        <button
          type="button"
          className={`seg-tab ${tab === 'accounts' ? 'active' : ''}`}
          onClick={() => setTab('accounts')}
        >
          ผังบัญชี ({accounts.length})
        </button>
        <button
          type="button"
          className={`seg-tab ${tab === 'parties' ? 'active' : ''}`}
          onClick={() => setTab('parties')}
        >
          ลูกหนี้ & เจ้าหนี้ ({parties.length})
        </button>
        <button
          type="button"
          className={`seg-tab ${tab === 'settings' ? 'active' : ''}`}
          onClick={() => setTab('settings')}
        >
          ตั้งค่ากิจการ & นำเข้าข้อมูล
        </button>
      </div>

      {tab === 'accounts' && (
        <>
          <form className="table-card" style={{ padding: 20 }} onSubmit={handleAddAccount}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>เพิ่มบัญชีใหม่ในผังบัญชี</div>
            <div className="form-row-3">
              <input
                type="text"
                className="form-input"
                placeholder="รหัส เช่น 5700"
                value={newAcc.code}
                onChange={(e) => setNewAcc({ ...newAcc, code: e.target.value })}
              />
              <input
                type="text"
                className="form-input"
                placeholder="ชื่อบัญชี เช่น ค่าเสื่อมราคา"
                value={newAcc.name}
                onChange={(e) => setNewAcc({ ...newAcc, name: e.target.value })}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <SelectDropdown
                  value={newAcc.type}
                  options={groups.map((g) => ({ value: g, label: ACCOUNT_TYPE_META[g].label }))}
                  onChange={(val) => {
                    const type = val as AccountType
                    const normal = type === 'asset' || type === 'expense' ? 'dr' : 'cr'
                    setNewAcc({ ...newAcc, type, normal })
                  }}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Plus size={15} /> เพิ่ม
                </button>
              </div>
            </div>
          </form>

          {groups.map((type) => {
            const list = accounts.filter((a) => a.type === type)
            const meta = ACCOUNT_TYPE_META[type]
            const Icon = TYPE_ICON[type]
            return (
              <div className="coa-group" key={type}>
                <div className="coa-group-header">
                  <div className="coa-group-left">
                    <span className="coa-group-icon" style={{ background: meta.color }}>
                      <Icon size={14} />
                    </span>
                    {meta.label}
                  </div>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {list.length} บัญชี
                  </span>
                </div>
                <div className="coa-list">
                  {list.map((a) => {
                    const bal = normalBalanceOf(gl[a.code], a.normal)
                    const isSys = SYSTEM_ACCOUNTS.includes(a.code)
                    return (
                      <div key={a.code} className="coa-item">
                        <div>
                          <div className="coa-item-name">
                            {a.name}
                            {a.isControl && <span className="badge badge-blue">บัญชีคุม</span>}
                            {a.note && !a.isControl && <span className="badge badge-gray">{a.note}</span>}
                          </div>
                          <div className="coa-item-code">
                            {a.code} · ยอดปกติ {a.normal === 'dr' ? 'เดบิต' : 'เครดิต'}
                          </div>
                        </div>
                        <div className="coa-item-balance">฿ {money(bal)}</div>
                        <div>
                          {!isSys && (
                            <button
                              type="button"
                              className="row-action danger"
                              title="ลบบัญชี"
                              onClick={() => handleDeleteAccount(a.code)}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}

      {tab === 'parties' && (
        <>
          <form className="table-card" style={{ padding: 20 }} onSubmit={handleAddParty}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>เพิ่มลูกหนี้หรือเจ้าหนี้ใหม่ (ข้อมูลสมมติ)</div>
            <div className="form-row-3">
              <SelectDropdown
                value={newPartyKind}
                options={[
                  { value: 'debtor', label: 'ลูกหนี้การค้า' },
                  { value: 'creditor', label: 'เจ้าหนี้การค้า' },
                ]}
                onChange={(val) => setNewPartyKind(val as PartyKind)}
              />
              <input
                type="text"
                className="form-input"
                placeholder="ชื่อสมมติ เช่น ร้านสมมติพาณิชย์"
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เงื่อนไข เช่น 2/10, n/30"
                  value={newPartyTerms}
                  onChange={(e) => setNewPartyTerms(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Plus size={15} /> เพิ่ม
                </button>
              </div>
            </div>
          </form>

          {(['debtor', 'creditor'] as PartyKind[]).map((kind) => {
            const list = parties.filter((p) => p.kind === kind)
            return (
              <div className="coa-group" key={kind}>
                <div className="coa-group-header">
                  <div className="coa-group-left">
                    <span
                      className="coa-group-icon"
                      style={{ background: kind === 'debtor' ? '#0066CC' : '#FF9F0A' }}
                    >
                      {kind === 'debtor' ? <User size={14} /> : <Building2 size={14} />}
                    </span>
                    {kind === 'debtor' ? 'รายชื่อลูกหนี้การค้า' : 'รายชื่อเจ้าหนี้การค้า'}
                  </div>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {list.length} ราย
                  </span>
                </div>
                <div className="coa-list">
                  {list.map((p) => (
                    <div key={p.id} className="coa-item">
                      <div>
                        <div className="coa-item-name">{p.name}</div>
                        <div className="coa-item-code">
                          {p.id} · เงื่อนไข {p.terms}
                        </div>
                      </div>
                      <div />
                      <button
                        type="button"
                        className="row-action danger"
                        onClick={() => handleDeleteParty(p.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}

      {tab === 'settings' && (
        <div className="table-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>ข้อมูลกิจการและงวดบัญชี</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ชื่อกิจการสมมติ</label>
              <input
                type="text"
                className="form-input"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">ชื่อย่อบนแถบนำทาง</label>
              <input
                type="text"
                className="form-input"
                value={company.shortName}
                onChange={(e) => setCompany({ ...company, shortName: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">วันเริ่มต้นงวดบัญชี</label>
              <input
                type="date"
                className="form-input"
                value={company.periodStart}
                onChange={(e) => setCompany({ ...company, periodStart: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">วันสิ้นสุดงวดบัญชี</label>
              <input
                type="date"
                className="form-input"
                value={company.periodEnd}
                onChange={(e) => setCompany({ ...company, periodEnd: e.target.value })}
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--gray-4)', margin: '20px 0' }} />

          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>กู้คืนข้อมูลจากไฟล์ JSON</div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportJSON}
          />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={16} /> นำเข้าไฟล์สำรอง (.json)
          </button>
        </div>
      )}
    </div>
  )
}
