'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Mail, CreditCard } from 'lucide-react';
import { createUser, loginUser } from '@/app/lib/api';
import type { CreateUserRequest } from '@/app/types/api';
import Header from '@/app/components/header';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateUserRequest>({
    name: '',
    password: '',
    email: '',
    cpf: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function updateField(field: keyof CreateUserRequest, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function handleCheckboxChange(event: React.ChangeEvent<HTMLInputElement>) {
  setAcceptedTerms(event.target.checked);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acceptedTerms) {
      setError('Você precisa aceitar as normas e regras para prosseguir.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const user = await createUser(form);
      try {
        const response = await loginUser({ email: form.email, password: form.password });
        localStorage.setItem('authToken', `${response.tokenType} ${response.token}`);
        localStorage.setItem('userId', String(response.userId));
        localStorage.setItem('userRole', response.role);
        localStorage.setItem('userName', response.userName);
        window.dispatchEvent(new Event('auth-changed'));
        router.push(response.role === 'ADMIN' ? '/admin' : '/');
      } catch {
        router.push(`/login?registered=1&email=${encodeURIComponent(user.email)}`);
      }
    } catch {
      setError('Não foi possível criar sua conta. Confira os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    
    <div className="min-h-screen flex flex-col bg-[#eef1f7]">
      <Header />

      {/* CONTEÚDO PRINCIPAL (SPLIT 2 COLUNAS) */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2">
        
        {/* LADO ESQUERDO: Imagem do Lab */}
        <div className="relative min-h-[350px] overflow-hidden bg-gray-800 md:min-h-full">
          <Image 
            src="/fotita.jpeg" 
            alt="Instalações Lab Maker" 
            fill 
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050b33]/90 via-[#050b33]/25 to-transparent" />
          <div className="absolute bottom-8 left-8 max-w-sm text-white md:bottom-12 md:left-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00ff9d]">Faça parte</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight">Dê vida às suas melhores ideias.</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">Crie seu perfil e descubra tudo o que o Lab Maker oferece.</p>
          </div>
        </div>

        {/* LADO DIREITO: Formulário de Registro */}
        <div className="relative flex flex-col items-center justify-between overflow-hidden bg-white p-8 md:p-12">
          
          <div className="z-10 my-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-[#e4e8f0] bg-white p-6 shadow-xl shadow-[#050b33]/10 md:p-8">
            {/* Logo Central */}
            <Image 
              src="/labmaker.png" 
              alt="Lab Maker" 
              width={220} 
              height={60} 
              className="h-14 w-auto object-contain mb-2"
            />

            {/* FORMULÁRIO DE CADASTRO */}
            <form className="w-full flex flex-col gap-3.5" onSubmit={handleSubmit}>
              
              {/* Campo NOME COMPLETO */}
              <div className="flex items-center border-2 border-gray-400 rounded-md overflow-hidden bg-white shadow-sm focus-within:border-[#050b33]">
                <div className="p-2.5 border-r border-gray-300 bg-gray-50">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <input 
                  type="text" 
                  placeholder="NOME COMPLETO" 
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  required
                  className="w-full px-3 py-2 outline-none text-sm font-semibold text-gray-800 placeholder-gray-500"
                />
              </div>

              {/* Campo CPF */}
              <div className="flex items-center border-2 border-gray-400 rounded-md overflow-hidden bg-white shadow-sm focus-within:border-[#050b33]">
                <div className="p-2.5 border-r border-gray-300 bg-gray-50">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </div>
                <input 
                  type="text" 
                  placeholder="CPF" 
                  value={form.cpf}
                  onChange={(event) => updateField('cpf', event.target.value)}
                  required
                  className="w-full px-3 py-2 outline-none text-sm font-semibold text-gray-800 placeholder-gray-500"
                />
              </div>

              {/* Campo EMAIL */}
              <div className="flex items-center border-2 border-gray-400 rounded-md overflow-hidden bg-white shadow-sm focus-within:border-[#050b33]">
                <div className="p-2.5 border-r border-gray-300 bg-gray-50">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <input 
                  type="email" 
                  placeholder="EMAIL" 
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  required
                  className="w-full px-3 py-2 outline-none text-sm font-semibold text-gray-800 placeholder-gray-500"
                />
              </div>

              {/* Campo SENHA */}
              <div className="flex items-center border-2 border-gray-400 rounded-md overflow-hidden bg-white shadow-sm focus-within:border-[#050b33]">
                <div className="p-2.5 border-r border-gray-300 bg-gray-50">
                  <Lock className="w-5 h-5 text-gray-600" />
                </div>
                <input 
                  type="password" 
                  placeholder="SENHA" 
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  required
                  className="w-full px-3 py-2 outline-none text-sm font-semibold text-gray-800 placeholder-gray-500"
                />
              </div>

              {/* Checkbox de Aceite das Normas e Regras */}
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  checked={acceptedTerms} 
                  onChange={handleCheckboxChange} 
                  className="h-4 w-4 text-[#050b33] border-gray-300 rounded focus:ring-[#050b33]"
                />
                <label htmlFor="terms" className="text-xs text-gray-600">
                  Aceito as <Link href="/normas" className="text-[#050b33] hover:underline">Normas e Regras</Link>
                </label>
              </div>

              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

              {/* Botão REGISTRO */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="mt-2 w-full rounded-md bg-[#050b33] py-3 text-sm font-extrabold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#101d5e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'ENVIANDO...' : 'REGISTRO'}
              </button>

              {/* Link para voltar ao Login */}
              <div className="text-center mt-2">
                <span className="text-xs text-gray-600">Já possui uma conta? </span>
                <Link href="/login" className="text-xs font-bold text-[#050b33] hover:underline">
                  Faça Login
                </Link>
              </div>
            </form>
          </div>

          {/* RODAPÉ DO LADO DIREITO: Texto "Como posso ajudar?" e Linha Ondulada */}
          <div className="w-full flex flex-col items-end z-10 mt-6">
            <span className="text-xs font-bold text-[#050b33] cursor-pointer hover:underline mb-4">
              Como posso ajudar?
            </span>
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