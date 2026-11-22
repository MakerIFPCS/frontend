'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import {
  ArrowRight,
  BellRing,
  Clock3,
  Handshake,
  Package,
  RefreshCw,
  Scissors,
} from 'lucide-react';
import Header from '@/app/components/header';
import { getLoanRequests, getProductionOrders } from '@/app/lib/api';
import { useAdminAccess } from '@/app/lib/use-admin-access';
import type {
  LoanRequestAPI,
  ProductionOrderAPI,
} from '@/app/types/api';

type RequestKind = 'order' | 'loan';
type KindFilter = 'ALL' | RequestKind;
type StatusFilter = 'PENDING' | 'ALL';

interface AdminRequest {
  id: string;
  kind: RequestKind;
  title: string;
  requester: string;
  summary: string;
  status: string;
  createdAt: string;
  href: string;
  pending: boolean;
}

const KIND_LABELS: Record<RequestKind, string> = {
  order: 'Pedido de fabricação',
  loan: 'Empréstimo',
};

const KIND_STYLES: Record<RequestKind, string> = {
  order: 'bg-violet-50 text-violet-800',
  loan: 'bg-emerald-50 text-emerald-800',
};

function isPendingStatus(status: string) {
  const normalized = status.trim().toLocaleLowerCase('pt-BR');
  return normalized === 'pending'
    || normalized === 'waiting_for_update'
    || normalized === 'aguardando análise'
    || normalized === 'aguardando analise';
}

function getOrderTypeLabel(type: ProductionOrderAPI['type']) {
  const labels: Record<ProductionOrderAPI['type'], string> = {
    LASER_CUTTING: 'Corte a laser',
    THREE_D_PRINTING: 'Impressão 3D',
    CNC_MACHINING: 'Usinagem CNC',
  };
  return labels[type];
}

function mapOrders(orders: ProductionOrderAPI[]): AdminRequest[] {
  return orders.map((order) => ({
    id: `order:${order.id}`,
    kind: 'order',
    title: `${getOrderTypeLabel(order.type)} · Pedido #${order.id}`,
    requester: order.requesterName,
    summary: order.machineName
      ? `Equipamento: ${order.machineName}`
      : order.fileName ? `Arquivo: ${order.fileName}` : 'Pedido de fabricação recebido.',
    status: order.status,
    createdAt: order.createdAt,
    href: '/Pedidos-ADM',
    pending: isPendingStatus(order.status),
  }));
}

function mapLoans(loans: LoanRequestAPI[]): AdminRequest[] {
  return loans.map((loan) => ({
    id: `loan:${loan.id}`,
    kind: 'loan',
    title: `Empréstimo #${loan.id}`,
    requester: loan.requesterName,
    summary: loan.items.length
      ? loan.items.map((item) => `${item.name} (${item.quantity})`).join(', ')
      : 'Solicitação de empréstimo recebida.',
    status: loan.status,
    createdAt: loan.createdAt,
    href: '/Emprestimos-ADM',
    pending: isPendingStatus(loan.status),
  }));
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não disponível';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'Aguardando análise',
    WAITING_FOR_UPDATE: 'Aguardando informações',
    APPROVED: 'Aprovado',
    IN_PRODUCTION: 'Em produção',
    READY_FOR_PICKUP: 'Pronto para retirada',
    REJECTED: 'Recusado',
  };
  return labels[status] ?? status;
}

function getApiError(error: unknown) {
  if (isAxiosError<unknown>(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      const body = data as Record<string, unknown>;
      if (typeof body.message === 'string') return body.message;
      if (typeof body.detail === 'string') return body.detail;
    }
    if (error.response?.status === 403) {
      return 'Sua conta não tem permissão para visualizar todas as solicitações administrativas.';
    }
    if (error.response) return `A API retornou erro HTTP ${error.response.status}.`;
    if (error.request) return 'Não foi possível conectar à API. Verifique se o servidor está em execução.';
  }
  return 'Não foi possível carregar as solicitações. Tente novamente.';
}

export default function AdminNotificationsPage() {
  const authorized = useAdminAccess();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [kindFilter, setKindFilter] = useState<KindFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    let isFetching = false;

    const refresh = async (showLoading = false) => {
      if (isFetching) return;
      isFetching = true;
      if (showLoading) setIsLoading(true);
      else setIsRefreshing(true);
      setError('');

      try {
        const [orders, loans] = await Promise.all([
          getProductionOrders(),
          getLoanRequests(),
        ]);
        if (active) {
          setRequests([
            ...mapOrders(orders),
            ...mapLoans(loans),
          ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      } catch (loadError: unknown) {
        if (active) setError(getApiError(loadError));
      } finally {
        isFetching = false;
        if (active) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    void refresh(true);
    const intervalId = window.setInterval(() => { void refresh(); }, 30_000);
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [authorized, refreshKey]);

  const pendingCount = useMemo(
    () => requests.filter((request) => request.pending).length,
    [requests],
  );
  const filteredRequests = useMemo(
    () => requests.filter((request) => (
      (kindFilter === 'ALL' || request.kind === kindFilter)
      && (statusFilter === 'ALL' || request.pending)
    )),
    [kindFilter, requests, statusFilter],
  );
  const kindCounts = useMemo(
    () => ({
      order: requests.filter((request) => request.kind === 'order' && request.pending).length,
      loan: requests.filter((request) => request.kind === 'loan' && request.pending).length,
    }),
    [requests],
  );

  if (!authorized) return <main className="p-10 text-center">Verificando acesso...</main>;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header authenticated />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#050b33] text-[#00ff9d]">
              <BellRing className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7000ff]">Área restrita</p>
              <h1 className="mt-1 text-3xl font-bold">Central de solicitações</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-[#cbd2df] bg-white px-4 py-2.5 text-sm font-bold text-[#050b33] transition hover:bg-[#f5f7fb] disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        <p className="mb-6 leading-7 text-[#56617d]">
          Acompanhe em um só lugar os pedidos de fabricação e empréstimos recebidos.
          A central atualiza automaticamente a cada 30 segundos.
        </p>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Resumo das solicitações">
          <div className="rounded-xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#56617d]">Pendentes</p>
            <p className="mt-2 text-3xl font-extrabold">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#56617d]"><Scissors className="h-4 w-4 text-violet-700" /> Fabricação</p>
            <p className="mt-2 text-3xl font-extrabold">{kindCounts.order}</p>
          </div>
          <div className="rounded-xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#56617d]"><Handshake className="h-4 w-4 text-emerald-700" /> Empréstimos</p>
            <p className="mt-2 text-3xl font-extrabold">{kindCounts.loan}</p>
          </div>
        </section>

        <section className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dfe4ee] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2" aria-label="Filtrar por tipo">
            {([
              ['ALL', 'Todos'],
              ['order', 'Fabricação'],
              ['loan', 'Empréstimos'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={kindFilter === value}
                onClick={() => setKindFilter(value)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  kindFilter === value
                    ? 'border-[#050b33] bg-[#050b33] text-white'
                    : 'border-[#dfe4ee] text-[#56617d] hover:bg-[#f5f7fb]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#56617d]">
            <input
              type="checkbox"
              checked={statusFilter === 'ALL'}
              onChange={(event) => setStatusFilter(event.target.checked ? 'ALL' : 'PENDING')}
              className="h-4 w-4 accent-[#7000ff]"
            />
            Mostrar solicitações já analisadas
          </label>
        </section>

        {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {isLoading ? (
          <p className="rounded-xl border border-[#dfe4ee] bg-white p-6 text-[#56617d]" role="status">Carregando solicitações...</p>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#cbd2df] bg-white p-10 text-center">
            <BellRing className="mx-auto h-10 w-10 text-[#7000ff]" />
            <h2 className="mt-4 text-xl font-bold">Nenhuma solicitação encontrada</h2>
            <p className="mt-2 text-sm text-[#56617d]">
              {statusFilter === 'PENDING'
                ? 'As novas solicitações aparecerão aqui assim que forem enviadas.'
                : 'Não há solicitações para o filtro selecionado.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredRequests.map((request) => {
              const Icon = request.kind === 'order' ? Scissors : Package;
              return (
                <li key={request.id} className="rounded-xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${KIND_STYLES[request.kind]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold">{request.title}</h2>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${KIND_STYLES[request.kind]}`}>
                            {KIND_LABELS[request.kind]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#56617d]">Solicitante: {request.requester}</p>
                        <p className="mt-2 break-words text-sm text-[#56617d]">{request.summary}</p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-[#8790a4]">
                          <Clock3 className="h-3.5 w-3.5" /> {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:ml-auto">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        request.pending ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {getStatusLabel(request.status)}
                      </span>
                      <Link
                        href={request.href}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#050b33] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#7000ff]"
                      >
                        Abrir <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
