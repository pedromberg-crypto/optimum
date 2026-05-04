import { Sidebar } from '@/components/v1/sidebar';

export default function V1Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">{children}</div>
    </div>
  );
}
