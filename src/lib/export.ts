import type { WorkBook, WorkSheet } from 'xlsx'
import {
  ACC,
  BOOKS,
  BOOK_ORDER,
  accountName,
  balanceOf,
  buildGeneralLedger,
  buildSubLedger,
  buildTrialBalance,
  reconcile,
  sortEntries,
} from '@/lib/accounting'
import { dateLong, dateShort } from '@/lib/format'
import type { BooksData } from '@/store/useBooks'

const baht = (v: number) => Math.round(v) / 100
const safeFile = (s: string) => s.replace(/[\\/:*?"<>|]/g, '-').trim() || 'baibai-accounting'

/** ใส่รูปแบบตัวเลข #,##0.00 ให้เซลล์ตัวเลขทั้งหมดในชีต */
function formatNumbers(ws: WorkSheet) {
  for (const key of Object.keys(ws)) {
    if (key.startsWith('!')) continue
    const cell = ws[key]
    if (cell && cell.t === 'n') cell.z = '#,##0.00'
  }
}

export function serializeJSON(data: BooksData): string {
  return JSON.stringify(
    {
      app: 'baibai-accounting',
      version: 2,
      exportedAt: new Date().toISOString(),
      ...data,
    },
    null,
    2,
  )
}

export function parseJSON(text: string): BooksData {
  const d = JSON.parse(text)
  if (
    !Array.isArray(d.entries) ||
    !Array.isArray(d.accounts) ||
    !Array.isArray(d.parties) ||
    !d.company
  ) {
    throw new Error('รูปแบบไฟล์ไม่ถูกต้อง')
  }
  return { company: d.company, accounts: d.accounts, parties: d.parties, entries: d.entries }
}

export function exportJSON(data: BooksData) {
  const blob = new Blob([serializeJSON(data)], {
    type: 'application/json;charset=utf-8',
  })
  download(blob, `baibai-books-${new Date().toISOString().slice(0, 10)}.json`)
}

export async function readJSON(file: File): Promise<BooksData> {
  return parseJSON(await file.text())
}

/** สร้าง Workbook Excel (แยกออกมาเพื่อให้ unit test ตรวจสอบความถูกต้องของไฟล์ที่ส่งออกได้จริง) */
export async function buildExcelWorkbook(data: BooksData): Promise<WorkBook> {
  const XLSX = await import('xlsx')
  const { accounts, parties, entries, company } = data
  const wb = XLSX.utils.book_new()
  const gl = buildGeneralLedger(entries, accounts)
  const tb = buildTrialBalance(gl, accounts)
  const ar = reconcile(gl, entries, parties, 'debtor')
  const ap = reconcile(gl, entries, parties, 'creditor')

  // 1. งบทดลอง (หัวกระดาษทางการ 3 บรรทัด ผสานเซลล์ A-D)
  const tbRows: (string | number)[][] = [
    [company.name],
    ['งบทดลอง'],
    [`ณ วันที่ ${dateLong(company.periodEnd)}`],
    [],
    ['เลขที่', 'ชื่อบัญชี', 'เดบิต', 'เครดิต'],
    ...tb.rows.map((r) => [r.code, r.name, r.dr ? baht(r.dr) : '', r.cr ? baht(r.cr) : '']),
    ['', 'รวม', baht(tb.totalDr), baht(tb.totalCr)],
  ]
  const ws = XLSX.utils.aoa_to_sheet(tbRows)
  ws['!cols'] = [{ wch: 12 }, { wch: 32 }, { wch: 18 }, { wch: 18 }]
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
  ]
  formatNumbers(ws)
  XLSX.utils.book_append_sheet(wb, ws, 'งบทดลอง')

  // 2. สมุดรายวัน 5 เล่ม
  for (const b of BOOK_ORDER) {
    const rows: (string | number)[][] = [
      [
        'วันที่',
        'เลขที่',
        'คำอธิบาย',
        'เหตุผลการเลือกสมุด',
        'เลขที่บัญชี',
        'ชื่อบัญชี',
        'ลูกหนี้/เจ้าหนี้',
        'เดบิต',
        'เครดิต',
      ],
    ]
    for (const e of sortEntries(entries.filter((x) => x.book === b))) {
      for (const l of e.lines) {
        rows.push([
          dateShort(e.date),
          e.docNo,
          e.memo,
          e.reason ?? '',
          l.account,
          accountName(accounts, l.account),
          parties.find((p) => p.id === l.partyId)?.name ?? '',
          l.dr ? baht(l.dr) : '',
          l.cr ? baht(l.cr) : '',
        ])
      }
    }
    const s = XLSX.utils.aoa_to_sheet(rows)
    s['!cols'] = [
      { wch: 14 },
      { wch: 12 },
      { wch: 34 },
      { wch: 46 },
      { wch: 12 },
      { wch: 24 },
      { wch: 28 },
      { wch: 16 },
      { wch: 16 },
    ]
    formatNumbers(s)
    XLSX.utils.book_append_sheet(wb, s, BOOKS[b].name.replace('สมุดรายวัน', 'สมุด'))
  }

  // 3. บัญชีแยกประเภททั่วไป
  const glRows: (string | number)[][] = [
    ['เลขที่บัญชี', 'ชื่อบัญชี', 'วันที่', 'รายการ', 'หน้าบัญชี', 'เดบิต', 'เครดิต'],
  ]
  for (const code of Object.keys(gl).sort()) {
    for (const p of gl[code]) {
      glRows.push([
        code,
        accountName(accounts, code),
        dateShort(p.date),
        p.description,
        p.ref,
        p.dr ? baht(p.dr) : '',
        p.cr ? baht(p.cr) : '',
      ])
    }
    const bal = balanceOf(gl[code])
    glRows.push(['', '', '', 'ยอดคงเหลือ', '', bal > 0 ? baht(bal) : '', bal < 0 ? baht(-bal) : ''])
  }
  const g = XLSX.utils.aoa_to_sheet(glRows)
  g['!cols'] = [
    { wch: 12 },
    { wch: 24 },
    { wch: 14 },
    { wch: 34 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
  ]
  formatNumbers(g)
  XLSX.utils.book_append_sheet(wb, g, 'แยกประเภททั่วไป')

  // 4. บัญชีย่อยลูกหนี้และเจ้าหนี้
  const addSubSheet = (kind: 'debtor' | 'creditor', title: string, rec: typeof ar) => {
    const sub = buildSubLedger(entries, kind)
    const sign = kind === 'debtor' ? 1 : -1
    const rows: (string | number)[][] = [
      ['รหัส', 'ชื่อ', 'วันที่', 'รายการ', 'หน้าบัญชี', 'เดบิต', 'เครดิต', 'คงเหลือ'],
    ]
    for (const { party } of rec.parties) {
      let running = 0
      const list = sub[party.id] ?? []
      for (const p of list) {
        running += sign * (p.dr - p.cr)
        rows.push([
          party.id,
          party.name,
          dateShort(p.date),
          p.description,
          p.ref,
          p.dr ? baht(p.dr) : '',
          p.cr ? baht(p.cr) : '',
          baht(running),
        ])
      }
      if (!list.length) rows.push([party.id, party.name, '', '(ไม่มีรายการ)', '', '', '', 0])
    }
    rows.push([])
    rows.push(['', 'รวมบัญชีย่อย', '', '', '', '', '', baht(rec.subTotal)])
    rows.push([
      '',
      `บัญชีคุม (${kind === 'debtor' ? ACC.AR : ACC.AP})`,
      '',
      '',
      '',
      '',
      '',
      baht(rec.control),
    ])
    rows.push(['', 'สถานะ', rec.ok ? 'ตรงกัน' : `ไม่ตรงกัน (ผลต่าง ${baht(Math.abs(rec.diff))})`])
    const sheet = XLSX.utils.aoa_to_sheet(rows)
    sheet['!cols'] = [
      { wch: 10 },
      { wch: 30 },
      { wch: 14 },
      { wch: 34 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ]
    formatNumbers(sheet)
    XLSX.utils.book_append_sheet(wb, sheet, title)
  }
  addSubSheet('debtor', 'บัญชีย่อยลูกหนี้', ar)
  addSubSheet('creditor', 'บัญชีย่อยเจ้าหนี้', ap)

  return wb
}

export async function exportExcel(data: BooksData) {
  const XLSX = await import('xlsx')
  const wb = await buildExcelWorkbook(data)
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  download(blob, `ระบบบัญชี-${safeFile(data.company.name)}-${data.company.periodEnd}.xlsx`)
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
