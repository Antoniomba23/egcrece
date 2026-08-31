"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Wallet, ArrowUpRight, ShieldCheck, PlusCircle, ArrowDownLeft } from "lucide-react";
import { DepositModal } from "@/components/dashboard/DepositModal";
import { WithdrawModal } from "@/components/dashboard/WithdrawModal";

interface BalanceCardProps {
  balanceXAF: number;
  yieldXAF: number;
  kycStatus: string;
  onBalanceUpdated?: () => void;
}

export function BalanceCard({ balanceXAF, yieldXAF, kycStatus, onBalanceUpdated }: BalanceCardProps) {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const handleComplete = () => {
    if (onBalanceUpdated) {
      onBalanceUpdated();
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 flex flex-col justify-between">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Saldo Total (XAF)</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">{formatCurrency(balanceXAF)}</span>
              <span className="text-xs text-emerald-400 block mt-1">Disponible para inversión</span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
              <Button
                size="sm"
                onClick={() => setIsDepositOpen(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 flex items-center justify-center space-x-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Depositar</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsWithdrawOpen(true)}
                className="flex-1 border-slate-800 text-slate-300 hover:bg-slate-800 text-xs h-8 flex items-center justify-center space-x-1"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Retirar</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 flex flex-col justify-between">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Rendimiento Acumulado</span>
              <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-teal-400">{formatCurrency(yieldXAF)}</span>
              <span className="text-xs text-slate-400 block mt-1">+8.5% estimado anual</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 flex flex-col justify-between">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Estado KYC</span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-semibold capitalize text-slate-200">
                {kycStatus === "approved" ? "Verificado" : kycStatus === "pending" ? "Pendiente" : "No Verificado"}
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  kycStatus === "approved"
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                    : kycStatus === "pending"
                    ? "bg-amber-950 text-amber-400 border-amber-800"
                    : "bg-rose-950 text-rose-400 border-rose-800"
                }`}
              >
                {kycStatus.toUpperCase()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDepositComplete={handleComplete}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={balanceXAF}
        onWithdrawComplete={handleComplete}
      />
    </>
  );
}
