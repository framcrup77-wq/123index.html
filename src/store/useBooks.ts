import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_COMPANY,
  DEFAULT_PARTIES,
  SAMPLE_ENTRIES,
  type Account,
  type Company,
  type Entry,
  type Party,
  type PartyKind,
} from '@/lib/accounting'
import { uid } from '@/lib/format'

export interface BooksData {
  company: Company
  accounts: Account[]
  parties: Party[]
  entries: Entry[]
}

interface BooksState extends BooksData {
  testMode: boolean
  theme: 'light' | 'dark'
  addEntry: (e: Omit<Entry, 'id' | 'createdAt'>) => Entry
  updateEntry: (id: string, e: Omit<Entry, 'id' | 'createdAt'>) => void
  deleteEntry: (id: string) => void
  loadSample: () => void
  clearEntries: () => void
  resetAll: () => void
  removeTestEntries: () => void
  setTestMode: (v: boolean) => void
  setTheme: (t: 'light' | 'dark') => void
  setCompany: (c: Company) => void
  upsertAccount: (a: Account, originalCode?: string) => void
  deleteAccount: (code: string) => void
  addPartyQuick: (kind: PartyKind, name: string, terms?: string) => Party
  upsertParty: (p: Party, originalId?: string) => void
  deleteParty: (id: string) => void
  importData: (d: BooksData) => void
}

const initial: BooksData = {
  company: DEFAULT_COMPANY,
  accounts: DEFAULT_ACCOUNTS,
  parties: DEFAULT_PARTIES,
  entries: [],
}

export const useBooks = create<BooksState>()(
  persist(
    (set, get) => ({
      ...initial,
      testMode: false,
      theme: 'light',

      addEntry: (e) => {
        const entry: Entry = { ...e, id: uid(), createdAt: Date.now() }
        set({ entries: [...get().entries, entry] })
        return entry
      },
      updateEntry: (id, e) =>
        set({
          entries: get().entries.map((x) =>
            x.id === id ? { ...x, ...e, id, createdAt: x.createdAt } : x,
          ),
        }),
      deleteEntry: (id) => set({ entries: get().entries.filter((x) => x.id !== id) }),

      loadSample: () =>
        set({
          company: DEFAULT_COMPANY,
          accounts: DEFAULT_ACCOUNTS,
          parties: DEFAULT_PARTIES,
          entries: SAMPLE_ENTRIES.map((e) => ({ ...e })),
        }),
      clearEntries: () => set({ entries: [] }),
      resetAll: () => set({ ...initial, testMode: false }),
      removeTestEntries: () => set({ entries: get().entries.filter((e) => !e.isTest) }),

      setTestMode: (testMode) => set({ testMode }),
      setTheme: (theme) => set({ theme }),
      setCompany: (company) => set({ company }),

      upsertAccount: (a, originalCode) => {
        const list = get().accounts.filter((x) => x.code !== (originalCode ?? a.code))
        set({ accounts: [...list, a].sort((x, y) => x.code.localeCompare(y.code)) })
      },
      deleteAccount: (code) => set({ accounts: get().accounts.filter((a) => a.code !== code) }),

      addPartyQuick: (kind, name, terms = '2/10, n/30') => {
        const trimmed = name.trim()
        const existing = get().parties.find((p) => p.kind === kind && p.name === trimmed)
        if (existing) return existing
        const prefix = kind === 'debtor' ? 'ลน' : 'จน'
        const sameKind = get().parties.filter((p) => p.kind === kind)
        const nextNum = sameKind.length + 1
        let id = `${prefix}-${String(nextNum).padStart(2, '0')}`
        while (get().parties.some((p) => p.id === id)) {
          id = `${prefix}-${String(Math.floor(Math.random() * 90) + 10)}`
        }
        const party: Party = { id, kind, name: trimmed, terms }
        set({ parties: [...get().parties, party] })
        return party
      },

      upsertParty: (p, originalId) => {
        const list = get().parties.filter((x) => x.id !== (originalId ?? p.id))
        set({ parties: [...list, p].sort((x, y) => x.id.localeCompare(y.id)) })
      },
      deleteParty: (id) => set({ parties: get().parties.filter((p) => p.id !== id) }),

      importData: (d) =>
        set({
          company: d.company,
          accounts: d.accounts,
          parties: d.parties,
          entries: d.entries,
        }),
    }),
    { name: 'baibai-books-v2', version: 2 },
  ),
)
