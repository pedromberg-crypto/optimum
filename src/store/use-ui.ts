'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIState {
  oculto: boolean;
  revelados: string[];
  toggleOculto: () => void;
  setOculto: (v: boolean) => void;
  toggleRevelado: (id: string) => void;
  revelarTodos: () => void;
  ocultarTodos: () => void;
  isMasked: (id: string) => boolean;
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      oculto: true,
      revelados: [],
      toggleOculto: () => set({ oculto: !get().oculto }),
      setOculto: (v) => set({ oculto: v }),
      toggleRevelado: (id) => {
        const r = get().revelados;
        set({ revelados: r.includes(id) ? r.filter(x => x !== id) : [...r, id] });
      },
      revelarTodos: () => set({ oculto: false, revelados: [] }),
      ocultarTodos: () => set({ oculto: true, revelados: [] }),
      isMasked: (id: string) => get().oculto && !get().revelados.includes(id),
    }),
    {
      name: 'optimum-ui-v1',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.revelados)) state.revelados = [];
      },
    },
  ),
);
