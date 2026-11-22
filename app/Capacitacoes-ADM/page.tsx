'use client';

import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { GraduationCap, Pencil, Plus, Trash2, X } from 'lucide-react';
import Header from '@/app/components/header';
import { createTraining, deleteTraining, getTrainings, updateTraining } from '@/app/lib/api';
import { useAdminAccess } from '@/app/lib/use-admin-access';
import type { TrainingAPI, TrainingCategoryAPI, TrainingPayload } from '@/app/types/api';

type TrainingFormState = TrainingPayload;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const EMPTY_FORM: TrainingFormState = {
  name: '',
  description: '',
  category: 'COURSE',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  image: '',
};

const CATEGORY_OPTIONS: Array<{ value: TrainingCategoryAPI; label: string }> = [
  { value: 'COURSE', label: 'Curso' },
  { value: 'LECTURE', label: 'Palestra' },
  { value: 'WORKSHOP', label: 'Oficina' },
  { value: 'TRAINING', label: 'Treinamento' },
];

const CATEGORY_LABELS = {
  COURSE: 'Curso',
  LECTURE: 'Palestra',
  WORKSHOP: 'Oficina',
  TRAINING: 'Treinamento',
} satisfies Record<TrainingCategoryAPI, string>;

function isTrainingCategory(value: string): value is TrainingCategoryAPI {
  return CATEGORY_OPTIONS.some((option) => option.value === value);
}

function getApiError(error: unknown, fallback: string) {
  if (isAxiosError<unknown>(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      const body = data as Record<string, unknown>;
      if (typeof body.message === 'string') return body.message;
      if (typeof body.detail === 'string') return body.detail;
    }
    if (error.response?.status === 403) {
      return 'A API recusou esta operação (403). Confirme se a sessão atual pertence a uma conta administrativa no servidor e entre novamente.';
    }
    if (error.response) return `Não foi possível concluir a operação (erro ${error.response.status}).`;
    if (error.request) return 'Não foi possível conectar à API. Verifique se o servidor está em execução.';
  }
  return fallback;
}

function toDateInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function formatTrainingDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatTrainingTime(training: Pick<TrainingAPI, 'startTime' | 'endTime' | 'time'>) {
  const startTime = training.startTime || training.time;
  if (startTime && training.endTime) return `${startTime.slice(0, 5)} - ${training.endTime.slice(0, 5)}`;
  return startTime?.slice(0, 5) || training.endTime?.slice(0, 5) || '';
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Não foi possível ler a imagem selecionada.'));
    };
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
    reader.onabort = () => reject(new Error('A leitura da imagem foi cancelada.'));
    reader.readAsDataURL(file);
  });
}

export default function CapacitacoesAdminPage() {
  const authorized = useAdminAccess();
  const [trainings, setTrainings] = useState<TrainingAPI[]>([]);
  const [form, setForm] = useState<TrainingFormState>(EMPTY_FORM);
  const [editingTrainingId, setEditingTrainingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingTrainingId, setDeletingTrainingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!authorized) return;
    getTrainings()
      .then(setTrainings)
      .catch((loadError: unknown) => setError(
        getApiError(loadError, 'Não foi possível carregar as capacitações. Tente novamente.'),
      ))
      .finally(() => setIsLoading(false));
  }, [authorized]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingTrainingId(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    const payload: TrainingPayload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      startTime: form.startTime.trim(),
      endTime: form.endTime.trim(),
      time: form.startTime.trim(),
      location: form.location.trim(),
      ...(form.image?.trim() ? { image: form.image.trim() } : { image: undefined }),
    };

    if (Boolean(payload.startTime) !== Boolean(payload.endTime)) {
      setError('Informe os horários de início e fim ou deixe ambos em branco.');
      setIsSubmitting(false);
      return;
    }
    if (payload.startTime && payload.endTime && payload.endTime <= payload.startTime) {
      setError('O horário de fim deve ser posterior ao horário de início.');
      setIsSubmitting(false);
      return;
    }

    try {
      const training = editingTrainingId === null
        ? await createTraining(payload)
        : await updateTraining(editingTrainingId, payload);
      setTrainings((current) => {
        const updated = editingTrainingId === null
          ? [...current, training]
          : current.map((item) => item.id === training.id ? training : item);
        return updated.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      });
      setNotice(editingTrainingId === null
        ? `${training.name} cadastrado com sucesso.`
        : `${training.name} atualizado com sucesso.`);
      resetForm();
    } catch (submitError: unknown) {
      setError(getApiError(submitError, 'Não foi possível salvar a capacitação. Confira os dados e tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(training: TrainingAPI) {
    if (!window.confirm(`Deseja excluir "${training.name}"?`)) return;
    setError('');
    setNotice('');
    setDeletingTrainingId(training.id);

    try {
      await deleteTraining(training.id);
      setTrainings((current) => current.filter((item) => item.id !== training.id));
      if (editingTrainingId === training.id) resetForm();
      setNotice(`${training.name} excluído com sucesso.`);
    } catch (deleteError: unknown) {
      setError(getApiError(deleteError, `Não foi possível excluir ${training.name}. Tente novamente.`));
    } finally {
      setDeletingTrainingId(null);
    }
  }

  function beginEdit(training: TrainingAPI) {
    setEditingTrainingId(training.id);
    setForm({
      name: training.name,
      description: training.description ?? '',
      category: training.category,
      date: toDateInput(training.date),
      startTime: (training.startTime || training.time)?.slice(0, 5) ?? '',
      endTime: training.endTime?.slice(0, 5) ?? '',
      location: training.location ?? '',
      image: training.image ?? '',
    });
    setError('');
    setNotice('');
  }

  if (!authorized) return <main className="p-10 text-center">Verificando acesso...</main>;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header authenticated />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#050b33] text-[#00ff9d]">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7000ff]">Área restrita</p>
            <h1 className="mt-1 text-3xl font-bold">Gerenciar capacitações</h1>
          </div>
        </div>

        <p className="mb-8 max-w-3xl leading-7 text-[#56617d]">
          Cadastre e atualize cursos, palestras, oficinas, treinamentos e outras atividades exibidas na página de capacitações.
        </p>

        {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {notice && <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-xl border border-[#dfe4ee] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              {editingTrainingId === null
                ? <Plus className="h-6 w-6 text-[#7000ff]" />
                : <Pencil className="h-6 w-6 text-[#7000ff]" />}
              <h2 className="text-xl font-bold">
                {editingTrainingId === null ? 'Adicionar atividade' : 'Editar atividade'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-sm font-semibold">
                Nome
                <input
                  required
                  maxLength={150}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-[#cbd2df] px-4 py-3 font-normal outline-none focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/20"
                  placeholder="Ex.: Introdução à impressão 3D"
                />
              </label>

              <label className="block text-sm font-semibold">
                Categoria
                <select
                  required
                  value={form.category}
                  onChange={(event) => {
                    const category = event.target.value;
                    if (!isTrainingCategory(category)) return;
                    setForm((current) => ({ ...current, category }));
                  }}
                  className="mt-2 w-full rounded-lg border border-[#cbd2df] bg-white px-4 py-3 font-normal"
                >
                  {CATEGORY_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold">
                Descrição
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="mt-2 w-full resize-y rounded-lg border border-[#cbd2df] px-4 py-3 font-normal outline-none focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/20"
                  placeholder="Informações sobre conteúdo, público e requisitos"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Data <span className="font-normal text-[#68728a]">(opcional)</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                    className="mt-2 w-full rounded-lg border border-[#cbd2df] bg-white px-4 py-3 font-normal"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    Início <span className="font-normal text-[#68728a]">(opcional)</span>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                      className="mt-2 w-full rounded-lg border border-[#cbd2df] bg-white px-4 py-3 font-normal"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Fim <span className="font-normal text-[#68728a]">(opcional)</span>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                      className="mt-2 w-full rounded-lg border border-[#cbd2df] bg-white px-4 py-3 font-normal"
                    />
                  </label>
                </div>
              </div>

              <label className="block text-sm font-semibold">
                Local <span className="font-normal text-[#68728a]">(opcional)</span>
                <input
                  maxLength={200}
                  value={form.location}
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-[#cbd2df] px-4 py-3 font-normal outline-none focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/20"
                  placeholder="Ex.: Laboratório Maker"
                />
              </label>

              <label className="block text-sm font-semibold">
                Imagem da atividade <span className="font-normal text-[#68728a]">(opcional)</span>
                <input
                  type="url"
                  maxLength={2048}
                  value={form.image?.startsWith('data:') ? '' : form.image ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-[#cbd2df] px-4 py-3 font-normal outline-none focus:border-[#7000ff] focus:ring-2 focus:ring-[#7000ff]/20"
                  placeholder="https://..."
                />
              </label>
              <label className="block text-sm font-semibold">
                Ou envie uma imagem do dispositivo
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  disabled={isSubmitting}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setError('');
                    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                      setError('Escolha uma imagem PNG, JPG, WEBP ou GIF.');
                      event.target.value = '';
                      return;
                    }
                    if (file.size > MAX_IMAGE_SIZE) {
                      setError('A imagem deve ter no máximo 5 MB.');
                      event.target.value = '';
                      return;
                    }
                    try {
                      const image = await readImageAsDataUrl(file);
                      setForm((current) => ({ ...current, image }));
                    } catch (imageError: unknown) {
                      setError(imageError instanceof Error ? imageError.message : 'Não foi possível carregar a imagem.');
                    }
                  }}
                  className="mt-2 block w-full rounded-lg border border-[#cbd2df] bg-white p-3 text-sm font-normal"
                />
                <span className="mt-1 block font-normal text-[#68728a]">PNG, JPG, WEBP ou GIF; até 5 MB.</span>
              </label>
              {form.image && (
                <div className="space-y-2">
                  <div className="relative aspect-video overflow-hidden rounded-lg border border-[#dfe4ee] bg-[#f5f7fb]">
                    <Image src={form.image} alt="Pré-visualização da imagem da atividade" fill unoptimized sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, image: '' }))}
                    className="text-sm font-semibold text-red-700 hover:underline"
                  >
                    Remover imagem
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || deletingTrainingId !== null}
                className="w-full rounded-lg bg-[#050b33] px-5 py-3 font-bold text-white transition-colors hover:bg-[#101d5e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? 'SALVANDO...'
                  : editingTrainingId === null ? 'CADASTRAR ATIVIDADE' : 'SALVAR ALTERAÇÕES'}
              </button>
              {editingTrainingId !== null && (
                <button
                  type="button"
                  disabled={isSubmitting || deletingTrainingId !== null}
                  onClick={() => {
                    resetForm();
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
              <h2 className="text-xl font-bold">Atividades cadastradas</h2>
              <span className="rounded-full bg-[#f0eaff] px-3 py-1 text-sm font-bold text-[#7000ff]">{trainings.length}</span>
            </div>

            {isLoading ? (
              <p className="text-sm text-[#56617d]" role="status">Carregando atividades...</p>
            ) : error && trainings.length === 0 ? (
              <p className="rounded-lg bg-red-50 p-5 text-sm text-red-800" role="status">
                Não foi possível carregar a lista de atividades.
              </p>
            ) : trainings.length === 0 ? (
              <p className="rounded-lg bg-[#f5f7fb] p-5 text-sm text-[#56617d]">Ainda não há atividades cadastradas.</p>
            ) : (
              <ul className="divide-y divide-[#edf0f5]">
                {trainings.map((training) => (
                  <li key={training.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-semibold">{training.name}</p>
                      <p className="mt-1 text-sm text-[#7000ff]">
                        {CATEGORY_LABELS[training.category] ?? training.category}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-[#68728a]">{training.description}</p>
                      {(training.date || formatTrainingTime(training) || training.location) && (
                        <p className="mt-2 text-xs text-[#68728a]">
                          {[formatTrainingDate(training.date), formatTrainingTime(training), training.location].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={isSubmitting || deletingTrainingId !== null}
                        aria-label={`Editar ${training.name}`}
                        onClick={() => beginEdit(training)}
                        className="rounded-lg p-2 text-[#56617d] hover:bg-[#f0eaff] hover:text-[#7000ff] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting || deletingTrainingId !== null}
                        aria-label={`Excluir ${training.name}`}
                        onClick={() => void handleDelete(training)}
                        className="rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingTrainingId === training.id
                          ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent" aria-hidden="true" />
                          : <Trash2 className="h-4 w-4" />}
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
