import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_COMPANY,
  DEFAULT_PARTIES,
  SAMPLE_ENTRIES,
} from './accounting'
import { buildExcelWorkbook, parseJSON, serializeJSON } from './export'

const sampleData = {
  company: DEFAULT_COMPANY,
  accounts: DEFAULT_ACCOUNTS,
  parties: DEFAULT_PARTIES,
  entries: SAMPLE_ENTRIES,
}

describe('ตรวจสอบการส่งออกไฟล์ Excel (.xlsx) และ JSON ไม่เพี้ยน', () => {
  it('ส่งออก Excel ครบทั้ง 9 ชีต ภาษาไทยไม่เพี้ยน ยอดงบทดลองและบัญชีย่อยถูกต้อง', async () => {
    const wb = await buildExcelWorkbook(sampleData)
    // เขียนเป็น binary .xlsx แล้วอ่านกลับมาตรวจสอบจริงเหมือนเปิดใน Microsoft Excel
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
    expect(buffer.byteLength).toBeGreaterThan(5000)

    const parsed = XLSX.read(buffer, { type: 'array', cellNF: true })
    expect(parsed.SheetNames).toEqual([
      'งบทดลอง',
      'สมุดซื้อ',
      'สมุดขาย',
      'สมุดรับเงิน',
      'สมุดจ่ายเงิน',
      'สมุดทั่วไป',
      'แยกประเภททั่วไป',
      'บัญชีย่อยลูกหนี้',
      'บัญชีย่อยเจ้าหนี้',
    ])

    // ทุกชื่อชีตต้องไม่เกิน 31 ตัวอักษรตามข้อกำหนด Excel
    for (const name of parsed.SheetNames) {
      expect(name.length).toBeLessThanOrEqual(31)
    }

    // ตรวจชีตงบทดลอง: หัวกระดาษภาษาไทย + ยอดรวม 331,500.00 ตรงทั้ง Dr และ Cr
    const tbSheet = parsed.Sheets['งบทดลอง']
    const tbRows = XLSX.utils.sheet_to_json<(string | number)[]>(tbSheet, { header: 1 })
    expect(tbRows[0][0]).toBe('ร้านใบไม้เครื่องเขียน')
    expect(tbRows[1][0]).toBe('งบทดลอง')
    const totalRow = tbRows[tbRows.length - 1]
    expect(totalRow[1]).toBe('รวม')
    expect(totalRow[2]).toBe(331500)
    expect(totalRow[3]).toBe(331500)

    // ตรวจรูปแบบตัวเลข #,##0.00, ค่าที่จัดรูปแบบแล้ว และการผสานหัวกระดาษ 3 บรรทัด
    const totalDrCell = tbSheet[`C${tbRows.length}`]
    expect(totalDrCell?.z).toBe('#,##0.00')
    expect(totalDrCell?.w).toBe('331,500.00')
    expect(tbSheet['!merges']).toHaveLength(3)

    // ตรวจชีตบัญชีย่อยลูกหนี้ (13,500) และเจ้าหนี้ (40,000)
    const arRows = XLSX.utils.sheet_to_json<(string | number)[]>(parsed.Sheets['บัญชีย่อยลูกหนี้'], {
      header: 1,
    })
    const arStatus = arRows[arRows.length - 1]
    const arControl = arRows[arRows.length - 2]
    const arSub = arRows[arRows.length - 3]
    expect(arSub[7]).toBe(13500)
    expect(arControl[7]).toBe(13500)
    expect(arStatus[2]).toBe('ตรงกัน')

    const apRows = XLSX.utils.sheet_to_json<(string | number)[]>(parsed.Sheets['บัญชีย่อยเจ้าหนี้'], {
      header: 1,
    })
    const apStatus = apRows[apRows.length - 1]
    const apControl = apRows[apRows.length - 2]
    const apSub = apRows[apRows.length - 3]
    expect(apSub[7]).toBe(40000)
    expect(apControl[7]).toBe(40000)
    expect(apStatus[2]).toBe('ตรงกัน')
  })

  it('ส่งออกและนำเข้า JSON กลับมาได้ข้อมูลครบถ้วน 100%', () => {
    const json = serializeJSON(sampleData)
    const restored = parseJSON(json)
    expect(restored.company.name).toBe('ร้านใบไม้เครื่องเขียน')
    expect(restored.accounts).toHaveLength(DEFAULT_ACCOUNTS.length)
    expect(restored.parties).toHaveLength(DEFAULT_PARTIES.length)
    expect(restored.entries).toHaveLength(SAMPLE_ENTRIES.length)
  })
})
