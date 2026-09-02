"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Calendar, TrendingUp, CheckCircle2, Clock } from "lucide-react";

interface InvestmentHolding {
  id: string;
  project_title: string;
  category: string;
  amount_invested: number;
  expected_return: number;
  next_payout_date: string;
  execution_status: string;
}

export function MyInvestmentsTable({ userId }: { userId: string }) {
  const [holdings, setHoldings] = useState<InvestmentHolding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchMyInvestments() {
      try {
        setLoading(true);

        // 1. Obtener transacciones de tipo investment para este usuario
        const { data: investments, error: invErr } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .eq("type", "investment")
          .eq("status", "completed");

        if (invErr) throw invErr;

        // 2. Obtener proyectos
        const { data: projects } = await supabase.from("projects").select("*");

        if (!investments || investments.length === 0) {
          setHoldings([]);
          return;
        }

        // Agrupar inversiones por proyecto
        const holdingsMap: { [key: string]: InvestmentHolding } = {};

        investments.forEach((inv) => {
          // Intentar coincidir con proyecto semilla o id
          const proj = projects?.find((p) => inv.reference_code?.includes(p.id.slice(0, 6))) || projects?.[0];
          const projId = proj ? proj.id : "proj-generic";
          const projTitle = proj ? proj.title : "Proyecto Agroindustrial Bioko";
          const returnRate = proj ? Number(proj.expected_return) : 10.5;
          const status = proj ? proj.status : "executing";

          if (holdingsMap[projId]) {
            holdingsMap[projId].amount_invested += Number(inv.amount);
          } else {
            // Calcular fecha de próximo dividendo (trimestral)
            const nextPayout = new Date();
            nextPayout.setMonth(nextPayout.getMonth() + 3);

            holdingsMap[projId] = {
              id: projId,
              project_title: projTitle,
              category: proj?.category || "Agroindustria",
              amount_invested: Number(inv.amount),
              expected_return: returnRate,
              next_payout_date: nextPayout.toLocaleDateString("es-ES", { month: "short", day: "numeric", year: "numeric" }),
              execution_status: status,
            };
          }
        });

        setHoldings(Object.values(holdingsMap));
      } catch (err) {
        console.error("Error al obtener inversiones del usuario:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyInvestments();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl bg-slate-900" />
        <Skeleton className="h-16 w-full rounded-xl bg-slate-900" />
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4 shadow-xl">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-sm font-bold text-white">Aún no tienes participaciones en proyectos</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Invierte en proyectos agroindustriales, comerciales o inmobiliarios para comenzar a acumular cupones trimestrales en FCFA.
          </p>
        </div>

        <Button
          asChild
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-5 shadow-lg"
        >
          <a href="/proyectos">Ver Proyectos Disponibles</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vista Escritorio: Tabla (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto no-scrollbar rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Nombre del Proyecto</th>
              <th className="px-4 py-3">Capital Aportado</th>
              <th className="px-4 py-3">Tasa Retorno (%)</th>
              <th className="px-4 py-3">Próximo Pago Dividendos</th>
              <th className="px-4 py-3 text-right">Estado de Obra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {holdings.map((item) => (
              <tr key={item.id} className="hover:bg-slate-900/40">
                <td className="px-4 py-3">
                  <span className="font-semibold text-white block">{item.project_title}</span>
                  <span className="text-[11px] text-slate-400">{item.category}</span>
                </td>
                <td className="px-4 py-3 font-bold text-emerald-400">{formatCurrency(item.amount_invested)}</td>
                <td className="px-4 py-3 font-bold text-teal-400">+{item.expected_return}% Anual</td>
                <td className="px-4 py-3 text-slate-300">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.next_payout_date}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {item.execution_status === "active" || item.execution_status === "draft" ? (
                    <Badge variant="outline" className="bg-amber-950/60 text-amber-400 border-amber-800 text-[10px] uppercase font-bold">
                      En Recaudación
                    </Badge>
                  ) : item.execution_status === "funded" || item.execution_status === "executing" ? (
                    <Badge variant="outline" className="bg-emerald-950/60 text-emerald-400 border-emerald-800 text-[10px] uppercase font-bold">
                      Activo / Devengando
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-900 text-slate-400 border-slate-700 text-[10px] uppercase font-bold">
                      Liquidado
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil Extrema: Tarjetas Apilables (<768px) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {holdings.map((item) => (
          <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-bold text-white text-sm block">{item.project_title}</span>
                <span className="text-[11px] text-emerald-400 font-semibold">{item.category}</span>
              </div>
              {item.execution_status === "active" || item.execution_status === "draft" ? (
                <Badge variant="outline" className="bg-amber-950/60 text-amber-400 border-amber-800 text-[10px] uppercase font-bold">
                  En Recaudación
                </Badge>
              ) : item.execution_status === "funded" || item.execution_status === "executing" ? (
                <Badge variant="outline" className="bg-emerald-950/60 text-emerald-400 border-emerald-800 text-[10px] uppercase font-bold">
                  Activo / Devengando
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-900 text-slate-400 border-slate-700 text-[10px] uppercase font-bold">
                  Liquidado
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-900 py-2">
              <div>
                <span className="text-slate-400 block text-[11px]">Capital Invertido</span>
                <span className="font-extrabold text-emerald-400 text-sm">{formatCurrency(item.amount_invested)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Retorno Estimado</span>
                <span className="font-bold text-teal-400 text-sm">+{item.expected_return}% Anual</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Próximo Cupón:</span>
              <div className="flex items-center space-x-1 font-bold text-white">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>{item.next_payout_date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
