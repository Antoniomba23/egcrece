import { SimuladorInversion } from "@/components/calculator/SimuladorInversion";

export default function SimuladorPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Calculadora Avanzada de Ahorro e Interés</h1>
        <p className="text-xs text-slate-400 mt-1">
          Proyecte sus metas de ahorro e inversión programada en la zona CEMAC.
        </p>
      </div>

      <SimuladorInversion />
    </div>
  );
}
