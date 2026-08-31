"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, X, CheckCircle2, AlertCircle, ShieldAlert, FileText, Lock, Wallet } from "lucide-react";
import Link from "next/link";

interface InvestmentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    expectedReturn: number;
    targetAmount: number;
    raisedAmount: number;
    durationMonths: number;
  } | null;
  initialAmount?: number;
  onInvestmentComplete: () => void;
  onOpenDeposit?: () => void;
}

export function InvestmentCheckoutModal({
  isOpen,
  onClose,
  project,
  initialAmount = 50000,
  onInvestmentComplete,
  onOpenDeposit,
}: InvestmentCheckoutModalProps) {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [readDossier, setReadDossier] = useState<boolean>(false);
  const [acceptMandate, setAcceptMandate] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  const supabase = createClient();

  if (!isOpen || !project) return null;

  // Cálculo de rendimientos netos
  const grossYield = (amount * project.expectedReturn) / 100;
  const taxWithholding = 0; // Exención de incentivos para microinversión en zona CEMAC
  const totalReturn = amount + grossYield - taxWithholding;

  const handleInvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMessage(null);

      if (!readDossier || !acceptMandate) {
        throw new Error("Debe aceptar los términos del Dossier y el Contrato de Mandato antes de proceder.");
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Debe iniciar sesión para realizar una inversión.");
      }

      // 1. Obtener perfil del usuario para validar KYC, Rol y Saldo Disponible
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, kyc_status")
        .eq("id", user.id)
        .single();

      const userRole = profile?.role || "investor";
      const kycStatus = profile?.kyc_status || "pending";

      if (userRole === "admin") {
        throw new Error("Separación de Funciones (SoD): Los administradores no pueden ejecutar inversiones desde la cuenta corporativa. Use una cuenta de Inversor.");
      }

      if (kycStatus !== "approved") {
        setStatusMessage({
          type: "warning",
          text: "Debe completar la verificación de identidad (KYC) para activar su cuenta antes de realizar inversiones.",
        });
        return;
      }

      // 2. Obtener saldo disponible del usuario
      const { data: userTxs } = await supabase
        .from("transactions")
        .select("type, amount, status")
        .eq("user_id", user.id)
        .eq("status", "completed");

      const totalDeposit = (userTxs || [])
        .filter((t) => t.type === "deposit")
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      const totalInvested = (userTxs || [])
        .filter((t) => t.type === "investment")
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      const availableBalance = Math.max(0, totalDeposit - totalInvested);

      if (amount > availableBalance) {
        setStatusMessage({
          type: "warning",
          text: `Saldo insuficiente. Su saldo disponible es de ${formatCurrency(availableBalance)}. Por favor recargue su billetera.`,
        });
        return;
      }

      // 3. Registrar transacción atómica de inversión en el ledger
      const referenceCode = `INV-${project.id.slice(0, 6)}-${Date.now().toString().slice(-6)}`;

      const { error: txError } = await supabase.from("transactions").insert({
        user_id: user.id,
        amount: amount,
        currency: "XAF",
        type: "investment",
        status: "completed",
        reference_code: referenceCode,
      });

      if (txError) throw txError;

      // 4. Actualizar la recaudación acumulada del proyecto
      const newRaised = Number(project.raisedAmount) + Number(amount);
      await supabase
        .from("projects")
        .update({ raised_amount: newRaised })
        .eq("id", project.id);

      setStatusMessage({
        type: "success",
        text: `¡Inversión de ${formatCurrency(amount)} confirmada en ${project.title}! Su capital está registrado en el ledger.`,
      });

      setTimeout(() => {
        onInvestmentComplete();
        onClose();
      }, 2000);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Error al procesar la inversión",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-slate-900 border-slate-800 text-white relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader>
          <CardTitle className="text-xl font-bold text-emerald-400 flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Confirmación de Orden de Inversión</span>
          </CardTitle>
          <CardDescription className="text-slate-300 font-semibold">
            {project.title} (+{project.expectedReturn}% Anual)
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleInvestSubmit}>
          <CardContent className="space-y-5">
            {statusMessage && (
              <div
                className={`p-3 rounded-md flex items-center justify-between text-xs ${
                  statusMessage.type === "success"
                    ? "bg-emerald-950/50 border border-emerald-800 text-emerald-300"
                    : statusMessage.type === "warning"
                    ? "bg-amber-950/50 border border-amber-800 text-amber-300"
                    : "bg-rose-950/50 border border-rose-800 text-rose-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>

                {statusMessage.type === "warning" && statusMessage.text.includes("saldo") && onOpenDeposit && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onOpenDeposit();
                    }}
                    className="ml-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] h-7 px-2"
                  >
                    Depositar XAF
                  </Button>
                )}

                {statusMessage.type === "warning" && statusMessage.text.includes("KYC") && (
                  <Link href="/kyc">
                    <Button
                      type="button"
                      size="sm"
                      className="ml-2 bg-amber-600 hover:bg-amber-500 text-white text-[10px] h-7 px-2"
                    >
                      Ir a KYC
                    </Button>
                  </Link>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="checkoutAmount">Monto a Invertir (Franco CFA - XAF)</Label>
              <Input
                id="checkoutAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={5000}
                step={5000}
                required
                className="mt-1 text-lg font-bold text-emerald-400 bg-slate-950 border-slate-800"
              />
            </div>

            {/* Resumen de la Orden */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block border-b border-slate-800 pb-1.5">
                Resumen de la Orden Financiera
              </span>

              <div className="flex justify-between text-slate-400">
                <span>Capital a debitar de tu billetera:</span>
                <span className="font-bold text-white">{formatCurrency(amount)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Intereses brutos estimados (+{project.expectedReturn}%):</span>
                <span className="font-bold text-emerald-400">+{formatCurrency(grossYield)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Retenciones fiscales (Ley CEMAC):</span>
                <span className="font-semibold text-slate-300">FCFA 0 (Exento)</span>
              </div>

              <div className="flex justify-between text-slate-200 border-t border-slate-800 pt-2 font-bold text-sm">
                <span>Capital Total Final Proyectado:</span>
                <span className="text-teal-400">{formatCurrency(totalReturn)}</span>
              </div>
            </div>

            {/* Checkboxes de Consentimiento Legal */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={readDossier}
                  onChange={(e) => setReadDossier(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span>
                  He leído y comprendo el <strong>Documento de Información Clave (Dossier)</strong> del proyecto y asumo el riesgo inherente.
                </span>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={acceptMandate}
                  onChange={(e) => setAcceptMandate(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span>
                  Acepto el <strong>Contrato de Mandato</strong> y reconozco que mi capital quedará inmovilizado durante {project.durationMonths} meses.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading || !readDossier || !acceptMandate}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold mt-2 h-11 text-sm"
            >
              {loading ? "Procesando Inversión..." : `Confirmar e Invertir ${formatCurrency(amount)}`}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
