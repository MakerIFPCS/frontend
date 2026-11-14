'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Activity, CalendarDays, Download, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Header from '@/app/components/header';
import { getActivityReport } from '@/app/lib/api';
import { useAdminAccess } from '@/app/lib/use-admin-access';
import type { ActivityReportAPI, ActivityReportEventAPI } from '@/app/types/api';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message;
  }
  return error instanceof Error ? error.message : 'Não foi possível carregar o relatório.';
}

function exportActivityReport(report: ActivityReportAPI) {
  const document = new jsPDF({ orientation: 'landscape' });
  const generatedAt = formatDateTime(report.generatedAt);
  const period = report.fromDate || report.untilDate
    ? `${report.fromDate ? new Date(report.fromDate).toLocaleDateString('pt-BR') : 'Início'} até ${
        report.untilDate ? new Date(new Date(report.untilDate).getTime() - 1).toLocaleDateString('pt-BR') : 'Hoje'
      }`
    : 'Todo o período';

  document.setProperties({
    title: 'Relatório de atividades - Lab Maker',
    subject: `Atividades administrativas: ${period}`,
    creator: 'Lab Maker',
  });
  document.setFontSize(18);
  document.setTextColor(5, 11, 51);
  document.text('Relatório de atividades', 14, 18);
  document.setFontSize(10);
  document.setTextColor(86, 97, 125);
  document.text(`Período: ${period}`, 14, 26);
  document.text(`Gerado em ${generatedAt} · ${report.events.length} atividade(s)`, 14, 32);

  const rows = report.events.map((event) => [
    formatDateTime(event.occurredAt),
    event.category,
    event.action,
    event.subject,
    event.actor,
    event.details || '—',
  ]);
  autoTable(document, {
    startY: 39,
    head: [['Data e hora', 'Categoria', 'Ação', 'Registro', 'Responsável', 'Detalhes']],
    body: rows.length ? rows : [['—', '—', 'Nenhuma atividade no período', '—', '—', '—']],
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [5, 11, 51], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 251] },
    columnStyles: {
      0: { cellWidth: 29 },
      1: { cellWidth: 25 },
      2: { cellWidth: 38 },
      3: { cellWidth: 39 },
      4: { cellWidth: 35 },
    },
    margin: { left: 14, right: 14, bottom: 14 },
    didDrawPage: ({ pageNumber }) => {
      const pageHeight = document.internal.pageSize.getHeight();
      document.setFontSize(8);
      document.setTextColor(120, 120, 120);
      document.text(`Lab Maker · Página ${pageNumber}`, 14, pageHeight - 7);
    },
  });

  const filenamePeriod = period.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  document.save(`LabMaker-Relatorio-${filenamePeriod || 'atividades'}.pdf`);
}

export default function RelatoriosPage() {
  const authorized = useAdminAccess();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [report, setReport] = useState<ActivityReportAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    setError('');
    try {
      setReport(await getActivityReport(from || undefined, to || undefined));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    getActivityReport()
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authorized]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of report?.events ?? []) {
      counts.set(event.category, (counts.get(event.category) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([first], [second]) => first.localeCompare(second, 'pt-BR'));
  }, [report]);

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadReport(fromDate, toDate);
  }

  if (!authorized) return <main className="p-10 text-center">Verificando acesso...</main>;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header authenticated />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#7000ff]">
              <Activity className="h-4 w-4" /> Administração
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight">Relatório de atividades</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#56617d]">
              Consulte cadastros, alterações, acessos e solicitações registradas no sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={() => report && exportActivityReport(report)}
            disabled={!report || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#050b33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#101d5e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Exportar PDF
          </button>
        </div>

        <form
          onSubmit={handleFilter}
          className="mb-6 grid gap-4 rounded-2xl border border-[#dfe4ee] bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
        >
          <label className="block text-sm font-semibold">
            <span className="mb-2 flex items-center gap-2 text-[#56617d]">
              <CalendarDays className="h-4 w-4" /> Data inicial
            </span>
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full rounded-lg border border-[#dfe4ee] px-3 py-2.5 outline-none focus:border-[#7000ff]"
            />
          </label>
          <label className="block text-sm font-semibold">
            <span className="mb-2 flex items-center gap-2 text-[#56617d]">
              <CalendarDays className="h-4 w-4" /> Data final
            </span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full rounded-lg border border-[#dfe4ee] px-3 py-2.5 outline-none focus:border-[#7000ff]"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#7000ff] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#5d00d6] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Filtrar
          </button>
          <button
            type="button"
            disabled={loading || (!fromDate && !toDate)}
            onClick={() => {
              setFromDate('');
              setToDate('');
              void loadReport();
            }}
            className="rounded-lg border border-[#dfe4ee] px-4 py-2.5 text-sm font-bold text-[#56617d] hover:bg-[#f5f7fb] disabled:opacity-50"
          >
            Limpar
          </button>
        </form>

        {error && (
          <div role="alert" className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <p>Não foi possível carregar o relatório: {error}</p>
            <button type="button" onClick={() => void loadReport(fromDate, toDate)} className="font-bold underline">
              Tentar novamente
            </button>
          </div>
        )}

        <section aria-label="Resumo das atividades" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Atividades no período" value={report?.events.length ?? 0} />
          {categoryCounts.slice(0, 3).map(([category, count]) => (
            <SummaryCard key={category} label={category} value={count} />
          ))}
          {!loading && categoryCounts.length === 0 && (
            <SummaryCard label="Categorias registradas" value={0} />
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#dfe4ee] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e9edf4] px-5 py-4">
            <div>
              <h2 className="font-bold">Movimentações</h2>
              <p className="mt-1 text-xs text-[#56617d]">
                {report ? `${report.events.length} registro(s)` : 'Aguardando dados'}
                {report?.generatedAt ? ` · Atualizado em ${formatDateTime(report.generatedAt)}` : ''}
              </p>
            </div>
            {loading && <span className="text-sm text-[#56617d]">Carregando...</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[#f8f9fc] text-xs uppercase tracking-wide text-[#56617d]">
                <tr>
                  <th className="px-5 py-3 font-bold">Data e hora</th>
                  <th className="px-5 py-3 font-bold">Categoria / ação</th>
                  <th className="px-5 py-3 font-bold">Registro</th>
                  <th className="px-5 py-3 font-bold">Responsável</th>
                  <th className="px-5 py-3 font-bold">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9edf4]">
                {report?.events.map((event, index) => (
                  <ActivityRow key={`${event.occurredAt}-${index}`} event={event} />
                ))}
                {!loading && !error && report?.events.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-[#56617d]">
                      Nenhuma movimentação encontrada para o período selecionado.
                    </td>
                  </tr>
                )}
                {loading && !report && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-[#56617d]">
                      Buscando movimentações...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#dfe4ee] bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#56617d]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function ActivityRow({ event }: { event: ActivityReportEventAPI }) {
  return (
    <tr className="align-top hover:bg-[#fafbfe]">
      <td className="whitespace-nowrap px-5 py-4 text-[#56617d]">{formatDateTime(event.occurredAt)}</td>
      <td className="px-5 py-4">
        <span className="mb-1 inline-flex rounded-full bg-[#f0e9ff] px-2.5 py-1 text-xs font-bold text-[#5d00d6]">
          {event.category}
        </span>
        <p className="font-semibold">{event.action}</p>
      </td>
      <td className="px-5 py-4 font-medium">{event.subject}</td>
      <td className="px-5 py-4">{event.actor}</td>
      <td className="max-w-md whitespace-normal px-5 py-4 text-[#56617d]">{event.details || '—'}</td>
    </tr>
  );
}
