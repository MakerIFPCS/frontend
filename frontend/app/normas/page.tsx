import Image from 'next/image';
import {
  ArrowDownToLine,
  BookOpen,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import Header from '@/app/components/header';
import { API_BASE_URL } from '@/app/lib/api';

const normas = [
  {
    icon: ShieldCheck,
    title: 'Segurança e boa convivência',
    accent: '#10B981',
    items: [
      'O uso de equipamentos pesados exige EPIs adequados, incluindo luvas e óculos de proteção.',
      'Produtos químicos devem ser utilizados e descartados seguindo as orientações e metodologias adequadas.',
      'Mantenha o volume controlado e não atrapalhe os projetos de outros usuários.',
      'Mochilas e objetos pessoais devem ser deixados na prateleira destinada a eles.',
      'Não deixe garrafas ou recipientes sobre as mesas de trabalho.',
      'Não é permitido consumir alimentos ou bebidas nas áreas de trabalho do Espaço Maker.',
      'Após o uso, ferramentas e equipamentos devem retornar aos seus locais corretos.',
      'Bancadas e estações de trabalho devem ser limpas ao final da utilização.',
    ],
  },
  {
    icon: Users,
    title: 'Acesso e utilização por alunos',
    accent: '#8B5CF6',
    items: [
      'Alunos menores de idade não podem utilizar o laboratório desacompanhados de um monitor, acompanhante ou supervisor maior de idade.',
      'Alunos maiores de idade podem utilizar o laboratório sem supervisão, desde que autorizados pelo coordenador.',
      'Impressoras 3D, máquina de corte e desenho e cortadora a laser exigem autorização e capacitação.',
      'O uso das ferramentas de corte e torque de alta potência é proibido para menores de idade.',
      'Quando necessário para menores de idade, o equipamento de alta potência deve ser operado pelo acompanhante maior de 18 anos.',
    ],
  },
  {
    icon: BookOpen,
    title: 'Uso por público externo',
    accent: '#FF0055',
    items: [
      'O público externo precisa realizar cadastro e solicitar previamente a utilização do espaço.',
      'Devem ser informados horário, motivo da utilização, nome completo e CPF dos integrantes do grupo.',
      'Integrantes não cadastrados poderão ter a entrada no campus e no Espaço Maker recusada.',
      'Pode ser solicitada exclusividade de uso do laboratório durante a reserva.',
      'A utilização pode ser recusada quando houver conflito com outras atividades, lotação máxima ou necessidade de exclusividade incompatível com reservas existentes.',
      'Equipamentos restritos exigem comprovação de conhecimento técnico e assinatura de declaração de responsabilidade por danos.',
    ],
  },
  {
    icon: Clock3,
    title: 'Prazos para equipamentos',
    accent: '#10B981',
    items: [
      'Impressões 3D simples, com arquivo .stl fornecido, menos de 5 volumes e até 6 horas por item: aviso de 2 semanas.',
      'Impressões 3D nas mesmas condições, mas sem arquivo .stl: aviso de 4 semanas.',
      'Pedidos com mais volumes possuem prazos maiores, podendo chegar a 2 ou 3 meses conforme quantidade e condições.',
      'Pedidos fora das situações previstas devem ser avaliados individualmente pelo laboratório.',
      'Para máquinas CNC é obrigatório o preenchimento de formulário de requisição.',
      'Prazos de corte e gravação variam conforme área, quantidade e complexidade do pedido.',
      'Os prazos podem ser negociados de acordo com disponibilidade de material, equipamentos e fila de espera.',
    ],
  },
  {
    icon: Wrench,
    title: 'Equipamentos CNC e máquinas',
    accent: '#8B5CF6',
    items: [
      'Uma área de corte corresponde a 240 cm² (60 cm × 40 cm).',
      'Projetos que ultrapassem a capacidade de produção e não possam ser divididos podem ser recusados.',
      'Pedidos de até 3 áreas de corte, com todas as vistas fornecidas, possuem prazo mínimo de uma semana.',
      'Projetos de corte e gravação possuem prazos maiores devido ao tempo adicional das gravações.',
      'Projetos acima de 3 áreas podem exigir prazos mínimos de 2 a 4 meses, conforme o tipo de produção.',
    ],
  },
  {
    icon: CheckCircle2,
    title: 'Monitores e apoio aos projetos',
    accent: '#FF0055',
    items: [
      'O monitor possui função didática, burocrática e de supervisão.',
      'Cabe ao monitor orientar dúvidas e ajudar a encontrar soluções, sem assumir integralmente o desenvolvimento do projeto.',
      'A produção de peças ou componentes não é uma função obrigatória do monitor, salvo situações específicas envolvendo equipamentos restritos.',
      'O monitor também auxilia na organização, manutenção, inventário e segurança do laboratório.',
      'O uso das impressoras por alunos e servidores exige certificação do laboratório e autorização do coordenador.',
      'Monitores voluntários também precisam de autorização prévia expressa para utilizar impressoras 3D e demais máquinas CNC.',
    ],
  },
];

export default function NormasPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#eef1f7]">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        {/* CONTEÚDO PRINCIPAL */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10 md:px-10 md:py-14">
          
          {/* CABEÇALHO DA PÁGINA */}
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <Image
              src="/labmaker.png"
              alt="Lab Maker"
              width={220}
              height={60}
              className="mx-auto mb-6 h-14 w-auto object-contain"
            />

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a67a]">
              IFSULDEMINAS • Câmpus Poços de Caldas
            </p>

            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-[#050b33] md:text-4xl">
              Normas de Uso do Espaço Maker
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
              Consulte abaixo uma versão resumida das principais regras para
              utilização segura, organizada e responsável do Espaço Maker.
            </p>
          </div>

          {/* AVISO PRINCIPAL */}
          <div className="mb-8 rounded-2xl border border-[#dfe5ef] bg-white p-5 shadow-lg shadow-[#050b33]/5 md:p-6">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#050b33]">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>

              <div>
                <h2 className="text-base font-extrabold text-[#050b33]">
                  Antes de utilizar o laboratório
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-600">
                  As regras gerais estabelecidas pelo IFSULDEMINAS e pelo
                  Governo Federal são a base para o funcionamento do laboratório.
                  O descumprimento das normas pode resultar em medidas
                  disciplinares.
                </p>
              </div>
            </div>
          </div>

          {/* CARDS DAS NORMAS */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {normas.map((norma) => {
              const Icon = norma.icon;

              return (
                <section
                  key={norma.title}
                  className="group rounded-2xl border border-[#e2e6ee] bg-white p-6 shadow-lg shadow-[#050b33]/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#050b33]/10"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${norma.accent}18`,
                      }}
                    >
                      <Icon
                        className="h-6 w-6"
                        style={{ color: norma.accent }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-extrabold text-[#050b33]">
                        {norma.title}
                      </h2>

                      <div
                        className="mt-2 h-1 w-10 rounded-full"
                        style={{ backgroundColor: norma.accent }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {norma.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#050b33]" />
                        <p className="text-sm leading-6 text-gray-600">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* ÁREA FINAL - DOCUMENTO COMPLETO */}
          <section className="relative mt-10 overflow-hidden rounded-2xl bg-[#050b33] p-7 text-white shadow-xl shadow-[#050b33]/20 md:p-9">
            {/* Detalhes decorativos */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#8B5CF6]/30 blur-2xl" />
            <div className="absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-[#00ff9d]/20 blur-2xl" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                <BookOpen className="h-7 w-7 text-[#00ff9d]" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00ff9d]">
                Documento oficial
              </p>

              <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">
                Quer consultar todas as normas?
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                Acesse a Política Institucional de Uso e Locação do Espaço
                Maker na íntegra para consultar todos os itens, condições,
                prazos e responsabilidades.
              </p>

              <a
                href={`${API_BASE_URL}/normas/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-extrabold uppercase tracking-wider text-[#050b33] shadow-md transition-all hover:-translate-y-0.5 hover:bg-gray-100"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Baixar / Ler na íntegra
              </a>

              <p className="mt-3 text-xs text-white/50">
                O documento será aberto em uma nova aba e também poderá ser
                baixado em PDF.
              </p>
            </div>
          </section>
        </div>

        {/* ONDA DECORATIVA INFERIOR */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 500 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-auto w-full"
          >
            <path
              d="M0,20 Q120,75 250,50 T500,40"
              stroke="#050b33"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="50" cy="38" r="7" fill="#8B5CF6" />
            <circle cx="250" cy="50" r="7" fill="#10B981" />
            <circle cx="450" cy="37" r="7" fill="#FF0055" />
          </svg>
        </div>
      </main>
    </div>
  );
}