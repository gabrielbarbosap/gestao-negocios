import Link from "next/link";

export default function PagamentoFalhaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-5xl">❌</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Pagamento não concluído</h1>
        <p className="text-slate-500 mb-6">
          Seu pagamento não foi processado. Tente novamente ou escolha outro método de pagamento.
        </p>
        <Link
          href="/aluno/pacotes"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-sky-600 px-6 font-medium text-white hover:bg-sky-700 transition-colors"
        >
          Tentar novamente
        </Link>
      </div>
    </main>
  );
}
