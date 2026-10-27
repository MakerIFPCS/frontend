'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { CalendarDays, Clock3, Package, Plus, Wrench, X } from 'lucide-react';
import Header from '@/app/components/header';
import {
  createLoanRequest,
  getMachines,
  getMaterials,
  getMyLoanRequests,
} from '@/app/lib/api';
import type {
  LoanRequestAPI,
  LoanRequestItemPayload,
  MachineAPI,
  MaterialAPI,
} from '@/app/types/api';

type SelectedItems = Record<string, string>;

function subscribeToAuth(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('auth-changed', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('auth-changed', callback);
  };
}

function getAuthToken() {
  return localStorage.getItem('authToken') ?? '';
}

function getToday() {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function getApiError(error: unknown) {
  if (isAxiosError<{ message?: unknown }>(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return 'Não foi possível concluir a solicitação. Tente novamente.';
}

function statusLabel(status: LoanRequestAPI['status']) {
  if (status === 'APPROVED') return 'Aprovado';
  if (status === 'REJECTED') return 'Recusado';
  return 'Aguardando análise';
}

function statusStyle(status: LoanRequestAPI['status']) {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'REJECTED') return 'bg-rose-50 text-rose-700';
  return 'bg-amber-50 text-amber-800';
}

export default function LoansPage() {
  const token = useSyncExternalStore(subscribeToAuth, getAuthToken, () => '');
  const [machines, setMachines] = useState<MachineAPI[]>([]);
  const [materials, setMaterials] = useState<MaterialAPI[]>([]);
  const [requests, setRequests] = useState<LoanRequestAPI[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({});
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [reason, setReason] = useState('');
  const [loadedToken, setLoadedToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!token) return;

    let active = true;
    Promise.all([getMachines(), getMaterials(), getMyLoanRequests()])
      .then(([loadedMachines, loadedMaterials, loadedRequests]) => {
        if (!active) return;
        setMachines(loadedMachines);
        setMaterials(loadedMaterials);
        setRequests(loadedRequests);
      })
      .catch((loadError: unknown) => {
        if (active) setError(getApiError(loadError));
      })
      .finally(() => {
        if (active) setLoadedToken(token);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const isLoading = Boolean(token) && loadedToken !== token;
  const selectedCount = Object.keys(selectedItems).length;
  const hasInvalidQuantity = Object.entries(selectedItems).some(([key, value]) => {
    if (!key.startsWith('MATERIAL:')) return false;
    const quantity = Number(value);
    const materialId = Number(key.split(':')[1]);
    const stock = materials.find((material) => material.id === materialId)?.quantity ?? 0;
    return !Number.isInteger(quantity) || quantity < 1 || quantity > stock;
  });
  const minimumReturnDate = pickupDate || getToday();
  const allItems = useMemo(() => [
    ...machines.map((machine) => ({
      key: `MACHINE:${machine.id}`,
      type: 'MACHINE' as const,
      id: machine.id,
      name: machine.name,
      description: machine.description,
      available: machine.status === 'AVAILABLE' || machine.status === 'FUNCTIONAL',
      quantityLabel: machine.status === 'AVAILABLE' || machine.status === 'FUNCTIONAL'
        ? 'Disponível para solicitação'
        : machine.status === 'MAINTENANCE' ? 'Em manutenção' : 'Indisponível',
    })),
    ...materials.map((material) => ({
      key: `MATERIAL:${material.id}`,
      type: 'MATERIAL' as const,
      id: material.id,
      name: material.name,
      description: material.description,
      available: material.quantity > 0,
      quantityLabel: `${material.quantity} ${material.unit} em estoque`,
    })),
  ], [machines, materials]);

  function toggleItem(key: string, available: boolean) {
    if (!available) return;
    setSelectedItems((current) => {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: '1' };
    });
  }

  function changeQuantity(key: string, quantity: string) {
    setSelectedItems((current) => ({ ...current, [key]: quantity }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!token) {
      setError('Entre na sua conta para solicitar um empréstimo.');
      return;
    }
    if (!selectedCount) {
      setError('Selecione pelo menos uma máquina ou material.');
      return;
    }
    if (!pickupDate || !returnDate || returnDate < pickupDate) {
      setError('Informe datas válidas para retirada e devolução.');
      return;
    }
    if (!reason.trim()) {
      setError('Descreva brevemente a finalidade do empréstimo.');
      return;
    }

    if (hasInvalidQuantity) {
      setError('Informe uma quantidade válida para cada material selecionado.');
      return;
    }

    const items: LoanRequestItemPayload[] = Object.entries(selectedItems)
      .map(([key, quantityText]) => {
        const [type, id] = key.split(':');
        return {
          type: type as LoanRequestItemPayload['type'],
          resourceId: Number(id),
          quantity: Number(quantityText),
        };
      });

    setIsSubmitting(true);
    try {
      const request = await createLoanRequest({
        items,
        pickupDate,
        returnDate,
        reason: reason.trim(),
      });
      setRequests((current) => [request, ...current]);
      setSelectedItems({});
      setPickupDate('');
      setReturnDate('');
      setReason('');
      setNotice('Pedido enviado. Você pode acompanhar a análise em “Meus pedidos”.');
    } catch (submitError: unknown) {
      setError(getApiError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#050b33] text-[#00ff9d]">
            <Package className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7000ff]">Espaço Maker</p>
            <h1 className="mt-1 text-3xl font-bold">Empréstimos</h1>
          </div>
        </div>

        <p className="mb-8 max-w-3xl leading-7 text-[#56617d]">
          Escolha as máquinas e os materiais de que precisa, informe as datas e envie o pedido para análise da administração.
        </p>

        {!token ? (
          <section className="rounded-xl border border-[#dfe4ee] bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold">Entre para solicitar um empréstimo</h2>
            <p className="mt-2 text-[#56617d]">É necessário estar conectado para enviar e acompanhar pedidos.</p>
            <Link href="/login" className="mt-5 inline-flex rounded-lg bg-[#050b33] px-5 py-3 font-bold text-white hover:bg-[#101d5e]">
              Entrar na conta
            </Link>
          </section>
        ) : isLoading ? (
          <p className="rounded-xl border border-[#dfe4ee] bg-white p-6 text-[#56617d]" role="status">
            Carregando máquinas, materiais e pedidos...
          </p>
        ) : (
          <>
            {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
            {notice && <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}

            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">Máquinas e materiais</h2>
                  <span className="rounded-full bg-[#f0eaff] px-3 py-1 text-sm font-bold text-[#7000ff]">
                    {selectedCount} selecionado(s)
                  </span>
                </div>
                {allItems.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#cbd2df] bg-white p-8 text-center text-[#56617d]">
                    Não há máquinas ou materiais cadastrados para solicitar.
                  </p>
                ) : (
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {allItems.map((item) => {
                      const isSelected = Object.prototype.hasOwnProperty.call(selectedItems, item.key);
                      const stock = item.type === 'MATERIAL'
                        ? materials.find((material) => material.id === item.id)?.quantity ?? 1
                        : 1;
                      return (
                        <li key={item.key} className="rounded-xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0eaff] text-[#7000ff]">
                              {item.type === 'MACHINE' ? <Wrench className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold uppercase tracking-wide text-[#7000ff]">
                                {item.type === 'MACHINE' ? 'Máquina' : 'Material'}
                              </p>
                              <h3 className="mt-1 font-bold">{item.name}</h3>
                            </div>
                          </div>
                          {item.description && <p className="mt-3 line-clamp-2 text-sm text-[#56617d]">{item.description}</p>}
                          <p className={`mt-3 text-xs font-semibold ${item.available ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {item.quantityLabel}
                          </p>
                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#edf0f5] pt-4">
                            {isSelected && item.type === 'MATERIAL' ? (
                              <label className="text-sm font-semibold">
                                Quantidade
                                <input
                                  type="number"
                                  min="1"
                                  max={stock}
                                  step="1"
                                  value={selectedItems[item.key]}
                                  onChange={(event) => {
                                    changeQuantity(item.key, event.target.value);
                                  }}
                                  className="ml-2 w-20 rounded-md border border-[#cbd2df] px-2 py-1.5"
                                  aria-label={`Quantidade de ${item.name}`}
                                />
                              </label>
                            ) : <span className="text-sm text-[#56617d]">{isSelected ? 'Selecionado' : ''}</span>}
                            <button
                              type="button"
                              disabled={!item.available}
                              onClick={() => toggleItem(item.key, item.available)}
                              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
                                isSelected
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  : 'bg-[#050b33] text-white hover:bg-[#101d5e]'
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {isSelected ? <><X className="h-4 w-4" /> Remover</> : <><Plus className="h-4 w-4" /> Adicionar</>}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[#dfe4ee] bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-bold">Enviar pedido</h2>
                  <p className="mt-1 text-sm text-[#56617d]">A solicitação ficará pendente até a análise do administrador.</p>
                </div>
                <label className="block text-sm font-semibold">
                  Data de retirada
                  <input
                    required
                    type="date"
                    min={getToday()}
                    value={pickupDate}
                    onChange={(event) => setPickupDate(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#cbd2df] px-4 py-3 font-normal"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Data prevista de devolução
                  <input
                    required
                    type="date"
                    min={minimumReturnDate}
                    value={returnDate}
                    onChange={(event) => setReturnDate(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#cbd2df] px-4 py-3 font-normal"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Finalidade do empréstimo
                  <textarea
                    required
                    maxLength={1000}
                    rows={4}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Conte como pretende utilizar os itens."
                    className="mt-2 w-full resize-y rounded-lg border border-[#cbd2df] px-4 py-3 font-normal"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedCount || hasInvalidQuantity}
                  className="w-full rounded-lg bg-[#050b33] px-5 py-3 font-bold text-white transition-colors hover:bg-[#101d5e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'ENVIANDO...' : 'SOLICITAR EMPRÉSTIMO'}
                </button>
                <p className="flex items-center gap-2 text-xs text-[#68728a]">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  As datas são uma solicitação e dependem da aprovação da administração.
                </p>
              </form>
            </div>

            <section className="mt-12">
              <div className="mb-4 flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-[#7000ff]" />
                <h2 className="text-xl font-bold">Meus pedidos</h2>
              </div>
              {requests.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#cbd2df] bg-white p-8 text-center text-[#56617d]">
                  Você ainda não enviou pedidos de empréstimo.
                </p>
              ) : (
                <ul className="space-y-4">
                  {requests.map((request) => (
                    <li key={request.id} className="rounded-xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold">Pedido #{request.id}</h3>
                          <p className="mt-1 text-sm text-[#56617d]">
                            Retirada {request.pickupDate} · Devolução {request.returnDate}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(request.status)}`}>
                          {statusLabel(request.status)}
                        </span>
                      </div>
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {request.items.map((item) => (
                          <li key={`${item.type}-${item.resourceId}`} className="rounded-lg bg-[#f5f7fb] px-3 py-2 text-sm">
                            {item.name}{item.type === 'MATERIAL' ? ` · ${item.quantity}` : ''}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-sm text-[#56617d]">{request.reason}</p>
                      {request.adminNotes && <p className="mt-2 rounded-lg bg-[#f5f7fb] p-3 text-sm text-[#56617d]">Resposta: {request.adminNotes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
