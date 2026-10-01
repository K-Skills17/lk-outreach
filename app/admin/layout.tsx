import type { Metadata } from 'next';
import AdminNav from './AdminNav';

export const metadata: Metadata = {
  title: 'Admin — LK Outreach',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100svh', background: '#0a0a0a' }}>
      <AdminNav />

      {/* Page content */}
      <main style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
