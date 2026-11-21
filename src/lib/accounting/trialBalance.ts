import { ACC, accountName } from './chart'
import { balanceOf, buildSubLedger, controlOf, type GeneralLedger } from './posting'
import type { Account, Entry, Party, PartyKind } from './types'

export interface TrialRow {
  code: string
  name: string
  dr: number
  cr: number
  /** ยอดคงเหลืออยู่ผิดด้านจากยอดปกติ (W-04) */
  wrongSide: boolean
}

export interface TrialBalance {
  rows: TrialRow[]
  totalDr: number
  totalCr: number
  diff: number
  balanced: boolean
}

export function buildTrialBalance(gl: GeneralLedger, accounts: Account[]): TrialBalance {
  const rows: TrialRow[] = []
  for (const code of Object.keys(gl).sort()) {
    const bal = balanceOf(gl[code])
    if (bal === 0) continue
    const acc = accounts.find((a) => a.code === code)
    const side = bal > 0 ? 'dr' : 'cr'
    rows.push({
      code,
      name: accountName(accounts, code),
      dr: bal > 0 ? bal : 0,
      cr: bal < 0 ? -bal : 0,
      wrongSide: acc ? acc.normal !== side : false,
    })
  }
  const totalDr = rows.reduce((s, r) => s + r.dr, 0)
  const totalCr = rows.reduce((s, r) => s + r.cr, 0)
  return { rows, totalDr, totalCr, diff: totalDr - totalCr, balanced: totalDr === totalCr }
}

export interface PartyBalance {
  party: Party
  /** ยอดคงเหลือตามด้านปกติ (ลูกหนี้ = เดบิต, เจ้าหนี้ = เครดิต) */
  balance: number
}

export interface Reconciliation {
  kind: PartyKind
  control: number
  subTotal: number
  diff: number
  ok: boolean
  parties: PartyBalance[]
}

/** เทียบยอดรวมบัญชีย่อยกับบัญชีคุม (W-02, W-03) */
export function reconcile(
  gl: GeneralLedger,
  entries: Entry[],
  parties: Party[],
  kind: PartyKind,
): Reconciliation {
  const sign = kind === 'debtor' ? 1 : -1
  const sub = buildSubLedger(entries, kind)
  const control = sign * balanceOf(gl[controlOf(kind)])
  const list = parties
    .filter((p) => p.kind === kind)
    .map((party) => ({ party, balance: sign * balanceOf(sub[party.id]) }))
  const subTotal = Object.values(sub).reduce((s, ps) => s + sign * balanceOf(ps), 0)
  return {
    kind,
    control,
    subTotal,
    diff: control - subTotal,
    ok: control === subTotal,
    parties: list,
  }
}

export type WarningLevel = 'error' | 'warning' | 'ok'

export interface LedgerWarning {
  code: 'W-01' | 'W-02' | 'W-03' | 'W-04' | 'OK'
  level: WarningLevel
  title: string
  detail?: string
  amount?: number
}

export function collectWarnings(
  tb: TrialBalance,
  ar: Reconciliation,
  ap: Reconciliation,
): LedgerWarning[] {
  const w: LedgerWarning[] = []
  if (!tb.balanced) {
    w.push({
      code: 'W-01',
      level: 'error',
      title: 'งบทดลองไม่สมดุล — ยอดเดบิตไม่เท่ากับยอดเครดิต!',
      detail: 'กรุณาตรวจสอบรายการที่มีป้าย "รายการทดสอบ" หรือรายการที่ไม่สมดุลในสมุดรายวัน',
      amount: Math.abs(tb.diff),
    })
  }
  if (!ar.ok) {
    w.push({
      code: 'W-02',
      level: 'warning',
      title: 'บัญชีย่อยลูกหนี้ไม่ตรงกับบัญชีคุมลูกหนี้การค้า',
      detail: `บัญชีคุม ${ACC.AR} ไม่เท่ากับยอดรวมบัญชีลูกหนี้รายตัว`,
      amount: Math.abs(ar.diff),
    })
  }
  if (!ap.ok) {
    w.push({
      code: 'W-03',
      level: 'warning',
      title: 'บัญชีย่อยเจ้าหนี้ไม่ตรงกับบัญชีคุมเจ้าหนี้การค้า',
      detail: `บัญชีคุม ${ACC.AP} ไม่เท่ากับยอดรวมบัญชีเจ้าหนี้รายตัว`,
      amount: Math.abs(ap.diff),
    })
  }
  const wrong = tb.rows.filter((r) => r.wrongSide)
  if (wrong.length) {
    w.push({
      code: 'W-04',
      level: 'warning',
      title: 'มีบัญชีที่ยอดคงเหลืออยู่ผิดด้านจากยอดปกติ',
      detail: wrong.map((r) => `${r.code} ${r.name}`).join(', '),
    })
  }
  if (!w.length) {
    w.push({
      code: 'OK',
      level: 'ok',
      title: 'ยอดเดบิตและเครดิตสมดุลกัน — บัญชีย่อยตรงกับบัญชีคุม',
    })
  }
  return w
}
