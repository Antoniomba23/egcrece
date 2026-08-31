import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KycUploader } from "@/components/kyc/KycUploader";

export default async function KycPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Verificación KYC y Cumplimiento</h1>
        <p className="text-xs text-slate-400 mt-1">
          Gestione la documentación requerida para cumplir con las normativas financieras de la COBAC / CEMAC.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">Estado Actual de su Cuenta:</span>
        <span className="font-semibold text-emerald-400 uppercase bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
          {profile?.kyc_status || "PENDIENTE"}
        </span>
      </div>

      <KycUploader userId={user.id} />
    </div>
  );
}
