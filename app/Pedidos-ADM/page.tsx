'use client';

import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Check, Clock3, Download, Package } from 'lucide-react';
import Header from '@/app/components/header';
import { downloadProductionOrderFile, getProductionOrders, updateProductionOrderStatus } from '@/app/lib/api';
import { useAdminAccess } from '@/app/lib/use-admin-access';
import type { ProductionOrderAPI, ProductionOrderStatus } from '@/app/types/api';

function getApiError(error: unknown) {
  if (isAxiosError<unknown>(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      const body = data as Record<string, unknown>;
      for (const key of ['message', 'detail', 'error']) {
        if (typeof body[key] === 'string' && body[key]) return body[key];
      }
    }
    if (typeof data === 'string' && data.trim()) return data;
    if (error.response) return `A API retornou erro HTTP ${error.response.status}.`;
    if (error.request) return 'Não foi possível conectar à API. Verifique se o backend está em execução.';
    if (error.message) return `Falha na solicitação: ${error.message}`;
  }
  return 'Não foi possível concluir a análise. Tente novamente.';
}

const STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  PENDING: 'Aguardando análise',
  WAITING_FOR_UPDATE: 'Aguardando informações do usuário',
  APPROVED: 'Aprovado',
  IN_PRODUCTION: 'Em produção',
  READY_FOR_PICKUP: 'Pronto para retirada',
  REJECTED: 'Recusado',
};

const STATUS_STYLES: Record<ProductionOrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800',
  WAITING_FOR_UPDATE: 'bg-sky-50 text-sky-800',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  IN_PRODUCTION: 'bg-violet-50 text-violet-800',
  READY_FOR_PICKUP: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
};

const STATUS_OPTIONS: ProductionOrderStatus[] = [
  'PENDING',
  'WAITING_FOR_UPDATE',
  'APPROVED',
  'IN_PRODUCTION',
  'READY_FOR_PICKUP',
  'REJECTED',
];
const FILTER_OPTIONS: Array<{ value: ProductionOrderStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Aguardando análise' },
  { value: 'WAITING_FOR_UPDATE', label: 'Aguardando usuário' },
  { value: 'APPROVED', label: 'Aprovados' },
  { value: 'IN_PRODUCTION', label: 'Em produção' },
  { value: 'READY_FOR_PICKUP', label: 'Prontos para retirada' },
  { value: 'REJECTED', label: 'Recusados' },
];

const LAB_TIME_ZONE = 'America/Sao_Paulo';

function getLabDateTimeParts(date: Date) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: LAB_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).map(({ type, value }) => [type, value]));
}

function toLabDateTimeInput(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = getLabDateTimeParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function toLabDateTimeIso(value: string) {
  const [year, month, day, hour, minute] = value.split(/[-T:]/).map(Number);
  const targetTime = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = targetTime;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = getLabDateTimeParts(new Date(timestamp));
    const representedTime = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    const adjustment = targetTime - representedTime;
    if (adjustment === 0) break;
    timestamp += adjustment;
  }

  const resolvedParts = getLabDateTimeParts(new Date(timestamp));
  if (
    Number(resolvedParts.year) !== year
    || Number(resolvedParts.month) !== month
    || Number(resolvedParts.day) !== day
    || Number(resolvedParts.hour) !== hour
    || Number(resolvedParts.minute) !== minute
  ) {
    return null;
  }
  return new Date(timestamp).toISOString();
}

export default function ProductionOrdersAdminPage() {
  const authorized = useAdminAccess();
  const [orders, setOrders] = useState<ProductionOrderAPI[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProductionOrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [selectedStatuses, setSelectedStatuses] = useState<Record<number, ProductionOrderStatus>>({});
  const [estimatedReadyDates, setEstimatedReadyDates] = useState<Record<number, string>>({});
  const [changedEstimatedDates, setChangedEstimatedDates] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    getProductionOrders()
      .then((loadedOrders) => {
        if (!active) return;
        setOrders(loadedOrders);
        setEstimatedReadyDates(Object.fromEntries(
          loadedOrders.map((order) => [order.id, toLabDateTimeInput(order.estimatedReadyAt)]),
        ));
      })
      .catch((loadError: unknown) => { if (active) setError(getApiError(loadError)); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [authorized]);

  const pendingCount = useMemo(
    () => orders.filter((order) => order.status === 'PENDING' || order.status === 'WAITING_FOR_UPDATE').length,
    [orders],
  );
  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const matchesSearch = !query || [
      order.requesterName,
      order.requesterEmail,
      String(order.id),
      order.machineName ?? '',
    ].some((value) => value.toLocaleLowerCase('pt-BR').includes(query));
    return matchesStatus && matchesSearch;
  }), [orders, search, statusFilter]);

  async function reviewOrder(id: number) {
    setError('');
    setNotice('');
    const status = selectedStatuses[id] ?? orders.find((order) => order.id === id)?.status ?? 'PENDING';
    const order = orders.find((item) => item.id === id);
    const adminNotes = notes[id]?.trim() ?? '';
    const estimatedReadyAt = estimatedReadyDates[id] ?? '';
    if ((status === 'WAITING_FOR_UPDATE' || status === 'REJECTED') && !adminNotes) {
      setError(status === 'WAITING_FOR_UPDATE'
        ? 'Explique quais informações o solicitante precisa enviar antes de pedir uma atualização.'
        : 'Informe o motivo antes de recusar o pedido.');
      return;
    }
    if (order?.type === 'THREE_D_PRINTING' && status === 'IN_PRODUCTION' && !estimatedReadyAt) {
      setError('Informe a previsão de conclusão antes de marcar o pedido como em produção.');
      return;
    }
    const estimatedReadyAtIso = estimatedReadyAt ? toLabDateTimeIso(estimatedReadyAt) : null;
    if (changedEstimatedDates[id] && estimatedReadyAt && !estimatedReadyAtIso) {
      setError('Informe uma data e horário válidos no fuso do laboratório.');
      return;
    }
    setReviewingId(id);
    try {
      const updated = await updateProductionOrderStatus(id, {
        status,
        ...(changedEstimatedDates[id]
          ? { estimatedReadyAt: estimatedReadyAtIso }
          : {}),
        adminNotes: adminNotes || undefined,
      });
      setOrders((current) => current.map((order) => order.id === id ? updated : order));
      setSelectedStatuses((current) => ({ ...current, [id]: updated.status }));
      setEstimatedReadyDates((current) => ({
        ...current,
        [id]: toLabDateTimeInput(updated.estimatedReadyAt),
      }));
      setChangedEstimatedDates((current) => ({ ...current, [id]: false }));
      setNotes((current) => ({ ...current, [id]: '' }));
      setNotice('Pedido atualizado.');
    } catch (reviewError: unknown) {
      setError(getApiError(reviewError));
    } finally {
      setReviewingId(null);
    }
  }

  async function downloadFile(order: ProductionOrderAPI) {
    const fileName = order.fileName;
    if (!fileName) return;
    setError('');
    try {
      const file = await downloadProductionOrderFile(order.id);
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError: unknown) {
      setError(getApiError(downloadError));
    }
  }

  if (!authorized) return <main className="p-10 text-center">Verificando acesso...</main>;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header authenticated />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#050b33] text-[#00ff9d]"><Package className="h-7 w-7" /></div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7000ff]">Área restrita</p>
            <h1 className="mt-1 text-3xl font-bold">Pedidos de fabricação</h1>
          </div>
        </div>
        <p className="mb-8 leading-7 text-[#56617d]">Revise os pedidos de fabricação, converse com o solicitante e altere o status. Pedidos aprovados ou recusados podem ser reabertos.</p>
        <div className="mb-5 flex items-center justify-between rounded-xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-[#7000ff]" /><h2 className="font-bold">Solicitações recebidas</h2></div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800">{pendingCount} aberta(s)</span>
        </div>
        <section className="mb-5 rounded-xl border border-[#dfe4ee] bg-white p-4 shadow-sm" aria-label="Filtros de pedidos">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">Filtrar solicitações</h2>
            <label className="sr-only" htmlFor="order-search">Buscar por usuário, e-mail, pedido ou máquina</label>
            <input
              id="order-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar usuário, e-mail, pedido ou máquina"
              className="w-full rounded-lg border border-[#cbd2df] px-3 py-2 text-sm sm:w-72"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => {
              const count = option.value === 'ALL'
                ? orders.length
                : orders.filter((order) => order.status === option.value).length;
              const selected = statusFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${selected ? 'border-[#050b33] bg-[#050b33] text-white' : 'border-[#dfe4ee] text-[#56617d] hover:bg-[#f5f7fb]'}`}
                >
                  {option.label} <span className={selected ? 'text-white/75' : 'text-[#8992a5]'}>{count}</span>
                </button>
              );
            })}
          </div>
        </section>
        {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {notice && <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
        {isLoading ? (
          <p className="rounded-xl border border-[#dfe4ee] bg-white p-6 text-[#56617d]" role="status">Carregando pedidos...</p>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#cbd2df] bg-white p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-[#7000ff]" />
            <h2 className="mt-4 text-xl font-bold">Nenhum pedido recebido</h2>
            <p className="mt-2 text-[#56617d]">Os pedidos enviados pelos usuários aparecerão aqui.</p>
          </div>
        ) : (
          <ul className="space-y-5">
            {filteredOrders.length === 0 ? (
              <li className="rounded-xl border border-dashed border-[#cbd2df] bg-white p-8 text-center text-sm text-[#56617d]">
                Nenhum pedido corresponde a estes filtros.
              </li>
            ) : filteredOrders.map((order) => {
              const selectedStatus = selectedStatuses[order.id] ?? order.status;
              const needsExplanation = selectedStatus === 'WAITING_FOR_UPDATE' || selectedStatus === 'REJECTED';
              return (
              <li key={order.id} className="rounded-xl border border-[#dfe4ee] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold">Pedido #{order.id} · {order.requesterName}</h3>
                    <p className="mt-0.5 text-sm text-[#56617d]">{order.requesterEmail}</p>
                    <p className="mt-1 text-sm text-[#56617d]">
                      {order.type === 'LASER_CUTTING' ? 'Corte a laser' : order.type === 'CNC_MACHINING' ? 'Usinagem CNC' : 'Impressão 3D'}
                      {order.machineName ? ` · ${order.machineName}` : ''}
                      {' · '}{new Date(order.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {order.fileName ? (
                    <button type="button" onClick={() => void downloadFile(order)} className="inline-flex items-center gap-1.5 font-semibold text-[#7000ff] hover:underline">
                      <Download className="h-4 w-4" /> {order.fileName} · {(order.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </button>
                  ) : <span className="text-amber-800">Sem arquivo anexado</span>}
                  {order.dimensions && <span className="text-[#56617d]">Dimensões informadas</span>}
                  {order.notes && <span className="text-[#56617d]">Observações incluídas</span>}
                </div>
                {order.adminNotes && !order.comments?.some((comment) => comment.message === order.adminNotes) && <p className="mt-3 text-sm text-[#56617d]">Observação anterior: {order.adminNotes}</p>}
                <details className="mt-3 border-t border-[#edf0f5] pt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[#56617d]">
                    Ver detalhes{order.comments?.length ? ` e conversa (${order.comments.length})` : ''}
                  </summary>
                  <div className="mt-3 space-y-3">
                    {order.fileName && <p className="text-sm text-[#56617d]">Arquivo: {order.fileName}</p>}
                    {order.dimensions && <p className="whitespace-pre-wrap text-sm leading-6 text-[#56617d]"><strong>Dimensões:</strong> {order.dimensions}</p>}
                    {order.notes && <p className="whitespace-pre-wrap text-sm leading-6 text-[#56617d]"><strong>Observações:</strong> {order.notes}</p>}
                    {order.type === 'THREE_D_PRINTING' && order.estimatedReadyAt && (
                      <p className="text-sm text-[#56617d]">
                        <strong>Previsão de conclusão:</strong>{' '}
                        {new Intl.DateTimeFormat('pt-BR', {
                          dateStyle: 'long',
                          timeStyle: 'short',
                          timeZone: LAB_TIME_ZONE,
                        }).format(new Date(order.estimatedReadyAt))}
                      </p>
                    )}
                    {order.comments?.map((comment) => (
                      <div key={comment.id} className="rounded-lg bg-[#f5f7fb] p-3">
                        <p className="text-xs font-semibold text-[#68728a]">{comment.authorName} · {comment.authorRole === 'ADMIN' ? 'Equipe' : 'Solicitante'} · {new Date(comment.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#56617d]">{comment.message}</p>
                      </div>
                    ))}
                    <label className="block text-sm font-semibold">
                      Status do pedido
                      <select
                        value={selectedStatus}
                        onChange={(event) => {
                          const status = STATUS_OPTIONS.find((option) => option === event.target.value);
                          if (status) setSelectedStatuses((current) => ({ ...current, [order.id]: status }));
                        }}
                        className="mt-1 w-full rounded-lg border border-[#cbd2df] bg-white px-3 py-2 font-normal"
                      >
                        {STATUS_OPTIONS
                          .filter((status) => order.type === 'THREE_D_PRINTING'
                            || (status !== 'IN_PRODUCTION' && status !== 'READY_FOR_PICKUP'))
                          .map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                      </select>
                    </label>
                    {order.type === 'THREE_D_PRINTING'
                      && (selectedStatus === 'APPROVED' || selectedStatus === 'IN_PRODUCTION') && (
                      <label className="block text-sm font-semibold">
                        Previsão de conclusão
                        <input
                          type="datetime-local"
                          value={estimatedReadyDates[order.id] ?? ''}
                          onChange={(event) => {
                            setEstimatedReadyDates((current) => ({ ...current, [order.id]: event.target.value }));
                            setChangedEstimatedDates((current) => ({ ...current, [order.id]: true }));
                          }}
                          className="mt-1 w-full rounded-lg border border-[#cbd2df] bg-white px-3 py-2 font-normal"
                        />
                        <span className="mt-1 block font-normal text-[#68728a]">Fuso America/Sao_Paulo; será exibido ao solicitante.</span>
                      </label>
                    )}
                    {needsExplanation && (
                      <label className="block text-sm font-semibold">
                        Mensagem para o solicitante <span className="font-normal text-[#68728a]">(obrigatória)</span>
                        <textarea rows={2} maxLength={500} value={notes[order.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [order.id]: event.target.value }))} className="mt-1 w-full resize-y rounded-lg border border-[#cbd2df] px-3 py-2 font-normal" placeholder={selectedStatus === 'WAITING_FOR_UPDATE' ? 'Diga o que está faltando, por exemplo o arquivo ou as dimensões.' : 'Explique por que o pedido foi recusado.'} />
                      </label>
                    )}
                    <div className="flex justify-end">
                      <button type="button" disabled={reviewingId !== null} onClick={() => void reviewOrder(order.id)} className="inline-flex items-center gap-2 rounded-lg bg-[#050b33] px-3 py-2 text-sm font-semibold text-white hover:bg-[#7000ff] disabled:opacity-50">
                        <Check className="h-4 w-4" /> {reviewingId === order.id ? 'Salvando...' : 'Salvar atualização'}
                      </button>
                    </div>
                  </div>
                </details>
              </li>
            );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
