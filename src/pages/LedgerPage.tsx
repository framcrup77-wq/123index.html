import { useState } from 'react'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Landmark,
  Receipt,
  Scale,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react'
import {
  ACC,
  ACCOUNT_TYPE_META,
  normalBalanceOf,
  type Account,
  type AccountType,
  type Posting,
  type Side,
} from '@/lib/accounting'
import { money } from '@/lib/format'
import { useBooks } from '@/store/useBooks'
import { useLedger } from '@/hooks/useLedger'
import { AccountDetailModal } from '@/components/AccountDetailModal'

const TYPE_ICON: Record<AccountType, typeof Wallet> = {
  asset: Wallet,
  liability: Scale,
  equity: Landmark,
  revenue: TrendingUp,
  expense: Receipt,
}

type Tab = 'general' | 'debtor' | 'creditor'

export function LedgerPage() {
  const accounts = useBooks((s) => s.accounts)
  const { gl, arSub, apSub, ar, ap } = useLedger()
  const [tab, setTab] = useState<Tab>('general')
  const [detail, setDetail] = useState<{
    title: string
    subtitle: string
    normal: Side
    postings: Posting[]
  } | null>(null)

  const activeAccounts = accounts.filter((a) => (gl[a.code]?.length ?? 0) > 0)
  const groups: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense']

  const openAccount = (a: Account) => {
    setDetail({
      title: `${a.code} · ${a.name}`,
      subtitle: `บัญชีแยกประเภททั่วไป · หมวด${ACCOUNT_TYPE_META[a.type].label}`,
      normal: a.normal,
      postings: gl[a.code] ?? [],
    })
  }

  return (
    <div>
      <div className="app-page-header">
        <div>
          <div className="app-page-title">บัญชีแยกประเภท</div>
          <div className="app-page-subtitle">
            ผ่านรายการอัตโนมัติจากสมุดรายวัน 5 เล่ม — คลิกที่แต่ละบัญชีเพื่อดูรายละเอียดเคลื่อนไหว
          </div>
        </div>
      </div>

      <div className="seg-tabs">
        <button
          type="button"
          className={`seg-tab ${tab === 'general' ? 'active' : ''}`}
          onClick={() => setTab('general')}
        >
          บัญชีแยกประเภททั่วไป ({activeAccounts.length})
        </button>
        <button
          type="button"
          className={`seg-tab ${tab === 'debtor' ? 'active' : ''}`}
          onClick={() => setTab('debtor')}
        >
          บัญชีย่อยลูกหนี้ ({ar.parties.length})
        </button>
        <button
          type="button"
          className={`seg-tab ${tab === 'creditor' ? 'active' : ''}`}
          onClick={() => setTab('creditor')}
        >
          บัญชีย่อยเจ้าหนี้ ({ap.parties.length})
        </button>
      </div>

      {/* แท็บ 1: บัญชีแยกประเภททั่วไป */}
      {tab === 'general' && (
        <>
          {activeAccounts.length === 0 ? (
            <div className="table-card">
              <div className="empty-state">
                <div className="empty-state-title">ยังไม่มีรายการในบัญชีแยกประเภท</div>
                <div className="empty-state-desc">
                  บันทึกรายการในสมุดรายวัน หรือกดปุ่ม "โหลดตัวอย่าง" เพื่อดูบัญชีแยกประเภทอัตโนมัติ
                </div>
              </div>
            </div>
          ) : (
            groups.map((type) => {
              const list = activeAccounts.filter((a) => a.type === type)
              if (list.length === 0) return null
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
                      return (
                        <div
                          key={a.code}
                          className="coa-item clickable"
                          onClick={() => openAccount(a)}
                        >
                          <div>
                            <div className="coa-item-name">
                              {a.name}
                              {a.isControl && <span className="badge badge-blue">บัญชีคุม</span>}
                            </div>
                            <div className="coa-item-code">
                              {a.code} · {gl[a.code]?.length ?? 0} รายการผ่านบัญชี
                            </div>
                          </div>
                          <div className="coa-item-balance">฿ {money(bal)}</div>
                          <ChevronRight size={16} color="var(--gray-1)" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </>
      )}

      {/* แท็บ 2: บัญชีย่อยลูกหนี้การค้า */}
      {tab === 'debtor' && (
        <>
          <div className={`tb-alert ${ar.ok ? 'success' : 'warning'}`}>
            <div className="tb-alert-left">
              {ar.ok ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              <div>
                <strong>
                  {ar.ok
                    ? 'ยอดรวมบัญชีย่อยลูกหนี้ตรงกับบัญชีคุมลูกหนี้การค้า (1100)'
                    : 'ยอดรวมบัญชีย่อยลูกหนี้ไม่ตรงกับบัญชีคุมลูกหนี้การค้า!'}
                </strong>
                <div style={{ fontSize: 14, marginTop: 2 }}>
                  รวมบัญชีย่อย: ฿ {money(ar.subTotal)} · บัญชีคุม ({ACC.AR}): ฿ {money(ar.control)}
                </div>
              </div>
            </div>
          </div>

          <div className="coa-group">
            <div className="coa-group-header">
              <div className="coa-group-left">
                <span className="coa-group-icon" style={{ background: '#0066CC' }}>
                  <User size={15} />
                </span>
                บัญชีย่อยลูกหนี้การค้ารายตัว
              </div>
              <span className="muted" style={{ fontSize: 13 }}>
                คลิกเพื่อดูรายละเอียด
              </span>
            </div>
            <div className="coa-list">
              {ar.parties.map(({ party, balance }) => (
                <div
                  key={party.id}
                  className="coa-item clickable"
                  onClick={() =>
                    setDetail({
                      title: `บัญชีย่อยลูกหนี้ — ${party.name}`,
                      subtitle: `รหัส ${party.id} · เงื่อนไข ${party.terms}`,
                      normal: 'dr',
                      postings: arSub[party.id] ?? [],
                    })
                  }
                >
                  <div>
                    <div className="coa-item-name">{party.name}</div>
                    <div className="coa-item-code">
                      {party.id} · เงื่อนไข {party.terms} · {(arSub[party.id] ?? []).length} รายการ
                    </div>
                  </div>
                  <div className="coa-item-balance">฿ {money(balance)}</div>
                  <ChevronRight size={16} color="var(--gray-1)" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* แท็บ 3: บัญชีย่อยเจ้าหนี้การค้า */}
      {tab === 'creditor' && (
        <>
          <div className={`tb-alert ${ap.ok ? 'success' : 'warning'}`}>
            <div className="tb-alert-left">
              {ap.ok ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              <div>
                <strong>
                  {ap.ok
                    ? 'ยอดรวมบัญชีย่อยเจ้าหนี้ตรงกับบัญชีคุมเจ้าหนี้การค้า (2100)'
                    : 'ยอดรวมบัญชีย่อยเจ้าหนี้ไม่ตรงกับบัญชีคุมเจ้าหนี้การค้า!'}
                </strong>
                <div style={{ fontSize: 14, marginTop: 2 }}>
                  รวมบัญชีย่อย: ฿ {money(ap.subTotal)} · บัญชีคุม ({ACC.AP}): ฿ {money(ap.control)}
                </div>
              </div>
            </div>
          </div>

          <div className="coa-group">
            <div className="coa-group-header">
              <div className="coa-group-left">
                <span className="coa-group-icon" style={{ background: '#FF9F0A' }}>
                  <Building2 size={15} />
                </span>
                บัญชีย่อยเจ้าหนี้การค้ารายตัว
              </div>
              <span className="muted" style={{ fontSize: 13 }}>
                คลิกเพื่อดูรายละเอียด
              </span>
            </div>
            <div className="coa-list">
              {ap.parties.map(({ party, balance }) => (
                <div
                  key={party.id}
                  className="coa-item clickable"
                  onClick={() =>
                    setDetail({
                      title: `บัญชีย่อยเจ้าหนี้ — ${party.name}`,
                      subtitle: `รหัส ${party.id} · เงื่อนไข ${party.terms}`,
                      normal: 'cr',
                      postings: apSub[party.id] ?? [],
                    })
                  }
                >
                  <div>
                    <div className="coa-item-name">{party.name}</div>
                    <div className="coa-item-code">
                      {party.id} · เงื่อนไข {party.terms} · {(apSub[party.id] ?? []).length} รายการ
                    </div>
                  </div>
                  <div className="coa-item-balance">฿ {money(balance)}</div>
                  <ChevronRight size={16} color="var(--gray-1)" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <AccountDetailModal
        open={!!detail}
        title={detail?.title ?? ''}
        subtitle={detail?.subtitle ?? ''}
        normal={detail?.normal ?? 'dr'}
        postings={detail?.postings ?? []}
        onClose={() => setDetail(null)}
      />
    </div>
  )
}
