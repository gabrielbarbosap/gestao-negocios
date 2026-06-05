import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const DEFAULT_PACKAGES = [
  { id: "4", name: "Pacote 4 aulas", lessons: 4, price: 400 },
  { id: "8", name: "Pacote 8 aulas", lessons: 8, price: 720 },
  { id: "12", name: "Pacote 12 aulas", lessons: 12, price: 960 },
];

export default function PacotesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Pacotes</h1>
        <p className="text-sm text-slate-500">Compre créditos de aulas</p>
      </div>

      <div className="grid gap-4">
        {DEFAULT_PACKAGES.map((pkg) => (
          <Card key={pkg.id} className="flex items-center justify-between p-4">
            <CardContent className="p-0 flex items-center justify-between w-full">
              <div>
                <p className="font-semibold text-slate-900">{pkg.name}</p>
                <p className="text-sm text-slate-500">{pkg.lessons} créditos de aula</p>
                <p className="text-lg font-bold text-sky-600 mt-1">{formatCurrency(pkg.price)}</p>
                {pkg.lessons > 4 && (
                  <p className="text-xs text-emerald-600">
                    Economia de {formatCurrency(pkg.price - pkg.lessons * 100)} vs avulso
                  </p>
                )}
              </div>
              <Button>Comprar</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-sky-50 p-4">
        <p className="text-sm font-medium text-sky-800">Como funcionam os créditos?</p>
        <p className="text-sm text-sky-600 mt-1">
          Após a compra, os créditos ficam disponíveis na sua conta e você pode agendar aulas
          livremente nos horários liberados pelo instrutor.
        </p>
      </div>
    </div>
  );
}
