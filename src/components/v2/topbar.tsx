'use client';

import { usePCS } from '@/store/use-pcs-store';
import { useUI } from '@/store/use-ui';
import { ini, isAdmin } from '@/lib/helpers';

export function TopbarV2({ onSearch }: { onSearch?: (q: string) => void }) {
  const db = usePCS(s => s.db);
  const oculto = useUI(s => s.oculto);
  const revelados = useUI(s => s.revelados);
  const revelarTodos = useUI(s => s.revelarTodos);
  const ocultarTodos = useUI(s => s.ocultarTodos);
  const me = db.colabs.find(c => isAdmin(c)) || db.colabs[0];
  const totalColabs = db.colabs.length;

  return (
    <div className="v2-tb">
      <div className="v2-tb-search">
        <input
          placeholder="Buscar colaborador, cargo, sindicato…"
          onChange={e => onSearch?.(e.target.value)}
        />
      </div>
      <div className="v2-tb-actions">
        {oculto && revelados.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--g5)', padding: '0 6px' }}>
            {revelados.length}/{totalColabs} revelado(s)
          </span>
        )}
        {oculto ? (
          <button
            className="v2-tb-icon"
            onClick={revelarTodos}
            title="Revelar todos os salários"
            style={{ background: 'var(--am0)', color: 'var(--am)', width: 'auto', padding: '0 12px', gap: 6, fontSize: 12, fontWeight: 600 }}
          >
            Valores ocultos · revelar
          </button>
        ) : (
          <button
            className="v2-tb-icon"
            onClick={ocultarTodos}
            title="Ocultar todos os salários"
            style={{ background: 'var(--gr0)', color: 'var(--gr)', width: 'auto', padding: '0 12px', gap: 6, fontSize: 12, fontWeight: 600 }}
          >
            Valores visíveis · ocultar
          </button>
        )}
        <button className="v2-tb-icon" title="Notificações">
          <span style={{ fontSize: 13 }}>•</span>
          <span className="v2-tb-dot" />
        </button>
        <div className="v2-tb-avatar" title={me?.n || 'Admin'}>
          {me ? ini(me.n) : 'A'}
        </div>
      </div>
    </div>
  );
}
