import { toSatang, satangToInput } from '../format'
import { ACC } from './chart'
import type { Book, Entry, Line } from './types'

/**
 * แปลงข้อมูลจากฟอร์มของสมุดแต่ละเล่ม → บรรทัดเดบิต/เครดิต (Line)
 * และแปลงกลับเพื่อใช้แก้ไขรายการ
 */

export interface OtherRow {
  account: string
  amount: string
}

export interface GeneralRow {
  account: string
  dr: string
  cr: string
  partyId: string
}

export interface EntryForm {
  book: Book
  date: string
  docNo: string
  memo: string
  reason: string
  terms: string
  partyId: string
  /** สมุดซื้อ/ขาย */
  amount: string
  /** สมุดรับเงิน/จ่ายเงิน */
  cash: string
  discount: string
  ar: string
  sales: string
  ap: string
  purchase: string
  others: OtherRow[]
  /** สมุดทั่วไป */
  lines: GeneralRow[]
}

export function emptyForm(book: Book, date: string): EntryForm {
  return {
    book,
    date,
    docNo: '',
    memo: '',
    reason: '',
    terms: '',
    partyId: '',
    amount: '',
    cash: '',
    discount: '',
    ar: '',
    sales: '',
    ap: '',
    purchase: '',
    others: [],
    lines: [
      { account: '', dr: '', cr: '', partyId: '' },
      { account: '', dr: '', cr: '', partyId: '' },
    ],
  }
}

const L = (
  account: string,
  dr: number,
  cr: number,
  column: Line['column'],
  partyId?: string,
): Line => ({
  account,
  dr,
  cr,
  column,
  ...(partyId ? { partyId } : {}),
})

export function formToLines(f: EntryForm): Line[] {
  const s = toSatang
  switch (f.book) {
    case 'purchase': {
      const a = s(f.amount)
      return [L(ACC.PURCHASE, a, 0, 'purchase'), L(ACC.AP, 0, a, 'ap', f.partyId)]
    }
    case 'sales': {
      const a = s(f.amount)
      return [L(ACC.AR, a, 0, 'ar', f.partyId), L(ACC.SALES, 0, a, 'sales')]
    }
    case 'receipt': {
      const lines: Line[] = [
        L(ACC.CASH, s(f.cash), 0, 'cash'),
        L(ACC.DISC_ALLOWED, s(f.discount), 0, 'discAllowed'),
        L(ACC.AR, 0, s(f.ar), 'ar', s(f.ar) ? f.partyId : undefined),
        L(ACC.SALES, 0, s(f.sales), 'sales'),
        ...f.others.map((o) => L(o.account, 0, s(o.amount), 'other')),
      ]
      return lines.filter(
        (l) => l.dr !== 0 || l.cr !== 0 || Number.isNaN(l.dr) || Number.isNaN(l.cr),
      )
    }
    case 'payment': {
      const lines: Line[] = [
        L(ACC.AP, s(f.ap), 0, 'ap', s(f.ap) ? f.partyId : undefined),
        L(ACC.PURCHASE, s(f.purchase), 0, 'purchase'),
        ...f.others.map((o) => L(o.account, s(o.amount), 0, 'other')),
        L(ACC.DISC_RECEIVED, 0, s(f.discount), 'discReceived'),
        L(ACC.CASH, 0, s(f.cash), 'cash'),
      ]
      return lines.filter(
        (l) => l.dr !== 0 || l.cr !== 0 || Number.isNaN(l.dr) || Number.isNaN(l.cr),
      )
    }
    case 'general':
      return f.lines
        .filter((r) => r.account || r.dr || r.cr)
        .map((r) => L(r.account, s(r.dr), s(r.cr), 'general', r.partyId || undefined))
  }
}

export function formToEntry(f: EntryForm): Omit<Entry, 'id' | 'createdAt'> {
  return {
    book: f.book,
    date: f.date,
    docNo: f.docNo.trim(),
    memo: f.memo.trim(),
    ...(f.reason.trim() ? { reason: f.reason.trim() } : {}),
    ...(f.terms.trim() ? { terms: f.terms.trim() } : {}),
    lines: formToLines(f),
  }
}

export function entryToForm(e: Entry): EntryForm {
  const f = emptyForm(e.book, e.date)
  f.docNo = e.docNo
  f.memo = e.memo
  f.reason = e.reason ?? ''
  f.terms = e.terms ?? ''
  const get = (col: Line['column']) => e.lines.find((l) => l.column === col)
  const amt = (l?: Line) => satangToInput(l ? l.dr || l.cr : 0)
  switch (e.book) {
    case 'purchase':
      f.amount = amt(get('ap'))
      f.partyId = get('ap')?.partyId ?? ''
      break
    case 'sales':
      f.amount = amt(get('ar'))
      f.partyId = get('ar')?.partyId ?? ''
      break
    case 'receipt':
    case 'payment':
      f.cash = amt(get('cash'))
      f.discount = amt(get(e.book === 'receipt' ? 'discAllowed' : 'discReceived'))
      f.ar = amt(get('ar'))
      f.ap = amt(get('ap'))
      f.sales = amt(get('sales'))
      f.purchase = amt(get('purchase'))
      f.partyId = (get('ar') ?? get('ap'))?.partyId ?? ''
      f.others = e.lines
        .filter((l) => l.column === 'other')
        .map((l) => ({ account: l.account, amount: amt(l) }))
      break
    case 'general':
      f.lines = e.lines.map((l) => ({
        account: l.account,
        dr: satangToInput(l.dr),
        cr: satangToInput(l.cr),
        partyId: l.partyId ?? '',
      }))
      while (f.lines.length < 2) f.lines.push({ account: '', dr: '', cr: '', partyId: '' })
      break
  }
  return f
}

export function totals(lines: Line[]) {
  const dr = lines.reduce((s, l) => s + (Number.isNaN(l.dr) ? 0 : l.dr), 0)
  const cr = lines.reduce((s, l) => s + (Number.isNaN(l.cr) ? 0 : l.cr), 0)
  return { dr, cr, diff: dr - cr }
}
