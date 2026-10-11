import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import dayjs from 'dayjs'

const useDiaryStore = create(
  persist(
    (set, get) => ({
      selectedDate: dayjs().format('YYYY-MM-DD'),
      draft: null,

      setDate: (date) => set({ selectedDate: date }),

      goToPrevDay: () =>
        set((s) => ({
          selectedDate: dayjs(s.selectedDate).subtract(1, 'day').format('YYYY-MM-DD'),
        })),

      goToNextDay: () =>
        set((s) => ({
          selectedDate: dayjs(s.selectedDate).add(1, 'day').format('YYYY-MM-DD'),
        })),

      goToToday: () => set({ selectedDate: dayjs().format('YYYY-MM-DD') }),

      // Draft management
      ensureDraft: (mealType) => {
        const d = get().draft
        if (d) return d
        const newDraft = {
          mealType: mealType || 'Lunch',
          date: get().selectedDate,
          items: [],
          note: '',
          editId: null,
        }
        set({ draft: newDraft })
        return newDraft
      },

      setDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),

      updateDraft: (updater) =>
        set((s) => ({ draft: s.draft ? updater(s.draft) : s.draft })),

      addDraftItem: (item) =>
        set((s) => ({
          draft: s.draft
            ? { ...s.draft, items: [...s.draft.items, { id: crypto.randomUUID(), ...item }] }
            : s.draft,
        })),

      removeDraftItem: (id) =>
        set((s) => ({
          draft: s.draft
            ? { ...s.draft, items: s.draft.items.filter((i) => i.id !== id) }
            : s.draft,
        })),

      updateDraftItem: (id, updates) =>
        set((s) => ({
          draft: s.draft
            ? {
                ...s.draft,
                items: s.draft.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
              }
            : s.draft,
        })),
    }),
    {
      name: 'nourish-diary',
      partialize: (s) => ({ selectedDate: s.selectedDate }),
    }
  )
)

export default useDiaryStore
