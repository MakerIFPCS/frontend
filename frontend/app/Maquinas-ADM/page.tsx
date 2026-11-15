'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Wrench,
  Home,
  Calendar,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Search,
  SlidersHorizontal,
  Eye,
  Pencil,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  Power,
  Radio,
  MinusCircle,
  Cpu,
  Bell,
  ShieldCheck,
  ChevronDown,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Upload,
  Check,
  Camera,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import Header from '@/app/components/header';
import { createMachine, deleteMachine, getMachines, updateMachine } from '@/app/lib/api';
import { useAdminAccess } from '@/app/lib/use-admin-access';
import type { MachineAPI, MachinePayload, MachineStatusAPI } from '@/app/types/api';

export type MachineStatus = 'Em operação' | 'Disponível' | 'Inativo';
export type MachineType = 'Impressão 3D' | 'Corte a Laser' | 'CNC';

export interface Machine {
  id: string;
  code: string;
  name: string;
  description: string;
  type: MachineType;
  status: MachineStatus;
  image: string;
  access: 'FREE' | 'RESTRICTED';
}

const INITIAL_MACHINES: Machine[] = [];
const PRESET_IMAGES = Array.from({ length: 7 }, (_, index) => `/maquinas/m${index + 1}.png`);

const machineStatusToApi: Record<MachineStatus, MachineStatusAPI> = {
  'Em operação': 'FUNCTIONAL',
  Disponível: 'AVAILABLE',
  Inativo: 'MAINTENANCE',
};

function toMachine(machine: MachineAPI): Machine {
  const type = machine.type === 'Corte a Laser' || machine.type === 'CNC' ? machine.type : 'Impressão 3D';
  const status: MachineStatus =
    machine.status === 'FUNCTIONAL' ? 'Em operação' :
    machine.status === 'AVAILABLE' ? 'Disponível' : 'Inativo';
  return {
    id: String(machine.id),
    code: machine.code ?? `#M${String(machine.id).padStart(3, '0')}`,
    name: machine.name,
    description: machine.description,
    type,
    status,
    image: machine.image || `/maquinas/m${type === 'CNC' ? '7' : type === 'Corte a Laser' ? '2' : '1'}.png`,
    access: machine.access,
  };
}

export default function MaquinasAdmPage() {
  const authorized = useAdminAccess();
  const [machines, setMachines] = useState<Machine[]>(INITIAL_MACHINES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [viewingMachine, setViewingMachine] = useState<Machine | null>(null);

  // formulário de edição/criação
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    description: string;
    type: MachineType;
    status: MachineStatus;
    image: string;
  }>({
    name: '',
    code: '',
    description: '',
    type: 'Impressão 3D',
    status: 'Disponível',
    image: '/maquinas/m1.png',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((text: string) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  useEffect(() => {
    if (!authorized) return;
    getMachines()
      .then((data) => setMachines(data.map(toMachine)))
      .catch(() => showToast('Não foi possível carregar as máquinas. Verifique a conexão com o servidor.'));
  }, [authorized, showToast]);

  function handleOpenEdit(machine: Machine) {
    setEditingMachine(machine);
    setIsCreatingNew(false);
    setFormData({
      name: machine.name,
      code: machine.code,
      description: machine.description,
      type: machine.type,
      status: machine.status,
      image: machine.image || '/maquinas/m1.png',
    });
  }

  // cadastro de nova máquina
  function handleOpenCreate() {
    setIsCreatingNew(true);
    setEditingMachine(null);
    const nextCode = `#M00${machines.length + 1}`;
    setFormData({
      name: '',
      code: nextCode,
      description: '',
      type: 'Impressão 3D',
      status: 'Disponível',
      image: '/maquinas/m1.png',
    });
  }

  // upload de imagem da máquina
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, image: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleDeleteMachine(machine: Machine) {
    if (!window.confirm(`Deseja desativar a máquina ${machine.name}?`)) return;
    try {
      await deleteMachine(machine.id);
      setMachines((previous) => previous.map((item) =>
        item.id === machine.id ? { ...item, status: 'Inativo' } : item
      ));
      showToast(`Máquina ${machine.name} desativada.`);
    } catch {
      showToast('Não foi possível desativar a máquina. Tente novamente.');
    }
  }

  // botão salvar máquina editada ou criada
  async function handleSaveMachine(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Por favor, informe o nome da máquina.');
      return;
    }

    const payload: MachinePayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        code: formData.code.trim() || `#M00${machines.length + 1}`,
        type: formData.type,
        status: machineStatusToApi[formData.status],
        image: formData.image || '/maquinas/m1.png',
        access: editingMachine?.access ?? 'RESTRICTED',
    };

    try {
      const saved = isCreatingNew
        ? await createMachine(payload)
        : editingMachine
          ? await updateMachine(editingMachine.id, payload)
          : null;
      if (!saved) return;

      const machine = toMachine(saved);
      setMachines((previous) =>
        isCreatingNew
          ? [machine, ...previous]
          : previous.map((item) => item.id === machine.id ? machine : item)
      );
      showToast(`Máquina ${machine.name} ${isCreatingNew ? 'cadastrada' : 'atualizada'} com sucesso!`);
      setEditingMachine(null);
      setIsCreatingNew(false);
    } catch {
      showToast('Não foi possível salvar a máquina. Confira os dados e tente novamente.');
    }
  }

  // Filtragem dinâmica
  const filteredMachines = useMemo(() => {
    return machines.filter((machine) => {
      const matchesSearch =
        machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'Todos' || machine.status === statusFilter;

      const matchesType =
        typeFilter === 'Todos' || machine.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [machines, searchTerm, statusFilter, typeFilter]);

  const totalCount = machines.length;
  const inOperationCount = machines.filter((m) => m.status === 'Em operação').length;
  const availableCount = machines.filter((m) => m.status === 'Disponível').length;
  const inactiveCount = machines.filter((m) => m.status === 'Inativo').length;

  if (!authorized) return <main className="p-10 text-center">Verificando acesso...</main>;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33] flex flex-col font-sans selection:bg-[#7000ff]/20 selection:text-[#050b33]">
      <Header authenticated />

      <div className="hidden">
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
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ff2a55] text-[9px] font-extrabold text-white">
                1
              </span>
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

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden">
          <div className="absolute -bottom-10 -left-10 w-44 h-44 opacity-5 pointer-events-none text-white">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30zm0-25c-2.3 0-4.3 1.5-4.8 3.8l-1.3 5.4c-2.4.7-4.7 1.8-6.7 3.1l-5-2.6c-2.1-1.1-4.7-.6-6.2 1.2l-5.7 7c-1.5 1.8-1.5 4.4-.1 6.3l3.3 4.6c-1.2 2.1-2.1 4.4-2.7 6.9l-5.5 1.1C13.2 47.3 11.5 49.3 11.5 51.6v9c0 2.3 1.7 4.3 3.9 4.8l5.5 1.1c.6 2.5 1.5 4.8 2.7 6.9l-3.3 4.6c-1.4 1.9-1.4 4.5-.1 6.3l-5.7-7c-1.5-1.8-4.1-2.3-6.2-1.2l-5 2.6c-2 1.3-4.3-2.4-6.7-3.1l-1.3-5.4C58.3 11.5 56.3 10 54 10h-4z" />
            </svg>
          </div>

          <div className="p-3.5 space-y-1 relative z-10">
            {mobileMenuOpen && (
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 lg:hidden">
                <span className="font-bold text-sm tracking-wide text-[#00ff9d]">NAVEGAÇÃO ADM</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-white/70 hover:text-white"
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
              active
              collapsed={!sidebarOpen}
            />

            <SidebarItem
              icon={<Calendar className="w-5 h-5" />}
              label="Agendamentos"
              href="/Agendamento-ADM"
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

          <div className="p-3.5 border-t border-white/10 relative z-10">
            <SidebarItem
              icon={<LogOut className="w-5 h-5" />}
              label="Sair"
              href="/admin"
              collapsed={!sidebarOpen}
            />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto px-6 py-12 max-w-6xl mx-auto w-full">
          {toastMessage && (
            <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border bg-emerald-50 text-emerald-900 border-emerald-200 text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="ml-2 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7000ff] mb-1">
                PAINEL ADMINISTRATIVO
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#050b33] tracking-tight">
                Gerenciamento de Máquinas
              </h1>
              <p className="text-sm text-[#56617d] mt-1 font-medium">
                Cadastre, edite e acompanhe o status das máquinas do laboratório.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f59e0b] px-5 py-3 text-sm font-extrabold text-[#050b33] shadow-sm shadow-[#f59e0b]/30 transition-all hover:bg-[#eab308] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Adicionar Máquina</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            <SummaryCard
              icon={
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10b981] text-white shadow-sm shadow-emerald-500/20">
                  <Power className="w-6 h-6 stroke-[2.5]" />
                </div>
              }
              title="Em operação"
              value={inOperationCount}
              onClick={() => setStatusFilter(statusFilter === 'Em operação' ? 'Todos' : 'Em operação')}
              isSelected={statusFilter === 'Em operação'}
            />

            <SummaryCard
              icon={
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-sm shadow-blue-500/20">
                  <Radio className="w-6 h-6 stroke-[2.5]" />
                </div>
              }
              title="Disponíveis"
              value={availableCount}
              onClick={() => setStatusFilter(statusFilter === 'Disponível' ? 'Todos' : 'Disponível')}
              isSelected={statusFilter === 'Disponível'}
            />

            <SummaryCard
              icon={
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#475569] text-white shadow-sm shadow-slate-500/20">
                  <MinusCircle className="w-6 h-6 stroke-[2.5]" />
                </div>
              }
              title="Inativas"
              value={inactiveCount}
              onClick={() => setStatusFilter(statusFilter === 'Inativo' ? 'Todos' : 'Inativo')}
              isSelected={statusFilter === 'Inativo'}
            />

            <SummaryCard
              icon={
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#050b33] text-white shadow-sm shadow-[#050b33]/20">
                  <Cpu className="w-6 h-6 stroke-[2.5]" />
                </div>
              }
              title="Total de máquinas"
              value={totalCount}
              onClick={() => {
                setStatusFilter('Todos');
                setTypeFilter('Todos');
                setSearchTerm('');
              }}
              isSelected={statusFilter === 'Todos' && typeFilter === 'Todos' && !searchTerm}
            />
          </div>

          {/* BARRA DE PESQUISA E FILTROS */}
          <div className="bg-white rounded-2xl border border-[#dfe4ee] p-3 sm:p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou descrição..."
                className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-10 pr-4 py-2.5 text-sm text-[#050b33] placeholder-slate-400 transition-colors focus:bg-white focus:border-[#7000ff] focus:outline-none focus:ring-2 focus:ring-[#7000ff]/20"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="w-full md:w-48 relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-[#7000ff] focus:outline-none focus:ring-2 focus:ring-[#7000ff]/20 cursor-pointer"
              >
                <option value="Todos">Todos os status</option>
                <option value="Em operação">Em operação</option>
                <option value="Disponível">Disponível</option>
                <option value="Inativo">Inativo</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <div className="w-full md:w-44 relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-[#7000ff] focus:outline-none focus:ring-2 focus:ring-[#7000ff]/20 cursor-pointer"
              >
                <option value="Todos">Todos os tipos</option>
                <option value="Impressão 3D">Impressão 3D</option>
                <option value="Corte a Laser">Corte a Laser</option>
                <option value="CNC">CNC</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <button
              type="button"
              title="Filtrar"
              className="w-full md:w-auto inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#7000ff] hover:border-[#7000ff]/50 hover:bg-[#7000ff]/5 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* TABELA DE MÁQUINAS */}
          <div className="bg-white rounded-2xl border border-[#dfe4ee] shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#fafbfe] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Máquina</th>
                    <th className="py-4 px-6">Descrição</th>
                    <th className="py-4 px-6 text-center">Tipo</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMachines.length > 0 ? (
                    filteredMachines.map((machine) => (
                      <tr
                        key={machine.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="relative w-14 h-11 rounded-lg overflow-hidden border border-slate-200/80 bg-slate-100 shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors">
                              <Image
                                src={machine.image}
                                alt={machine.name}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#050b33] leading-snug">
                                {machine.name}
                              </p>
                              <span className="inline-block text-[11px] font-mono font-medium text-slate-400">
                                {machine.code}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 max-w-xs md:max-w-sm">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {machine.description}
                          </p>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#eef1ff] text-[#4f46e5] border border-[#e0e7ff]">
                            {machine.type}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <StatusBadge status={machine.status} />
                        </td>

                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            {/* botao: detalhes (olhinho) */}
                            <button
                              type="button"
                              onClick={() => setViewingMachine(machine)}
                              title="Visualizar detalhes da máquina"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#7000ff] hover:bg-[#7000ff]/5 hover:border-[#7000ff]/40 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* botao: editar maquina */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(machine)}
                              title="Editar máquina (foto, nome, descrição, status)"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-colors cursor-pointer active:scale-95"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* botao: mais opções */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(machine)}
                              title="Mais opções de edição"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#050b33] hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMachine(machine)}
                              disabled={machine.status === 'Inativo'}
                              title="Desativar máquina"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-slate-500">
                        Nenhuma máquina encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
              <p>
                Mostrando{' '}
                <strong className="text-[#050b33] font-bold">
                  {filteredMachines.length}
                </strong>{' '}
                {filteredMachines.length === 1 ? 'máquina' : 'máquinas'}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  title="Página anterior"
                  disabled
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="w-8 h-8 rounded-lg bg-[#050b33] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  1
                </span>

                <button
                  type="button"
                  title="Próxima página"
                  disabled
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* edicao e cadastro de maquinas */}
      {(editingMachine || isCreatingNew) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b33]/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={() => {
            setEditingMachine(null);
            setIsCreatingNew(false);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-[#dfe4ee] shadow-2xl max-w-xl w-full overflow-hidden my-8 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#fafbfe] border-b border-slate-100 p-5 sm:p-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-[#f59e0b] border border-amber-200">
                  <Pencil className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs font-extrabold text-[#7000ff]">
                      {formData.code || '#M000'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      • {isCreatingNew ? 'Nova Máquina' : 'Edição'}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#050b33] tracking-tight">
                    {isCreatingNew ? 'Cadastrar Nova Máquina' : `Editar ${editingMachine?.name}`}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingMachine(null);
                  setIsCreatingNew(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-[#050b33] hover:bg-slate-100 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMachine}>
              <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
                {/* foto da maquina*/}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    Foto da Máquina
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#f8fafc] p-4 rounded-2xl border border-slate-200/80">
                    <div className="relative w-28 h-24 rounded-xl overflow-hidden border-2 border-slate-300 bg-white shadow-2xs shrink-0 flex items-center justify-center">
                      {formData.image ? (
                        <Image
                          src={formData.image}
                          alt="Foto da Máquina"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#050b33] text-xs font-bold text-white hover:bg-[#101d5e] transition-colors shadow-2xs cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Carregar Foto do Computador</span>
                        </button>

                        {formData.image && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, image: '/maquinas/m1.png' }))}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                            title="Restaurar imagem padrão"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Padrão</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                          Ou escolha uma imagem do laboratório:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {PRESET_IMAGES.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, image: img }))}
                              title={`Foto predefinida M${idx + 1}`}
                              className={`relative w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                                formData.image === img
                                  ? 'border-[#7000ff] ring-2 ring-[#7000ff]/30 scale-105'
                                  : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-400'
                              }`}
                            >
                              <Image src={img} alt={`Preset ${idx + 1}`} fill className="object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Nome da Máquina *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Creality Ender 3 Pro"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-[#050b33] placeholder-slate-400 focus:border-[#7000ff] focus:outline-none focus:ring-2 focus:ring-[#7000ff]/20 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Código *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="#M001"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-[#050b33] font-mono font-bold focus:border-[#7000ff] focus:outline-none focus:ring-2 focus:ring-[#7000ff]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Tipo de Máquina
                    </label>
                    <div className="relative">
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, type: e.target.value as MachineType }))
                        }
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-sm font-semibold text-slate-700 focus:border-[#7000ff] focus:outline-none focus:ring-2 focus:ring-[#7000ff]/20 transition-all cursor-pointer"
                      >
                        <option value="Impressão 3D">Impressão 3D</option>
                        <option value="Corte a Laser">Corte a Laser</option>
                        <option value="CNC">CNC</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Status Operacional
                    </label>
                    <div className="relative">
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, status: e.target.value as MachineStatus }))
                        }
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-sm font-semibold text-slate-700 focus:border-[#7000ff] focus:outline-none focus:ring-2 focus:ring-[#7000ff]/20 transition-all cursor-pointer"
                      >
                        <option value="Disponível">Disponível</option>
                        <option value="Em operação">Em operação</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Descrição Detalhada da Máquina
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva a finalidade, especificações, volume de impressão ou materiais suportados..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm text-[#050b33] placeholder-slate-400 focus:border-[#7000ff] focus:outline-none focus:ring-2 focus:ring-[#7000ff]/20 transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="bg-[#fafbfe] border-t border-slate-100 p-4 sm:p-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMachine(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f59e0b] px-6 py-2.5 text-xs font-extrabold text-[#050b33] shadow-sm shadow-[#f59e0b]/30 hover:bg-[#eab308] hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isCreatingNew ? 'Cadastrar Máquina' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingMachine && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b33]/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setViewingMachine(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#dfe4ee] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
              <Image
                src={viewingMachine.image}
                alt={viewingMachine.name}
                fill
                className="object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050b33] via-transparent to-transparent" />
              <button
                type="button"
                onClick={() => setViewingMachine(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-[#00ff9d] bg-[#00ff9d]/20 px-2.5 py-0.5 rounded-md border border-[#00ff9d]/30">
                    {viewingMachine.code}
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-1">
                    {viewingMachine.name}
                  </h3>
                </div>
                <StatusBadge status={viewingMachine.status} />
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Tipo de Equipamento
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#eef1ff] text-[#4f46e5]">
                  {viewingMachine.type}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Descrição
                </span>
                <p className="text-sm text-slate-700 leading-relaxed bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100">
                  {viewingMachine.description}
                </p>
              </div>
            </div>

            <div className="bg-[#fafbfe] border-t border-slate-100 p-4 sm:p-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const m = viewingMachine;
                  setViewingMachine(null);
                  handleOpenEdit(m);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar esta máquina</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingMachine(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

function SummaryCard({
  icon,
  title,
  value,
  onClick,
  isSelected = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  onClick?: () => void;
  isSelected?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4 ${
        isSelected
          ? 'border-[#7000ff] ring-2 ring-[#7000ff]/20'
          : 'border-[#dfe4ee] hover:border-slate-300 hover:shadow-md'
      }`}
    >
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

function StatusBadge({ status }: { status: MachineStatus }) {
  if (status === 'Em operação') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
        <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
        Em operação
      </span>
    );
  }

  if (status === 'Disponível') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
        <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
        Disponível
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]">
      <span className="w-2 h-2 rounded-full bg-[#64748b]" />
      Inativo
    </span>
  );
}
