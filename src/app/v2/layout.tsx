'use client';

import { SidebarV2 } from '@/components/v2/sidebar';
import { TopbarV2 } from '@/components/v2/topbar';

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="v2-shell">
      <SidebarV2 />
      <div className="v2-main">
        <TopbarV2 />
        {children}
      </div>
    </div>
  );
}
