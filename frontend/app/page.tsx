'use client';

import Link from 'next/link';
import { ArrowRight, Lightbulb, Users, Wrench } from 'lucide-react';
import Image from 'next/image';
import Header from '@/app/components/header';
import React from 'react';

// Tipagem para o componente InfoCard
type InfoCardProps = {
  icon: React.ReactNode;
  title: string;
  text: string;
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex flex-col font-sans">
      <Header />

      {/* APRESENTAÇÃO DO LABORATÓRIO */}
      <main className="flex-1 relative">
        {/* SVG de fundo para as linhas onduladas e bolinhas coloridas */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1920 1000"
          preserveAspectRatio="none"
        >
          {/* Linha ondulada inferior estendida para cobrir 100% da largura */}
          <path 
            d="M -50,800 Q 200,750 400,820 T 900,850 T 1500,800 T 2200,800" 
            fill="none" 
            stroke="#1D2B53" 
            strokeWidth="2" 
          />
          {/* Bolinhas alinhadas sobre a curva */}
          <circle cx="190" cy="780" r="10" fill="#7000FF" />
          <circle cx="900" cy="850" r="10" fill="#00FF19" />
          <circle cx="1700" cy="796" r="10" fill="#FF2A55" />
        </svg>

        <section className="relative isolate min-h-[560px] overflow-hidden bg-[#07113f] text-white">
          <Image
            src="/fotita.jpeg"
            alt="Espaço de criação do Lab Maker"
            fill
            priority
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050b33] via-[#050b33]/80 to-[#050b33]/25" />

          <div className="relative mx-auto flex min-h-[560px] max-w-6xl items-center px-8 py-20 lg:px-12">
            <div className="max-w-2xl">
              <p className="mb-5 text-sm font-bold uppercase tracking-[0.28em] text-[#00ff9d]">
                Centro de empreendedorismo e inovação
              </p>
              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
                Ideias ganham forma aqui.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/80 md:text-xl">
                O Lab Maker é um espaço para aprender, criar e transformar projetos em realidade com tecnologia, colaboração e muita curiosidade.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/Cadastro"
                  className="inline-flex items-center gap-2 bg-[#00ff9d] px-5 py-3 font-bold text-[#050b33] transition-transform hover:-translate-y-0.5"
                >
                  Comece a criar <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 border border-white/50 px-5 py-3 font-bold text-white transition-colors hover:bg-white/10"
                >
                  Já tenho uma conta
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-8 py-16 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7000ff]">Um lugar para fazer</p>
            <h2 className="mt-3 text-3xl font-bold text-[#050b33] md:text-4xl">Aprenda fazendo, compartilhe descobertas.</h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <InfoCard icon={<Lightbulb />} title="Explore ideias" text="Encontre inspiração e dê o primeiro passo para tirar seu projeto do papel." />
            <InfoCard icon={<Wrench />} title="Use recursos" text="Tenha acesso a máquinas, materiais e ferramentas para experimentar com liberdade." />
            <InfoCard icon={<Users />} title="Crie junto" text="Faça parte de uma comunidade que aprende, constrói e cresce em colaboração." />
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoCard({ icon, title, text }: InfoCardProps) {
  return (
    <article className="border-t-4 border-[#050b33] bg-[#f5f7fb] p-6">
      <div className="flex h-11 w-11 items-center justify-center bg-white text-[#7000ff] shadow-sm">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-bold text-[#050b33]">{title}</h3>
      <p className="mt-3 leading-7 text-[#56617d]">{text}</p>
    </article>
  );
}
