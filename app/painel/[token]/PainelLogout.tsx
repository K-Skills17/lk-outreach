'use client';

import { useRouter } from 'next/navigation';

export default function PainelLogout() {
  const router = useRouter();

  function logout() {
    localStorage.removeItem('lk_painel_token');
    router.push('/painel');
  }

  return (
    <button
      onClick={logout}
      style={{
        background:   'none',
        border:       '1px solid rgba(255,255,255,0.07)',
        borderRadius: '6px',
        padding:      '0.3rem 0.7rem',
        color:        '#3a3530',
        fontSize:     '0.72rem',
        cursor:       'pointer',
      }}
    >
      Sair
    </button>
  );
}
