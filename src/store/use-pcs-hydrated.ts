'use client';

import { useEffect, useState } from 'react';
import { usePCS } from './use-pcs-store';

export function useHydratedPCS() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = usePCS.persist.onFinishHydration(() => setHydrated(true));
    if (usePCS.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
