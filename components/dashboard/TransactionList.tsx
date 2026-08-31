import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
      <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-xl">
        <Clock className="mx-auto h-8 w-8 text-slate-500 mb-2" />
        <p className="text-slate-300 font-medium">Sin transacciones registradas</p>
        <p className="text-xs text-slate-500 mt-1">Los movimientos de depósitos, retornos e inversiones aparecerán en este ledger inmutable.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto no-scrollbar rounded-xl border border-slate-800 bg-slate-900/80">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
          <tr>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Referencia</th>
            <th className="px-4 py-3">Monto (XAF)</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Fecha</th>
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
                <span>{tx.type}</span>
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
                  {tx.status}
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
  );
}
