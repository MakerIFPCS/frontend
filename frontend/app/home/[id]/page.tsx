'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useParams } from 'next/navigation';
import {
  getUserThemePreference,
  isThemePreference,
  setUserThemePreference,
  subscribeToTheme,
} from '@/app/lib/theme';
import { getUser } from '@/app/lib/api';
import type { User } from '@/app/types/api';
import Header from '@/app/components/header';

export default function UserHomePage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getUser(params.id)
      .then(setUser)
      .catch(() => setError('Não foi possível carregar os dados do usuário.'));
  }, [params.id]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-6">
        <section className="w-full max-w-lg bg-white rounded-xl p-8 shadow-sm text-center">
          <p className="text-red-600" role="alert">{error}</p>
          <Link href="/Cadastro" className="inline-block mt-6 font-semibold text-[#050b33] hover:underline">
            Voltar ao cadastro
          </Link>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center text-[#050b33]">
        Carregando seus dados...
      </main>
    );
  }

  const userId = String(user.id);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      {/* HEADER: user.id é convertido explicitamente para String para evitar o erro do TypeScript */}
      <Header authenticated userName={user.name} userId={userId} />

      <section className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#56617d]">Área do usuário</p>
        <h2 className="mt-3 text-4xl font-bold">Olá, {user.name}!</h2>
        <p className="mt-3 text-[#56617d]">Seu cadastro foi realizado com sucesso.</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Info label="E-mail" value={user.email} />
          <Info label="CPF" value={user.cpf} />
          <Info label="Celular" value={user.cellphone ?? 'Não informado'} />
          <Info label="Tipo" value={user.type} />
          <Info label="Perfil" value={user.role} />
          <Info label="Status" value={user.status} />
          <Info label="Data de nascimento" value={user.birthDate ?? 'Não informado'} />
          <Info label="Cadastro criado em" value={new Date(user.createdAt).toLocaleString('pt-BR')} />
        </div>

        <ThemeSettings userId={userId} />
      </section>
    </div>
  );
}

function ThemeSettings({ userId }: { userId: string }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    () => getUserThemePreference(userId),
    () => 'light',
  );

  function handleThemeChange(value: string) {
    if (isThemePreference(value)) {
      setUserThemePreference(userId, value);
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-[#dfe4ee] bg-white p-5 shadow-sm">
      <label htmlFor="theme-preference" className="block text-lg font-semibold">
        Tema da interface
      </label>
      <p className="mt-1 text-sm text-[#56617d]">
        Escolha como deseja visualizar o sistema. Sua preferência ficará salva neste navegador para este usuário.
      </p>
      <select
        id="theme-preference"
        value={theme}
        onChange={(event) => handleThemeChange(event.target.value)}
        className="mt-4 w-full max-w-xs rounded-lg border border-[#dfe4ee] bg-white px-3 py-2 text-sm text-[#050b33] outline-none focus-visible:ring-2 focus-visible:ring-[#7000ff]"
      >
        <option value="light">Claro (padrão)</option>
        <option value="dark">Escuro</option>
        <option value="system">Seguir o sistema</option>
      </select>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#dfe4ee] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#7b8498]">{label}</p>
      <p className="mt-2 break-words font-medium">{value}</p>
    </div>
  );
}
