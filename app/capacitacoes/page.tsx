'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Globe,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import Header from '@/app/components/header';

export type TrainingCategoryAPI =
  | 'COURSE'
  | 'WORKSHOP'
  | 'LECTURE'
  | 'TRAINING'
  | 'Curso'
  | 'Oficina'
  | 'Palestra'
  | 'Treinamento';

export interface TrainingAPI {
  id: number;
  name: string;
  description: string;
  category?: TrainingCategoryAPI | string;
  date?: string;
  time?: string;
  location?: string;
  image?: string | null;
}

type FilterOption = 'Todos' | 'Cursos' | 'Oficinas' | 'Palestras' | 'Treinamentos';
type IllustrationType = 'fusion360' | 'arduino' | 'python';

const FILTER_OPTIONS: FilterOption[] = [
  'Todos',
  'Cursos',
  'Oficinas',
  'Palestras',
  'Treinamentos',
];

const CATEGORY_LABELS: Record<string, string> = {
  COURSE: 'Curso',
  WORKSHOP: 'Oficina',
  LECTURE: 'Palestra',
  TRAINING: 'Treinamento',
  Curso: 'Curso',
  Oficina: 'Oficina',
  Palestra: 'Palestra',
  Treinamento: 'Treinamento',
};

const FILTER_TO_CATEGORY_LABEL: Record<Exclude<FilterOption, 'Todos'>, string> = {
  Cursos: 'Curso',
  Oficinas: 'Oficina',
  Palestras: 'Palestra',
  Treinamentos: 'Treinamento',
};

//const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8081/api').replace(/\/+$/, '');

async function fetchTrainingsFromAPI(): Promise<TrainingAPI[]> {
  const response = await fetch(`${API_BASE_URL}/trainings`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Falha ao carregar capacitações');
  }

  return response.json();
}

function getCategoryLabel(category?: string): string {
  if (!category) return 'Capacitação';
  return CATEGORY_LABELS[category] ?? category;
}

function getTrainingIllustration(training: TrainingAPI): IllustrationType {
  const text = `${training.name ?? ''} ${training.description ?? ''}`.toLocaleLowerCase('pt-BR');
  if (
    text.includes('arduino') ||
    text.includes('eletrônica') ||
    text.includes('eletronica') ||
    text.includes('esp32')
  ) {
    return 'arduino';
  }
  if (
    text.includes('python') ||
    text.includes('programação') ||
    text.includes('programacao') ||
    text.includes('código')
  ) {
    return 'python';
  }
  return 'fusion360';
}

function formatTrainingDate(dateValue?: string): string {
  if (!dateValue) return 'A definir';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) return dateValue;

  const parsed = new Date(dateValue);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }
  return dateValue;
}

export default function CapacitacoesPage() {
  const [trainings, setTrainings] = useState<TrainingAPI[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [subscribedIds, setSubscribedIds] = useState<number[]>([]);
  const [activeTrainingModal, setActiveTrainingModal] = useState<TrainingAPI | null>(null);

  useEffect(() => {
    fetchTrainingsFromAPI()
      .then((data) => {
        setTrainings(data);
        setLastUpdated(new Date());
      })
      .catch(() =>
        setError(
          'Não foi possível carregar as capacitações. Verifique sua conexão e tente novamente.',
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!activeTrainingModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveTrainingModal(null);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTrainingModal]);

  async function handleRefresh() {
    setIsLoading(true);
    setError('');

    try {
      const data = await fetchTrainingsFromAPI();
      setTrainings(data);
      setLastUpdated(new Date());
    } catch {
      setError(
        'Não foi possível carregar as capacitações. Verifique sua conexão e tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  const filteredTrainings = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('pt-BR');

    return trainings.filter((training) => {
      const categoryLabel = getCategoryLabel(training.category);
      const matchesCategory =
        selectedFilter === 'Todos' ||
        categoryLabel.toLocaleLowerCase('pt-BR') ===
          FILTER_TO_CATEGORY_LABEL[selectedFilter].toLocaleLowerCase('pt-BR');

      const matchesSearch =
        !query ||
        [
          training.name,
          training.description ?? '',
          training.location ?? '',
          categoryLabel,
        ].some((value) => value.toLocaleLowerCase('pt-BR').includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [trainings, selectedFilter, searchTerm]);

  function handleScrollToEvents() {
    const section = document.getElementById('proximos-eventos');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleOpenEnrollModal(training: TrainingAPI) {
    setActiveTrainingModal(training);
  }

  function handleConfirmEnroll(trainingId: number) {
    setSubscribedIds((current) =>
      current.includes(trainingId) ? current : [...current, trainingId],
    );
  }

  function handleCancelEnroll(trainingId: number) {
    setSubscribedIds((current) => current.filter((id) => id !== trainingId));
    setActiveTrainingModal(null);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fb] text-[#050b33] font-sans">
      <Header />

      <main className="flex-1">
        {/* B) BANNER PRINCIPAL */}
        <section className="relative isolate overflow-hidden bg-[#050b33] text-white">
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#7000ff]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-10 h-80 w-80 rounded-full bg-[#00ff9d]/15 blur-3xl" />
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 500"
            preserveAspectRatio="none"
          >
            <path
              d="M -60,420 Q 280,340 620,410 T 1220,370 T 1540,410"
              fill="none"
              stroke="#1e2d67"
              strokeWidth="2"
            />
            <circle cx="210" cy="382" r="7" fill="#7000ff" />
            <circle cx="760" cy="398" r="7" fill="#00ff9d" />
            <circle cx="1260" cy="373" r="7" fill="#ff2a55" />
          </svg>

          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 sm:px-8 md:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#7000ff]/50 bg-[#7000ff]/20 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-[#00ff9d]">
                <Sparkles className="h-3.5 w-3.5 text-[#00ff9d]" />
                CAPACITAÇÕES DO LAB MAKER
              </span>

              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Aprenda, crie e inove com a gente!
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
                Participe de cursos, oficinas e treinamentos oferecidos pelo
                Laboratório Maker e desenvolva novas habilidades em tecnologia,
                inovação e criatividade.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleScrollToEvents}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-[#00ff9d] px-6 py-3.5 text-sm font-extrabold text-[#050b33] shadow-lg shadow-[#00ff9d]/20 transition-all hover:-translate-y-0.5 hover:bg-[#52ffba] cursor-pointer"
                >
                  Ver próximos eventos
                  <ArrowDown className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/20 disabled:cursor-wait disabled:opacity-70 cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Atualizando...' : 'Atualizar lista'}
                </button>
              </div>

              {lastUpdated && (
                <p className="mt-3 text-xs text-white/60">
                  Atualizada às{' '}
                  {lastUpdated.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#0c164f] to-[#070d38] p-3 shadow-2xl">
                <BannerMakerPrinterIllustration />
              </div>
            </div>
          </div>
        </section>

        {/* C) FILTROS E PESQUISA + D) CARDS DE CAPACITAÇÕES */}
        <section
          id="proximos-eventos"
          className="mx-auto max-w-6xl scroll-mt-6 px-6 py-10 sm:px-8 sm:py-12"
        >
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#dfe4ee] bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div
              role="tablist"
              aria-label="Filtrar capacitações por categoria"
              className="flex flex-wrap items-center gap-2"
            >
              {FILTER_OPTIONS.map((filter) => {
                const isSelected = selectedFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedFilter(filter)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#7000ff] text-white shadow-sm shadow-[#7000ff]/25'
                        : 'bg-[#f5f7fb] text-[#050b33] hover:bg-[#eef1ff] hover:text-[#7000ff]'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            <label className="relative block w-full lg:w-80">
              <span className="sr-only">Buscar capacitação</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#56617d]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome, local ou descrição..."
                className="w-full rounded-full border border-[#dfe4ee] bg-[#f8fafc] py-2.5 pl-10 pr-4 text-sm text-[#050b33] placeholder:text-[#68728a] outline-none transition focus:border-[#7000ff] focus:bg-white focus:ring-2 focus:ring-[#7000ff]/15"
              />
            </label>
          </div>

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
                className="inline-flex shrink-0 items-center gap-2 font-bold underline disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" /> Tentar novamente
              </button>
            </div>
          )}

          {isLoading && trainings.length === 0 ? (
            <div
              className="rounded-2xl border border-[#dfe4ee] bg-white p-10 text-center text-[#56617d] shadow-sm"
              role="status"
            >
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#7000ff]" />
              <p className="mt-3">Carregando capacitações...</p>
            </div>
          ) : error && trainings.length === 0 ? null : trainings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cbd2df] bg-white p-10 text-center shadow-sm">
              <Sparkles className="mx-auto h-10 w-10 text-[#7000ff]" />
              <h2 className="mt-4 text-xl font-bold text-[#050b33]">
                Nenhuma capacitação cadastrada
              </h2>
              <p className="mt-2 text-sm text-[#56617d]">
                Quando a administração cadastrar novos cursos, oficinas ou palestras, eles aparecerão nesta página.
              </p>
            </div>
          ) : filteredTrainings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cbd2df] bg-white p-10 text-center shadow-sm">
              <Search className="mx-auto h-10 w-10 text-[#7000ff]" />
              <h2 className="mt-4 text-xl font-bold text-[#050b33]">
                Nenhuma capacitação encontrada
              </h2>
              <p className="mt-2 text-sm text-[#56617d]">
                Não encontramos atividades para o filtro ou termo pesquisado.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedFilter('Todos');
                  setSearchTerm('');
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#7000ff] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5c00d6] cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrainings.map((training) => {
                const isSubscribed = subscribedIds.includes(training.id);
                const categoryLabel = getCategoryLabel(training.category);

                return (
                  <article
                    key={training.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#dfe4ee] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#07113f]">
                      {training.image ? (
                        <Image
                          src={training.image}
                          alt={training.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <TrainingCardIllustration type={getTrainingIllustration(training)} />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="inline-block rounded-full bg-[#f0eaff] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#7000ff]">
                          {categoryLabel}
                        </span>
                        {isSubscribed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Inscrito
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl font-extrabold leading-snug text-[#050b33]">
                        {training.name}
                      </h2>

                      <p className="mt-2.5 flex-1 text-sm leading-6 text-[#56617d]">
                        {training.description || 'Sem descrição cadastrada.'}
                      </p>

                      <div className="mt-5 space-y-2 border-t border-[#edf0f5] pt-4 text-sm text-[#56617d]">
                        <div className="flex items-center gap-2.5">
                          <CalendarDays className="h-4 w-4 shrink-0 text-[#7000ff]" />
                          <span>
                            <strong className="font-semibold text-[#050b33]">Data:</strong>{' '}
                            {formatTrainingDate(training.date)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Clock3 className="h-4 w-4 shrink-0 text-[#7000ff]" />
                          <span>
                            <strong className="font-semibold text-[#050b33]">Horário:</strong>{' '}
                            {training.time || 'A definir'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <MapPin className="h-4 w-4 shrink-0 text-[#7000ff]" />
                          <span>
                            <strong className="font-semibold text-[#050b33]">Local:</strong>{' '}
                            {training.location || 'Laboratório Maker'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto pt-6">
                        <button
                          type="button"
                          onClick={() => handleOpenEnrollModal(training)}
                          className={`w-full rounded-xl px-4 py-3 text-sm font-extrabold transition-all cursor-pointer ${
                            isSubscribed
                              ? 'border border-[#7000ff]/30 bg-[#f0eaff] text-[#7000ff] hover:bg-[#e5dbff]'
                              : 'bg-[#00ff9d] text-[#050b33] shadow-sm hover:bg-[#4affb8]'
                          }`}
                        >
                          {isSubscribed ? 'Ver inscrição' : 'Inscrever-se'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* E) RODAPÉ / CHAMADA FINAL */}
        <section className="mx-auto max-w-6xl px-6 pb-14 sm:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-[#dfe4ee] bg-[#eef1ff] px-6 py-10 text-center shadow-sm sm:px-10">
            <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#7000ff]/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-[#00ff9d]/20 blur-2xl" />

            <div className="relative z-10 mx-auto max-w-xl">
              <h2 className="text-2xl font-extrabold text-[#050b33] sm:text-3xl">
                Fique por dentro!
              </h2>
              <p className="mt-2.5 text-sm leading-6 text-[#56617d] sm:text-base">
                Acompanhe nossas redes e não perca as próximas capacitações.
              </p>

              <div className="mt-6 flex items-center justify-center gap-4">
                <a
                  href="#redes-instagram"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Instagram do Lab Maker"
                  title="Instagram"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#050b33] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#7000ff]"
                >
                  <InstagramIcon />
                </a>
                <a
                  href="#redes-youtube"
                  onClick={(e) => e.preventDefault()}
                  aria-label="YouTube do Lab Maker"
                  title="YouTube"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#050b33] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#7000ff]"
                >
                  <YoutubeIcon />
                </a>
                <a
                  href="#redes-linkedin"
                  onClick={(e) => e.preventDefault()}
                  aria-label="LinkedIn do Lab Maker"
                  title="LinkedIn"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#050b33] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#7000ff]"
                >
                  <LinkedinIcon />
                </a>
                <a
                  href="#redes-portal"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Portal do Lab Maker"
                  title="Portal Institucional"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#050b33] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#7000ff]"
                >
                  <Globe className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {activeTrainingModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-inscricao-titulo"
          onClick={() => setActiveTrainingModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b33]/60 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-[#dfe4ee] bg-white p-6 text-[#050b33] shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setActiveTrainingModal(null)}
              aria-label="Fechar aviso de inscrição"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[#56617d] transition hover:bg-[#f5f7fb] hover:text-[#050b33] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="inline-block rounded-full bg-[#f0eaff] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#7000ff]">
              {getCategoryLabel(activeTrainingModal.category)}
            </span>

            <h3 id="modal-inscricao-titulo" className="mt-3 text-xl font-extrabold">
              {activeTrainingModal.name}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#56617d]">
              {activeTrainingModal.description || 'Sem descrição cadastrada.'}
            </p>

            <div className="mt-4 space-y-2 rounded-xl bg-[#f5f7fb] p-4 text-sm text-[#56617d]">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#7000ff]" />
                <span>
                  <strong className="text-[#050b33]">Data:</strong>{' '}
                  {formatTrainingDate(activeTrainingModal.date)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#7000ff]" />
                <span>
                  <strong className="text-[#050b33]">Horário:</strong>{' '}
                  {activeTrainingModal.time || 'A definir'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#7000ff]" />
                <span>
                  <strong className="text-[#050b33]">Local:</strong>{' '}
                  {activeTrainingModal.location || 'Laboratório Maker'}
                </span>
              </div>
            </div>

            {subscribedIds.includes(activeTrainingModal.id) ? (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs leading-5 text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Inscrição registrada! Compareça ao{' '}
                  <strong>{activeTrainingModal.location || 'Laboratório Maker'}</strong> na data e
                  horário indicados.
                </span>
              </div>
            ) : (
              <p className="mt-4 text-xs leading-5 text-[#68728a]">
                Confirme abaixo para registrar sua participação nesta capacitação.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              {subscribedIds.includes(activeTrainingModal.id) ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleCancelEnroll(activeTrainingModal.id)}
                    className="rounded-xl border border-[#dfe4ee] px-4 py-2.5 text-sm font-bold text-[#56617d] transition hover:bg-[#f5f7fb] cursor-pointer"
                  >
                    Cancelar inscrição
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTrainingModal(null)}
                    className="rounded-xl bg-[#050b33] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#7000ff] cursor-pointer"
                  >
                    Fechar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTrainingModal(null)}
                    className="rounded-xl border border-[#dfe4ee] px-4 py-2.5 text-sm font-bold text-[#56617d] transition hover:bg-[#f5f7fb] cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmEnroll(activeTrainingModal.id)}
                    className="rounded-xl bg-[#00ff9d] px-5 py-2.5 text-sm font-extrabold text-[#050b33] transition hover:bg-[#4affb8] cursor-pointer"
                  >
                    Confirmar inscrição
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function BannerMakerPrinterIllustration() {
  return (
    <svg
      viewBox="0 0 520 340"
      className="h-auto w-full rounded-xl"
      role="img"
      aria-label="Impressora 3D em funcionamento no Laboratório Maker"
    >
      <defs>
        <linearGradient id="bannerBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#09154a" />
          <stop offset="55%" stopColor="#121e63" />
          <stop offset="100%" stopColor="#1d1158" />
        </linearGradient>
        <linearGradient id="neonGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00ff9d" />
          <stop offset="100%" stopColor="#00b8ff" />
        </linearGradient>
      </defs>

      <rect width="520" height="340" rx="14" fill="url(#bannerBg)" />

      <g stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1">
        <line x1="0" y1="60" x2="520" y2="60" />
        <line x1="0" y1="120" x2="520" y2="120" />
        <line x1="0" y1="180" x2="520" y2="180" />
        <line x1="0" y1="240" x2="520" y2="240" />
        <line x1="0" y1="300" x2="520" y2="300" />
        <line x1="80" y1="0" x2="80" y2="340" />
        <line x1="160" y1="0" x2="160" y2="340" />
        <line x1="240" y1="0" x2="240" y2="340" />
        <line x1="320" y1="0" x2="320" y2="340" />
        <line x1="400" y1="0" x2="400" y2="340" />
        <line x1="480" y1="0" x2="480" y2="340" />
      </g>

      <circle cx="260" cy="195" r="95" fill="#00ff9d" opacity="0.12" />
      <circle cx="340" cy="120" r="70" fill="#7000ff" opacity="0.2" />

      <circle cx="115" cy="95" r="34" fill="#1b2868" stroke="#4859a3" strokeWidth="5" />
      <circle cx="115" cy="95" r="22" fill="none" stroke="#00ff9d" strokeWidth="8" strokeDasharray="36 8" />
      <circle cx="115" cy="95" r="9" fill="#050b33" />

      <rect x="135" y="42" width="16" height="236" rx="4" fill="#28357a" />
      <rect x="369" y="42" width="16" height="236" rx="4" fill="#28357a" />
      <rect x="125" y="34" width="270" height="18" rx="6" fill="#374794" />

      <rect x="151" y="128" width="218" height="10" rx="3" fill="#64748b" />
      <line x1="151" y1="133" x2="369" y2="133" stroke="#cbd5e1" strokeWidth="2" />

      <path d="M 135 80 Q 210 55 258 112" fill="none" stroke="#00ff9d" strokeWidth="3" />

      <rect x="234" y="108" width="48" height="44" rx="8" fill="#050b33" stroke="#00ff9d" strokeWidth="2" />
      <rect x="244" y="118" width="28" height="14" rx="3" fill="#7000ff" />
      <circle cx="258" cy="141" r="4" fill="#00ff9d" />
      <polygon points="252,152 264,152 259,164 257,164" fill="#ffbe0b" />
      <circle cx="258" cy="166" r="6" fill="#00ff9d" opacity="0.85" />
      <circle cx="258" cy="166" r="13" fill="#00ff9d" opacity="0.28" />

      <g>
        <polygon
          points="258,166 296,188 296,232 258,252 220,232 220,188"
          fill="url(#neonGreen)"
          fillOpacity="0.28"
          stroke="#00ff9d"
          strokeWidth="2.5"
        />
        <line x1="258" y1="166" x2="258" y2="252" stroke="#00ff9d" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="220" y1="188" x2="296" y2="232" stroke="#00ff9d" strokeWidth="1.2" strokeOpacity="0.5" />
        <line x1="296" y1="188" x2="220" y2="232" stroke="#00ff9d" strokeWidth="1.2" strokeOpacity="0.5" />
        <line x1="224" y1="205" x2="292" y2="205" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.45" />
        <line x1="224" y1="220" x2="292" y2="220" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.45" />
      </g>

      <rect x="172" y="252" width="176" height="10" rx="4" fill="#475569" />
      <rect x="180" y="248" width="160" height="5" rx="2" fill="#00ff9d" opacity="0.7" />

      <rect x="115" y="272" width="290" height="42" rx="10" fill="#172259" stroke="#394b99" strokeWidth="2" />
      <rect x="315" y="282" width="66" height="22" rx="4" fill="#050b33" stroke="#00ff9d" strokeWidth="1.2" />
      <text x="325" y="297" fill="#00ff9d" fontSize="10" fontFamily="monospace" fontWeight="bold">
        210°C OK
      </text>
      <circle cx="145" cy="293" r="5" fill="#ff2a55" />
      <circle cx="163" cy="293" r="5" fill="#7000ff" />
      <circle cx="181" cy="293" r="5" fill="#00ff19" />
      <circle cx="199" cy="293" r="5" fill="#ff6a00" />
    </svg>
  );
}

function TrainingCardIllustration({ type }: { type: IllustrationType }) {
  const gradientId = useId();

  if (type === 'fusion360') {
    return (
      <svg
        viewBox="0 0 400 250"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        role="img"
        aria-label="Ilustração do curso de Modelagem 3D"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#07113f" />
            <stop offset="100%" stopColor="#1e1b6b" />
          </linearGradient>
        </defs>
        <rect width="400" height="250" fill={`url(#${gradientId})`} />
        <g stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1">
          <line x1="40" y1="195" x2="360" y2="195" />
          <line x1="70" y1="165" x2="330" y2="165" />
          <line x1="100" y1="135" x2="300" y2="135" />
          <line x1="200" y1="45" x2="200" y2="220" />
          <line x1="120" y1="195" x2="175" y2="120" />
          <line x1="280" y1="195" x2="225" y2="120" />
        </g>
        <rect x="28" y="22" width="344" height="206" rx="10" fill="#0b1548" stroke="#3b4c9c" strokeWidth="1.5" />
        <rect x="28" y="22" width="344" height="24" rx="10" fill="#162366" />
        <circle cx="46" cy="34" r="4" fill="#ff2a55" />
        <circle cx="60" cy="34" r="4" fill="#ffbe0b" />
        <circle cx="74" cy="34" r="4" fill="#00ff9d" />
        <text x="95" y="38" fill="#cbd5e1" fontSize="10" fontFamily="monospace" fontWeight="bold">
          FUSION 360 • CAD 3D
        </text>
        <g transform="translate(200, 132)">
          <polygon points="0,-54 52,-26 0,2 -52,-26" fill="#7000ff" fillOpacity="0.55" stroke="#00ff9d" strokeWidth="2" />
          <polygon points="-52,-26 0,2 0,58 -52,30" fill="#4f46e5" fillOpacity="0.65" stroke="#00ff9d" strokeWidth="2" />
          <polygon points="52,-26 0,2 0,58 52,30" fill="#00ff9d" fillOpacity="0.3" stroke="#00ff9d" strokeWidth="2" />
          <circle cx="0" cy="-26" r="14" fill="#0b1548" stroke="#00ff9d" strokeWidth="2" />
          <line x1="0" y1="-54" x2="0" y2="-74" stroke="#00ff9d" strokeWidth="2" />
          <line x1="52" y1="30" x2="72" y2="42" stroke="#ff2a55" strokeWidth="2" />
          <line x1="-52" y1="30" x2="-72" y2="42" stroke="#38bdf8" strokeWidth="2" />
        </g>
        <rect x="44" y="62" width="54" height="22" rx="5" fill="#7000ff" />
        <text x="53" y="77" fill="#ffffff" fontSize="11" fontWeight="bold">
          3D CAD
        </text>
      </svg>
    );
  }

  if (type === 'arduino') {
    return (
      <svg
        viewBox="0 0 400 250"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        role="img"
        aria-label="Ilustração da oficina de Eletrônica e Microcontroladores"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#051c38" />
            <stop offset="100%" stopColor="#0a3b5c" />
          </linearGradient>
        </defs>
        <rect width="400" height="250" fill={`url(#${gradientId})`} />
        <g stroke="#00ff9d" strokeOpacity="0.18" strokeWidth="2" fill="none">
          <path d="M 20 50 L 90 50 L 115 75" />
          <path d="M 380 65 L 310 65 L 285 90" />
          <path d="M 30 200 L 105 200 L 130 175" />
          <path d="M 370 190 L 300 190 L 275 165" />
        </g>
        <rect x="85" y="48" width="230" height="154" rx="12" fill="#008184" stroke="#00ff9d" strokeWidth="2.5" />
        <rect x="68" y="74" width="28" height="34" rx="4" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
        <rect x="72" y="148" width="24" height="28" rx="3" fill="#1e293b" />
        <rect x="120" y="56" width="165" height="12" rx="2" fill="#0f172a" />
        <g fill="#facc15">
          <rect x="128" y="59" width="6" height="6" />
          <rect x="142" y="59" width="6" height="6" />
          <rect x="156" y="59" width="6" height="6" />
          <rect x="170" y="59" width="6" height="6" />
          <rect x="184" y="59" width="6" height="6" />
          <rect x="198" y="59" width="6" height="6" />
          <rect x="212" y="59" width="6" height="6" />
          <rect x="226" y="59" width="6" height="6" />
          <rect x="240" y="59" width="6" height="6" />
          <rect x="254" y="59" width="6" height="6" />
          <rect x="268" y="59" width="6" height="6" />
        </g>
        <rect x="135" y="182" width="150" height="12" rx="2" fill="#0f172a" />
        <rect x="165" y="108" width="96" height="34" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
        <text x="182" y="129" fill="#00ff9d" fontSize="11" fontFamily="monospace" fontWeight="bold">
          ARDUINO
        </text>
        <circle cx="130" cy="118" r="14" fill="none" stroke="#ffffff" strokeWidth="3.5" />
        <circle cx="152" cy="118" r="14" fill="none" stroke="#ffffff" strokeWidth="3.5" />
        <circle cx="285" cy="95" r="6" fill="#00ff9d" />
        <circle cx="285" cy="95" r="12" fill="#00ff9d" opacity="0.35" />
        <circle cx="285" cy="122" r="5" fill="#ff2a55" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 400 250"
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      role="img"
      aria-label="Ilustração do curso de Programação em Python"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#050b33" />
          <stop offset="100%" stopColor="#26145c" />
        </linearGradient>
      </defs>
      <rect width="400" height="250" fill={`url(#${gradientId})`} />
      <rect x="36" y="26" width="328" height="198" rx="12" fill="#0d153f" stroke="#4353a3" strokeWidth="1.5" />
      <rect x="36" y="26" width="328" height="26" rx="12" fill="#182464" />
      <circle cx="56" cy="39" r="4.5" fill="#ff2a55" />
      <circle cx="71" cy="39" r="4.5" fill="#ffbe0b" />
      <circle cx="86" cy="39" r="4.5" fill="#00ff9d" />
      <text x="108" y="43" fill="#cbd5e1" fontSize="10" fontFamily="monospace" fontWeight="bold">
        main.py — Python 3
      </text>

      <g fontFamily="monospace" fontSize="12" fontWeight="bold">
        <text x="56" y="80" fill="#7000ff">def</text>
        <text x="86" y="80" fill="#00ff9d">inovar_lab_maker</text>
        <text x="206" y="80" fill="#ffffff">():</text>

        <rect x="74" y="94" width="140" height="8" rx="4" fill="#38bdf8" opacity="0.8" />
        <rect x="222" y="94" width="65" height="8" rx="4" fill="#facc15" opacity="0.85" />

        <text x="74" y="126" fill="#ff79c6">for</text>
        <text x="104" y="126" fill="#ffffff">projeto</text>
        <text x="164" y="126" fill="#ff79c6">in</text>
        <text x="188" y="126" fill="#00ff9d">ideias</text>
        <text x="234" y="126" fill="#ffffff">:</text>

        <text x="92" y="150" fill="#38bdf8">print</text>
        <text x="130" y="150" fill="#facc15">(&quot;Olá, Mundo Maker!&quot;)</text>

        <rect x="56" y="170" width="288" height="36" rx="6" fill="#050b33" stroke="#00ff9d" strokeOpacity="0.4" />
        <text x="68" y="193" fill="#00ff9d" fontSize="11">
          &gt;&gt;&gt; Executando script Python... OK!
        </text>
      </g>

      <rect x="292" y="64" width="54" height="24" rx="6" fill="#facc15" />
      <text x="307" y="80" fill="#050b33" fontSize="12" fontFamily="monospace" fontWeight="bold">
        .PY
      </text>
    </svg>
  );
}
