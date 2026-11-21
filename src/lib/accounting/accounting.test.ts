import { describe, expect, it } from 'vitest'
import {
  ACC,
  BOOK_ORDER,
  DEFAULT_ACCOUNTS,
  DEFAULT_COMPANY,
  DEFAULT_PARTIES,
  SAMPLE_ENTRIES,
  balanceOf,
  buildGeneralLedger,
  buildSubLedger,
  buildTrialBalance,
  collectWarnings,
  emptyForm,
  formToEntry,
  reconcile,
  validateEntry,
} from './index'

const ctx = {
  accounts: DEFAULT_ACCOUNTS,
  parties: DEFAULT_PARTIES,
  periodStart: DEFAULT_COMPANY.periodStart,
  periodEnd: DEFAULT_COMPANY.periodEnd,
  testMode: false,
}

describe('ระบบบัญชีร้านใบไม้เครื่องเขียน (AC101)', () => {
  it('รายการตัวอย่างมีอย่างน้อย 15 รายการ ครบทั้ง 5 สมุด และผ่านการตรวจสอบทุกรายการ', () => {
    expect(SAMPLE_ENTRIES.length).toBeGreaterThanOrEqual(15)
    for (const book of BOOK_ORDER) {
      expect(SAMPLE_ENTRIES.some((e) => e.book === book)).toBe(true)
    }
    for (const e of SAMPLE_ENTRIES) {
      const res = validateEntry(e, ctx)
      expect(res.ok, `รายการ ${e.docNo} (${e.memo}): ${res.errors.map((x) => x.message).join(', ')}`).toBe(true)
      expect(e.reason?.trim().length).toBeGreaterThan(0)
    }
  })

  it('งบทดลองสมดุล 331,500.00 บาท และยอดบัญชีตรงกับการคำนวณด้วยมือทุกสตางค์', () => {
    const gl = buildGeneralLedger(SAMPLE_ENTRIES, DEFAULT_ACCOUNTS)
    const tb = buildTrialBalance(gl, DEFAULT_ACCOUNTS)
    const ar = reconcile(gl, SAMPLE_ENTRIES, DEFAULT_PARTIES, 'debtor')
    const ap = reconcile(gl, SAMPLE_ENTRIES, DEFAULT_PARTIES, 'creditor')
    const warnings = collectWarnings(tb, ar, ap)

    expect(tb.balanced).toBe(true)
    expect(tb.totalDr).toBe(331_500_00)
    expect(tb.totalCr).toBe(331_500_00)
    expect(tb.diff).toBe(0)

    // ตรวจสอบยอดคงเหลือแต่ละบัญชีเทียบกับการคำนวณมือ
    expect(balanceOf(gl[ACC.CASH])).toBe(139_500_00)
    expect(balanceOf(gl[ACC.BANK])).toBe(50_000_00)
    expect(balanceOf(gl[ACC.AR])).toBe(13_500_00)
    expect(balanceOf(gl['1300'])).toBe(8_000_00)
    expect(balanceOf(gl[ACC.AP])).toBe(-40_000_00)
    expect(balanceOf(gl[ACC.OTHER_AP])).toBe(-8_000_00)
    expect(balanceOf(gl['3000'])).toBe(-200_000_00)
    expect(balanceOf(gl[ACC.SALES])).toBe(-80_500_00)
    expect(balanceOf(gl[ACC.SALES_RETURN])).toBe(2_000_00)
    expect(balanceOf(gl[ACC.PURCHASE])).toBe(88_000_00)
    expect(balanceOf(gl[ACC.PURCHASE_RETURN])).toBe(-3_000_00)

    // ตรวจสอบบัญชีย่อยตรงกับบัญชีคุม
    expect(ar.ok).toBe(true)
    expect(ar.control).toBe(13_500_00)
    expect(ar.subTotal).toBe(13_500_00)

    expect(ap.ok).toBe(true)
    expect(ap.control).toBe(40_000_00)
    expect(ap.subTotal).toBe(40_000_00)

    const arSub = buildSubLedger(SAMPLE_ENTRIES, 'debtor')
    expect(balanceOf(arSub['ลน-01'])).toBe(8_500_00)
    expect(balanceOf(arSub['ลน-02'])).toBe(5_000_00)

    const apSub = buildSubLedger(SAMPLE_ENTRIES, 'creditor')
    expect(-balanceOf(apSub['จน-01'])).toBe(22_000_00)
    expect(-balanceOf(apSub['จน-02'])).toBe(18_000_00)

    expect(warnings).toHaveLength(1)
    expect(warnings[0].code).toBe('OK')
  })

  it('ป้องกันการบันทึกเงินสดในสมุดรายวันทั่วไป (V-05)', () => {
    const f = emptyForm('general', '2026-11-10')
    f.memo = 'ทดลองลงเงินสดในสมุดทั่วไป'
    f.lines = [
      { account: ACC.CASH, dr: '1000', cr: '', partyId: '' },
      { account: ACC.SALES, dr: '', cr: '1000', partyId: '' },
    ]
    const res = validateEntry(formToEntry(f), ctx)
    expect(res.ok).toBe(false)
    expect(res.errors.some((e) => e.code === 'V-05')).toBe(true)
  })

  it('ป้องกันการใช้บัญชีคุมลูกหนี้/เจ้าหนี้โดยไม่ระบุชื่อรายตัว (V-04)', () => {
    const f = emptyForm('general', '2026-11-10')
    f.memo = 'ส่งคืนสินค้าแต่ลืมระบุเจ้าหนี้'
    f.lines = [
      { account: ACC.AP, dr: '1000', cr: '', partyId: '' },
      { account: ACC.PURCHASE_RETURN, dr: '', cr: '1000', partyId: '' },
    ]
    const res = validateEntry(formToEntry(f), ctx)
    expect(res.ok).toBe(false)
    expect(res.errors.some((e) => e.code === 'V-04')).toBe(true)
  })

  it('โหมดปกติห้ามบันทึกรายการไม่สมดุล แต่โหมดทดสอบอนุญาตและแจ้งเตือน W-01 ในงบทดลอง', () => {
    const f = emptyForm('general', '2026-11-29')
    f.memo = 'รายการทดสอบเดบิตไม่เท่าเครดิต'
    f.lines = [
      { account: '1300', dr: '5000', cr: '', partyId: '' },
      { account: '2150', dr: '', cr: '4000', partyId: '' },
    ]
    const entry = formToEntry(f)

    // โหมดปกติ: ปฏิเสธ
    const normalRes = validateEntry(entry, ctx)
    expect(normalRes.ok).toBe(false)
    expect(normalRes.errors.some((e) => e.code === 'V-01')).toBe(true)

    // โหมดทดสอบ: อนุญาตพร้อม warning
    const testRes = validateEntry(entry, { ...ctx, testMode: true })
    expect(testRes.ok).toBe(true)
    expect(testRes.warnings.some((w) => w.code === 'V-01')).toBe(true)

    // งบทดลองต้องแจ้งเตือน W-01 พร้อมผลต่าง 1,000.00 บาท
    const combined = [...SAMPLE_ENTRIES, { ...entry, id: 'test-1', isTest: true, createdAt: 999 }]
    const gl = buildGeneralLedger(combined, DEFAULT_ACCOUNTS)
    const tb = buildTrialBalance(gl, DEFAULT_ACCOUNTS)
    const ar = reconcile(gl, combined, DEFAULT_PARTIES, 'debtor')
    const ap = reconcile(gl, combined, DEFAULT_PARTIES, 'creditor')
    const warnings = collectWarnings(tb, ar, ap)

    expect(tb.balanced).toBe(false)
    expect(Math.abs(tb.diff)).toBe(1_000_00)
    expect(warnings.some((w) => w.code === 'W-01')).toBe(true)
  })
})
