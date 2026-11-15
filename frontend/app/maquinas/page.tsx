'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { Radio, RefreshCw, Search, ShieldCheck, Wrench, Zap } from 'lucide-react';
import Header from '@/app/components/header';
import { getMachines } from '@/app/lib/api';
import type { MachineAPI, MachineStatusAPI } from '@/app/types/api';

type StatusFilter = MachineStatusAPI | 'ALL';

const STATUS_LABELS: Record<MachineStatusAPI, string> = {
  FUNCTIONAL: 'Em operação',
  AVAILABLE: 'Disponível',
  MAINTENANCE: 'Em manutenção',
  UNUSABLE: 'Indisponível',
};

const STATUS_STYLES: Record<MachineStatusAPI, string> = {
  FUNCTIONAL: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  AVAILABLE: 'border-blue-200 bg-blue-50 text-blue-700',
  MAINTENANCE: 'border-amber-200 bg-amber-50 text-amber-700',
  UNUSABLE: 'border-slate-200 bg-slate-100 text-slate-600',
};

function isStatusFilter(value: string): value is StatusFilter {
  return value === 'ALL' || Object.prototype.hasOwnProperty.call(STATUS_LABELS, value);
}

function getMachineImage(machine: MachineAPI) {
  if (machine.image) return machine.image;
  if (machine.type === 'CNC') return '/maquinas/m7.png';
  if (machine.type === 'Corte a Laser') return '/maquinas/m2.png';
  return '/maquinas/m1.png';
}

export default function MaquinasPage() {
  const [machines, setMachines] = useState<MachineAPI[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    getMachines()
      .then((data) => {
        setMachines(data);
        setLastUpdated(new Date());
      })
      .catch(() => setError('Não foi possível carregar as máquinas. Verifique sua conexão e tente novamente.'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleRefresh() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getMachines();
      setMachines(data);
      setLastUpdated(new Date());
    } catch {
      setError('Não foi possível carregar as máquinas. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  const machineTypes = useMemo(
    () => [...new Set(machines.map((machine) => machine.type).filter((type): type is string => Boolean(type)))]
      .sort((first, second) => first.localeCompare(second, 'pt-BR')),
    [machines],
  );

  const filteredMachines = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('pt-BR');

    return machines.filter((machine) => {
      const matchesSearch = [
        machine.name,
        machine.description,
        machine.code ?? '',
        machine.type ?? '',
      ].some((value) => value.toLocaleLowerCase('pt-BR').includes(query));
      const matchesStatus = statusFilter === 'ALL' || machine.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || machine.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [machines, searchTerm, statusFilter, typeFilter]);

  const availableCount = machines.filter((machine) => machine.status === 'AVAILABLE').length;
  const operationalCount = machines.filter((machine) => machine.status === 'FUNCTIONAL').length;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <section className="mb-8 flex flex-col gap-6 rounded-2xl bg-[#050b33] p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#00ff9d] text-[#050b33]">
              <Wrench className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#00ff9d]">Espaço Maker</p>
              <h1 className="mt-1 text-3xl font-bold">Máquinas do laboratório</h1>
              <p className="mt-2 max-w-2xl leading-6 text-white/75">
                Consulte os equipamentos cadastrados pela administração, seus tipos e a situação atual.
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00ff9d] px-4 py-2.5 text-sm font-bold text-[#050b33] transition-colors hover:bg-[#6bffbd] disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Atualizando...' : 'Atualizar lista'}
            </button>
            {lastUpdated && (
              <p className="mt-2 text-xs text-white/60">
                Atualizada às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </section>

        <section aria-label="Resumo das máquinas" className="mb-7 grid gap-4 sm:grid-cols-3">
          <SummaryCard icon={<Wrench className="h-5 w-5" />} label="Máquinas cadastradas" value={machines.length} />
          <SummaryCard icon={<Zap className="h-5 w-5" />} label="Em operação" value={operationalCount} />
          <SummaryCard icon={<Radio className="h-5 w-5" />} label="Disponíveis" value={availableCount} />
        </section>

        <section aria-label="Filtros de máquinas" className="mb-6 grid gap-3 rounded-xl border border-[#dfe4ee] bg-white p-4 shadow-sm md:grid-cols-[1fr_200px_200px]">
          <label className="relative block">
            <span className="sr-only">Buscar máquinas</span>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome, código ou descrição"
              className="w-full rounded-lg border border-slate-200 bg-[#f8fafc] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/15"
            />
          </label>
          <label>
            <span className="sr-only">Filtrar por situação</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                if (isStatusFilter(event.target.value)) setStatusFilter(event.target.value);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#050b33] outline-none focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/15"
            >
              <option value="ALL">Todas as situações</option>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por tipo</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#050b33] outline-none focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/15"
            >
              <option value="ALL">Todos os tipos</option>
              {machineTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
        </section>

        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex shrink-0 items-center gap-2 font-bold underline disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          </div>
        )}

        {isLoading && machines.length === 0 ? (
          <div className="rounded-xl border border-[#dfe4ee] bg-white p-8 text-center text-[#56617d]" role="status">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#7000ff]" />
            <p className="mt-3">Carregando máquinas...</p>
          </div>
        ) : error && machines.length === 0 ? null : machines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#cbd2df] bg-white p-10 text-center">
            <Wrench className="mx-auto h-10 w-10 text-[#7000ff]" />
            <h2 className="mt-4 text-xl font-bold">Nenhuma máquina cadastrada</h2>
            <p className="mt-2 text-[#56617d]">
              Quando a administração cadastrar os equipamentos, eles aparecerão nesta página.
            </p>
          </div>
        ) : filteredMachines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#cbd2df] bg-white p-10 text-center">
            <Search className="mx-auto h-9 w-9 text-[#7000ff]" />
            <h2 className="mt-4 text-lg font-bold">Nenhuma máquina encontrada</h2>
            <p className="mt-2 text-[#56617d]">Ajuste os filtros ou tente buscar por outro termo.</p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMachines.map((machine) => (
              <li key={machine.id} className="overflow-hidden rounded-xl border border-[#dfe4ee] bg-white shadow-sm">
                <div className="relative aspect-[16/10] bg-slate-100">
                  <Image
                    src={getMachineImage(machine)}
                    alt={machine.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{machine.name}</h2>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {machine.code || `#M${String(machine.id).padStart(3, '0')}`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[machine.status]}`}>
                      {STATUS_LABELS[machine.status]}
                    </span>
                  </div>
                  <p className="mt-4 min-h-12 text-sm leading-6 text-[#56617d]">
                    {machine.description || 'Sem descrição cadastrada.'}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0f5] pt-4 text-xs">
                    <span className="rounded-full bg-[#eef1ff] px-3 py-1.5 font-semibold text-[#4f46e5]">
                      {machine.type || 'Tipo não informado'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#56617d]">
                      <ShieldCheck className="h-4 w-4" />
                      {machine.access === 'RESTRICTED' ? 'Acesso restrito' : 'Acesso livre'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <article className="flex items-center gap-4 rounded-xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f0eaff] text-[#7000ff]">
        {icon}
      </div>
      <div>
        <p className="text-sm text-[#56617d]">{label}</p>
        <p className="mt-0.5 text-2xl font-bold">{value}</p>
      </div>
    </article>
  );
}
