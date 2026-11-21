import { useMemo } from 'react'
import {
  buildGeneralLedger,
  buildSubLedger,
  buildTrialBalance,
  collectWarnings,
  reconcile,
} from '@/lib/accounting'
import { useBooks } from '@/store/useBooks'

/** คำนวณบัญชีแยกประเภท บัญชีย่อย และงบทดลองใหม่ทุกครั้งที่ข้อมูลเปลี่ยน */
export function useLedger() {
  const entries = useBooks((s) => s.entries)
  const accounts = useBooks((s) => s.accounts)
  const parties = useBooks((s) => s.parties)

  return useMemo(() => {
    const gl = buildGeneralLedger(entries, accounts)
    const arSub = buildSubLedger(entries, 'debtor')
    const apSub = buildSubLedger(entries, 'creditor')
    const tb = buildTrialBalance(gl, accounts)
    const ar = reconcile(gl, entries, parties, 'debtor')
    const ap = reconcile(gl, entries, parties, 'creditor')
    const warnings = collectWarnings(tb, ar, ap)
    const healthy = warnings[0]?.code === 'OK'
    return { gl, arSub, apSub, tb, ar, ap, warnings, healthy }
  }, [entries, accounts, parties])
}
