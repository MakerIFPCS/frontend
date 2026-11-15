'use client';

import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { Boxes, PackagePlus, Pencil, X } from 'lucide-react';
import Header from '@/app/components/header';
import { createMaterial, getMaterials, updateMaterial } from '@/app/lib/api';
import { useAdminAccess } from '@/app/lib/use-admin-access';
import type { MaterialAPI, MaterialPayload } from '@/app/types/api';

type MaterialFormState = Omit<MaterialPayload, 'quantity'> & {
  quantity: string;
};

const EMPTY_FORM: MaterialFormState = {
  name: '',
  description: '',
  quantity: '',
  unit: 'unidades',
};

export default function MaterialsAdminPage() {
  const authorized = useAdminAccess();
  const [materials, setMaterials] = useState<MaterialAPI[]>([]);
  const [form, setForm] = useState<MaterialFormState>(EMPTY_FORM);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
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

    const quantity = Number(form.quantity);
    if (form.quantity.trim() === '' || !Number.isInteger(quantity) || quantity < 0) {
      setError('Informe uma quantidade inteira igual ou maior que zero.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: MaterialPayload = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        quantity,
        unit: form.unit.trim(),
      };
      const material = editingMaterialId === null
        ? await createMaterial(payload)
        : await updateMaterial(editingMaterialId, payload);
      setMaterials((current) => {
        const updated = editingMaterialId === null
          ? [...current, material]
          : current.map((item) => item.id === material.id ? material : item);
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });
      setForm(EMPTY_FORM);
      setNotice(editingMaterialId === null
        ? `${material.name} cadastrado com sucesso.`
        : `${material.name} atualizado com sucesso.`);
      setEditingMaterialId(null);
    } catch (error) {
      const apiMessage = isAxiosError<{ message?: unknown }>(error)
        ? error.response?.data?.message
        : undefined;
      setError(
        typeof apiMessage === 'string'
          ? apiMessage
          : 'Não foi possível cadastrar o material. Confira os dados e tente novamente.',
      );
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
              <h2 className="text-xl font-bold">
                {editingMaterialId === null ? 'Cadastrar material' : 'Editar material'}
              </h2>
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
                  {editingMaterialId === null ? 'Quantidade inicial' : 'Quantidade'}
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))}
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
                disabled={
                  isSubmitting
                  || form.quantity.trim() === ''
                  || !Number.isInteger(Number(form.quantity))
                  || Number(form.quantity) < 0
                }
                className="w-full rounded-lg bg-[#050b33] px-5 py-3 font-bold text-white transition-colors hover:bg-[#101d5e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? editingMaterialId === null ? 'CADASTRANDO...' : 'SALVANDO...'
                  : editingMaterialId === null ? 'CADASTRAR MATERIAL' : 'SALVAR ALTERAÇÕES'}
              </button>
              {editingMaterialId !== null && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setEditingMaterialId(null);
                    setForm(EMPTY_FORM);
                    setError('');
                    setNotice('');
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#cbd2df] px-5 py-3 font-semibold text-[#56617d] hover:bg-[#f5f7fb] disabled:opacity-60"
                >
                  <X className="h-4 w-4" /> Cancelar edição
                </button>
              )}
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
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="text-sm font-bold">{material.quantity} {material.unit}</p>
                      <button
                        type="button"
                        aria-label={`Editar ${material.name}`}
                        onClick={() => {
                          setEditingMaterialId(material.id);
                          setForm({
                            name: material.name,
                            description: material.description ?? '',
                            quantity: String(material.quantity),
                            unit: material.unit,
                          });
                          setError('');
                          setNotice('');
                        }}
                        className="rounded-lg p-2 text-[#56617d] hover:bg-[#f0eaff] hover:text-[#7000ff]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
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
