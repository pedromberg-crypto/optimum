'use client';

import { useUI } from '@/store/use-ui';

export function EyeToggle({ colabId, size = 11 }: { colabId: string; size?: number }) {
  const oculto = useUI(s => s.oculto);
  const revelados = useUI(s => s.revelados);
  const toggleRevelado = useUI(s => s.toggleRevelado);
  if (!oculto) return null;
  const revelado = revelados.includes(colabId);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggleRevelado(colabId); }}
      title={revelado ? 'Ocultar valores deste colaborador' : 'Revelar valores deste colaborador'}
      style={{
        background: revelado ? 'var(--gr0)' : 'transparent',
        border: '1px solid',
        borderColor: revelado ? 'var(--gr2)' : 'var(--g2)',
        color: revelado ? 'var(--gr)' : 'var(--g5)',
        cursor: 'pointer',
        borderRadius: 6,
        padding: '2px 7px',
        fontSize: size,
        lineHeight: 1.4,
        marginLeft: 6,
        fontFamily: "'Inter',sans-serif",
        fontWeight: 600,
      }}
    >
      {revelado ? 'visível' : 'oculto'}
    </button>
  );
}
