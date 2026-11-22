'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import Header from '@/app/components/header';
import { resendEmailVerification, verifyEmail } from '@/app/lib/api';

type VerificationState = 'checking' | 'ready' | 'verified' | 'failed';

const verificationRequests = new Map<string, ReturnType<typeof verifyEmail>>();

function verifyTokenOnce(token: string) {
  const existingRequest = verificationRequests.get(token);
  if (existingRequest) return existingRequest;

  const request = verifyEmail(token);
  verificationRequests.set(token, request);
  request.then(
    () => {
      if (verificationRequests.get(token) === request) verificationRequests.delete(token);
    },
    () => {
      if (verificationRequests.get(token) === request) verificationRequests.delete(token);
    },
  );
  return request;
}

function getApiMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: unknown }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
  }
  return 'Não foi possível confirmar o e-mail. Verifique o link e tente novamente.';
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [hasSentVerification, setHasSentVerification] = useState(() => searchParams.get('sent') === '1');
  const [email, setEmail] = useState(() => searchParams.get('email') ?? '');
  const [state, setState] = useState<VerificationState>(() => token ? 'checking' : 'ready');
  const [message, setMessage] = useState(() => token
    ? ''
    : searchParams.get('sent') === '1'
      ? 'Enviamos um link de confirmação para o e-mail informado no cadastro.'
      : 'Informe o e-mail do cadastro para solicitar um novo link de confirmação.');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    verifyTokenOnce(token)
      .then((response) => {
        if (!active) return;
        setMessage(response.message);
        setState('verified');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(getApiMessage(error));
        setState('failed');
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setIsResending(true);
    try {
      const response = await resendEmailVerification(email.trim());
      setMessage(response.message);
      setState('ready');
      setHasSentVerification(true);
    } catch (error: unknown) {
      setMessage(getApiMessage(error));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header />
      <main className="mx-auto flex max-w-xl justify-center px-5 py-16">
        <section className="w-full rounded-2xl border border-[#dfe4ee] bg-white p-7 text-center shadow-sm sm:p-10">
          <Image
            src="/labmaker.png"
            alt="Lab Maker"
            width={200}
            height={58}
            className="mx-auto mb-8 h-14 w-auto object-contain dark-readable-logo"
          />

          {state === 'checking' ? (
            <>
              <RefreshCw className="mx-auto h-10 w-10 animate-spin text-[#7000ff]" />
              <h1 className="mt-5 text-2xl font-extrabold">Confirmando seu e-mail</h1>
              <p className="mt-2 text-sm text-[#56617d]">Aguarde enquanto validamos o link.</p>
            </>
          ) : state === 'verified' ? (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <h1 className="mt-5 text-2xl font-extrabold">E-mail confirmado</h1>
              <p className="mt-2 text-sm leading-6 text-[#56617d]">{message}</p>
              <Link
                href="/login"
                className="mt-7 inline-flex rounded-lg bg-[#050b33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#7000ff]"
              >
                Entrar na conta
              </Link>
            </>
          ) : (
            <>
              <Mail className="mx-auto h-11 w-11 text-[#7000ff]" />
              <h1 className="mt-5 text-2xl font-extrabold">
                {state === 'failed' ? 'Não foi possível confirmar' : 'Confirme seu e-mail'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#56617d]">{message}</p>

              <form onSubmit={handleResend} className="mt-6 space-y-3 text-left">
                <label className="block text-sm font-semibold">
                  E-mail do cadastro
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#cbd2df] px-4 py-3 font-normal outline-none focus:border-[#7000ff]"
                    placeholder="voce@exemplo.com"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isResending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#050b33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#7000ff] disabled:cursor-wait disabled:opacity-60"
                >
                  {isResending && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {isResending ? 'ENVIANDO...' : 'REENVIAR LINK DE CONFIRMAÇÃO'}
                </button>
              </form>

              {state === 'ready' && hasSentVerification && (
                <p className="mt-4 text-xs leading-5 text-[#68728a]">
                  Se houver um cadastro pendente, o link será enviado. Verifique a caixa de entrada e a pasta de spam.
                </p>
              )}
              <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-[#7000ff] hover:underline">
                Voltar para o login
              </Link>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function VerificationLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#050b33]">
      <Header />
      <main className="mx-auto flex max-w-xl justify-center px-5 py-16">
        <p className="rounded-2xl border border-[#dfe4ee] bg-white p-10 text-sm text-[#56617d] shadow-sm">
          Carregando confirmação de e-mail...
        </p>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerificationLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
