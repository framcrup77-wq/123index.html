/**
 * ประเภทข้อมูลหลักของระบบบัญชีร้านใบไม้
 * จำนวนเงินทุกช่องเก็บเป็น "สตางค์" (จำนวนเต็ม) เพื่อป้องกันความคลาดเคลื่อนของทศนิยม
 */

export type Book = 'purchase' | 'sales' | 'receipt' | 'payment' | 'general'

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export type Side = 'dr' | 'cr'

export interface Account {
  code: string
  name: string
  type: AccountType
  normal: Side
  isControl?: boolean
  note?: string
}

export type PartyKind = 'debtor' | 'creditor'

export interface Party {
  id: string
  kind: PartyKind
  name: string
  terms: string
}

/** ช่องของสมุดรายวันที่บรรทัดนั้นอยู่ ใช้กำหนดวิธีผ่านรายการ */
export type Column =
  | 'cash'
  | 'ar'
  | 'ap'
  | 'sales'
  | 'purchase'
  | 'discAllowed'
  | 'discReceived'
  | 'other'
  | 'general'

export interface Line {
  account: string
  dr: number
  cr: number
  column: Column
  partyId?: string
}

export interface Entry {
  id: string
  book: Book
  /** วันที่แบบ ISO (ค.ศ.) YYYY-MM-DD */
  date: string
  docNo: string
  memo: string
  /** เหตุผลว่าทำไมจึงบันทึกในสมุดรายวันเล่มนี้ (ใช้ประกอบการเรียนรู้และรายงาน AC101) */
  reason?: string
  terms?: string
  lines: Line[]
  isTest?: boolean
  createdAt: number
}

export interface Posting {
  key: string
  date: string
  description: string
  ref: string
  dr: number
  cr: number
  kind: 'line' | 'total'
  book: Book
  entryId?: string
  memo?: string
}

export interface Company {
  name: string
  shortName: string
  owner: string
  periodStart: string
  periodEnd: string
}
