/** แปลงข้อความ/ตัวเลขบาทเป็นสตางค์ (จำนวนเต็ม) คืน NaN หากไม่ใช่ตัวเลข */
export function toSatang(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0
  const s = String(value).replace(/,/g, '').trim()
  if (s === '') return 0
  const n = Number(s)
  if (!Number.isFinite(n)) return NaN
  return Math.round(n * 100)
}

/** สตางค์ → ข้อความสำหรับช่องกรอก */
export function satangToInput(v: number): string {
  if (!v) return ''
  return (v / 100).toFixed(2)
}

const nf = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** สตางค์ → 27,440.00 */
export function money(v: number): string {
  return nf.format(v / 100)
}

/** แสดงค่าว่างหรือขีดเมื่อเป็น 0 */
export function moneyDash(v: number | undefined): string {
  return v ? money(v) : '-'
}

/** แสดงค่าว่างเมื่อเป็น 0 ตามรูปแบบสมุดบัญชี */
export function moneyBlank(v: number | undefined): string {
  return v ? money(v) : ''
}

export const TH_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

export const TH_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

function parts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

/** 13 พ.ย. 2569 */
export function dateShort(iso: string): string {
  if (!iso) return ''
  const { y, m, d } = parts(iso)
  if (!y || !m || !d) return iso
  return `${d} ${TH_MONTHS_SHORT[m - 1]} ${y + 543}`
}

/** 30 พฤศจิกายน 2569 */
export function dateLong(iso: string): string {
  if (!iso) return ''
  const { y, m, d } = parts(iso)
  if (!y || !m || !d) return iso
  return `${d} ${TH_MONTHS[m - 1]} ${y + 543}`
}

/** พฤศจิกายน 2569 */
export function monthLong(iso: string): string {
  if (!iso) return ''
  const { y, m } = parts(iso)
  if (!y || !m) return iso
  return `${TH_MONTHS[m - 1]} ${y + 543}`
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}
