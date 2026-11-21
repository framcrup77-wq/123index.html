import type { Account, Book, Company, Party } from './types'

/** เลขที่บัญชีหลักที่ระบบใช้เป็นช่องเฉพาะของสมุดรายวัน (4 หลัก ตามผังบัญชีร้านใบไม้) */
export const ACC = {
  CASH: '1000',
  BANK: '1010',
  AR: '1100',
  AP: '2100',
  OTHER_AP: '2150',
  SALES: '4000',
  SALES_RETURN: '4010',
  DISC_ALLOWED: '4020',
  PURCHASE: '5000',
  PURCHASE_RETURN: '5010',
  DISC_RECEIVED: '5020',
} as const

export const SYSTEM_ACCOUNTS: string[] = [
  ACC.CASH,
  ACC.AR,
  ACC.AP,
  ACC.SALES,
  ACC.DISC_ALLOWED,
  ACC.PURCHASE,
  ACC.DISC_RECEIVED,
]

export const DEFAULT_COMPANY: Company = {
  name: 'ร้านใบไม้เครื่องเขียน',
  shortName: 'บัญชีร้านใบไม้',
  owner: 'เจ้าของกิจการ (สมมติ)',
  periodStart: '2026-11-01',
  periodEnd: '2026-11-30',
}

export const DEFAULT_ACCOUNTS: Account[] = [
  // หมวด 1 สินทรัพย์
  { code: '1000', name: 'เงินสด', type: 'asset', normal: 'dr' },
  { code: '1010', name: 'เงินฝากธนาคาร', type: 'asset', normal: 'dr' },
  { code: '1100', name: 'ลูกหนี้การค้า', type: 'asset', normal: 'dr', isControl: true, note: 'บัญชีคุมลูกหนี้' },
  { code: '1200', name: 'สินค้าคงเหลือ', type: 'asset', normal: 'dr' },
  { code: '1300', name: 'อุปกรณ์สำนักงาน', type: 'asset', normal: 'dr' },
  { code: '1400', name: 'วัสดุสำนักงาน', type: 'asset', normal: 'dr' },

  // หมวด 2 หนี้สิน
  { code: '2100', name: 'เจ้าหนี้การค้า', type: 'liability', normal: 'cr', isControl: true, note: 'บัญชีคุมเจ้าหนี้' },
  { code: '2150', name: 'เจ้าหนี้อื่น', type: 'liability', normal: 'cr', note: 'หนี้ที่ไม่ได้เกิดจากการซื้อสินค้าเพื่อขาย' },
  { code: '2200', name: 'เงินกู้ยืม', type: 'liability', normal: 'cr' },

  // หมวด 3 ส่วนของเจ้าของ (ทุน)
  { code: '3000', name: 'ทุน', type: 'equity', normal: 'cr' },
  { code: '3100', name: 'ถอนใช้ส่วนตัว', type: 'equity', normal: 'dr' },

  // หมวด 4 รายได้
  { code: '4000', name: 'ขาย', type: 'revenue', normal: 'cr' },
  { code: '4010', name: 'รับคืนสินค้า', type: 'revenue', normal: 'dr', note: 'บัญชีปรับลดยอดขาย' },
  { code: '4020', name: 'ส่วนลดจ่าย', type: 'revenue', normal: 'dr', note: 'บัญชีปรับลดยอดขาย' },
  { code: '4100', name: 'รายได้ดอกเบี้ย', type: 'revenue', normal: 'cr' },
  { code: '4200', name: 'รายได้อื่น', type: 'revenue', normal: 'cr' },

  // หมวด 5 ค่าใช้จ่าย
  { code: '5000', name: 'ซื้อ', type: 'expense', normal: 'dr' },
  { code: '5010', name: 'ส่งคืนสินค้า', type: 'expense', normal: 'cr', note: 'บัญชีปรับลดยอดซื้อ' },
  { code: '5020', name: 'ส่วนลดรับ', type: 'expense', normal: 'cr', note: 'บัญชีปรับลดยอดซื้อ' },
  { code: '5100', name: 'ค่าเช่า', type: 'expense', normal: 'dr' },
  { code: '5200', name: 'ค่าจ้าง', type: 'expense', normal: 'dr' },
  { code: '5300', name: 'ค่าสาธารณูปโภค', type: 'expense', normal: 'dr' },
  { code: '5400', name: 'ค่าขนส่ง', type: 'expense', normal: 'dr' },
  { code: '5500', name: 'ค่าประกันภัย', type: 'expense', normal: 'dr' },
  { code: '5600', name: 'ค่าโฆษณา', type: 'expense', normal: 'dr' },
  { code: '5900', name: 'ค่าใช้จ่ายอื่น', type: 'expense', normal: 'dr' },
]

export const DEFAULT_PARTIES: Party[] = [
  { id: 'ลน-01', kind: 'debtor', name: 'นาย สมชาย ใจดี', terms: '2/10, n/30' },
  { id: 'ลน-02', kind: 'debtor', name: 'นาง สมหญิง รักเรียน', terms: '2/10, n/30' },
  { id: 'จน-01', kind: 'creditor', name: 'บจก. เอ็มเคเครื่องเขียน', terms: '2/10, n/30' },
  { id: 'จน-02', kind: 'creditor', name: 'หจก. สำนักงานสมบูรณ์', terms: '2/10, n/30' },
]

export const ACCOUNT_TYPE_META: Record<
  Account['type'],
  { label: string; color: string; badgeClass: string }
> = {
  asset: { label: 'สินทรัพย์', color: '#0066CC', badgeClass: 'badge-blue' },
  liability: { label: 'หนี้สิน', color: '#FF9F0A', badgeClass: 'badge-orange' },
  equity: { label: 'ส่วนของเจ้าของ (ทุน)', color: '#BF5AF2', badgeClass: 'badge-purple' },
  revenue: { label: 'รายได้', color: '#30D158', badgeClass: 'badge-green' },
  expense: { label: 'ค่าใช้จ่าย', color: '#FF375F', badgeClass: 'badge-pink' },
}

export interface BookMeta {
  name: string
  short: string
  abbr: string
  color: string
  badgeClass: string
  description: string
  addLabel: string
}

export const BOOK_ORDER: Book[] = ['purchase', 'sales', 'receipt', 'payment', 'general']

export const BOOKS: Record<Book, BookMeta> = {
  purchase: {
    name: 'สมุดรายวันซื้อ',
    short: 'ซื้อ',
    abbr: 'ซ',
    color: '#0066CC',
    badgeClass: 'badge-blue',
    description: 'บันทึกการซื้อสินค้าเพื่อขายเป็นเงินเชื่อเท่านั้น',
    addLabel: 'เพิ่มรายการซื้อเชื่อ',
  },
  sales: {
    name: 'สมุดรายวันขาย',
    short: 'ขาย',
    abbr: 'ข',
    color: '#30D158',
    badgeClass: 'badge-green',
    description: 'บันทึกการขายสินค้าเป็นเงินเชื่อเท่านั้น',
    addLabel: 'เพิ่มรายการขายเชื่อ',
  },
  receipt: {
    name: 'สมุดรายวันรับเงิน',
    short: 'รับเงิน',
    abbr: 'ร',
    color: '#FF9F0A',
    badgeClass: 'badge-orange',
    description: 'บันทึกทุกรายการที่มีการรับเงินสด (รับชำระลูกหนี้ ขายสด เงินลงทุน ฯลฯ)',
    addLabel: 'เพิ่มรายการรับเงิน',
  },
  payment: {
    name: 'สมุดรายวันจ่ายเงิน',
    short: 'จ่ายเงิน',
    abbr: 'จ',
    color: '#BF5AF2',
    badgeClass: 'badge-purple',
    description: 'บันทึกทุกรายการที่มีการจ่ายเงินสด (จ่ายเจ้าหนี้ ซื้อสด ค่าใช้จ่าย ฝากธนาคาร ฯลฯ)',
    addLabel: 'เพิ่มรายการจ่ายเงิน',
  },
  general: {
    name: 'สมุดรายวันทั่วไป',
    short: 'ทั่วไป',
    abbr: 'ท',
    color: '#FF375F',
    badgeClass: 'badge-pink',
    description: 'บันทึกรายการที่บันทึกในสมุดรายวันเฉพาะไม่ได้ (ซื้อสินทรัพย์เงินเชื่อ ส่งคืน รับคืน ฯลฯ)',
    addLabel: 'เพิ่มรายการทั่วไป',
  },
}

export function accountName(accounts: Account[], code: string): string {
  return accounts.find((a) => a.code === code)?.name ?? `(ไม่พบบัญชี ${code})`
}
