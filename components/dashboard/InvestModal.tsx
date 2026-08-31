"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, X, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    expectedReturn: number;
    targetAmount: number;
    raisedAmount: number;
  } | null;
  onInvestmentComplete: () => void;
}

export function InvestModal({ isOpen, onClose, project, onInvestmentComplete }: InvestModalProps) {
  const [amount, setAmount] = useState<number>(25000);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  if (!isOpen || !project) return null;

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMessage(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Debe iniciar sesión para realizar una inversión.");
      }

      // 1. Obtener perfil del inversor para verificar KYC y Rol
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, kyc_status")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        throw new Error("Separación de Funciones (SoD): Los administradores no pueden ejecutar inversiones desde la cuenta corporativa. Regístrese con una cuenta de Inversor.");
      }

      if (profile?.kyc_status !== "approved") {
        throw new Error("Debe completar su verificación de identidad (KYC) para activar su cuenta antes de realizar una inversión.");
      }

      // 2. Insertar transacción atómica de inversión en el ledger
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: user.id,
        amount: amount,
        currency: "XAF",
        type: "investment",
        status: "completed",
        reference_code: `INV-${project.id.slice(0, 6)}-${Date.now()}`,
      });

      if (txError) throw txError;

      // 3. Actualizar la recaudación acumulada del proyecto
      const newRaised = Number(project.raisedAmount) + Number(amount);
      const { error: projError } = await supabase
        .from("projects")
        .update({ raised_amount: newRaised })
        .eq("id", project.id);

      if (projError) throw projError;

      setStatusMessage({
        type: "success",
        text: `Inversión de ${formatCurrency(amount)} confirmada en ${project.title}.`,
      });

      setTimeout(() => {
        onInvestmentComplete();
        onClose();
      }, 1500);
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader>
          <CardTitle className="text-xl font-bold text-emerald-400 flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Confirmar Inversión en FCFA</span>
          </CardTitle>
          <CardDescription className="text-slate-300 font-semibold">
            {project.title} (+{project.expectedReturn}% Anual)
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleInvest}>
          <CardContent className="space-y-4">
            {statusMessage && (
              <div
                className={`p-3 rounded-md flex items-center space-x-2 text-xs ${
                  statusMessage.type === "success"
                    ? "bg-emerald-950/50 border border-emerald-800 text-emerald-300"
                    : "bg-rose-950/50 border border-rose-800 text-rose-300"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div>
              <Label htmlFor="investAmount">Monto a Invertir (Franco CFA - XAF)</Label>
              <Input
                id="investAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1000}
                step={1000}
                required
                className="mt-1 text-lg font-bold text-emerald-400"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Monto mínimo: FCFA 5,000 | Sin comisiones ocultas
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Retorno Estimado Anual:</span>
                <span className="text-emerald-400 font-bold">+{project.expectedReturn}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Rendimiento Anual Estimado:</span>
                <span className="text-white font-semibold">{formatCurrency((amount * project.expectedReturn) / 100)}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold mt-2"
            >
              {loading ? "Procesando Transacción..." : `Invertir ${formatCurrency(amount)}`}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
