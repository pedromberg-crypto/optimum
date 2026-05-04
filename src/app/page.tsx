'use client';

import Link from 'next/link';

export default function VersionSwitcherPage() {
  return (
    <div className="switch-shell">
      <div className="switch-card">
        <div className="bi" style={{ width: 56, height: 56, fontSize: 22 }}>O</div>
        <h1 className="switch-title">Optimum · PCS</h1>
        <p className="switch-sub">Escolha qual versão do sistema usar</p>

        <div className="switch-grid">
          <Link href="/v2" className="switch-opt switch-opt-primary">
            <div className="switch-opt-tag">Recomendado</div>
            <div className="switch-opt-num">v2</div>
            <div className="switch-opt-name">Reduzido & Limpo</div>
            <ul className="switch-opt-list">
              <li>4 áreas: Dashboard, Colaboradores, Cargos, CCT</li>
              <li>Hub do colaborador com tabs</li>
              <li>Vagas integradas em Cargos</li>
              <li>Visual novo (cards + KPIs)</li>
            </ul>
          </Link>

          <Link href="/v1" className="switch-opt">
            <div className="switch-opt-tag switch-opt-tag-muted">Original</div>
            <div className="switch-opt-num">v1</div>
            <div className="switch-opt-name">Clássico</div>
            <ul className="switch-opt-list">
              <li>11 páginas separadas</li>
              <li>Estrutura granular</li>
              <li>Referência / fallback</li>
            </ul>
          </Link>
        </div>

        <div className="switch-foot">Os dados são compartilhados entre versões (mesmo storage local).</div>
      </div>
    </div>
  );
}
