'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock } from 'lucide-react';
import { loginUser } from '@/app/lib/api';
import type { LoginRequest } from '@/app/types/api';
import Header from '@/app/components/header';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginRequest>({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await loginUser(form);
      localStorage.setItem('authToken', `${response.tokenType} ${response.token}`);
      localStorage.setItem('userId', String(response.userId));
      localStorage.setItem('userRole', response.role);
      localStorage.setItem('userName', response.userName);
      window.dispatchEvent(new Event('auth-changed'));
      router.push(response.role === 'ADMIN' ? '/admin' : '/');
    } catch {
      setError('E-mail ou senha inválidos. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#eef1f7]">
      <Header />

      {/* CONTEÚDO PRINCIPAL (DIVIDIDO EM 2 COLUNAS) */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2">
        {/* LADO ESQUERDO: Imagem do Lab */}
        <div className="relative min-h-[300px] overflow-hidden bg-gray-800 md:min-h-full">
          {/* Coloque uma foto do contêiner do laboratório na pasta public com o nome lab-foto.jpg */}
          <Image 
            src="/fotita.jpeg" 
            alt="Instalações Lab Maker" 
            fill 
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050b33]/90 via-[#050b33]/25 to-transparent" />
          <div className="absolute bottom-8 left-8 max-w-sm text-white md:bottom-12 md:left-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00ff9d]">Lab Maker</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight">Seu próximo projeto começa com uma ideia.</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">Entre para continuar aprendendo, criando e colaborando.</p>
          </div>
        </div>

        {/* LADO DIREITO: Formulário Branco */}
        <div className="relative flex flex-col items-center justify-center bg-white p-8 text-gray-800 md:p-12">
          <div className="w-full max-w-sm rounded-2xl border border-[#e4e8f0] bg-white p-6 shadow-xl shadow-[#050b33]/10 md:p-8">
            
            {/* Logo do Lab Maker */}
            <Image 
              src="/labmaker.png" 
              alt="Lab Maker" 
              width={240} 
              height={70} 
              className="h-18 w-auto object-contain mb-2"
            />

            {/* Campos de Entrada */}
            <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
              {/* Campo EMAIL */}
              <div className="flex items-center border border-gray-400 rounded-md px-3 py-2 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-900">
                <User className="w-5 h-5 text-gray-600 mr-3" />
                <input 
                  type="email" 
                  placeholder="EMAIL" 
                  value={form.email}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, email: event.target.value }))}
                  required
                  className="w-full outline-none text-sm font-semibold text-gray-700 bg-transparent placeholder-gray-500"
                />
              </div>

              {/* Campo PASSWORD */}
              <div className="flex items-center border border-gray-400 rounded-md px-3 py-2 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-900">
                <Lock className="w-5 h-5 text-gray-600 mr-3" />
                <input 
                  type="password" 
                  placeholder="PASSWORD" 
                  value={form.password}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, password: event.target.value }))}
                  required
                  className="w-full outline-none text-sm font-semibold text-gray-700 bg-transparent placeholder-gray-500"
                />
              </div>

              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

              {/* Botão LOGIN */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="mt-2 w-full rounded-md bg-[#050b33] py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#101d5e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'ENTRANDO...' : 'LOGIN'}
              </button>

              {/* Botão REGISTRO */}
              <Link 
                href="/Cadastro" 
                className="w-full rounded-md border border-[#cbd2df] py-3 text-center text-sm font-bold uppercase tracking-wider text-[#050b33] transition-colors hover:bg-[#f5f7fb]"
              >
                REGISTRO
              </Link>
            </form>

            {/* Esqueceu a Senha */}
            <a href="#" className="text-xs font-bold text-gray-800 hover:underline mt-2">
              Esqueceu a senha?
            </a>
          </div>

          {/* Onda Decorativa com Bolinhas na parte inferior */}
          <div className="absolute bottom-0 right-0 left-0 w-full pointer-events-none">
            <svg viewBox="0 0 500 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M0,20 Q120,75 250,50 T500,40" stroke="#050b33" strokeWidth="1.5" fill="none" />
              <circle cx="50" cy="38" r="7" fill="#8B5CF6" />
              <circle cx="250" cy="50" r="7" fill="#10B981" />
              <circle cx="450" cy="37" r="7" fill="#FF0055" />
            </svg>
          </div>
          
        </div>
      </main>
    </div>
  );
}