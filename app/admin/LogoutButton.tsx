'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background:   'transparent',
        border:       '1px solid rgba(197,163,104,0.2)',
        borderRadius: '6px',
        padding:      '0.3rem 0.7rem',
        color:        '#888',
        fontSize:     '0.75rem',
        cursor:       'pointer',
        letterSpacing:'0.04em',
        whiteSpace:   'nowrap',
      }}
    >
      Sair
    </button>
  );
}
