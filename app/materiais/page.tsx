'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Boxes,
  Package,
  PackageCheck,
  PackageX,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import Header from '@/app/components/header';
import { getMaterials } from '@/app/lib/api';
import type { MaterialAPI } from '@/app/types/api';

type StockFilter = 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK';

const STOCK_FILTER_LABELS: Record<Exclude<StockFilter, 'ALL'>, string> = {
  IN_STOCK: 'Em estoque',
  OUT_OF_STOCK: 'Sem estoque',
};

function isStockFilter(value: string): value is StockFilter {
  return value === 'ALL' || value === 'IN_STOCK' || value === 'OUT_OF_STOCK';
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialAPI[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    getMaterials()
      .then((data) => {
        if (!active) return;
        setMaterials(data);
        setLastUpdated(new Date());
      })
      .catch(() => {
        if (active) {
          setError('Não foi possível carregar os materiais. Verifique sua conexão e tente novamente.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleRefresh() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getMaterials();
      setMaterials(data);
      setLastUpdated(new Date());
    } catch {
      setError('Não foi possível carregar os materiais. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  function clearFilters() {
    setSearchTerm('');
    setStockFilter('ALL');
    setUnitFilter('ALL');
  }

  const materialUnits = useMemo(
    () =>
      [...new Set(materials.map((material) => material.unit?.trim()).filter((unit): unit is string => Boolean(unit)))]
        .sort((first, second) => first.localeCompare(second, 'pt-BR')),
    [materials],
  );

  const filteredMaterials = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('pt-BR');

    return materials.filter((material) => {
      const matchesSearch =
        query.length === 0 ||
        [material.name, material.description ?? '', material.unit ?? ''].some((value) =>
          value.toLocaleLowerCase('pt-BR').includes(query),
        );
      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'IN_STOCK' && material.quantity > 0) ||
        (stockFilter === 'OUT_OF_STOCK' && material.quantity <= 0);
      const matchesUnit = unitFilter === 'ALL' || material.unit?.trim() === unitFilter;

      return matchesSearch && matchesStock && matchesUnit;
    });
  }, [materials, searchTerm, stockFilter, unitFilter]);

  const inStockCount = materials.filter((material) => material.quantity > 0).length;
  const outOfStockCount = materials.length - inStockCount;
  const hasActiveFilters = searchTerm.trim().length > 0 || stockFilter !== 'ALL' || unitFilter !== 'ALL';

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <section className="mb-8 flex flex-col gap-6 rounded-2xl bg-[#050b33] p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#00ff9d] text-[#050b33]">
              <Boxes className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#00ff9d]">Espaço Maker</p>
              <h1 className="mt-1 text-3xl font-bold">Materiais do laboratório</h1>
              <p className="mt-2 max-w-2xl leading-6 text-white/75">
                Consulte os materiais disponíveis no laboratório e suas quantidades em estoque.
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

        <section aria-label="Resumo dos materiais" className="mb-7 grid gap-4 sm:grid-cols-3">
          <SummaryCard icon={<Boxes className="h-5 w-5" />} label="Materiais cadastrados" value={materials.length} />
          <SummaryCard icon={<PackageCheck className="h-5 w-5" />} label="Em estoque" value={inStockCount} />
          <SummaryCard icon={<PackageX className="h-5 w-5" />} label="Sem estoque" value={outOfStockCount} />
        </section>

        <section
          aria-label="Filtros de materiais"
          className="mb-6 rounded-xl border border-[#dfe4ee] bg-white p-4 shadow-sm"
        >
          <div className="grid gap-3 md:grid-cols-[1fr_200px_200px]">
            <label className="relative block">
              <span className="sr-only">Buscar materiais</span>
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome, descrição ou unidade"
                className="w-full rounded-lg border border-slate-200 bg-[#f8fafc] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/15"
              />
            </label>
            <label>
              <span className="sr-only">Filtrar por disponibilidade</span>
              <select
                value={stockFilter}
                onChange={(event) => {
                  if (isStockFilter(event.target.value)) setStockFilter(event.target.value);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#050b33] outline-none focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/15"
              >
                <option value="ALL">Todos os status</option>
                {Object.entries(STOCK_FILTER_LABELS).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Filtrar por unidade</span>
              <select
                value={unitFilter}
                onChange={(event) => setUnitFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#050b33] outline-none focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/15"
              >
                <option value="ALL">Todas as unidades</option>
                {materialUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0f5] pt-3 text-xs text-[#56617d]">
              <p>
                Exibindo <strong className="text-[#050b33]">{filteredMaterials.length}</strong> de{' '}
                <strong className="text-[#050b33]">{materials.length}</strong> materiais
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 font-semibold text-[#7000ff] hover:underline"
              >
                <X className="h-3.5 w-3.5" /> Limpar filtros
              </button>
            </div>
          )}
        </section>

        {error && (
          <div
            className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
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

        {isLoading && materials.length === 0 ? (
          <div className="rounded-xl border border-[#dfe4ee] bg-white p-8 text-center text-[#56617d]" role="status">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#7000ff]" />
            <p className="mt-3">Carregando materiais...</p>
          </div>
        ) : error && materials.length === 0 ? null : materials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#cbd2df] bg-white p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-[#7000ff]" />
            <h2 className="mt-4 text-xl font-bold">Nenhum material cadastrado</h2>
            <p className="mt-2 text-[#56617d]">Os materiais do laboratório aparecerão aqui quando forem cadastrados.</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#cbd2df] bg-white p-10 text-center">
            <Search className="mx-auto h-9 w-9 text-[#7000ff]" />
            <h2 className="mt-4 text-lg font-bold">Nenhum material encontrado</h2>
            <p className="mt-2 text-[#56617d]">Ajuste os filtros ou tente buscar por outro termo.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#050b33] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#101d5e]"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => (
              <li
                key={material.id}
                className="flex flex-col rounded-xl border border-[#dfe4ee] bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f0eaff] text-[#7000ff]">
                    <Package className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      material.quantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {material.quantity > 0 ? 'Em estoque' : 'Sem estoque'}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-bold">{material.name}</h2>
                <p className="mt-2 min-h-12 flex-1 text-sm leading-6 text-[#56617d]">
                  {material.description || 'Sem descrição cadastrada.'}
                </p>
                <p className="mt-5 border-t border-[#edf0f5] pt-4 text-sm text-[#56617d]">Quantidade em estoque</p>
                <p className="mt-1 text-2xl font-bold text-[#050b33]">
                  {material.quantity} <span className="text-base font-semibold text-[#56617d]">{material.unit}</span>
                </p>
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
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f0eaff] text-[#7000ff]">{icon}</div>
      <div>
        <p className="text-sm text-[#56617d]">{label}</p>
        <p className="mt-0.5 text-2xl font-bold">{value}</p>
      </div>
    </article>
  );
}
