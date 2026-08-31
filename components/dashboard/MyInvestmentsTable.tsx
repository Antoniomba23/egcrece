"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
    return <div className="p-4 text-xs text-slate-400 animate-pulse">Cargando mis inversiones...</div>;
  }

  if (holdings.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
        <Building2 className="mx-auto h-8 w-8 text-slate-500" />
        <h3 className="text-sm font-semibold text-white">Sin inversiones activas aún</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Explore el catálogo de proyectos en Guinea Ecuatorial e invierta su saldo disponible para comenzar a recibir dividendos.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto no-scrollbar rounded-lg border border-slate-800 bg-slate-950">
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
              <td className="px-4 py-3 text-slate-300 flex items-center space-x-1.5 pt-4">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{item.next_payout_date}</span>
              </td>
              <td className="px-4 py-3 text-right">
                {item.execution_status === "active" || item.execution_status === "draft" ? (
                  <Badge variant="outline" className="bg-amber-950/60 text-amber-400 border-amber-800 text-[10px] uppercase font-bold">
                    ⏳ En Recaudación
                  </Badge>
                ) : item.execution_status === "funded" || item.execution_status === "executing" ? (
                  <Badge variant="outline" className="bg-emerald-950/60 text-emerald-400 border-emerald-800 text-[10px] uppercase font-bold">
                    📈 Activo / Devengando
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-slate-900 text-slate-400 border-slate-700 text-[10px] uppercase font-bold">
                    🏁 Liquidado
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
