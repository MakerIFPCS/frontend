'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/app/components/header';
import { getUsers, promoteUserToAdmin } from '@/app/lib/api';
import { useAdminAccess } from '@/app/lib/use-admin-access';
import type { User } from '@/app/types/api';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Ocorreu um erro inesperado.';
}

export default function UserManagementPage() {
  const authorized = useAdminAccess();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!authorized) return;
    let isCurrent = true;
    getUsers()
      .then((loadedUsers) => {
        if (isCurrent) setUsers(loadedUsers);
      })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(`Não foi possível carregar os usuários: ${getErrorMessage(loadError)}`);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [authorized]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (!query) return users;
    return users.filter((user) =>
      user.name.toLocaleLowerCase('pt-BR').includes(query)
      || user.email.toLocaleLowerCase('pt-BR').includes(query)
      || String(user.id).includes(query),
    );
  }, [search, users]);

  async function handlePromote(user: User) {
    if (!window.confirm(`Promover ${user.name} (${user.email}) a administrador?`)) return;
    setUpdatingUserId(user.id);
    setError('');
    setNotice('');
    try {
      const promotedUser = await promoteUserToAdmin(user.id);
      setUsers((current) => current.map((item) => item.id === promotedUser.id ? promotedUser : item));
      setNotice(`${promotedUser.name} agora é administrador. A pessoa deve entrar novamente para atualizar o perfil da sessão.`);
    } catch (promotionError) {
      setError(`Não foi possível promover o usuário: ${getErrorMessage(promotionError)}`);
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (!authorized) return <main className="p-10 text-center">Verificando acesso...</main>;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header authenticated />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7000ff]">Administração</p>
            <h1 className="mt-2 text-3xl font-bold">Controle de usuários</h1>
            <p className="mt-2 text-sm text-[#56617d]">Consulte as contas cadastradas e conceda acesso administrativo.</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, e-mail ou ID"
            aria-label="Buscar usuários"
            className="w-full rounded-lg border border-[#cbd2df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#7000ff] sm:max-w-sm"
          />
        </div>

        {error && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {notice && <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">{notice}</p>}

        <section className="mt-7 overflow-hidden rounded-xl border border-[#dfe4ee] bg-white shadow-sm">
          {isLoading ? (
            <p className="p-8 text-center text-sm text-[#56617d]">Carregando usuários...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#56617d]">
              {users.length === 0 ? 'Nenhum usuário cadastrado.' : 'Nenhum usuário corresponde à busca.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-[#050b33] text-white">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Usuário</th>
                    <th className="px-5 py-4 font-semibold">Tipo</th>
                    <th className="px-5 py-4 font-semibold">Perfil</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7eaf0]">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#f8f9fc]">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{user.name}</p>
                        <p className="mt-1 text-xs text-[#68728a]">{user.email} · ID {user.id}</p>
                      </td>
                      <td className="px-5 py-4">{user.type}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.role === 'ADMIN' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'}`}>
                          {user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-5 py-4">{user.status === 'ACTIVE' ? 'Ativo' : user.status}</td>
                      <td className="px-5 py-4 text-right">
                        {user.role === 'ADMIN' ? (
                          <span className="text-xs text-[#68728a]">Já é administrador</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handlePromote(user)}
                            disabled={updatingUserId !== null}
                            className="rounded-md bg-[#050b33] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#101d5e] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingUserId === user.id ? 'Atualizando...' : 'Tornar admin'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className="mt-4 text-xs text-[#68728a]">Usuários promovidos precisam entrar novamente para que o frontend reconheça o novo perfil.</p>
      </main>
    </div>
  );
}
