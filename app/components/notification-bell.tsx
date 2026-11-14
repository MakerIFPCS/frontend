'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, X } from 'lucide-react';
import {
  getLoanRequests,
  getMyLoanRequests,
  getMyProductionOrders,
  getProductionOrders,
  getSchedulingRequests,
} from '@/app/lib/api';
import type {
  LoanRequestAPI,
  ProductionOrderAPI,
  SchedulingRequestAPI,
} from '@/app/types/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  read: boolean;
}

interface NotificationSnapshotEntry {
  status: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
}

interface NotificationStore {
  snapshot: Record<string, NotificationSnapshotEntry>;
  notifications: NotificationItem[];
}

function getStoredToken() {
  return localStorage.getItem('authToken') ?? '';
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'aguardando análise',
    WAITING_FOR_UPDATE: 'aguardando suas informações',
    APPROVED: 'aprovado',
    IN_PRODUCTION: 'em produção',
    READY_FOR_PICKUP: 'pronto para retirada',
    REJECTED: 'recusado',
  };
  return labels[status] ?? status;
}

function getUserStatusMessage(kind: 'order' | 'loan', status: string) {
  if (status === 'APPROVED') {
    return kind === 'order'
      ? 'Seu pedido foi aceito por um administrador.'
      : 'Seu empréstimo foi aprovado por um administrador.';
  }
  const subject = kind === 'order' ? 'pedido' : 'empréstimo';
  return `O status do seu ${subject} mudou para ${getStatusLabel(status)}.`;
}

function createSnapshot(
  role: string,
  orders: ProductionOrderAPI[],
  loans: LoanRequestAPI[],
  schedulingRequests: SchedulingRequestAPI[],
) {
  const snapshot: Record<string, NotificationSnapshotEntry> = {};

  if (role === 'ADMIN') {
    for (const order of orders) {
      snapshot[`order:${order.id}`] = {
        status: order.status,
        title: `Novo pedido #${order.id}`,
        message: `Pedido de fabricação enviado por ${order.requesterName}.`,
        href: '/Pedidos-ADM',
        createdAt: order.createdAt,
      };
    }
    for (const loan of loans) {
      snapshot[`loan:${loan.id}`] = {
        status: loan.status,
        title: `Novo empréstimo #${loan.id}`,
        message: `Solicitação enviada por ${loan.requesterName}.`,
        href: '/Emprestimos-ADM',
        createdAt: loan.createdAt,
      };
    }
    for (const request of schedulingRequests) {
      snapshot[`scheduling:${request.id}`] = {
        status: request.status,
        title: `Novo agendamento ${request.code}`,
        message: `Solicitação enviada por ${request.requesterName}.`,
        href: '/Agendamento-ADM',
        createdAt: request.createdAt,
      };
    }
    return snapshot;
  }

  for (const order of orders) {
    snapshot[`order:${order.id}`] = {
      status: order.status,
      title: `Pedido #${order.id}`,
      message: getUserStatusMessage('order', order.status),
      href: '/pedidos',
      createdAt: order.updatedAt || order.createdAt,
    };
  }
  for (const loan of loans) {
    snapshot[`loan:${loan.id}`] = {
      status: loan.status,
      title: `Empréstimo #${loan.id}`,
      message: getUserStatusMessage('loan', loan.status),
      href: '/emprestimos',
      createdAt: loan.updatedAt || loan.createdAt,
    };
  }
  return snapshot;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSnapshotEntry(value: unknown): value is NotificationSnapshotEntry {
  return isRecord(value)
    && typeof value.status === 'string'
    && typeof value.title === 'string'
    && typeof value.message === 'string'
    && typeof value.href === 'string'
    && typeof value.createdAt === 'string';
}

function isSnapshotRecord(value: unknown): value is Record<string, NotificationSnapshotEntry> {
  return isRecord(value) && Object.values(value).every(isSnapshotEntry);
}

function isNotificationItem(value: unknown): value is NotificationItem {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.message === 'string'
    && typeof value.href === 'string'
    && typeof value.createdAt === 'string'
    && typeof value.read === 'boolean';
}

function isCreatedRequestDetail(value: unknown): value is { kind: 'order' | 'loan'; id: number } {
  return isRecord(value)
    && (value.kind === 'order' || value.kind === 'loan')
    && typeof value.id === 'number';
}

function isPendingAdminRequest(key: string, status: string) {
  const normalizedStatus = status.toLocaleLowerCase('pt-BR');
  if (key.startsWith('scheduling:')) {
    return normalizedStatus === 'pending'
      || normalizedStatus === 'aguardando análise'
      || normalizedStatus === 'aguardando analise';
  }
  return status === 'PENDING';
}

function loadStore(key: string): NotificationStore | null {
  const serialized = localStorage.getItem(key);
  if (!serialized) return null;

  const parsed: unknown = JSON.parse(serialized);
  if (
    !isRecord(parsed)
    || !isSnapshotRecord(parsed.snapshot)
    || !Array.isArray(parsed.notifications)
    || !parsed.notifications.every(isNotificationItem)
  ) {
    throw new Error('O histórico de notificações salvo está inválido.');
  }
  return { snapshot: parsed.snapshot, notifications: parsed.notifications };
}

function saveStore(key: string, store: NotificationStore) {
  localStorage.setItem(key, JSON.stringify(store));
}

function getNewNotifications(
  previous: NotificationStore | null,
  current: Record<string, NotificationSnapshotEntry>,
  isAdmin: boolean,
  locallyCreatedIds: Set<string>,
) {
  const next: NotificationItem[] = [];

  for (const [key, entry] of Object.entries(current)) {
    const oldEntry = previous?.snapshot[key];
    const isPendingOnFirstAdminLoad = isAdmin
      && !previous
      && isPendingAdminRequest(key, entry.status);
    if (!oldEntry && (previous || locallyCreatedIds.has(key) || isPendingOnFirstAdminLoad)) {
      const [kind, id] = key.split(':');
      next.push({
        id: `${key}:created`,
        title: isAdmin
          ? entry.title
          : kind === 'order' ? `Pedido #${id} realizado` : `Empréstimo #${id} solicitado`,
        message: isAdmin
          ? entry.message
          : kind === 'order'
            ? 'Seu pedido de fabricação foi enviado e aguarda análise.'
            : 'Sua solicitação de empréstimo foi enviada e aguarda análise.',
        href: entry.href,
        createdAt: entry.createdAt,
        read: false,
      });
    } else if (oldEntry && !isAdmin && oldEntry.status !== entry.status) {
      const [kind, id] = key.split(':');
      next.push({
        id: `${key}:${entry.status}:${entry.createdAt}`,
        title: `Atualização do ${kind === 'order' ? 'pedido' : 'empréstimo'} #${id}`,
        message: entry.message,
        href: entry.href,
        createdAt: entry.createdAt,
        read: false,
      });
    }
  }

  return next;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Agora';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export default function NotificationBell({
  userId,
  userRole,
  authenticated,
}: {
  userId: string;
  userRole: string;
  authenticated: boolean;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const storageKey = `labmaker:notifications:${userRole}:${userId}`;
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!authenticated || !userId || !userRole || !getStoredToken()) {
      return;
    }

    let active = true;
    let isRefreshing = false;
    let refreshPending = false;
    let queuedRefreshId: number | null = null;
    const locallyCreatedIds = new Set<string>();
    const refreshNotifications = async () => {
      if (!active) return;
      if (isRefreshing) {
        refreshPending = true;
        return;
      }
      isRefreshing = true;
      setError('');

      try {
        const previous = loadStore(storageKey);
        const [orders, loans, schedulingRequests] = userRole === 'ADMIN'
          ? await Promise.all([getProductionOrders(), getLoanRequests(), getSchedulingRequests()])
          : await Promise.all([getMyProductionOrders(), getMyLoanRequests(), Promise.resolve([])]);
        if (!active) return;
        const latestStore = loadStore(storageKey) ?? previous;
        const currentSnapshot = createSnapshot(userRole, orders, loans, schedulingRequests);
        const newNotifications = getNewNotifications(
          latestStore,
          currentSnapshot,
          userRole === 'ADMIN',
          locallyCreatedIds,
        );
        const previousNotifications = latestStore?.notifications ?? [];
        const knownIds = new Set(previousNotifications.map((notification) => notification.id));
        const nextStore: NotificationStore = {
          snapshot: currentSnapshot,
          notifications: [...newNotifications.filter((item) => !knownIds.has(item.id)), ...previousNotifications]
            .slice(0, 50),
        };
        saveStore(storageKey, nextStore);
        for (const id of locallyCreatedIds) {
          if (currentSnapshot[id]) locallyCreatedIds.delete(id);
        }
        setNotifications(nextStore.notifications);
      } catch (refreshError: unknown) {
        if (active) {
          setError(refreshError instanceof Error
            ? `Não foi possível atualizar as notificações: ${refreshError.message}`
            : 'Não foi possível atualizar as notificações. Tente novamente.');
        }
      } finally {
        isRefreshing = false;
        if (active) setIsLoading(false);
        if (refreshPending && active) {
          refreshPending = false;
          queuedRefreshId = window.setTimeout(() => { void refreshNotifications(); }, 0);
        }
      }
    };

    const initialRefreshId = window.setTimeout(() => { void refreshNotifications(); }, 0);
    const intervalId = window.setInterval(() => { void refreshNotifications(); }, 30_000);
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void refreshNotifications();
    };
    const refreshOnRequest = (event: Event) => {
      if (event instanceof CustomEvent && isCreatedRequestDetail(event.detail)) {
        locallyCreatedIds.add(`${event.detail.kind}:${event.detail.id}`);
      }
      void refreshNotifications();
    };
    const syncStoredNotifications = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      try {
        setNotifications(loadStore(storageKey)?.notifications ?? []);
      } catch (storageError: unknown) {
        setError(storageError instanceof Error
          ? `Não foi possível ler as notificações salvas: ${storageError.message}`
          : 'Não foi possível ler as notificações salvas.');
      }
    };

    window.addEventListener('focus', refreshOnFocus);
    window.addEventListener('notifications-refresh', refreshOnRequest);
    window.addEventListener('storage', syncStoredNotifications);
    return () => {
      active = false;
      window.clearTimeout(initialRefreshId);
      if (queuedRefreshId !== null) window.clearTimeout(queuedRefreshId);
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshOnFocus);
      window.removeEventListener('notifications-refresh', refreshOnRequest);
      window.removeEventListener('storage', syncStoredNotifications);
    };
  }, [authenticated, storageKey, userId, userRole]);

  function markAllAsRead() {
    const updated = notifications.map((notification) => ({ ...notification, read: true }));
    try {
      const currentStore = loadStore(storageKey);
      if (currentStore) {
        saveStore(storageKey, { ...currentStore, notifications: updated });
        setNotifications(updated);
      }
    } catch (storageError: unknown) {
      setError(storageError instanceof Error
        ? `Não foi possível atualizar as notificações salvas: ${storageError.message}`
        : 'Não foi possível atualizar as notificações salvas.');
    }
  }

  function markAsRead(id: string) {
    const updated = notifications.map((notification) => (
      notification.id === id ? { ...notification, read: true } : notification
    ));
    try {
      const currentStore = loadStore(storageKey);
      if (currentStore) {
        saveStore(storageKey, { ...currentStore, notifications: updated });
        setNotifications(updated);
      }
    } catch (storageError: unknown) {
      setError(storageError instanceof Error
        ? `Não foi possível atualizar as notificações salvas: ${storageError.message}`
        : 'Não foi possível atualizar as notificações salvas.');
    }
  }

  if (!authenticated || !userId || !userRole) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ''}`}
        aria-expanded={isOpen}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-[#00ff9d] hover:bg-white/10"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff2a55] px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          aria-label="Notificações"
          className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#dfe4ee] bg-white text-[#050b33] shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-[#edf0f5] px-4 py-3">
            <h2 className="font-bold">Notificações</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#7000ff] hover:underline"
                >
                  <Check className="h-3.5 w-3.5" /> Marcar lidas
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar notificações"
                className="rounded p-1 text-[#56617d] hover:bg-[#f5f7fb]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-800" role="alert">{error}</p>}
          {isLoading ? (
            <p className="p-5 text-sm text-[#56617d]" role="status">Carregando notificações...</p>
          ) : notifications.length === 0 ? (
            <p className="p-5 text-sm text-[#56617d]">Você não tem notificações novas.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-[#edf0f5] overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={notification.href}
                    onClick={() => {
                      markAsRead(notification.id);
                      setIsOpen(false);
                    }}
                    className={`block px-4 py-3 transition-colors hover:bg-[#f5f7fb] ${
                      notification.read ? 'bg-white' : 'bg-[#f4fff9]'
                    }`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-bold">{notification.title}</span>
                      {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00b875]" />}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-[#56617d]">{notification.message}</span>
                    <span className="mt-2 block text-xs text-[#8790a4]">{formatDate(notification.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
