import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle } from "lucide-react";

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: "deposit" | "investment" | "withdrawal" | "yield";
  status: "pending" | "completed" | "failed";
  reference_code: string | null;
  created_at: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
        <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
          <Clock className="h-7 w-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-white">Tu historial de movimientos está listo</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Aún no has registrado depósitos o inversiones. Activa tu cartera para recibir rendimientos periódicos en Franco CFA (XAF).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-5 shadow-lg"
          >
            <a href="/proyectos">Explorar Catálogo de Proyectos</a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto border-slate-800 text-slate-300 hover:bg-slate-800 text-xs h-10 px-5"
          >
            <a href="/kyc">Verificar Cuenta (KYC)</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vista de Escritorio: Tabla Normal (md:block) */}
      <div className="hidden md:block overflow-x-auto no-scrollbar rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Tipo Movimiento</th>
              <th className="px-4 py-3">Referencia Contable</th>
              <th className="px-4 py-3">Monto (XAF)</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha / Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-950/40 transition-colors">
                <td className="px-4 py-3 font-medium text-white capitalize flex items-center space-x-2">
                  {tx.type === "deposit" || tx.type === "yield" ? (
                    <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-rose-400" />
                  )}
                  <span>{tx.type === "deposit" ? "Depósito" : tx.type === "yield" ? "Rendimiento" : tx.type === "investment" ? "Inversión" : "Retiro"}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                  {tx.reference_code || tx.id.slice(0, 8)}
                </td>
                <td className={`px-4 py-3 font-semibold ${tx.type === "deposit" || tx.type === "yield" ? "text-emerald-400" : "text-slate-200"}`}>
                  {formatCurrency(tx.amount, tx.currency)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      tx.status === "completed"
                        ? "default"
                        : tx.status === "pending"
                        ? "warning"
                        : "destructive"
                    }
                  >
                    {tx.status === "completed" ? "Completado" : tx.status === "pending" ? "Pendiente" : "Fallido"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {formatDate(tx.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil Extrema: Tarjetas Apilables (<768px) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {transactions.map((tx) => (
          <div key={tx.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {tx.type === "deposit" || tx.type === "yield" ? (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <span className="font-bold text-white text-sm capitalize block">
                    {tx.type === "deposit" ? "Depósito Recargado" : tx.type === "yield" ? "Rendimiento Abonado" : tx.type === "investment" ? "Inversión en Proyecto" : "Solicitud de Retiro"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Ref: {tx.reference_code || tx.id.slice(0, 8)}
                  </span>
                </div>
              </div>

              <Badge
                variant={
                  tx.status === "completed"
                    ? "default"
                    : tx.status === "pending"
                    ? "warning"
                    : "destructive"
                }
                className="text-[10px]"
              >
                {tx.status === "completed" ? "Completado" : tx.status === "pending" ? "Pendiente" : "Fallido"}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">{formatDate(tx.created_at)}</span>
              <span className={`text-base font-extrabold ${tx.type === "deposit" || tx.type === "yield" ? "text-emerald-400" : "text-white"}`}>
                {formatCurrency(tx.amount, tx.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
