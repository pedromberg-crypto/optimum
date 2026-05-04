'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePCS } from '@/store/use-pcs-store';
import { colabsAguardandoCCT } from '@/lib/helpers';

export function SidebarV2() {
  const pathname = usePathname();
  const db = usePCS(s => s.db);
  const ano = new Date().getFullYear();
  const cctAtrasados = colabsAguardandoCCT(db, ano).filter(x => x.st.atrasada).length;
  const pdiPend = db.pdis.filter(p => p.st !== 'concluido').length;

  const isActive = (href: string) => href === '/v2' ? pathname === '/v2' : pathname?.startsWith(href);

  return (
    <aside className="v2-sb">
      <Link href="/v2" className="v2-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="v2-bi">O</div>
        <div>
          <div className="v2-bn">Optimum</div>
          <div className="v2-bs">PCS · Carreira · PDI</div>
        </div>
      </Link>

      <nav className="v2-nav">
        <div className="v2-ng">Principal</div>
        <Link href="/v2" className={`v2-na${isActive('/v2') ? ' on' : ''}`}>
          <span className="v2-icon"></span>Dashboard
        </Link>
        <Link href="/v2/colaboradores" className={`v2-na${isActive('/v2/colaboradores') || pathname?.startsWith('/v2/colab') ? ' on' : ''}`}>
          <span className="v2-icon"></span>Colaboradores
          <span className="v2-badge" style={{ background: 'var(--g3)', color: 'var(--g7)' }}>{db.colabs.length}</span>
        </Link>
        <Link href="/v2/cargos" className={`v2-na${isActive('/v2/cargos') ? ' on' : ''}`}>
          <span className="v2-icon"></span>Cargos & Vagas
          {db.vagas.length > 0 && <span className="v2-badge" style={{ background: 'var(--am)', color: '#fff' }}>{db.vagas.length}</span>}
        </Link>
        <Link href="/v2/cct" className={`v2-na${isActive('/v2/cct') ? ' on' : ''}`}>
          <span className="v2-icon"></span>Sindicatos & CCT
          {cctAtrasados > 0 && <span className="v2-badge">{cctAtrasados}</span>}
        </Link>

        <div className="v2-ng" style={{ marginTop: 8 }}>Configuração</div>
        <Link href="/v2/config" className={`v2-na${isActive('/v2/config') ? ' on' : ''}`}>
          <span className="v2-icon"></span>Política & Regras
        </Link>
      </nav>

      <div className="v2-sb-foot">
        <div className="v2-upgrade">
          <strong>Pendências</strong>
          {pdiPend > 0 && <div>· {pdiPend} PDIs ativos</div>}
          {cctAtrasados > 0 && <div>· {cctAtrasados} CCTs atrasadas</div>}
          {pdiPend === 0 && cctAtrasados === 0 && <div style={{ opacity: .8 }}>Tudo em dia</div>}
          <Link href="/v2" className="v2-up-btn">Ver dashboard</Link>
        </div>
        <div style={{ fontSize: 10, color: 'var(--g4)', textAlign: 'center' }}>v2.0 · local only</div>
      </div>
    </aside>
  );
}
