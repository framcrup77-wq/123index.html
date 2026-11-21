import { ACC, BOOKS, accountName } from './chart'
import type { Account, Book, Entry, Line, Party, PartyKind, Posting, Side } from './types'

/**
 * กฎการผ่านรายการบัญชีสมุดรายวันเฉพาะ (AC101)
 * - สมุดรายวันเฉพาะ: ช่องเฉพาะผ่าน "ยอดรวมสิ้นเดือน" ไปบัญชีแยกประเภททั่วไป
 *   ช่องบัญชีอื่น ๆ ผ่าน "รายตัว" ตามวันที่เกิดรายการ
 * - สมุดรายวันทั่วไป: ผ่าน "รายตัว" ทุกบรรทัด
 * - บรรทัดที่มีชื่อลูกหนี้/เจ้าหนี้: ผ่าน "รายตัว" ไปบัญชีย่อยตามวันที่ของรายการทันที
 */

export const sideOf = (l: Line): Side => (l.dr > 0 ? 'dr' : 'cr')
export const amountOf = (l: Line): number => (l.dr > 0 ? l.dr : l.cr)

export const monthKey = (iso: string) => iso.slice(0, 7)

export function lastDayOfMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${ym}-${String(d).padStart(2, '0')}`
}

/** เลขหน้าสมุด: หนึ่งเดือนต่อหนึ่งหน้า นับจากเดือนแรกที่มีรายการ */
export function pageMap(entries: Entry[]): Map<string, number> {
  const months = [...new Set(entries.map((e) => monthKey(e.date)))].sort()
  return new Map(months.map((m, i) => [m, i + 1]))
}

export function refOf(book: Book, date: string, pages: Map<string, number>): string {
  return `${BOOKS[book].abbr}.${pages.get(monthKey(date)) ?? 1}`
}

export function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
}

/** ชื่อบัญชีด้านตรงข้าม ใช้เป็น "รายการ" ในบัญชีแยกประเภทตามหลักการบัญชี */
function contraNames(entry: Entry, line: Line, accounts: Account[]): string {
  const side = sideOf(line)
  const names = entry.lines
    .filter((l) => amountOf(l) > 0 && sideOf(l) !== side)
    .map((l) => accountName(accounts, l.account))
  const unique = [...new Set(names)]
  return unique.length ? unique.join(', ') : entry.memo || '-'
}

export const isSpecial = (book: Book) => book !== 'general'

export function isTotalPosted(entry: Entry, line: Line): boolean {
  return isSpecial(entry.book) && line.column !== 'other'
}

export type GeneralLedger = Record<string, Posting[]>

export function buildGeneralLedger(entries: Entry[], accounts: Account[]): GeneralLedger {
  const pages = pageMap(entries)
  const gl: GeneralLedger = {}
  const push = (code: string, p: Posting) => {
    ;(gl[code] ??= []).push(p)
  }
  const totalsMap = new Map<string, Posting>()

  for (const entry of sortEntries(entries)) {
    entry.lines.forEach((line, idx) => {
      const amt = amountOf(line)
      if (amt <= 0) return
      const side = sideOf(line)
      if (isTotalPosted(entry, line)) {
        const ym = monthKey(entry.date)
        const key = `${entry.book}|${ym}|${line.account}|${side}`
        const t = totalsMap.get(key)
        if (t) {
          t.dr += line.dr
          t.cr += line.cr
        } else {
          totalsMap.set(key, {
            key,
            date: lastDayOfMonth(ym),
            description: `ยอดรวม${BOOKS[entry.book].name}`,
            ref: refOf(entry.book, entry.date, pages),
            dr: line.dr,
            cr: line.cr,
            kind: 'total',
            book: entry.book,
          })
        }
      } else {
        push(line.account, {
          key: `${entry.id}:${idx}`,
          date: entry.date,
          description: contraNames(entry, line, accounts),
          ref: refOf(entry.book, entry.date, pages),
          dr: line.dr,
          cr: line.cr,
          kind: 'line',
          book: entry.book,
          entryId: entry.id,
          memo: entry.memo,
        })
      }
    })
  }

  for (const t of totalsMap.values()) {
    const code = t.key.split('|')[2]
    push(code, t)
  }

  for (const code of Object.keys(gl)) {
    gl[code].sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.kind === b.kind ? 0 : a.kind === 'line' ? -1 : 1),
    )
  }
  return gl
}

export const controlOf = (kind: PartyKind) => (kind === 'debtor' ? ACC.AR : ACC.AP)

export type SubLedger = Record<string, Posting[]>

export function buildSubLedger(entries: Entry[], kind: PartyKind): SubLedger {
  const pages = pageMap(entries)
  const control = controlOf(kind)
  const sub: SubLedger = {}
  for (const entry of sortEntries(entries)) {
    entry.lines.forEach((line, idx) => {
      if (line.account !== control || !line.partyId || amountOf(line) <= 0) return
      ;(sub[line.partyId] ??= []).push({
        key: `${entry.id}:${idx}`,
        date: entry.date,
        description: entry.memo || entry.docNo || BOOKS[entry.book].name,
        ref: refOf(entry.book, entry.date, pages),
        dr: line.dr,
        cr: line.cr,
        kind: 'line',
        book: entry.book,
        entryId: entry.id,
      })
    })
  }
  return sub
}

/** ยอดคงเหลือ (เดบิต − เครดิต) */
export function balanceOf(postings: Posting[] | undefined): number {
  return (postings ?? []).reduce((s, p) => s + p.dr - p.cr, 0)
}

/** ยอดคงเหลือตามด้านปกติของบัญชีนั้น */
export function normalBalanceOf(postings: Posting[] | undefined, normal: Side): number {
  const raw = balanceOf(postings)
  return normal === 'dr' ? raw : -raw
}

export interface TraceStep {
  account: string
  accountName: string
  side: Side
  amount: number
  mode: 'individual' | 'total'
  party?: Party
}

/** อธิบายว่าแต่ละบรรทัดของรายการถูกผ่านไปที่ใด (ใช้ในหน้าต่าง "ดูการผ่านรายการ") */
export function traceEntry(entry: Entry, accounts: Account[], parties: Party[]): TraceStep[] {
  return entry.lines
    .filter((l) => amountOf(l) > 0)
    .map((l) => ({
      account: l.account,
      accountName: accountName(accounts, l.account),
      side: sideOf(l),
      amount: amountOf(l),
      mode: isTotalPosted(entry, l) ? 'total' : 'individual',
      party: l.partyId ? parties.find((p) => p.id === l.partyId) : undefined,
    }))
}
