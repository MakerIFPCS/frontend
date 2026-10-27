'use client';

import Link from 'next/link';
import { CalendarDays, ChartNoAxesColumn, PackagePlus, Users, Wrench, Handshake } from 'lucide-react';
import { useAdminAccess } from '@/app/lib/use-admin-access';
import Header from '@/app/components/header';

const adminSections = [
  { href: '/Maquinas-ADM', title: 'Máquinas', description: 'Gerencie os equipamentos e seus estados.', icon: Wrench },
  { href: '/Materiais-ADM', title: 'Materiais', description: 'Cadastre e consulte os materiais do laboratório.', icon: PackagePlus },
  { href: '/Emprestimos-ADM', title: 'Empréstimos', description: 'Analise, aprove ou recuse pedidos de empréstimo.', icon: Handshake },
  { href: '/Relatorio-ADM', title: 'Relatórios', description: 'Acesse os relatórios administrativos.', icon: ChartNoAxesColumn },
  { href: '/Agendamento-ADM', title: 'Agendamentos', description: 'Analise e atualize solicitações de uso.', icon: CalendarDays },
  { href: '/usuarios', title: 'Usuários', description: 'Consulte contas e conceda acesso administrativo.', icon: Users },
];

export default function AdminDashboardPage() {
  const authorized = useAdminAccess();
  if (!authorized) return <main className="p-10 text-center">Verificando acesso...</main>;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header authenticated />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7000ff]">Área restrita</p>
        <h1 className="mt-2 text-4xl font-bold">Painel administrativo</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {adminSections.map(({ href, title, description, icon: Icon }) => (
            <Link key={href} href={href} className="rounded-xl border border-[#dfe4ee] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <Icon className="h-8 w-8 text-[#7000ff]" />
              <h2 className="mt-5 text-xl font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#56617d]">{description}</p>
              <span className="mt-5 inline-block font-semibold text-[#050b33]">Abrir seção →</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
