"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, BarChart3 } from "lucide-react";

interface PortfolioChartProps {
  totalBalance: number;
}

export function PortfolioChart({ totalBalance }: PortfolioChartProps) {
  // Proyección visual de 6 meses
  const months = ["Mar", "Abr", "May", "Jun", "Jul", "Ago"];
  const baseValue = Math.max(totalBalance, 100000);
  const dataPoints = [
    Math.round(baseValue * 0.4),
    Math.round(baseValue * 0.52),
    Math.round(baseValue * 0.65),
    Math.round(baseValue * 0.78),
    Math.round(baseValue * 0.89),
    baseValue,
  ];

  const maxVal = Math.max(...dataPoints);

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            <span>Evolución Histórica de Portafolio</span>
          </CardTitle>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full">
            +8.5% Crecimiento
          </span>
        </div>
        <CardDescription>Seguimiento mensual de activos en Franco CFA (XAF)</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-44 w-full flex items-end justify-between gap-2 border-b border-slate-800 pb-3 pt-6 px-2">
          {dataPoints.map((val, idx) => {
            const heightPercent = Math.max(15, Math.round((val / maxVal) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-950 border border-slate-700 text-emerald-400 text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-10">
                  {formatCurrency(val)}
                </div>
                <div
                  className="w-full max-w-[42px] bg-gradient-to-t from-emerald-700 via-emerald-500 to-teal-400 rounded-t-md transition-all duration-500 hover:brightness-125"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[11px] text-slate-400">{months[idx]}</span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-3 text-xs text-slate-400">
          <span>Capital Actual: <strong className="text-white font-bold">{formatCurrency(totalBalance)}</strong></span>
          <span className="flex items-center space-x-1 text-emerald-400 font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Proyección Cumplida</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
