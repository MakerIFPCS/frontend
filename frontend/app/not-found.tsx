import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6 text-[#050b33]">
      <section className="max-w-lg rounded-2xl border border-[#dfe4ee] bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7000ff]">Erro 404</p>
        <h1 className="mt-3 text-3xl font-bold">Página ainda não disponível</h1>
        <p className="mt-3 text-[#56617d]">Este destino ainda não foi implementado. Volte ao início para continuar navegando.</p>
        <Link href="/" className="mt-6 inline-flex rounded-md bg-[#050b33] px-5 py-3 font-semibold text-white hover:bg-[#101d5e]">
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
