"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Calculator, Save, TrendingUp, DollarSign } from "lucide-react";

export function SimuladorInversion() {
  const [initialAmount, setInitialAmount] = useState<number>(50000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(10000);
  const [years, setYears] = useState<number>(5);
  const [annualRate, setAnnualRate] = useState<number>(8.5);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  // Cálculo de Interés Compuesto
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;

  let totalPrincipal = initialAmount;
  let totalFutureValue = initialAmount;

  for (let i = 1; i <= months; i++) {
    totalPrincipal += monthlyContribution;
    totalFutureValue = (totalFutureValue + monthlyContribution) * (1 + monthlyRate);
  }

  const estimatedYield = totalFutureValue - totalPrincipal;

  const handleSaveSimulation = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Debe iniciar sesión para guardar la simulación.");
        return;
      }

      const { error } = await supabase.from("simulations").insert({
        user_id: user.id,
        initial_amount: initialAmount,
        monthly_contribution: monthlyContribution,
        years: years,
        estimated_return: Math.round(totalFutureValue),
      });

      if (error) throw error;
      setMessage("Simulación guardada exitosamente en su perfil.");
    } catch (err: any) {
      setMessage(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <Card className="lg:col-span-6 bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-emerald-400">
            <Calculator className="h-5 w-5" />
            <span>Simulador de Interés Compuesto</span>
          </CardTitle>
          <CardDescription>
            Proyecta el crecimiento de tu capital en Franco CFA (XAF) con aportaciones periódicas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="initial">Capital Inicial (XAF)</Label>
            <Input
              id="initial"
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
              min={0}
              step={5000}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="monthly">Aportación Mensual (XAF)</Label>
            <Input
              id="monthly"
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              min={0}
              step={2000}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="years">Plazo (Años)</Label>
              <Input
                id="years"
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                min={1}
                max={30}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rate">Rendimiento Anual Estimado (%)</Label>
              <Input
                id="rate"
                type="number"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                step={0.5}
                min={1}
                max={30}
                className="mt-1"
              />
            </div>
          </div>

          <Button
            onClick={handleSaveSimulation}
            disabled={saving}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Guardando..." : "Guardar Simulación en mi Perfil"}</span>
          </Button>

          {message && (
            <p className={`text-xs text-center mt-2 ${message.includes("Error") || message.includes("iniciar") ? "text-amber-400" : "text-emerald-400"}`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-6 bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <span>Resultado de la Proyección</span>
          </CardTitle>
          <CardDescription>Resumen financiero estimado para {years} años</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Valor Futuro Estimado</span>
            <span className="text-3xl font-extrabold text-emerald-400 block mt-1">
              {formatCurrency(totalFutureValue)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block">Total Invertido</span>
              <span className="text-lg font-bold text-slate-200 block mt-1">
                {formatCurrency(totalPrincipal)}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block">Intereses Generados</span>
              <span className="text-lg font-bold text-emerald-400 block mt-1">
                {formatCurrency(estimatedYield)}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 text-xs text-slate-400 leading-relaxed">
            * Los cálculos mostrados son simulaciones estimadas sujetas a la tasa anual definida ({annualRate}%). Los retornos reales dependerán del tipo de proyecto o fondo seleccionado.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
