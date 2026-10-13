'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Home,
  Wrench,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Bell,
  ShieldCheck,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  X,
  User,
  GraduationCap,
  Briefcase,
  AlertCircle,
  FileText,
  RotateCcw,
  Layers,
  WrenchIcon,
  Tag,
  CheckSquare,
  Square,
} from 'lucide-react';
import Header from '@/app/components/header';
import { getSchedulingRequests, updateSchedulingRequest } from '@/app/lib/api';
import { useAdminAccess } from '@/app/lib/use-admin-access';
import type { SchedulingRequestAPI, SchedulingRequestPayload } from '@/app/types/api';

export type RequestStatus = 'Aguardando análise' | 'Aprovado' | 'Recusado';
export type RequesterType = 'Aluno' | 'Servidor';
export type CourseType =
  | 'Administração'
  | 'Geografia'
  | 'Biologia'
  | 'Engenharia de Computação'
  | 'N/A';

export interface SchedulingRequest {
  id: string;
  code: string;
  requesterName: string;
  requesterType: RequesterType;
  course?: CourseType;
  email: string;
  registrationNumber: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  purpose: string;
  reason: string;
  description: string;
  equipment: string[];
  status: RequestStatus;
  workstation?: string;
  adminNotes?: string;
  rejectionReason?: string;
  decidedAt?: string;
  decidedBy?: string;
  createdAt: string;
}

const INITIAL_REQUESTS: SchedulingRequest[] = [];

const ITEMS_PER_PAGE = 8;

function toSchedulingRequest(request: SchedulingRequestAPI): SchedulingRequest {
  const status: RequestStatus =
    request.status === 'Aprovado' || request.status === 'Recusado'
      ? request.status
      : 'Aguardando análise';
  const requesterType: RequesterType = request.requesterType === 'Servidor' ? 'Servidor' : 'Aluno';
  const courses: CourseType[] = ['Administração', 'Geografia', 'Biologia', 'Engenharia de Computação', 'N/A'];
  const course = courses.find((item) => item === request.course);
  return {
    ...request,
    id: String(request.id),
    requesterType,
    course,
    status,
  };
}

function toSchedulingPayload(request: SchedulingRequest): SchedulingRequestPayload {
  return {
    code: request.code,
    requesterName: request.requesterName,
    requesterType: request.requesterType,
    course: request.course,
    email: request.email,
    registrationNumber: request.registrationNumber,
    date: request.date,
    dayOfWeek: request.dayOfWeek,
    startTime: request.startTime,
    endTime: request.endTime,
    purpose: request.purpose,
    reason: request.reason,
    description: request.description,
    equipment: request.equipment,
    status: request.status,
    workstation: request.workstation,
    adminNotes: request.adminNotes,
    rejectionReason: request.rejectionReason,
    decidedAt: request.decidedAt,
    decidedBy: request.decidedBy,
  };
}

export default function AgendamentoAdmPage() {
  const authorized = useAdminAccess();
  const [requests, setRequests] = useState<SchedulingRequest[]>(INITIAL_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [typeFilter, setTypeFilter] = useState<string>('Todos');
  const [courseFilter, setCourseFilter] = useState<string>('Todos');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Seleção múltipla para ações em lote
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modais
  const [selectedRequest, setSelectedRequest] = useState<SchedulingRequest | null>(null);
  const [acceptingRequest, setAcceptingRequest] = useState<SchedulingRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<SchedulingRequest | null>(null);

  // Campos do formulário de decisão do ADM
  const [allocatedWorkstation, setAllocatedWorkstation] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Toast / Notificação
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  useEffect(() => {
    if (!authorized) return;
    getSchedulingRequests()
      .then((data) => setRequests(data.map(toSchedulingRequest)))
      .catch(() => showToast('Não foi possível carregar os agendamentos. Verifique a conexão com o servidor.', 'error'));
  }, [authorized, showToast]);

  async function saveRequest(request: SchedulingRequest) {
    const saved = await updateSchedulingRequest(request.id, toSchedulingPayload(request));
    const updated = toSchedulingRequest(saved);
    setRequests((previous) => previous.map((item) => item.id === updated.id ? updated : item));
    setSelectedRequest((current) => current?.id === updated.id ? updated : current);
    return updated;
  }

  // Abertura do Modal de Aceite
  function openAcceptModal(req: SchedulingRequest, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setAcceptingRequest(req);
    setAllocatedWorkstation(req.workstation || 'Bancada 01 - Fabricação Digital');
    setApprovalNotes(req.adminNotes || '');
  }

  // Confirmação do Aceite do Agendamento
  async function confirmAccept() {
    if (!acceptingRequest) return;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const updated = {
      ...acceptingRequest,
      status: 'Aprovado' as const,
      workstation: allocatedWorkstation || acceptingRequest.workstation,
      adminNotes: approvalNotes || undefined,
      rejectionReason: undefined,
      decidedAt: formattedDate,
      decidedBy: 'Monitor ADM',
    };
    try {
      await saveRequest(updated);
      showToast(`Agendamento ${acceptingRequest.code} aceito com sucesso!`, 'success');
      setAcceptingRequest(null);
    } catch {
      showToast('Não foi possível atualizar o agendamento. Tente novamente.', 'error');
    }
  }

  // Abertura do Modal de Recusa
  function openRejectModal(req: SchedulingRequest, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setRejectingRequest(req);
    setRejectionReasonText(req.rejectionReason || '');
  }

  // Confirmação da Recusa do Agendamento
  async function confirmReject() {
    if (!rejectingRequest) return;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const reason = rejectionReasonText.trim() || 'Solicitação incompatível com a capacidade do laboratório nesta data.';

    const updated = {
      ...rejectingRequest,
      status: 'Recusado' as const,
      rejectionReason: reason,
      adminNotes: undefined,
      decidedAt: formattedDate,
      decidedBy: 'Monitor ADM',
    };
    try {
      await saveRequest(updated);
      showToast(`Agendamento ${rejectingRequest.code} recusado.`, 'error');
      setRejectingRequest(null);
    } catch {
      showToast('Não foi possível atualizar o agendamento. Tente novamente.', 'error');
    }
  }

  // Ação rápida: Reabrir para análise
  async function handleReopen(requestId: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;
    try {
      await saveRequest({
        ...target,
        status: 'Aguardando análise',
        rejectionReason: undefined,
        adminNotes: undefined,
      });
      showToast(`Agendamento ${target.code} reaberto para análise.`, 'info');
    } catch {
      showToast('Não foi possível reabrir o agendamento. Tente novamente.', 'error');
    }
  }

  // Ações em lote: Aceitar múltiplos
  async function handleBatchAccept() {
    if (selectedIds.length === 0) return;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const chosen = requests.filter((request) => selectedIds.includes(request.id));
    const results = await Promise.allSettled(chosen.map((request) => updateSchedulingRequest(
      request.id,
      toSchedulingPayload({ ...request, status: 'Aprovado', decidedAt: formattedDate, decidedBy: 'Monitor ADM' }),
    )));
    const updated = results.flatMap((result) => result.status === 'fulfilled' ? [toSchedulingRequest(result.value)] : []);
    setRequests((previous) => previous.map((request) => updated.find((item) => item.id === request.id) ?? request));
    const succeededIds = updated.map((request) => request.id);
    setSelectedIds((previous) => previous.filter((id) => !succeededIds.includes(id)));
    showToast(
      results.some((result) => result.status === 'rejected')
        ? `${updated.length} agendamento(s) aceito(s); alguns não puderam ser atualizados.`
        : `${updated.length} agendamento(s) aceito(s) em lote!`,
      results.some((result) => result.status === 'rejected') ? 'error' : 'success',
    );
  }

  // Ações em lote: Recusar múltiplos
  async function handleBatchReject() {
    if (selectedIds.length === 0) return;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const chosen = requests.filter((request) => selectedIds.includes(request.id));
    const results = await Promise.allSettled(chosen.map((request) => updateSchedulingRequest(
      request.id,
      toSchedulingPayload({
        ...request,
        status: 'Recusado',
        rejectionReason: 'Recusado em ação administrativa em lote.',
        decidedAt: formattedDate,
        decidedBy: 'Monitor ADM',
      }),
    )));
    const updated = results.flatMap((result) => result.status === 'fulfilled' ? [toSchedulingRequest(result.value)] : []);
    setRequests((previous) => previous.map((request) => updated.find((item) => item.id === request.id) ?? request));
    const succeededIds = updated.map((request) => request.id);
    setSelectedIds((previous) => previous.filter((id) => !succeededIds.includes(id)));
    showToast(
      results.some((result) => result.status === 'rejected')
        ? `${updated.length} agendamento(s) recusado(s); alguns não puderam ser atualizados.`
        : `${updated.length} agendamento(s) recusado(s) em lote.`,
      'error',
    );
  }

  // Filtragem dinâmica
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        req.requesterName.toLowerCase().includes(search) ||
        req.code.toLowerCase().includes(search) ||
        req.date.toLowerCase().includes(search) ||
        req.description.toLowerCase().includes(search) ||
        req.purpose.toLowerCase().includes(search) ||
        (req.course && req.course.toLowerCase().includes(search)) ||
        req.equipment.some((eq) => eq.toLowerCase().includes(search));

      const matchesStatus =
        statusFilter === 'Todos' || req.status === statusFilter;

      const matchesType =
        typeFilter === 'Todos' || req.requesterType === typeFilter;

      const matchesCourse =
        courseFilter === 'Todos' ||
        (courseFilter === 'Servidor' && req.requesterType === 'Servidor') ||
        req.course === courseFilter;

      const matchesDate =
        !dateFilter || req.date.includes(dateFilter);

      return matchesSearch && matchesStatus && matchesType && matchesCourse && matchesDate;
    });
  }, [requests, searchTerm, statusFilter, typeFilter, courseFilter, dateFilter]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  // Contadores dinâmicos
  const totalCount = requests.length;
  const approvedCount = requests.filter((r) => r.status === 'Aprovado').length;
  const rejectedCount = requests.filter((r) => r.status === 'Recusado').length;
  const pendingCount = requests.filter((r) => r.status === 'Aguardando análise').length;

  // Controle de seleção em massa
  const allCurrentPageSelected =
    paginatedRequests.length > 0 &&
    paginatedRequests.every((req) => selectedIds.includes(req.id));

  function toggleSelectAllCurrentPage() {
    if (allCurrentPageSelected) {
      const currentIds = paginatedRequests.map((r) => r.id);
      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      const newIds = paginatedRequests.map((r) => r.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...newIds])));
    }
  }

  function toggleSelectRow(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  if (!authorized) return <main className="p-10 text-center">Verificando acesso...</main>;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33] flex flex-col font-sans selection:bg-[#7000ff]/20 selection:text-[#050b33]">
      {/* 1. CABEÇALHO GLOBAL */}
      <Header authenticated />

      {/* 2. BARRA DE CONTEXTO ADMINISTRATIVO */}
      <div className="bg-[#030722] border-b border-white/10 px-4 sm:px-8 py-2.5 text-xs text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Recolher menu lateral' : 'Expandir menu lateral'}
              className="hidden lg:inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              <span className="text-[11px] font-medium">{sidebarOpen ? 'Recolher' : 'Menu'}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Menu className="w-4 h-4" />
              <span className="text-[11px] font-medium">Menu</span>
            </button>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7000ff]/30 px-3 py-0.5 text-[11px] font-bold tracking-wider uppercase text-[#00ff9d] border border-[#7000ff]/50">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00ff9d]" /> Painel Administrativo
            </span>
            <span className="hidden sm:inline text-white/30">/</span>
            <span className="hidden sm:inline text-white/80 font-medium">Laboratório de Fabricação Digital</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              title="Notificações"
              className="relative p-1 text-white/70 hover:text-white transition-colors"
            >
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ff2a55] text-[9px] font-extrabold text-white">
                  {pendingCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-white/15">
              <div className="w-7 h-7 rounded-full bg-[#7000ff] flex items-center justify-center font-bold text-white text-xs shadow-inner">
                M
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="font-semibold text-white text-xs">Monitor</p>
                <p className="text-[10px] text-white/60">Administrador</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/50" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTEÚDO PRINCIPAL COM SIDEBAR */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR ADMINISTRATIVA */}
        <aside
          className={`bg-[#050b33] text-white shrink-0 border-r border-white/10 transition-all duration-300 relative flex flex-col justify-between ${
            sidebarOpen ? 'w-60' : 'w-16'
          } ${mobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 w-64 shadow-2xl flex' : 'hidden lg:flex'}`}
        >
          {/* Marca d'água da engrenagem decorativa */}
          <div className="absolute -bottom-10 -left-10 w-44 h-44 opacity-5 pointer-events-none text-white">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30zm0-25c-2.3 0-4.3 1.5-4.8 3.8l-1.3 5.4c-2.4.7-4.7 1.8-6.7 3.1l-5-2.6c-2.1-1.1-4.7-.6-6.2 1.2l-5.7 7c-1.5 1.8-1.5 4.4-.1 6.3l3.3 4.6c-1.2 2.1-2.1 4.4-2.7 6.9l-5.5 1.1C13.2 47.3 11.5 49.3 11.5 51.6v9c0 2.3 1.7 4.3 3.9 4.8l5.5 1.1c.6 2.5 1.5 4.8 2.7 6.9l-3.3 4.6c-1.4 1.9-1.4 4.5-.1 6.3l-5.7-7c-1.5-1.8-4.1-2.3-6.2-1.2l-5 2.6c-2-1.3-4.3-2.4-6.7-3.1l-1.3-5.4C58.3 11.5 56.3 10 54 10h-4z" />
            </svg>
          </div>

          <div className="p-3.5 space-y-1 relative z-10">
            {mobileMenuOpen && (
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 lg:hidden">
                <span className="font-bold text-sm tracking-wide text-[#00ff9d]">NAVEGAÇÃO ADM</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-white/70 hover:text-white"
                  aria-label="Fechar menu"
                >
                  ✕
                </button>
              </div>
            )}

            <SidebarItem
              icon={<Home className="w-5 h-5" />}
              label="Início"
              href="/admin"
              collapsed={!sidebarOpen}
            />

            <SidebarItem
              icon={<Wrench className="w-5 h-5" />}
              label="Máquinas"
              href="/Maquinas-ADM"
              collapsed={!sidebarOpen}
            />

            <SidebarItem
              icon={<Calendar className="w-5 h-5" />}
              label="Agendamentos"
              href="/Agendamento-ADM"
              active
              collapsed={!sidebarOpen}
            />

            <SidebarItem
              icon={<Users className="w-5 h-5" />}
              label="Usuários"
              href="/usuarios"
              collapsed={!sidebarOpen}
            />

            <SidebarItem
              icon={<BarChart3 className="w-5 h-5" />}
              label="Relatórios"
              href="/Relatorio-ADM"
              collapsed={!sidebarOpen}
            />

            <SidebarItem
              icon={<Settings className="w-5 h-5" />}
              label="Configurações"
              href="/configuracoes"
              collapsed={!sidebarOpen}
            />
          </div>

          <div className="p-3.5 border-t border-white/10 relative z-10 bg-[#050b33]">
            <SidebarItem
              icon={<LogOut className="w-5 h-5" />}
              label="Sair"
              href="/"
              collapsed={!sidebarOpen}
            />
          </div>
        </aside>

        {/* ÁREA DE CONTEÚDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-10 py-7 max-w-7xl mx-auto w-full">
          {/* TOAST FLUTUANTE */}
          {toastMessage && (
            <div
              className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all animate-in fade-in slide-in-from-top-4 duration-200 text-sm font-semibold ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : toastMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                  : 'bg-indigo-50 text-indigo-900 border-indigo-200'
              }`}
            >
              {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {toastMessage.type === 'error' && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              {toastMessage.type === 'info' && <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0" />}
              <span>{toastMessage.text}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="ml-2 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. TÍTULO E SUBTÍTULO */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7000ff]/10 text-[#7000ff] shrink-0 border border-[#7000ff]/20">
                <Calendar className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7000ff] mb-1">
                  PAINEL ADMINISTRATIVO
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#050b33] tracking-tight">
                  Solicitações de Agendamento
                </h1>
                <p className="text-sm text-[#56617d] mt-1 font-medium">
                  Gerencie e decida sobre as solicitações de uso do Laboratório Maker.
                </p>
              </div>
            </div>

            {/* Aviso de solicitações que exigem análise */}
            {pendingCount > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 border border-amber-200/80 text-amber-800 text-xs font-semibold shadow-2xs self-start sm:self-auto">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                <span>
                  <strong>{pendingCount}</strong> {pendingCount === 1 ? 'solicitação aguarda' : 'solicitações aguardam'} sua decisão
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-2xs self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Todas as solicitações foram analisadas!</span>
              </div>
            )}
          </div>

          {/* 2. RESUMO DAS SOLICITAÇÕES (CARDS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            <SummaryCard
              icon={
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#050b33] text-white shadow-sm shadow-[#050b33]/20">
                  <Calendar className="w-6 h-6 stroke-[2.2]" />
                </div>
              }
              title="Total de solicitações"
              value={totalCount}
              onClick={() => {
                setStatusFilter('Todos');
                setTypeFilter('Todos');
                setCourseFilter('Todos');
                setDateFilter('');
                setSearchTerm('');
              }}
              isSelected={statusFilter === 'Todos' && typeFilter === 'Todos' && courseFilter === 'Todos' && !searchTerm && !dateFilter}
            />

            <SummaryCard
              icon={
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10b981] text-white shadow-sm shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                </div>
              }
              title="Aprovadas"
              value={approvedCount}
              onClick={() => setStatusFilter(statusFilter === 'Aprovado' ? 'Todos' : 'Aprovado')}
              isSelected={statusFilter === 'Aprovado'}
            />

            <SummaryCard
              icon={
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff2a55] text-white shadow-sm shadow-rose-500/20">
                  <XCircle className="w-6 h-6 stroke-[2.2]" />
                </div>
              }
              title="Recusadas"
              value={rejectedCount}
              onClick={() => setStatusFilter(statusFilter === 'Recusado' ? 'Todos' : 'Recusado')}
              isSelected={statusFilter === 'Recusado'}
            />

            <SummaryCard
              icon={
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f59e0b] text-white shadow-sm shadow-amber-500/20">
                  <Clock className="w-6 h-6 stroke-[2.2]" />
                </div>
              }
              title="Aguardando análise"
              value={pendingCount}
              onClick={() => setStatusFilter(statusFilter === 'Aguardando análise' ? 'Todos' : 'Aguardando análise')}
              isSelected={statusFilter === 'Aguardando análise'}
              badgeNotification={pendingCount > 0}
            />
          </div>

          {/* 3. BUSCA E FILTROS */}
          <div className="bg-white rounded-2xl border border-[#dfe4ee] p-3 sm:p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center gap-3">
            {/* Campo de Busca */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por nome, data, descrição, finalidade..."
                className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-10 pr-9 py-2.5 text-sm text-[#050b33] placeholder-slate-400 transition-colors focus:bg-white focus:border-[#7000ff] focus:outline-none focus:ring-2 focus:ring-[#7000ff]/20"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold p-1"
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtro de Status */}
            <div className="w-full sm:w-auto min-w-[170px] relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-[#7000ff] focus:outline-none focus:ring-2 focus:ring-[#7000ff]/20 cursor-pointer"
              >
                <option value="Todos">Status: Todos</option>
                <option value="Aguardando análise">Aguardando análise</option>
                <option value="Aprovado">Aprovado / Aceito</option>
                <option value="Recusado">Recusado</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* Filtro de Tipo de Solicitante */}
            <div className="w-full sm:w-auto min-w-[150px] relative">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  if (e.target.value === 'Servidor') setCourseFilter('Todos');
                  setCurrentPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-[#7000ff] focus:outline-none focus:ring-2 focus:ring-[#7000ff]/20 cursor-pointer"
              >
                <option value="Todos">Perfil: Todos</option>
                <option value="Aluno">Aluno</option>
                <option value="Servidor">Servidor</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* Filtro de Curso */}
            <div className="w-full sm:w-auto min-w-[210px] relative">
              <select
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={typeFilter === 'Servidor'}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-[#7000ff] focus:outline-none focus:ring-2 focus:ring-[#7000ff]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="Todos">Curso: Todos</option>
                <option value="Administração">Administração</option>
                <option value="Geografia">Geografia</option>
                <option value="Biologia">Biologia</option>
                <option value="Engenharia de Computação">Engenharia de Computação</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* Botão de resetar filtros */}
            {(searchTerm || statusFilter !== 'Todos' || typeFilter !== 'Todos' || courseFilter !== 'Todos' || dateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('Todos');
                  setTypeFilter('Todos');
                  setCourseFilter('Todos');
                  setDateFilter('');
                  setCurrentPage(1);
                }}
                title="Limpar todos os filtros"
                className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>

          {/* BARRA DE AÇÕES EM LOTE DO ADMINISTRADOR (QUANDO ITENS SÃO SELECIONADOS) */}
          {selectedIds.length > 0 && (
            <div className="mb-4 bg-[#050b33] text-white p-3.5 rounded-2xl shadow-md border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00ff9d] text-[#050b33] font-bold text-xs">
                  {selectedIds.length}
                </span>
                <span className="text-xs font-semibold text-white/90">
                  {selectedIds.length === 1 ? '1 solicitação selecionada' : `${selectedIds.length} solicitações selecionadas`}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleBatchAccept}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#10b981] px-4 py-2 text-xs font-bold text-white hover:bg-[#059669] transition-all shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Aceitar selecionadas</span>
                </button>

                <button
                  type="button"
                  onClick={handleBatchReject}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#ef4444] px-4 py-2 text-xs font-bold text-white hover:bg-[#dc2626] transition-all shadow-xs"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Recusar selecionadas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Desmarcar
                </button>
              </div>
            </div>
          )}

          {/* 4. LISTA DE SOLICITAÇÕES (TABELA COMPLETA DESKTOP) */}
          <div className="bg-white rounded-2xl border border-[#dfe4ee] shadow-sm overflow-hidden mb-6">
            {/* TABELA DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#fafbfe] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAllCurrentPage}
                        title={allCurrentPageSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                        className="text-slate-400 hover:text-[#7000ff] transition-colors"
                      >
                        {allCurrentPageSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#7000ff]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-4">ID</th>
                    <th className="py-4 px-5">Solicitante</th>
                    <th className="py-4 px-5">Data & Horário</th>
                    <th className="py-4 px-5">Finalidade & Descrição</th>
                    <th className="py-4 px-5">O que será usado</th>
                    <th className="py-4 px-5 text-center">Status</th>
                    <th className="py-4 px-5 text-center w-56">Ações do Administrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRequests.length > 0 ? (
                    paginatedRequests.map((req) => {
                      const isPending = req.status === 'Aguardando análise';
                      const isSelected = selectedIds.includes(req.id);
                      return (
                        <tr
                          key={req.id}
                          className={`transition-colors group ${
                            isSelected
                              ? 'bg-purple-50/40 border-l-4 border-l-[#7000ff]'
                              : isPending
                              ? 'bg-amber-50/20 hover:bg-amber-50/40 border-l-4 border-l-amber-400'
                              : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                          }`}
                        >
                          {/* Checkbox de seleção */}
                          <td className="py-4 px-3 align-top text-center">
                            <button
                              type="button"
                              onClick={(e) => toggleSelectRow(req.id, e)}
                              className="text-slate-400 hover:text-[#7000ff] transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#7000ff]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* ID */}
                          <td className="py-4 px-4 align-top">
                            <span className="font-mono text-xs font-extrabold text-[#050b33] block">
                              {req.code}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {req.createdAt.split(' ')[0]}
                            </span>
                          </td>

                          {/* SOLICITANTE */}
                          <td className="py-4 px-5 align-top max-w-[210px]">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                                  req.requesterType === 'Servidor'
                                    ? 'bg-[#7000ff] text-white'
                                    : 'bg-[#050b33] text-white'
                                }`}
                              >
                                {getInitials(req.requesterName)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-[#050b33] leading-snug truncate">
                                  {req.requesterName}
                                </p>
                                <p className="text-xs text-[#56617d] font-medium leading-tight mt-0.5">
                                  {req.requesterType === 'Servidor' ? (
                                    <span className="inline-flex items-center gap-1 font-semibold text-[#7000ff]">
                                      <Briefcase className="w-3 h-3" /> Servidor
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1">
                                      <GraduationCap className="w-3 h-3 text-slate-400" />
                                      Aluno • <span className="font-semibold text-slate-700">{req.course}</span>
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* DATA E HORÁRIO */}
                          <td className="py-4 px-5 align-top whitespace-nowrap">
                            <p className="text-xs font-bold text-[#050b33]">
                              {req.date}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              ({req.dayOfWeek})
                            </p>
                            <p className="text-xs font-mono font-semibold text-slate-700 mt-1 inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {req.startTime} - {req.endTime}
                            </p>
                          </td>

                          {/* DESCRIÇÃO E FINALIDADE */}
                          <td className="py-4 px-5 align-top max-w-xs">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#eef1ff] text-[#4f46e5] mb-1">
                              {req.purpose}
                            </span>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {req.description}
                            </p>
                            {req.rejectionReason && (
                              <p className="mt-1 text-[11px] text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-100 font-medium">
                                <strong>Motivo da recusa:</strong> {req.rejectionReason}
                              </p>
                            )}
                            {req.adminNotes && (
                              <p className="mt-1 text-[11px] text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-100 font-medium">
                                <strong>Nota ADM:</strong> {req.adminNotes}
                              </p>
                            )}
                          </td>

                          {/* O QUE SERÁ UTILIZADO */}
                          <td className="py-4 px-5 align-top max-w-[190px]">
                            <ul className="space-y-1">
                              {req.equipment.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-slate-700 flex items-center gap-1.5"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#7000ff]" />
                                  <span className="truncate">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </td>

                          {/* STATUS */}
                          <td className="py-4 px-5 align-top text-center whitespace-nowrap">
                            <StatusBadge status={req.status} />
                            {req.decidedAt && (
                              <span className="block text-[10px] text-slate-400 mt-1">
                                {req.decidedAt.split(' ')[0]}
                              </span>
                            )}
                          </td>

                          {/* AÇÕES DO ADMINISTRADOR */}
                          <td className="py-4 px-5 align-top">
                            <div className="flex flex-col gap-1.5 w-full">
                              {isPending ? (
                                <>
                                  {/* BOTÃO ACEITAR AGENDAMENTO */}
                                  <button
                                    type="button"
                                    onClick={(e) => openAcceptModal(req, e)}
                                    title="Aceitar agendamento do solicitante"
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#10b981] px-3 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-[#059669] transition-all hover:-translate-y-0.5 active:translate-y-0"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Aceitar Agendamento</span>
                                  </button>

                                  {/* BOTÃO RECUSAR AGENDAMENTO */}
                                  <button
                                    type="button"
                                    onClick={(e) => openRejectModal(req, e)}
                                    title="Recusar agendamento do solicitante"
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ef4444] px-3 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-[#dc2626] transition-all hover:-translate-y-0.5 active:translate-y-0"
                                  >
                                    <X className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Recusar Agendamento</span>
                                  </button>

                                  {/* BOTÃO VER DETALHES */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRequest(req)}
                                    title="Ver todos os detalhes da solicitação"
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:text-[#7000ff] hover:bg-[#7000ff]/5 hover:border-[#7000ff]/30 transition-all"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Ver detalhes</span>
                                  </button>
                                </>
                              ) : req.status === 'Aprovado' ? (
                                <>
                                  <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold w-full">
                                    <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
                                    <span>Agendamento Aceito</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => openRejectModal(req, e)}
                                      title="Alterar decisão e recusar agendamento"
                                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                                    >
                                      <X className="w-3 h-3" /> Recusar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedRequest(req)}
                                      title="Ver detalhes"
                                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                      <Eye className="w-3 h-3" /> Detalhes
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-bold w-full">
                                    <X className="w-3.5 h-3.5 stroke-[3] text-rose-600" />
                                    <span>Agendamento Recusado</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => openAcceptModal(req, e)}
                                      title="Reavaliar e aceitar agendamento"
                                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                                    >
                                      <Check className="w-3 h-3" /> Aceitar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedRequest(req)}
                                      title="Ver detalhes"
                                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                      <Eye className="w-3 h-3" /> Detalhes
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-sm text-slate-500">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        Nenhuma solicitação encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* VISUALIZAÇÃO RESPONSIVA MOBILE (CARDS) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {paginatedRequests.length > 0 ? (
                paginatedRequests.map((req) => {
                  const isPending = req.status === 'Aguardando análise';
                  return (
                    <div
                      key={req.id}
                      className={`p-4 transition-colors ${
                        isPending ? 'bg-amber-50/30 border-l-4 border-l-amber-400' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-[#050b33]">
                            {req.code}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            • {req.date} ({req.startTime} - {req.endTime})
                          </span>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            req.requesterType === 'Servidor'
                              ? 'bg-[#7000ff] text-white'
                              : 'bg-[#050b33] text-white'
                          }`}
                        >
                          {getInitials(req.requesterName)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#050b33]">{req.requesterName}</p>
                          <p className="text-xs text-slate-500">
                            {req.requesterType === 'Servidor'
                              ? 'Servidor da Instituição'
                              : `Aluno • ${req.course}`}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#eef1ff] text-[#4f46e5] mb-1">
                          {req.purpose}
                        </span>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {req.description}
                        </p>
                        {req.rejectionReason && (
                          <p className="mt-1 text-[11px] text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-100 font-medium">
                            <strong>Recusa:</strong> {req.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Ações do Administrador no Mobile */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                        {isPending ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={(e) => openAcceptModal(req, e)}
                              className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#10b981] px-3 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#059669]"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aceitar</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => openRejectModal(req, e)}
                              className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#ef4444] px-3 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#dc2626]"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Recusar</span>
                            </button>
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="w-full inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver detalhes completos</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  Nenhuma solicitação encontrada.
                </div>
              )}
            </div>

            {/* 5. RODAPÉ DE PAGINAÇÃO */}
            <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
              <p>
                Mostrando{' '}
                <strong className="text-[#050b33] font-bold">
                  {paginatedRequests.length}
                </strong>{' '}
                de{' '}
                <strong className="text-[#050b33] font-bold">
                  {filteredRequests.length}
                </strong>{' '}
                {filteredRequests.length === 1 ? 'solicitação' : 'solicitações'}
              </p>

              {/* Botões de Paginação */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  title="Página anterior"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#050b33] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs transition-colors ${
                      currentPage === page
                        ? 'bg-[#050b33] text-white shadow-xs'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  title="Próxima página"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#050b33] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 6. MODAL ADMINISTRATIVO: ACEITAR AGENDAMENTO */}
      {acceptingRequest && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b33]/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setAcceptingRequest(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#dfe4ee] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-emerald-50/60 border-b border-emerald-100 p-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981] text-white shadow-sm">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#050b33]">
                    Aceitar Agendamento
                  </h3>
                  <p className="text-xs text-slate-500">
                    Solicitação <strong className="font-mono text-[#050b33]">{acceptingRequest.code}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAcceptingRequest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <p className="font-bold text-[#050b33] text-sm">{acceptingRequest.requesterName}</p>
                <p className="text-slate-500">
                  {acceptingRequest.requesterType === 'Servidor'
                    ? 'Servidor da Instituição'
                    : `Aluno • ${acceptingRequest.course}`}
                </p>
                <p className="text-slate-700 font-medium">
                  <strong>Data:</strong> {acceptingRequest.date} ({acceptingRequest.startTime} às {acceptingRequest.endTime})
                </p>
                <p className="text-slate-700 font-medium">
                  <strong>Finalidade:</strong> {acceptingRequest.purpose}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Bancada / Posto de Trabalho Alocado
                </label>
                <input
                  type="text"
                  value={allocatedWorkstation}
                  onChange={(e) => setAllocatedWorkstation(e.target.value)}
                  placeholder="Ex: Bancada 03 - Prototipagem"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-[#050b33] focus:border-[#10b981] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Observações ou Recomendações do ADM (opcional)
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Ex: Liberado uso da Impressora 3D. Favor trazer arquivo fatiado em formato .gcode e filamento PLA homologado."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-[#050b33] focus:border-[#10b981] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 resize-none"
                />
              </div>
            </div>

            <div className="bg-[#fafbfe] border-t border-slate-100 p-4 sm:p-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAcceptingRequest(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmAccept}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#10b981] text-xs font-extrabold text-white shadow-sm shadow-emerald-500/20 hover:bg-[#059669] transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirmar e Aceitar Agendamento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL ADMINISTRATIVO: RECUSAR AGENDAMENTO */}
      {rejectingRequest && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b33]/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setRejectingRequest(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#dfe4ee] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-rose-50/60 border-b border-rose-100 p-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ef4444] text-white shadow-sm">
                  <X className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#050b33]">
                    Recusar Agendamento
                  </h3>
                  <p className="text-xs text-slate-500">
                    Solicitação <strong className="font-mono text-[#050b33]">{rejectingRequest.code}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <p className="font-bold text-[#050b33] text-sm">{rejectingRequest.requesterName}</p>
                <p className="text-slate-500">
                  {rejectingRequest.requesterType === 'Servidor'
                    ? 'Servidor da Instituição'
                    : `Aluno • ${rejectingRequest.course}`}
                </p>
                <p className="text-slate-700 font-medium">
                  <strong>Data solicitada:</strong> {rejectingRequest.date} ({rejectingRequest.startTime} às {rejectingRequest.endTime})
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Motivos frequentes (clique para preencher rápido):
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[
                    'Capacidade máxima do laboratório atingida neste horário.',
                    'Máquina/equipamento em manutenção técnica preventiva.',
                    'Horário coincide com aula prática agendada.',
                    'Necessário apresentar projeto detalhado previamente.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReasonText(preset)}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md text-left transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Justificativa da Recusa para o Solicitante
                </label>
                <textarea
                  rows={3}
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  placeholder="Descreva o motivo pelo qual o agendamento não pôde ser aceito..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-[#050b33] focus:border-[#ef4444] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/20 resize-none"
                />
              </div>
            </div>

            <div className="bg-[#fafbfe] border-t border-slate-100 p-4 sm:p-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmReject}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#ef4444] text-xs font-extrabold text-white shadow-sm shadow-rose-500/20 hover:bg-[#dc2626] transition-all"
              >
                <X className="w-4 h-4 stroke-[3]" />
                <span>Confirmar Recusa do Agendamento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL DE VISUALIZAÇÃO DETALHADA */}
      {selectedRequest && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b33]/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#dfe4ee] shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="bg-[#fafbfe] border-b border-slate-100 p-5 sm:p-6 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-extrabold text-[#7000ff]">
                    {selectedRequest.code}
                  </span>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#050b33] tracking-tight">
                  Detalhes da Solicitação
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enviada em {selectedRequest.createdAt}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-[#050b33] hover:bg-slate-100 transition-colors"
                title="Fechar detalhes"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Modal com Seções */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Seção 1: Dados do solicitante */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7000ff] mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Dados do Solicitante
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#f8fafc] p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">Nome Completo</span>
                    <p className="text-sm font-bold text-[#050b33]">{selectedRequest.requesterName}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">Perfil / Tipo</span>
                    <p className="text-sm font-semibold text-[#050b33] flex items-center gap-1.5">
                      {selectedRequest.requesterType === 'Servidor' ? (
                        <span className="inline-flex items-center gap-1 text-[#7000ff]">
                          <Briefcase className="w-3.5 h-3.5" /> Servidor da Instituição
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <GraduationCap className="w-3.5 h-3.5" /> Aluno
                        </span>
                      )}
                    </p>
                  </div>

                  {selectedRequest.requesterType === 'Aluno' && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block">Curso</span>
                      <p className="text-sm font-bold text-[#050b33]">{selectedRequest.course}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {selectedRequest.requesterType === 'Aluno' ? 'Matrícula SGA' : 'Registro Funcional'}
                    </span>
                    <p className="text-sm font-mono font-medium text-slate-700">
                      {selectedRequest.registrationNumber}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[11px] font-semibold text-slate-400 block">E-mail Institucional</span>
                    <p className="text-sm font-mono text-slate-700">{selectedRequest.email}</p>
                  </div>
                </div>
              </div>

              {/* Seção 2: Dados do agendamento */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7000ff] mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Dados do Agendamento
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f8fafc] p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">Data Desejada</span>
                    <p className="text-sm font-bold text-[#050b33]">{selectedRequest.date}</p>
                    <span className="text-[11px] text-slate-500">({selectedRequest.dayOfWeek})</span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">Horário de Início</span>
                    <p className="text-sm font-mono font-bold text-[#050b33]">{selectedRequest.startTime}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">Horário de Término</span>
                    <p className="text-sm font-mono font-bold text-[#050b33]">{selectedRequest.endTime}</p>
                  </div>

                  {selectedRequest.workstation && (
                    <div className="sm:col-span-3 pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-400 block">Bancada / Posto Solicitado</span>
                      <p className="text-xs font-semibold text-slate-700">{selectedRequest.workstation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 3: Finalidade e Motivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#7000ff] mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Finalidade
                  </h3>
                  <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 h-full">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-[#eef1ff] text-[#4f46e5]">
                      {selectedRequest.purpose}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#7000ff] mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Motivo da Solicitação
                  </h3>
                  <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 h-full">
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {selectedRequest.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Seção 4: Equipamentos e materiais */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7000ff] mb-3 flex items-center gap-1.5">
                  <WrenchIcon className="w-3.5 h-3.5" /> Equipamentos e Materiais
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.equipment.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-[#050b33] shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Seção 5: Descrição da atividade */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7000ff] mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Descrição da Atividade / Projeto
                </h3>
                <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-100">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {selectedRequest.description}
                  </p>
                </div>
              </div>

              {/* Seção 6: Informações da Decisão do ADM */}
              {(selectedRequest.decidedAt || selectedRequest.rejectionReason || selectedRequest.adminNotes) && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#050b33] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7000ff]" /> Registro da Decisão Administrativa
                  </h3>
                  {selectedRequest.decidedAt && (
                    <p className="text-xs text-slate-600">
                      Decidido em <strong>{selectedRequest.decidedAt}</strong> por <strong>{selectedRequest.decidedBy}</strong>.
                    </p>
                  )}
                  {selectedRequest.rejectionReason && (
                    <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                      <strong>Motivo da recusa informado:</strong> {selectedRequest.rejectionReason}
                    </div>
                  )}
                  {selectedRequest.adminNotes && (
                    <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <strong>Orientações registradas pelo ADM:</strong> {selectedRequest.adminNotes}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rodapé com Ações do Administrador */}
            <div className="bg-[#fafbfe] border-t border-slate-100 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-auto">
                {selectedRequest.status !== 'Aguardando análise' && (
                  <button
                    type="button"
                    onClick={() => handleReopen(selectedRequest.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#7000ff] transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reabrir para análise
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Fechar
                </button>

                {selectedRequest.status === 'Aguardando análise' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openRejectModal(selectedRequest)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#ef4444] text-xs font-extrabold text-white hover:bg-[#dc2626] shadow-sm transition-all"
                    >
                      <X className="w-4 h-4 stroke-[3]" /> Recusar Agendamento
                    </button>
                    <button
                      type="button"
                      onClick={() => openAcceptModal(selectedRequest)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#10b981] text-xs font-extrabold text-white hover:bg-[#059669] shadow-sm shadow-emerald-500/20 transition-all"
                    >
                      <Check className="w-4 h-4 stroke-[3]" /> Aceitar Agendamento
                    </button>
                  </>
                ) : selectedRequest.status === 'Aprovado' ? (
                  <button
                    type="button"
                    onClick={() => openRejectModal(selectedRequest)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-300 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    <X className="w-4 h-4" /> Alterar para Recusado
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAcceptModal(selectedRequest)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Reavaliar e Aceitar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// COMPONENTE: ITEM DA SIDEBAR
function SidebarItem({
  icon,
  label,
  href,
  active = false,
  collapsed = false,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-[#101b4c] text-[#f59e0b] shadow-inner'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <span className={active ? 'text-[#f59e0b]' : 'text-white/70'}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

// COMPONENTE: CARD DE RESUMO
function SummaryCard({
  icon,
  title,
  value,
  onClick,
  isSelected = false,
  badgeNotification = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  onClick?: () => void;
  isSelected?: boolean;
  badgeNotification?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4 relative overflow-hidden ${
        isSelected
          ? 'border-[#7000ff] ring-2 ring-[#7000ff]/20 shadow-md'
          : 'border-[#dfe4ee] hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {badgeNotification && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
      )}
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <p className="text-xs font-semibold text-[#56617d] leading-none mb-1.5">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-[#050b33] tracking-tight">
            {value}
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
    </div>
  );
}

// COMPONENTE: BADGE DE STATUS
function StatusBadge({ status }: { status: RequestStatus }) {
  if (status === 'Aguardando análise') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
        <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
        Ag. análise
      </span>
    );
  }

  if (status === 'Aprovado') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
        <span className="w-2 h-2 rounded-full bg-[#10b981]" />
        Aceito
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]">
      <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
      Recusado
    </span>
  );
}

// FUNÇÃO AUXILIAR: PEGAR INICIAIS DO NOME
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
