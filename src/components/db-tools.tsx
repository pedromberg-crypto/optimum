'use client';

import { useRef } from 'react';
import { Button } from './ui';
import { useToast } from './toast';
import { usePCS } from '@/store/use-pcs-store';

export function DBTools() {
  const exportJSON = usePCS(s => s.exportJSON);
  const importJSON = usePCS(s => s.importJSON);
  const resetSeed = usePCS(s => s.resetSeed);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const onExport = () => {
    const data = exportJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimum-pcs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push('Backup exportado', 'ok');
  };

  const onImportClick = () => fileRef.current?.click();

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importJSON(String(reader.result || ''));
      toast.push(ok ? 'Backup importado' : 'Falha ao importar', ok ? 'ok' : 'err');
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(f);
  };

  const onReset = () => {
    if (confirm('Resetar para dados iniciais? Todas alterações locais serão perdidas.')) {
      resetSeed();
      toast.push('Dados resetados ao seed', 'info');
    }
  };

  return (
    <>
      <Button kind="o" size="sm" onClick={onExport}>↓ Export</Button>
      <Button kind="o" size="sm" onClick={onImportClick}>↑ Import</Button>
      <Button kind="dng" size="sm" onClick={onReset}>↺ Reset</Button>
      <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={onImportFile} />
    </>
  );
}
