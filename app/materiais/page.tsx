'use client';

import { useEffect, useState } from 'react';
import { Boxes, Package, RefreshCw } from 'lucide-react';
import Header from '@/app/components/header';
import { getMaterials } from '@/app/lib/api';
import type { MaterialAPI } from '@/app/types/api';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMaterials()
      .then(setMaterials)
      .catch(() => setError('Não foi possível carregar os materiais. Tente novamente mais tarde.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#050b33] text-[#00ff9d]">
            <Boxes className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7000ff]">Espaço Maker</p>
            <h1 className="mt-1 text-3xl font-bold">Materiais do laboratório</h1>
          </div>
        </div>

        <p className="mb-8 max-w-2xl leading-7 text-[#56617d]">
          Consulte os materiais disponíveis no laboratório e suas quantidades em estoque.
        </p>

        {isLoading ? (
          <p className="rounded-xl border border-[#dfe4ee] bg-white p-6 text-[#56617d]" role="status">
            Carregando materiais...
          </p>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setError('');
                getMaterials()
                  .then(setMaterials)
                  .catch(() => setError('Não foi possível carregar os materiais. Tente novamente mais tarde.'))
                  .finally(() => setIsLoading(false));
              }}
              className="mt-3 inline-flex items-center gap-2 font-semibold underline"
            >
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          </div>
        ) : materials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#cbd2df] bg-white p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-[#7000ff]" />
            <h2 className="mt-4 text-xl font-bold">Nenhum material cadastrado</h2>
            <p className="mt-2 text-[#56617d]">Os materiais do laboratório aparecerão aqui quando forem cadastrados.</p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <li key={material.id} className="rounded-xl border border-[#dfe4ee] bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f0eaff] text-[#7000ff]">
                    <Package className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${material.quantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {material.quantity > 0 ? 'Em estoque' : 'Sem estoque'}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-bold">{material.name}</h2>
                {material.description && <p className="mt-2 min-h-12 text-sm leading-6 text-[#56617d]">{material.description}</p>}
                <p className="mt-5 border-t border-[#edf0f5] pt-4 text-sm text-[#56617d]">
                  Quantidade em estoque
                </p>
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
