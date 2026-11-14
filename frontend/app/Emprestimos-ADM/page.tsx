'use client';

import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Check, Clock3, Package, X } from 'lucide-react';
import Header from '@/app/components/header';
import { getLoanRequests, updateLoanRequestStatus } from '@/app/lib/api';
import { useAdminAccess } from '@/app/lib/use-admin-access';
import type { LoanRequestAPI, LoanRequestStatus } from '@/app/types/api';

function getApiError(error: unknown) {
  if (isAxiosError<{ message?: unknown }>(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return 'Não foi possível concluir a análise. Tente novamente.';
}

const STATUS_LABELS: Record<LoanRequestStatus, string> = {
  PENDING: 'Aguardando análise',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
};

const STATUS_STYLES: Record<LoanRequestStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
};

export default function LoansAdminPage() {
  const authorized = useAdminAccess();
  const [requests, setRequests] = useState<LoanRequestAPI[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    getLoanRequests()
      .then((loadedRequests) => {
        if (active) setRequests(loadedRequests);
      })
      .catch((loadError: unknown) => {
        if (active) setError(getApiError(loadError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authorized]);

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === 'PENDING').length,
    [requests],
  );

  async function reviewRequest(id: number, status: 'APPROVED' | 'REJECTED') {
    setError('');
    setNotice('');
    setReviewingId(id);
    try {
      const updatedRequest = await updateLoanRequestStatus(id, {
        status,
        adminNotes: notes[id]?.trim() || undefined,
      });
      setRequests((current) => current.map((request) => request.id === id ? updatedRequest : request));
      setNotice(status === 'APPROVED' ? 'Pedido aprovado.' : 'Pedido recusado.');
    } catch (reviewError: unknown) {
      setError(getApiError(reviewError));
    } finally {
      setReviewingId(null);
    }
  }

  if (!authorized) return <main className="p-10 text-center">Verificando acesso...</main>;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header authenticated />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#050b33] text-[#00ff9d]">
            <Package className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7000ff]">Área restrita</p>
            <h1 className="mt-1 text-3xl font-bold">Pedidos de empréstimo</h1>
          </div>
        </div>

        <p className="mb-8 leading-7 text-[#56617d]">
          Analise os itens e as datas solicitadas. Materiais só saem do estoque quando o pedido é aprovado.
        </p>

        <div className="mb-5 flex items-center justify-between rounded-xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-[#7000ff]" />
            <h2 className="font-bold">Solicitações recebidas</h2>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800">
            {pendingCount} pendente(s)
          </span>
        </div>

        {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {notice && <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}

        {isLoading ? (
          <p className="rounded-xl border border-[#dfe4ee] bg-white p-6 text-[#56617d]" role="status">Carregando pedidos...</p>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#cbd2df] bg-white p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-[#7000ff]" />
            <h2 className="mt-4 text-xl font-bold">Nenhum pedido recebido</h2>
            <p className="mt-2 text-[#56617d]">Os pedidos enviados pelos usuários aparecerão aqui.</p>
          </div>
        ) : (
          <ul className="space-y-5">
            {requests.map((request) => (
              <li key={request.id} className="rounded-xl border border-[#dfe4ee] bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">Pedido #{request.id} · {request.requesterName}</h3>
                    <p className="mt-1 text-sm text-[#56617d]">{request.requesterEmail}</p>
                    <p className="mt-2 text-sm text-[#56617d]">
                      Retirada: <strong>{request.pickupDate}</strong> · Devolução: <strong>{request.returnDate}</strong>
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[request.status]}`}>
                    {STATUS_LABELS[request.status]}
                  </span>
                </div>

                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {request.items.map((item) => (
                    <li key={`${item.type}-${item.resourceId}`} className="rounded-lg bg-[#f5f7fb] p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#7000ff]">
                        {item.type === 'MACHINE' ? 'Máquina' : 'Material'}
                      </p>
                      <p className="mt-1 font-semibold">{item.name}</p>
                      {item.type === 'MATERIAL' && <p className="mt-1 text-sm text-[#56617d]">Quantidade: {item.quantity}</p>}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 rounded-lg border border-[#edf0f5] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#68728a]">Finalidade</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#56617d]">{request.reason}</p>
                </div>

                {request.adminNotes && request.status !== 'PENDING' && (
                  <p className="mt-3 text-sm text-[#56617d]">Observação enviada: {request.adminNotes}</p>
                )}

                {request.status === 'PENDING' && (
                  <div className="mt-5 border-t border-[#edf0f5] pt-5">
                    <label className="block text-sm font-semibold">
                      Observação para o solicitante <span className="font-normal text-[#68728a]">(opcional)</span>
                      <textarea
                        rows={2}
                        maxLength={500}
                        value={notes[request.id] ?? ''}
                        onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                        className="mt-2 w-full resize-y rounded-lg border border-[#cbd2df] px-4 py-3 font-normal"
                        placeholder="Informe detalhes sobre a decisão."
                      />
                    </label>
                    <div className="mt-4 flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        disabled={reviewingId !== null}
                        onClick={() => void reviewRequest(request.id, 'REJECTED')}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-4 w-4" /> Recusar
                      </button>
                      <button
                        type="button"
                        disabled={reviewingId !== null}
                        onClick={() => void reviewRequest(request.id, 'APPROVED')}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        {reviewingId === request.id ? 'Analisando...' : 'Aprovar'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
