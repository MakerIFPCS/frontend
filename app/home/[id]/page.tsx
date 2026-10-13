'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      {/* HEADER: user.id é convertido explicitamente para String para evitar o erro do TypeScript */}
      <Header authenticated userName={user.name} userId={String(user.id)} />

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
      </section>
    </div>
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
