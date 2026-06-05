import { Card, CardContent } from "@/components/ui/card";

export default function EvolucaoPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Evolução</h1>
        <p className="text-sm text-slate-500">Seu histórico e progresso nas aulas</p>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />

        <div className="ml-10 text-center py-12">
          <p className="text-slate-400 text-sm">
            Seu histórico de evolução aparecerá aqui após as primeiras aulas.
          </p>
          <p className="text-slate-400 text-xs mt-1">
            O instrutor registrará seu desempenho após cada sessão.
          </p>
        </div>
      </div>

      <Card className="mt-4">
        <CardContent className="pt-4">
          <h3 className="font-semibold text-slate-900 mb-2">Registro de fotografias</h3>
          <p className="text-sm text-slate-500 mb-3">
            Guarde as memórias das suas sessões de surf!
          </p>
          <a
            href="https://guardei.art"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
          >
             Registrar fotos no guardei.art
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
