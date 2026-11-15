'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Box, Download, FileUp, Printer, Scissors } from 'lucide-react';
import Header from '@/app/components/header';
import {
  createProductionOrder,
  downloadProductionOrderFile,
  getMachines,
  getMyProductionOrders,
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
  if (isAxiosError<{ message?: unknown }>(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return 'Não foi possível concluir o pedido. Tente novamente.';
}

const STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  PENDING: 'Aguardando análise',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
};

const STATUS_STYLES: Record<ProductionOrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
};

const MAX_FILE_SIZE = 100 * 1024 * 1024;

function formatFileSize(size: number) {
  if (size < 1024) return `${size} bytes`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function OrderFile({ order }: { order: ProductionOrderAPI }) {
  const [error, setError] = useState('');

  async function downloadFile() {
    setError('');
    try {
      const file = await downloadProductionOrderFile(order.id);
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = order.fileName;
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

  const printers = useMemo(
    () => machines.filter((machine) =>
      (machine.type === 'Impressão 3D' || machine.type === 'Impressao 3D')
      && (machine.status === 'AVAILABLE' || machine.status === 'FUNCTIONAL')),
    [machines],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!token) {
      setError('Entre na sua conta para enviar um pedido.');
      return;
    }
    if (!file) {
      setError('Selecione o arquivo original que deseja enviar.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('O arquivo deve ter no máximo 100 MB.');
      return;
    }
    if (type === 'THREE_D_PRINTING' && !machineId) {
      setError('Selecione uma impressora 3D disponível.');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createProductionOrder({
        type,
        ...(type === 'THREE_D_PRINTING' ? { machineId: Number(machineId) } : {}),
        notes: notes.trim(),
        file,
      });
      setOrders((current) => [order, ...current]);
      setFile(null);
      setNotes('');
      setMachineId('');
      const fileInput = document.getElementById('order-file') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      setNotice('Pedido enviado. Você pode acompanhar a análise abaixo.');
    } catch (submitError: unknown) {
      setError(getApiError(submitError));
    } finally {
      setIsSubmitting(false);
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
          Envie seu arquivo para corte a laser ou impressão 3D. Todos os formatos de arquivo são aceitos; a equipe analisará sua solicitação.
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
                onClick={() => setType('THREE_D_PRINTING')}
                aria-pressed={type === 'THREE_D_PRINTING'}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left font-semibold ${type === 'THREE_D_PRINTING' ? 'border-[#7000ff] bg-violet-50' : 'border-[#dfe4ee]'}`}
              >
                <Printer className="h-5 w-5 text-[#7000ff]" /> Impressão 3D
              </button>
            </div>

            {type === 'THREE_D_PRINTING' && (
              <label className="mt-5 block text-sm font-semibold">
                Impressora 3D
                <select
                  required
                  value={machineId}
                  onChange={(event) => setMachineId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#cbd2df] bg-white px-4 py-3 font-normal"
                >
                  <option value="">Selecione uma impressora disponível</option>
                  {printers.map((printer) => <option key={printer.id} value={printer.id}>{printer.name}</option>)}
                </select>
                {!printers.length && <span className="mt-2 block font-normal text-amber-800">Não há impressoras 3D disponíveis no momento.</span>}
              </label>
            )}

            <label className="mt-5 block text-sm font-semibold">
              Arquivo original <span className="font-normal text-[#68728a]">(qualquer formato, até 100 MB)</span>
              <span className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-[#cbd2df] bg-[#f9faff] p-4 font-normal">
                <FileUp className="h-5 w-5 shrink-0 text-[#7000ff]" />
                <input
                  id="order-file"
                  type="file"
                  required
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="min-w-0 flex-1 text-sm"
                />
              </span>
            </label>

            <label className="mt-5 block text-sm font-semibold">
              Dúvidas ou observações <span className="font-normal text-[#68728a]">(opcional)</span>
              <textarea
                rows={4}
                maxLength={2000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-2 w-full resize-y rounded-lg border border-[#cbd2df] px-4 py-3 font-normal"
                placeholder="Inclua medidas, material desejado ou outras informações importantes."
              />
            </label>
            <button type="submit" disabled={isSubmitting || (type === 'THREE_D_PRINTING' && printers.length === 0)} className="mt-5 rounded-lg bg-[#050b33] px-5 py-3 font-bold text-white transition hover:bg-[#7000ff] disabled:cursor-not-allowed disabled:opacity-50">
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
              {orders.map((order) => (
                <li key={order.id} className="rounded-xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">Pedido #{order.id} · {order.type === 'LASER_CUTTING' ? 'Corte a laser' : 'Impressão 3D'}</h3>
                      <p className="mt-1 text-sm text-[#56617d]">
                        {order.machineName ? `Impressora: ${order.machineName} · ` : ''}{new Date(order.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                  </div>
                  <div className="mt-4"><OrderFile order={order} /></div>
                  {order.notes && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#56617d]">{order.notes}</p>}
                  {order.adminNotes && <p className="mt-3 rounded-lg bg-[#f5f7fb] p-3 text-sm text-[#56617d]"><strong>Resposta da equipe:</strong> {order.adminNotes}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
