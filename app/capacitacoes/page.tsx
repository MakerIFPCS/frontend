'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Globe,
  MapPin,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import Header from '@/app/components/header';

type TrainingCategory = 'Curso' | 'Oficina' | 'Palestra' | 'Treinamento';
type FilterOption = 'Todos' | 'Cursos' | 'Oficinas' | 'Palestras' | 'Treinamentos';

interface TrainingItem {
  id: number;
  category: TrainingCategory;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  illustration: 'fusion360' | 'arduino' | 'python';
}

const FILTER_OPTIONS: FilterOption[] = [
  'Todos',
  'Cursos',
  'Oficinas',
  'Palestras',
  'Treinamentos',
];

const FILTER_TO_CATEGORY: Record<Exclude<FilterOption, 'Todos'>, TrainingCategory> = {
  Cursos: 'Curso',
  Oficinas: 'Oficina',
  Palestras: 'Palestra',
  Treinamentos: 'Treinamento',
};

const INITIAL_TRAININGS: TrainingItem[] = [
  {
    id: 1,
    category: 'Curso',
    name: 'Modelagem 3D com Fusion 360',
    description: 'Aprenda a criar e editar modelos 3D de forma prática e intuitiva.',
    date: '18/11/2026',
    time: '14h às 17h',
    location: 'Laboratório Maker',
    illustration: 'fusion360',
  },
  {
    id: 2,
    category: 'Oficina',
    name: 'Eletrônica Básica com Arduino',
    description: 'Explore o mundo da eletrônica com projetos práticos e criativos.',
    date: '20/11/2026',
    time: '09h às 12h',
    location: 'Laboratório Maker',
    illustration: 'arduino',
  },
  {
    id: 3,
    category: 'Curso',
    name: 'Introdução à Programação em Python',
    description: 'Dê os primeiros passos na programação com Python.',
    date: '25/11/2026',
    time: '14h às 17h',
    location: 'Laboratório Maker',
    illustration: 'python',
  },
];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function CapacitacoesPage() {
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [subscribedIds, setSubscribedIds] = useState<number[]>([]);
  const [activeTrainingModal, setActiveTrainingModal] = useState<TrainingItem | null>(null);

  const filteredTrainings = useMemo(() => {
    const normalizedQuery = normalizeText(searchTerm.trim());

    return INITIAL_TRAININGS.filter((training) => {
      const matchesCategory =
        selectedFilter === 'Todos' ||
        training.category === FILTER_TO_CATEGORY[selectedFilter];

      const matchesSearch =
        !normalizedQuery ||
        normalizeText(training.name).includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [selectedFilter, searchTerm]);

  function handleScrollToEvents() {
    const section = document.getElementById('proximos-eventos');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleOpenEnrollModal(training: TrainingItem) {
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
          {/* Elementos decorativos de fundo na identidade Lab Maker */}
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
            {/* Texto do Banner */}
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

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleScrollToEvents}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-[#00ff9d] px-6 py-3.5 text-sm font-extrabold text-[#050b33] shadow-lg shadow-[#00ff9d]/20 transition-all hover:-translate-y-0.5 hover:bg-[#52ffba] cursor-pointer"
                >
                  Ver próximos eventos
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Imagem ilustrativa do ambiente Maker (Impressora 3D em funcionamento) */}
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
          {/* Barra de Filtros e Pesquisa */}
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#dfe4ee] bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            {/* Botões de categoria */}
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

            {/* Campo de busca */}
            <label className="relative block w-full lg:w-80">
              <span className="sr-only">Buscar capacitação</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#56617d]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar capacitação..."
                className="w-full rounded-full border border-[#dfe4ee] bg-[#f8fafc] py-2.5 pl-10 pr-4 text-sm text-[#050b33] placeholder:text-[#68728a] outline-none transition focus:border-[#7000ff] focus:bg-white focus:ring-2 focus:ring-[#7000ff]/15"
              />
            </label>
          </div>

          {/* Lista de Cards de Capacitações */}
          {filteredTrainings.length === 0 ? (
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

                return (
                  <article
                    key={training.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#dfe4ee] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    {/* 1. Imagem ilustrativa da capacitação */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#07113f]">
                      <TrainingCardIllustration type={training.illustration} />
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="flex flex-1 flex-col p-6">
                      {/* 2. Categoria */}
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="inline-block rounded-full bg-[#f0eaff] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#7000ff]">
                          {training.category}
                        </span>
                        {isSubscribed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Inscrito
                          </span>
                        )}
                      </div>

                      {/* 3. Nome da capacitação */}
                      <h2 className="text-xl font-extrabold leading-snug text-[#050b33]">
                        {training.name}
                      </h2>

                      {/* 4. Pequena descrição */}
                      <p className="mt-2.5 text-sm leading-6 text-[#56617d]">
                        {training.description}
                      </p>

                      {/* 5, 6, 7. Data, Horário e Local */}
                      <div className="mt-5 space-y-2 border-t border-[#edf0f5] pt-4 text-sm text-[#56617d]">
                        <div className="flex items-center gap-2.5">
                          <CalendarDays className="h-4 w-4 shrink-0 text-[#7000ff]" />
                          <span>
                            <strong className="font-semibold text-[#050b33]">Data:</strong>{' '}
                            {training.date}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Clock3 className="h-4 w-4 shrink-0 text-[#7000ff]" />
                          <span>
                            <strong className="font-semibold text-[#050b33]">Horário:</strong>{' '}
                            {training.time}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <MapPin className="h-4 w-4 shrink-0 text-[#7000ff]" />
                          <span>
                            <strong className="font-semibold text-[#050b33]">Local:</strong>{' '}
                            {training.location}
                          </span>
                        </div>
                      </div>

                      {/* 8. Botão "Inscrever-se" alinhado na base */}
                      <div className="mt-6 pt-2">
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
            {/* Detalhes decorativos sutis */}
            <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#7000ff]/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-[#00ff9d]/20 blur-2xl" />

            <div className="relative z-10 mx-auto max-w-xl">
              <h2 className="text-2xl font-extrabold text-[#050b33] sm:text-3xl">
                Fique por dentro!
              </h2>
              <p className="mt-2.5 text-sm leading-6 text-[#56617d] sm:text-base">
                Acompanhe nossas redes e não perca as próximas capacitações.
              </p>

              {/* Ícones de redes sociais */}
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

      {/* Modal demonstrativo de inscrição (exclusivamente frontend, sem persistência) */}
      {activeTrainingModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-inscricao-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b33]/60 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-[#dfe4ee] bg-white p-6 text-[#050b33] shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveTrainingModal(null)}
              aria-label="Fechar aviso de inscrição"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[#56617d] transition hover:bg-[#f5f7fb] hover:text-[#050b33] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="inline-block rounded-full bg-[#f0eaff] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#7000ff]">
              {activeTrainingModal.category}
            </span>

            <h3 id="modal-inscricao-titulo" className="mt-3 text-xl font-extrabold">
              {activeTrainingModal.name}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#56617d]">
              {activeTrainingModal.description}
            </p>

            <div className="mt-4 space-y-2 rounded-xl bg-[#f5f7fb] p-4 text-sm text-[#56617d]">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#7000ff]" />
                <span>
                  <strong className="text-[#050b33]">Data:</strong> {activeTrainingModal.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#7000ff]" />
                <span>
                  <strong className="text-[#050b33]">Horário:</strong> {activeTrainingModal.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#7000ff]" />
                <span>
                  <strong className="text-[#050b33]">Local:</strong> {activeTrainingModal.location}
                </span>
              </div>
            </div>

            {subscribedIds.includes(activeTrainingModal.id) ? (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs leading-5 text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Inscrição demonstrativa registrada! Compareça ao{' '}
                  <strong>{activeTrainingModal.location}</strong> na data e horário
                  indicados.
                </span>
              </div>
            ) : (
              <p className="mt-4 text-xs leading-5 text-[#68728a]">
                Confirme abaixo para registrar seu interesse nesta capacitação
                (demonstração visual de frontend).
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

/**
 * Ilustração vetorial de uma Impressora 3D em funcionamento no ambiente Lab Maker
 */
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

      {/* Fundo */}
      <rect width="520" height="340" rx="14" fill="url(#bannerBg)" />

      {/* Grade de fundo estilo CAD / Maker */}
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

      {/* Brilho ambiente */}
      <circle cx="260" cy="195" r="95" fill="#00ff9d" opacity="0.12" />
      <circle cx="340" cy="120" r="70" fill="#7000ff" opacity="0.2" />

      {/* Carretel de filamento lateral */}
      <circle cx="115" cy="95" r="34" fill="#1b2868" stroke="#4859a3" strokeWidth="5" />
      <circle cx="115" cy="95" r="22" fill="none" stroke="#00ff9d" strokeWidth="8" strokeDasharray="36 8" />
      <circle cx="115" cy="95" r="9" fill="#050b33" />

      {/* Estrutura Pórtico da Impressora 3D */}
      <rect x="135" y="42" width="16" height="236" rx="4" fill="#28357a" />
      <rect x="369" y="42" width="16" height="236" rx="4" fill="#28357a" />
      <rect x="125" y="34" width="270" height="18" rx="6" fill="#374794" />

      {/* Eixo X (barra transversal) */}
      <rect x="151" y="128" width="218" height="10" rx="3" fill="#64748b" />
      <line x1="151" y1="133" x2="369" y2="133" stroke="#cbd5e1" strokeWidth="2" />

      {/* Fio de filamento alimentando a extrusora */}
      <path d="M 135 80 Q 210 55 258 112" fill="none" stroke="#00ff9d" strokeWidth="3" />

      {/* Cabeçote de impressão (Extrusora) */}
      <rect x="234" y="108" width="48" height="44" rx="8" fill="#050b33" stroke="#00ff9d" strokeWidth="2" />
      <rect x="244" y="118" width="28" height="14" rx="3" fill="#7000ff" />
      <circle cx="258" cy="141" r="4" fill="#00ff9d" />
      {/* Bico aquecido (Nozzle) */}
      <polygon points="252,152 264,152 259,164 257,164" fill="#ffbe0b" />
      {/* Ponto luminoso de impressão */}
      <circle cx="258" cy="166" r="6" fill="#00ff9d" opacity="0.85" />
      <circle cx="258" cy="166" r="13" fill="#00ff9d" opacity="0.28" />

      {/* Peça 3D sendo impressa (Engrenagem / Protótipo Maker em camadas) */}
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

      {/* Mesa aquecida (Print Bed) */}
      <rect x="172" y="252" width="176" height="10" rx="4" fill="#475569" />
      <rect x="180" y="248" width="160" height="5" rx="2" fill="#00ff9d" opacity="0.7" />

      {/* Base da Impressora */}
      <rect x="115" y="272" width="290" height="42" rx="10" fill="#172259" stroke="#394b99" strokeWidth="2" />
      {/* Painel digital na base */}
      <rect x="315" y="282" width="66" height="22" rx="4" fill="#050b33" stroke="#00ff9d" strokeWidth="1.2" />
      <text x="325" y="297" fill="#00ff9d" fontSize="10" fontFamily="monospace" fontWeight="bold">
        210°C OK
      </text>
      {/* Indicadores coloridos Lab Maker na base */}
      <circle cx="145" cy="293" r="5" fill="#ff2a55" />
      <circle cx="163" cy="293" r="5" fill="#7000ff" />
      <circle cx="181" cy="293" r="5" fill="#00ff19" />
      <circle cx="199" cy="293" r="5" fill="#ff6a00" />
    </svg>
  );
}

/**
 * Ilustrações temáticas de cada card de capacitação
 */
function TrainingCardIllustration({ type }: { type: TrainingItem['illustration'] }) {
  if (type === 'fusion360') {
    return (
      <svg
        viewBox="0 0 400 250"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        role="img"
        aria-label="Ilustração do curso de Modelagem 3D com Fusion 360"
      >
        <defs>
          <linearGradient id="fusionBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#07113f" />
            <stop offset="100%" stopColor="#1e1b6b" />
          </linearGradient>
        </defs>
        <rect width="400" height="250" fill="url(#fusionBg)" />
        {/* Grade de modelagem 3D */}
        <g stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1">
          <line x1="40" y1="195" x2="360" y2="195" />
          <line x1="70" y1="165" x2="330" y2="165" />
          <line x1="100" y1="135" x2="300" y2="135" />
          <line x1="200" y1="45" x2="200" y2="220" />
          <line x1="120" y1="195" x2="175" y2="120" />
          <line x1="280" y1="195" x2="225" y2="120" />
        </g>
        {/* Janela estilo software CAD */}
        <rect x="28" y="22" width="344" height="206" rx="10" fill="#0b1548" stroke="#3b4c9c" strokeWidth="1.5" />
        <rect x="28" y="22" width="344" height="24" rx="10" fill="#162366" />
        <circle cx="46" cy="34" r="4" fill="#ff2a55" />
        <circle cx="60" cy="34" r="4" fill="#ffbe0b" />
        <circle cx="74" cy="34" r="4" fill="#00ff9d" />
        <text x="95" y="38" fill="#cbd5e1" fontSize="10" fontFamily="monospace" fontWeight="bold">
          FUSION 360 • CAD 3D
        </text>
        {/* Cubo / Peça 3D isométrica no centro */}
        <g transform="translate(200, 132)">
          <polygon points="0,-54 52,-26 0,2 -52,-26" fill="#7000ff" fillOpacity="0.55" stroke="#00ff9d" strokeWidth="2" />
          <polygon points="-52,-26 0,2 0,58 -52,30" fill="#4f46e5" fillOpacity="0.65" stroke="#00ff9d" strokeWidth="2" />
          <polygon points="52,-26 0,2 0,58 52,30" fill="#00ff9d" fillOpacity="0.3" stroke="#00ff9d" strokeWidth="2" />
          <circle cx="0" cy="-26" r="14" fill="#0b1548" stroke="#00ff9d" strokeWidth="2" />
          {/* Eixos X, Y, Z */}
          <line x1="0" y1="-54" x2="0" y2="-74" stroke="#00ff9d" strokeWidth="2" />
          <line x1="52" y1="30" x2="72" y2="42" stroke="#ff2a55" strokeWidth="2" />
          <line x1="-52" y1="30" x2="-72" y2="42" stroke="#38bdf8" strokeWidth="2" />
        </g>
        {/* Badge lateral */}
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
        aria-label="Ilustração da oficina de Eletrônica Básica com Arduino"
      >
        <defs>
          <linearGradient id="arduinoBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#051c38" />
            <stop offset="100%" stopColor="#0a3b5c" />
          </linearGradient>
        </defs>
        <rect width="400" height="250" fill="url(#arduinoBg)" />
        {/* Trilhas de circuito impresso ao fundo */}
        <g stroke="#00ff9d" strokeOpacity="0.18" strokeWidth="2" fill="none">
          <path d="M 20 50 L 90 50 L 115 75" />
          <path d="M 380 65 L 310 65 L 285 90" />
          <path d="M 30 200 L 105 200 L 130 175" />
          <path d="M 370 190 L 300 190 L 275 165" />
        </g>
        {/* Placa Microcontroladora estilo Arduino UNO */}
        <rect x="85" y="48" width="230" height="154" rx="12" fill="#008184" stroke="#00ff9d" strokeWidth="2.5" />
        {/* Conector USB */}
        <rect x="68" y="74" width="28" height="34" rx="4" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
        {/* Conector de energia */}
        <rect x="72" y="148" width="24" height="28" rx="3" fill="#1e293b" />
        {/* Pinos superiores e inferiores */}
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
        {/* Chip ATmega central */}
        <rect x="165" y="108" width="96" height="34" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
        <text x="182" y="129" fill="#00ff9d" fontSize="11" fontFamily="monospace" fontWeight="bold">
          ARDUINO
        </text>
        {/* Símbolo infinito estilo Arduino + LEDs */}
        <circle cx="130" cy="118" r="14" fill="none" stroke="#ffffff" strokeWidth="3.5" />
        <circle cx="152" cy="118" r="14" fill="none" stroke="#ffffff" strokeWidth="3.5" />
        {/* LED aceso */}
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
      aria-label="Ilustração do curso de Introdução à Programação em Python"
    >
      <defs>
        <linearGradient id="pythonBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#050b33" />
          <stop offset="100%" stopColor="#26145c" />
        </linearGradient>
      </defs>
      <rect width="400" height="250" fill="url(#pythonBg)" />
      {/* Janela de Editor de Código */}
      <rect x="36" y="26" width="328" height="198" rx="12" fill="#0d153f" stroke="#4353a3" strokeWidth="1.5" />
      <rect x="36" y="26" width="328" height="26" rx="12" fill="#182464" />
      <circle cx="56" cy="39" r="4.5" fill="#ff2a55" />
      <circle cx="71" cy="39" r="4.5" fill="#ffbe0b" />
      <circle cx="86" cy="39" r="4.5" fill="#00ff9d" />
      <text x="108" y="43" fill="#cbd5e1" fontSize="10" fontFamily="monospace" fontWeight="bold">
        main.py — Python 3
      </text>

      {/* Linhas de código estilizadas */}
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

        {/* Saída do terminal */}
        <rect x="56" y="170" width="288" height="36" rx="6" fill="#050b33" stroke="#00ff9d" strokeOpacity="0.4" />
        <text x="68" y="193" fill="#00ff9d" fontSize="11">
          &gt;&gt;&gt; Executando script Python... OK!
        </text>
      </g>

      {/* Badge Python */}
      <rect x="292" y="64" width="54" height="24" rx="6" fill="#facc15" />
      <text x="307" y="80" fill="#050b33" fontSize="12" fontFamily="monospace" fontWeight="bold">
        .PY
      </text>
    </svg>
  );
}
