"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Wallet, TrendingUp, ArrowUpRight, ShieldCheck, PlusCircle, FileText, ArrowDownLeft, Filter } from "lucide-react";
import { MyInvestmentsTable } from "@/components/dashboard/MyInvestmentsTable";
import { PortfolioChart } from "@/components/dashboard/PortfolioChart";
import { TransactionList, Transaction } from "@/components/dashboard/TransactionList";
import { DepositModal } from "@/components/dashboard/DepositModal";
import { WithdrawModal } from "@/components/dashboard/WithdrawModal";
import { StatementModal } from "@/components/dashboard/StatementModal";
import Link from "next/link";

interface InvestorPanelProps {
  userId: string;
  userName: string;
  userEmail: string;
  kycStatus: string;
  transactions: Transaction[];
  onDataRefresh?: () => void;
}

export function InvestorPanel({
  userId,
  userName,
  userEmail,
  kycStatus,
  transactions,
  onDataRefresh,
}: InvestorPanelProps) {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  // Cálculo de KPIs
  const totalDeposit = transactions
    .filter((t) => t.type === "deposit" && t.status === "completed")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalInvested = transactions
    .filter((t) => t.type === "investment" && t.status === "completed")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalYield = transactions
    .filter((t) => t.type === "yield" && t.status === "completed")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const availableBalance = Math.max(0, totalDeposit - totalInvested);

  // Filtrado dinámico de transacciones
  const filteredTransactions = transactions.filter((t) => {
    if (filterType === "all") return true;
    return t.type === filterType;
  });

  const handleRefresh = () => {
    if (onDataRefresh) onDataRefresh();
  };

  return (
    <div className="space-y-8">
      {/* 1. Cabecera con Acciones Primarias */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">Panel de Cartera Personal</h1>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5 font-bold">
              INVERSOR
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de saldo líquido, inversiones activas en Guinea Ecuatorial y extractos contables.
          </p>
        </div>

        {/* Acciones de Borde Primarias */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={() => setIsDepositOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 px-3 flex items-center justify-center space-x-1 font-semibold w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Depositar XAF</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsWithdrawOpen(true)}
            className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs h-9 px-3 flex items-center justify-center space-x-1 font-semibold w-full sm:w-auto"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Solicitar Retiro</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsStatementOpen(true)}
            className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs h-9 px-3 flex items-center justify-center space-x-1 col-span-2 sm:col-span-1 w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>Extracto / Certificado Fiscal</span>
          </Button>

          {kycStatus !== "approved" && (
            <Link href="/kyc" className="col-span-2 sm:col-span-1 w-full sm:w-auto">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-9 px-3 font-semibold w-full">
                <ShieldCheck className="h-4 w-4 mr-1" /> Subir KYC
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 2. KPIs Principales (4 Tarjetas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta 1: Saldo Disponible */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Saldo Disponible (XAF)</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">{formatCurrency(availableBalance)}</span>
              <span className="text-[11px] text-emerald-400 block mt-1 font-medium">Billetera Móvil Lista</span>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta 2: Total Invertido */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Capital Invertido Activo</span>
              <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-teal-400">{formatCurrency(totalInvested)}</span>
              <span className="text-[11px] text-slate-400 block mt-1">En proyectos locales</span>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta 3: Rendimientos Acumulados */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Rendimientos Acumulados</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-400">{formatCurrency(totalYield)}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Intereses cobrados</span>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta 4: Estado KYC */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Verificación KYC</span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-bold capitalize text-white">
                {kycStatus === "approved" ? "Verificado" : kycStatus === "pending" ? "Pendiente" : "No Verificado"}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase ${
                  kycStatus === "approved"
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                    : kycStatus === "pending"
                    ? "bg-amber-950 text-amber-400 border-amber-800"
                    : "bg-rose-950 text-rose-400 border-rose-800"
                }`}
              >
                {kycStatus.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Gráfico de Evolución del Portafolio */}
      <PortfolioChart totalBalance={totalDeposit + totalYield} />

      {/* 4. Tabla Mis Inversiones */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <span>Mis Inversiones Activas</span>
        </h2>
        <MyInvestmentsTable userId={userId} />
      </div>

      {/* 5. Historial de Transacciones Filtrable */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">Historial del Ledger Personal</h2>

          {/* Filtros dinámicos (Horiz. Scroll sin desbordar el Viewport Móvil) */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 max-w-full overflow-x-auto whitespace-nowrap no-scrollbar">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5 shrink-0" />
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all shrink-0 ${
                filterType === "all" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Todos ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType("deposit")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all shrink-0 ${
                filterType === "deposit" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Depósitos
            </button>
            <button
              onClick={() => setFilterType("investment")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all shrink-0 ${
                filterType === "investment" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Inversiones
            </button>
            <button
              onClick={() => setFilterType("yield")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all shrink-0 ${
                filterType === "yield" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Rendimientos
            </button>
            <button
              onClick={() => setFilterType("withdrawal")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all shrink-0 ${
                filterType === "withdrawal" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Retiros
            </button>
          </div>
        </div>

        <TransactionList transactions={filteredTransactions} />
      </div>

      {/* Modales Integrados */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDepositComplete={handleRefresh}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={availableBalance}
        onWithdrawComplete={handleRefresh}
      />

      <StatementModal
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        userName={userName}
        userEmail={userEmail}
        transactions={transactions}
      />
    </div>
  );
}
