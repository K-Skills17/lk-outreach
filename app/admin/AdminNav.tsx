'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

const NAV = [
  { href: '/admin',             label: 'Dashboard' },
  { href: '/admin/replies',     label: 'Respostas' },
  { href: '/admin/prospects',   label: 'Prospectos' },
  { href: '/admin/campaigns',   label: 'Campanhas' },
  { href: '/admin/billing',     label: 'Cobrança' },
  { href: '/admin/agenda',      label: 'Agenda' },
  { href: '/admin/scraper',     label: 'Scraper' },
  { href: '/admin/runner',      label: 'Runner' },
  { href: '/admin/config',      label: 'Configurar' },
];

export default function AdminNav() {
  const pathname = usePathname();

  // The login page lives under the admin layout but must not show the nav.
  if (pathname === '/admin/login') return null;

  return (
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
        {NAV.map(n => {
          const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className="admin-nav-link"
              aria-current={active ? 'page' : undefined}
            >
              {n.label}
            </Link>
          );
        })}
      </div>

      <LogoutButton />
    </nav>
  );
}
