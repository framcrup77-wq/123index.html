import { money } from '../format'
import { ACC, BOOKS } from './chart'
import { totals } from './builders'
import type { Account, Entry, Party } from './types'

export interface ValidationContext {
  accounts: Account[]
  parties: Party[]
  periodStart: string
  periodEnd: string
  /** โหมดทดสอบ: อนุญาตให้บันทึกรายการที่ไม่สมดุลได้เพื่อทดสอบการแจ้งเตือนงบทดลอง */
  testMode: boolean
}

export interface ValidationIssue {
  code: 'V-01' | 'V-02' | 'V-03' | 'V-04' | 'V-05' | 'V-06'
  message: string
}

export interface ValidationResult {
  ok: boolean
  errors: ValidationIssue[]
  /** ข้อผิดพลาดที่โหมดทดสอบยอมให้ผ่าน */
  warnings: ValidationIssue[]
}

export function validateEntry(
  entry: Omit<Entry, 'id' | 'createdAt'>,
  ctx: ValidationContext,
): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []
  const meta = BOOKS[entry.book]

  // V-02 วันที่
  if (!entry.date) {
    errors.push({ code: 'V-02', message: 'กรุณาระบุวันที่' })
  } else if (entry.date < ctx.periodStart || entry.date > ctx.periodEnd) {
    errors.push({ code: 'V-02', message: 'กรุณาระบุวันที่ภายในงวดบัญชี' })
  }

  // V-03 จำนวนเงิน
  const bad = entry.lines.some((l) => Number.isNaN(l.dr) || Number.isNaN(l.cr))
  const negative = entry.lines.some((l) => l.dr < 0 || l.cr < 0)
  const both = entry.lines.some((l) => l.dr > 0 && l.cr > 0)
  const { dr, cr, diff } = totals(entry.lines)
  if (bad) errors.push({ code: 'V-03', message: 'จำนวนเงินต้องเป็นตัวเลขเท่านั้น' })
  else if (negative) errors.push({ code: 'V-03', message: 'จำนวนเงินต้องไม่ติดลบ' })
  else if (both) errors.push({ code: 'V-03', message: 'หนึ่งบรรทัดต้องมีเฉพาะเดบิตหรือเครดิตอย่างใดอย่างหนึ่ง' })
  else if (dr === 0 && cr === 0) errors.push({ code: 'V-03', message: 'จำนวนเงินต้องมากกว่า 0' })

  // V-06 บัญชีต้องมีอยู่ในผังบัญชี
  for (const l of entry.lines) {
    if (!l.account) {
      errors.push({ code: 'V-06', message: 'กรุณาเลือกชื่อบัญชีให้ครบทุกบรรทัด' })
      break
    }
    if (!ctx.accounts.some((a) => a.code === l.account)) {
      errors.push({ code: 'V-06', message: `ไม่พบบัญชีเลขที่ ${l.account} ในผังบัญชี` })
      break
    }
  }

  // V-04 บัญชีคุมต้องระบุชื่อลูกหนี้/เจ้าหนี้
  for (const l of entry.lines) {
    if (l.account === ACC.AR && (l.dr || l.cr)) {
      const p = ctx.parties.find((x) => x.id === l.partyId)
      if (!p || p.kind !== 'debtor') {
        errors.push({ code: 'V-04', message: 'กรุณาเลือกชื่อลูกหนี้สำหรับบัญชีลูกหนี้การค้า (1100)' })
        break
      }
    }
    if (l.account === ACC.AP && (l.dr || l.cr)) {
      const p = ctx.parties.find((x) => x.id === l.partyId)
      if (!p || p.kind !== 'creditor') {
        errors.push({ code: 'V-04', message: 'กรุณาเลือกชื่อเจ้าหนี้สำหรับบัญชีเจ้าหนี้การค้า (2100)' })
        break
      }
    }
  }

  // V-05 เงินสดต้องบันทึกในสมุดรายวันรับเงินหรือจ่ายเงิน
  if (entry.book === 'general' && entry.lines.some((l) => l.account === ACC.CASH && (l.dr || l.cr))) {
    errors.push({
      code: 'V-05',
      message: 'รายการรับ/จ่ายเงินสดต้องบันทึกในสมุดรายวันรับเงินหรือสมุดรายวันจ่ายเงิน',
    })
  }
  if (entry.lines.some((l) => l.column === 'other' && l.account === ACC.CASH)) {
    errors.push({ code: 'V-05', message: `ห้ามใช้บัญชีเงินสดในช่องบัญชีอื่น ๆ ของ${meta.name}` })
  }

  if (entry.book === 'general' && !entry.memo) {
    errors.push({ code: 'V-06', message: 'กรุณาระบุคำอธิบายรายการ' })
  }

  // V-01 เดบิตต้องเท่ากับเครดิต
  if (!bad && diff !== 0) {
    const issue: ValidationIssue = {
      code: 'V-01',
      message: `ยอดเดบิตและเครดิตไม่เท่ากัน ผลต่าง ${money(Math.abs(diff))} บาท`,
    }
    if (ctx.testMode) warnings.push(issue)
    else errors.push(issue)
  }

  return { ok: errors.length === 0, errors, warnings }
}
