import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InvestorPanel } from "@/components/dashboard/InvestorPanel";
import { AdminPanel } from "@/components/dashboard/AdminPanel";
import { AuditorPanel } from "@/components/dashboard/AuditorPanel";
import { Transaction } from "@/components/dashboard/TransactionList";
import { Lock } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Obtener perfil del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Obtener transacciones del ledger
  const { data: transactionsData } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const transactions = (transactionsData as Transaction[]) || [];

  const isAdmin = profile?.role === "admin";
  const isAuditor = profile?.role === "auditor";
  const isFrozen = profile?.status === "frozen" || profile?.status === "suspended";

  return (
    <div className="space-y-6">
      {/* Aviso de Cuenta Suspendida / Congelada */}
      {isFrozen && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 flex items-center space-x-3">
          <Lock className="h-6 w-6 text-rose-400 flex-shrink-0" />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-rose-200 block text-sm">Cuenta Congelada / Suspendida por Prevención de Fraude</span>
            <span>Sus operaciones de depósito, inversión y retiro se encuentran bloqueadas temporalmente. Contacte con soporte.</span>
          </div>
        </div>
      )}

      {/* Renderizado Condicional por Rol */}
      {isAdmin ? (
        <AdminPanel />
      ) : isAuditor ? (
        <AuditorPanel />
      ) : (
        <InvestorPanel
          userId={user.id}
          userName={profile?.full_name || ""}
          userEmail={user.email || ""}
          kycStatus={profile?.kyc_status || "pending"}
          transactions={transactions}
        />
      )}
    </div>
  );
}
