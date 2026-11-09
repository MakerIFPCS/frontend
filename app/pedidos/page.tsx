'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Box, Download, FileUp, Printer, Scissors, Wrench } from 'lucide-react';
import Header from '@/app/components/header';
import {
  addProductionOrderComment,
  createProductionOrder,
  downloadProductionOrderFile,
  getMachines,
  getMyProductionOrders,
  updateMyProductionOrder,
} from '@/app/lib/api';
import type {
  MachineAPI,
  ProductionOrderAPI,
  ProductionOrderStatus,
  ProductionOrderType,
} from '@/app/types/api';

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

function getApiError(error: unknown) {
  if (isAxiosError<{ message?: unknown; detail?: unknown }>(error)) {
    const responseData = error.response?.data;
    if (responseData && typeof responseData === 'object') {
      if ('message' in responseData && typeof responseData.message === 'string') {
        return responseData.message;
      }
      if ('detail' in responseData && typeof responseData.detail === 'string') {
        return responseData.detail;
      }
    }
    if (error.response) {
      if (error.response.status === 401) return 'Sua sessão expirou. Entre novamente e tente de novo.';
      if (error.response.status === 403) return 'A API recusou a solicitação (HTTP 403). Confira a conta e as permissões.';
      if (error.response.status === 413) return 'O arquivo excede o limite aceito pelo servidor (100 MB).';
      return `A API retornou um erro (HTTP ${error.response.status}).`;
    }
    if (error.message) {
      return `Não foi possível conectar à API (${error.message}).`;
    }
  }
  return 'Não foi possível concluir o pedido. Tente novamente.';
}

const STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  PENDING: 'Aguardando análise',
  WAITING_FOR_UPDATE: 'Aguardando suas informações',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
};

const STATUS_STYLES: Record<ProductionOrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800',
  WAITING_FOR_UPDATE: 'bg-sky-50 text-sky-800',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
};

const MAX_FILE_SIZE = 100 * 1024 * 1024;

function getOrderTypeLabel(type: ProductionOrderType) {
  if (type === 'LASER_CUTTING') return 'Corte a laser';
  if (type === 'CNC_MACHINING') return 'Usinagem CNC';
  return 'Impressão 3D';
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} bytes`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function OrderFile({ order }: { order: ProductionOrderAPI }) {
  const [error, setError] = useState('');

  async function downloadFile() {
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

  return (
    <div>
      <button type="button" onClick={downloadFile} className="inline-flex items-center gap-2 text-sm font-semibold text-[#7000ff] hover:underline">
        <Download className="h-4 w-4" /> {order.fileName} ({formatFileSize(order.fileSize)})
      </button>
      {error && <p className="mt-1 text-xs text-red-700" role="alert">{error}</p>}
    </div>
  );
}

export default function ProductionOrdersPage() {
  const token = useSyncExternalStore(subscribeToAuth, getAuthToken, () => '');
  const [type, setType] = useState<ProductionOrderType>('LASER_CUTTING');
  const [machines, setMachines] = useState<MachineAPI[]>([]);
  const [orders, setOrders] = useState<ProductionOrderAPI[]>([]);
  const [machineId, setMachineId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editType, setEditType] = useState<ProductionOrderType>('LASER_CUTTING');
  const [editMachineId, setEditMachineId] = useState('');
  const [editDimensions, setEditDimensions] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [loadedToken, setLoadedToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([getMachines(), getMyProductionOrders()])
      .then(([loadedMachines, loadedOrders]) => {
        if (!active) return;
        setMachines(loadedMachines);
        setOrders(loadedOrders);
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

  const availableMachines = useMemo(() => machines.filter((machine) => {
    if (machine.status !== 'AVAILABLE' && machine.status !== 'FUNCTIONAL') return false;
    if (type === 'THREE_D_PRINTING') {
      return machine.type === 'Impressão 3D' || machine.type === 'Impressao 3D';
    }
    return type === 'CNC_MACHINING' && (machine.type ?? '').toUpperCase().includes('CNC');
  }), [machines, type]);
  const editAvailableMachines = useMemo(() => machines.filter((machine) => {
    if (machine.status !== 'AVAILABLE' && machine.status !== 'FUNCTIONAL') return false;
    if (editType === 'THREE_D_PRINTING') {
      return machine.type === 'Impressão 3D' || machine.type === 'Impressao 3D';
    }
    return editType === 'CNC_MACHINING' && (machine.type ?? '').toUpperCase().includes('CNC');
  }), [machines, editType]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!token) {
      setError('Entre na sua conta para enviar um pedido.');
      return;
    }
    if (file && file.size > MAX_FILE_SIZE) {
      setError('O arquivo deve ter no máximo 100 MB.');
      return;
    }
    if (type !== 'LASER_CUTTING' && !machineId) {
      setError('Selecione uma máquina disponível.');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createProductionOrder({
        type,
        ...(type !== 'LASER_CUTTING' ? { machineId: Number(machineId) } : {}),
        notes: notes.trim(),
        dimensions: dimensions.trim(),
        file: file ?? undefined,
      });
      setOrders((current) => [order, ...current]);
      setFile(null);
      setNotes('');
      setDimensions('');
      setMachineId('');
      const fileInput = document.getElementById('order-file') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      setNotice('Pedido enviado. Você pode acompanhar a análise abaixo e completar os dados depois.');
    } catch (submitError: unknown) {
      setError(getApiError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function beginEdit(order: ProductionOrderAPI) {
    setEditingOrderId(order.id);
    setEditType(order.type);
    setEditMachineId(order.machineId ? String(order.machineId) : '');
    setEditDimensions(order.dimensions ?? '');
    setEditNotes(order.notes ?? '');
    setEditFile(null);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>, orderId: number) {
    event.preventDefault();
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
    setError('');
    setNotice('');
    if (editType !== 'LASER_CUTTING' && !editMachineId) {
      setError('Selecione uma máquina disponível.');
      return;
    }
    if (editFile && editFile.size > MAX_FILE_SIZE) {
      setError('O arquivo deve ter no máximo 100 MB.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateMyProductionOrder({
        id: orderId,
        type: editType,
        ...(editType !== 'LASER_CUTTING' ? { machineId: Number(editMachineId) } : {}),
        notes: editNotes.trim(),
        dimensions: editDimensions.trim(),
        file: editFile ?? undefined,
      });
      setOrders((current) => current.map((item) => item.id === orderId ? updated : item));
      setEditingOrderId(null);
      setNotice('Pedido atualizado. A equipe poderá continuar a análise.');
    } catch (updateError: unknown) {
      setError(getApiError(updateError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComment(orderId: number) {
    const message = commentDrafts[orderId]?.trim();
    if (!message) return;
    setError('');
    setNotice('');
    try {
      const updated = await addProductionOrderComment(orderId, message);
      setOrders((current) => current.map((item) => item.id === orderId ? updated : item));
      setCommentDrafts((current) => ({ ...current, [orderId]: '' }));
    } catch (commentError: unknown) {
      setError(getApiError(commentError));
    }
  }

  const isLoading = Boolean(token) && loadedToken !== token;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#050b33] text-[#00ff9d]">
            <Box className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7000ff]">Espaço Maker</p>
            <h1 className="mt-1 text-3xl font-bold">Pedidos de fabricação</h1>
          </div>
        </div>

        <p className="mb-8 max-w-3xl leading-7 text-[#56617d]">
          Solicite corte a laser, impressão 3D ou usinagem CNC. Você pode enviar o arquivo e completar medidas e detalhes depois, se necessário.
        </p>

        {!token && <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Entre na sua conta para enviar e acompanhar pedidos.</p>}
        {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {notice && <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}

        <form onSubmit={handleSubmit} className="rounded-xl border border-[#dfe4ee] bg-white p-6 shadow-sm sm:p-8">
          <fieldset disabled={!token || isSubmitting} className="disabled:opacity-70">
            <legend className="text-xl font-bold">Novo pedido</legend>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => { setType('LASER_CUTTING'); setMachineId(''); }}
                aria-pressed={type === 'LASER_CUTTING'}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left font-semibold ${type === 'LASER_CUTTING' ? 'border-[#7000ff] bg-violet-50' : 'border-[#dfe4ee]'}`}
              >
                <Scissors className="h-5 w-5 text-[#7000ff]" /> Corte a laser
              </button>
              <button
                type="button"
                onClick={() => { setType('THREE_D_PRINTING'); setMachineId(''); }}
                aria-pressed={type === 'THREE_D_PRINTING'}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left font-semibold ${type === 'THREE_D_PRINTING' ? 'border-[#7000ff] bg-violet-50' : 'border-[#dfe4ee]'}`}
              >
                <Printer className="h-5 w-5 text-[#7000ff]" /> Impressão 3D
              </button>
              <button
                type="button"
                onClick={() => { setType('CNC_MACHINING'); setMachineId(''); }}
                aria-pressed={type === 'CNC_MACHINING'}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left font-semibold ${type === 'CNC_MACHINING' ? 'border-[#7000ff] bg-violet-50' : 'border-[#dfe4ee]'}`}
              >
                <Wrench className="h-5 w-5 text-[#7000ff]" /> Usinagem CNC
              </button>
            </div>

            {type !== 'LASER_CUTTING' && (
              <label className="mt-5 block text-sm font-semibold">
                {type === 'THREE_D_PRINTING' ? 'Impressora 3D' : 'Máquina CNC'}
                <select
                  required
                  value={machineId}
                  onChange={(event) => setMachineId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#cbd2df] bg-white px-4 py-3 font-normal"
                >
                  <option value="">Selecione uma máquina disponível</option>
                  {availableMachines.map((machine) => <option key={machine.id} value={machine.id}>{machine.name}</option>)}
                </select>
                {!availableMachines.length && <span className="mt-2 block font-normal text-amber-800">Não há máquinas disponíveis para esta opção.</span>}
              </label>
            )}

            <label className="mt-5 block text-sm font-semibold">
              Arquivo original <span className="font-normal text-[#68728a]">(opcional; qualquer formato, até 100 MB)</span>
              <span className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-[#cbd2df] bg-[#f9faff] p-4 font-normal">
                <FileUp className="h-5 w-5 shrink-0 text-[#7000ff]" />
                <input
                  id="order-file"
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="min-w-0 flex-1 text-sm"
                />
              </span>
            </label>

            <label className="mt-5 block text-sm font-semibold">
              Dimensões e especificações <span className="font-normal text-[#68728a]">(opcional)</span>
              <textarea
                rows={4}
                maxLength={2000}
                value={dimensions}
                onChange={(event) => setDimensions(event.target.value)}
                className="mt-2 w-full resize-y rounded-lg border border-[#cbd2df] px-4 py-3 font-normal"
                placeholder="Informe medidas, material, escala ou outros requisitos do trabalho."
              />
            </label>
            <label className="mt-5 block text-sm font-semibold">
              Observações adicionais <span className="font-normal text-[#68728a]">(opcional)</span>
              <textarea
                rows={3}
                maxLength={2000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-2 w-full resize-y rounded-lg border border-[#cbd2df] px-4 py-3 font-normal"
                placeholder="Descreva como pretende usar o equipamento ou faça uma pergunta."
              />
            </label>
            <button type="submit" disabled={isSubmitting || (type !== 'LASER_CUTTING' && availableMachines.length === 0)} className="mt-5 rounded-lg bg-[#050b33] px-5 py-3 font-bold text-white transition hover:bg-[#7000ff] disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? 'Enviando...' : 'Enviar pedido'}
            </button>
          </fieldset>
        </form>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">Meus pedidos</h2>
          {!token ? (
            <p className="rounded-xl border border-[#dfe4ee] bg-white p-6 text-[#56617d]">Entre na sua conta para acompanhar os pedidos.</p>
          ) : isLoading ? (
            <p className="rounded-xl border border-[#dfe4ee] bg-white p-6 text-[#56617d]" role="status">Carregando pedidos...</p>
          ) : orders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#cbd2df] bg-white p-8 text-center text-[#56617d]">Você ainda não enviou pedidos.</p>
          ) : (
            <ul className="space-y-4">
              {orders.map((order) => {
                const isOpen = order.status === 'PENDING' || order.status === 'WAITING_FOR_UPDATE';
                const isEditing = editingOrderId === order.id;
                return (
                <li key={order.id} className="rounded-xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">Pedido #{order.id} · {getOrderTypeLabel(order.type)}</h3>
                      <p className="mt-1 text-sm text-[#56617d]">
                        {order.machineName ? `Máquina: ${order.machineName} · ` : ''}{new Date(order.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                  </div>
                {order.fileName ? (
                  <div className="mt-4"><OrderFile order={order} /></div>
                ) : (
                  <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Nenhum arquivo enviado ainda. Você pode anexá-lo ao editar o pedido.</p>
                )}
                {order.dimensions && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#56617d]"><strong>Dimensões e especificações:</strong> {order.dimensions}</p>}
                {order.notes && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#56617d]">{order.notes}</p>}
                {order.adminNotes && <p className="mt-3 rounded-lg bg-[#f5f7fb] p-3 text-sm text-[#56617d]"><strong>Resposta da equipe:</strong> {order.adminNotes}</p>}
                {(order.comments?.length ?? 0) > 0 && (
                  <div className="mt-4 space-y-3 rounded-lg border border-[#edf0f5] p-4">
                    <h4 className="text-sm font-bold">Conversa</h4>
                    {order.comments?.map((comment) => (
                      <div key={comment.id} className="border-t border-[#edf0f5] pt-3 first:border-0 first:pt-0">
                        <p className="text-xs font-semibold text-[#68728a]">
                          {comment.authorName} · {comment.authorRole === 'ADMIN' ? 'Equipe' : 'Solicitante'} · {new Date(comment.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#56617d]">{comment.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                {isOpen && (
                  <>
                    {!isEditing ? (
                      <button type="button" onClick={() => beginEdit(order)} className="mt-4 rounded-lg border border-[#cbd2df] px-4 py-2 text-sm font-semibold hover:bg-[#f5f7fb]">
                        Editar solicitação
                      </button>
                    ) : (
                      <form onSubmit={(event) => void handleUpdate(event, order.id)} className="mt-5 space-y-4 rounded-lg bg-[#f5f7fb] p-4">
                        <h4 className="font-bold">Editar solicitação</h4>
                        <div className="flex flex-wrap gap-2">
                          {(['LASER_CUTTING', 'THREE_D_PRINTING', 'CNC_MACHINING'] as const).map((option) => (
                            <button key={option} type="button" onClick={() => { setEditType(option); setEditMachineId(''); }} aria-pressed={editType === option} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${editType === option ? 'border-[#7000ff] bg-violet-50' : 'border-[#dfe4ee] bg-white'}`}>
                              {getOrderTypeLabel(option)}
                            </button>
                          ))}
                        </div>
                        {editType !== 'LASER_CUTTING' && (
                          <label className="block text-sm font-semibold">
                            {editType === 'THREE_D_PRINTING' ? 'Impressora 3D' : 'Máquina CNC'}
                            <select required value={editMachineId} onChange={(event) => setEditMachineId(event.target.value)} className="mt-2 w-full rounded-lg border border-[#cbd2df] bg-white px-4 py-3 font-normal">
                              <option value="">Selecione uma máquina disponível</option>
                              {editAvailableMachines.map((machine) => <option key={machine.id} value={machine.id}>{machine.name}</option>)}
                            </select>
                          </label>
                        )}
                        <label className="block text-sm font-semibold">
                          Substituir ou anexar arquivo <span className="font-normal text-[#68728a]">(opcional, até 100 MB)</span>
                          <input type="file" onChange={(event) => setEditFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-lg border border-[#cbd2df] bg-white p-3 text-sm" />
                        </label>
                        <label className="block text-sm font-semibold">
                          Dimensões e especificações
                          <textarea rows={3} maxLength={2000} value={editDimensions} onChange={(event) => setEditDimensions(event.target.value)} className="mt-2 w-full rounded-lg border border-[#cbd2df] bg-white px-4 py-3 font-normal" />
                        </label>
                        <label className="block text-sm font-semibold">
                          Observações adicionais
                          <textarea rows={3} maxLength={2000} value={editNotes} onChange={(event) => setEditNotes(event.target.value)} className="mt-2 w-full rounded-lg border border-[#cbd2df] bg-white px-4 py-3 font-normal" />
                        </label>
                        <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setEditingOrderId(null)} className="rounded-lg border border-[#cbd2df] bg-white px-4 py-2 font-semibold">Cancelar</button>
                          <button type="submit" disabled={isSubmitting || (editType !== 'LASER_CUTTING' && editAvailableMachines.length === 0)} className="rounded-lg bg-[#050b33] px-4 py-2 font-semibold text-white disabled:opacity-50">
                            {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
                          </button>
                        </div>
                      </form>
                    )}
                    <div className="mt-4 flex gap-3">
                      <textarea aria-label="Adicionar comentário" rows={2} maxLength={2000} value={commentDrafts[order.id] ?? ''} onChange={(event) => setCommentDrafts((current) => ({ ...current, [order.id]: event.target.value }))} placeholder="Escreva uma mensagem para a equipe..." className="min-w-0 flex-1 rounded-lg border border-[#cbd2df] px-3 py-2 text-sm" />
                      <button type="button" disabled={!commentDrafts[order.id]?.trim()} onClick={() => void handleComment(order.id)} className="self-end rounded-lg bg-[#7000ff] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Enviar</button>
                    </div>
                  </>
                )}
                </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
