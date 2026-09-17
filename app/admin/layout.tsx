import type { Metadata } from 'next';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export const metadata: Metadata = {
  title: 'Admin — LK Outreach',
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/admin',           label: 'Dashboard' },
  { href: '/admin/replies',   label: 'Respostas' },
  { href: '/admin/prospects', label: 'Prospectos' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100svh', background: '#0a0a0a' }}>
      {/* Top nav */}
      <nav style={{
        background:   '#111',
        borderBottom: '1px solid rgba(197,163,104,0.12)',
        padding:      '0 1.25rem',
        display:      'flex',
        alignItems:   'center',
        gap:          '0.25rem',
        height:       '52px',
      }}>
        {/* Brand */}
        <span style={{
          color:        '#c5a368',
          fontWeight:   700,
          fontSize:     '0.85rem',
          letterSpacing:'0.06em',
          marginRight:  '1.5rem',
          whiteSpace:   'nowrap',
        }}>
          LK OUTREACH
        </span>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '0.1rem', flex: 1 }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href}
              className="admin-nav-link"
            >
              {n.label}
            </Link>
          ))}
        </div>

        {/* Logout */}
        <LogoutButton />
      </nav>

      {/* Page content */}
      <main style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
