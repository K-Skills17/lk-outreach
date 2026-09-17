'use client';

import { useEffect } from 'react';

export default function TokenRemember({ token }: { token: string }) {
  useEffect(() => {
    if (token) localStorage.setItem('lk_painel_token', token);
  }, [token]);
  return null;
}
