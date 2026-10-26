'use client';

import { useEffect, useState } from 'react';
import { Boxes, PackagePlus } from 'lucide-react';
import Header from '@/app/components/header';
import { createMaterial, getMaterials } from '@/app/lib/api';
import { useAdminAccess } from '@/app/lib/use-admin-access';
import type { MaterialAPI, MaterialPayload } from '@/app/types/api';

const EMPTY_FORM: MaterialPayload = {
  name: '',
  description: '',
  quantity: 0,
  unit: 'unidades',
};

export default function MaterialsAdminPage() {
  const authorized = useAdminAccess();
  const [materials, setMaterials] = useState<MaterialAPI[]>([]);
  const [form, setForm] = useState<MaterialPayload>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!authorized) return;
    getMaterials()
      .then(setMaterials)
      .catch(() => setError('Não foi possível carregar os materiais. Verifique a conexão com o servidor.'))
      .finally(() => setIsLoading(false));
  }, [authorized]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    try {
      const material = await createMaterial({
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        unit: form.unit.trim(),
      });
      setMaterials((current) => [...current, material].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(EMPTY_FORM);
      setNotice(`${material.name} cadastrado com sucesso.`);
    } catch {
      setError('Não foi possível cadastrar o material. Confira os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!authorized) return <main className="p-10 text-center">Verificando acesso...</main>;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header authenticated />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#050b33] text-[#00ff9d]">
            <Boxes className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7000ff]">Área restrita</p>
            <h1 className="mt-1 text-3xl font-bold">Controle de materiais</h1>
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-xl border border-[#dfe4ee] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <PackagePlus className="h-6 w-6 text-[#7000ff]" />
              <h2 className="text-xl font-bold">Cadastrar material</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-sm font-semibold">
                Nome do material
                <input
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-[#cbd2df] px-4 py-3 font-normal outline-none focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/20"
                  placeholder="Ex.: Filamento PLA"
                />
              </label>

              <label className="block text-sm font-semibold">
                Descrição <span className="font-normal text-[#68728a]">(opcional)</span>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="mt-2 w-full resize-y rounded-lg border border-[#cbd2df] px-4 py-3 font-normal outline-none focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/20"
                  placeholder="Detalhes ou especificações do material"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Quantidade inicial
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.valueAsNumber }))}
                    className="mt-2 w-full rounded-lg border border-[#cbd2df] px-4 py-3 font-normal outline-none focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/20"
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Unidade
                  <input
                    required
                    maxLength={30}
                    value={form.unit}
                    onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                    className="mt-2 w-full rounded-lg border border-[#cbd2df] px-4 py-3 font-normal outline-none focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/20"
                    placeholder="Ex.: rolos, metros, unidades"
                  />
                </label>
              </div>

              {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
              {notice && <p className="text-sm text-emerald-700" role="status">{notice}</p>}

              <button
                type="submit"
                disabled={isSubmitting || !Number.isInteger(form.quantity) || form.quantity < 0}
                className="w-full rounded-lg bg-[#050b33] px-5 py-3 font-bold text-white transition-colors hover:bg-[#101d5e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'CADASTRANDO...' : 'CADASTRAR MATERIAL'}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-[#dfe4ee] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Materiais cadastrados</h2>
              <span className="rounded-full bg-[#f0eaff] px-3 py-1 text-sm font-bold text-[#7000ff]">
                {materials.length}
              </span>
            </div>

            {isLoading ? (
              <p className="text-sm text-[#56617d]" role="status">Carregando materiais...</p>
            ) : error && materials.length === 0 ? (
              <p className="text-sm text-red-700" role="alert">{error}</p>
            ) : materials.length === 0 ? (
              <p className="rounded-lg bg-[#f5f7fb] p-5 text-sm text-[#56617d]">Ainda não há materiais cadastrados.</p>
            ) : (
              <ul className="divide-y divide-[#edf0f5]">
                {materials.map((material) => (
                  <li key={material.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <PackagePlus className="h-5 w-5 shrink-0 text-[#7000ff]" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{material.name}</p>
                        {material.description && <p className="truncate text-sm text-[#68728a]">{material.description}</p>}
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-bold">{material.quantity} {material.unit}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
