'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

type AccessState = 'checking' | 'admin' | 'user' | 'guest';

function subscribeToAuth(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('auth-changed', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('auth-changed', callback);
  };
}

function getAccessState(): AccessState {
  const token = localStorage.getItem('authToken');
  if (!token) return 'guest';
  return localStorage.getItem('userRole') === 'ADMIN' ? 'admin' : 'user';
}

export function useAdminAccess() {
  const router = useRouter();
  const accessState = useSyncExternalStore(subscribeToAuth, getAccessState, () => 'checking');

  useEffect(() => {
    if (accessState === 'user') router.replace('/');
    if (accessState === 'guest') router.replace('/login');
  }, [accessState, router]);

  return accessState === 'admin';
}
