'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ToastKind = 'ok' | 'err' | 'info';
interface ToastItem { id: string; kind: ToastKind; msg: string }
interface ToastCtx { push: (msg: string, kind?: ToastKind) => void }

const Ctx = createContext<ToastCtx>({ push: () => {} });

export function useToast() { return useContext(Ctx); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((msg: string, kind: ToastKind = 'ok') => {
    const id = 't' + Date.now() + Math.random().toString(36).slice(2, 5);
    setItems(s => [...s, { id, kind, msg }]);
    setTimeout(() => setItems(s => s.filter(x => x.id !== id)), 3200);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <ToastHost items={items} onClose={id => setItems(s => s.filter(x => x.id !== id))} />
    </Ctx.Provider>
  );
}

function ToastHost({ items, onClose }: { items: ToastItem[]; onClose: (id: string) => void }) {
  return (
    <div className="toast-host">
      {items.map(t => <ToastView key={t.id} t={t} onClose={() => onClose(t.id)} />)}
    </div>
  );
}

function ToastView({ t, onClose }: { t: ToastItem; onClose: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setShow(true)); }, []);
  const icon = t.kind === 'ok' ? '✓' : t.kind === 'err' ? '✕' : 'ℹ';
  return (
    <div className={`toast t-${t.kind} ${show ? 'on' : ''}`} onClick={onClose}>
      <span className="ti">{icon}</span>
      <span>{t.msg}</span>
    </div>
  );
}
