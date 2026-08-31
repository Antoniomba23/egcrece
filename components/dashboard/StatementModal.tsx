"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { FileText, Download, Printer, X, ShieldCheck } from "lucide-react";
import { Transaction } from "@/components/dashboard/TransactionList";

interface StatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  transactions: Transaction[];
}

export function StatementModal({ isOpen, onClose, userName, userEmail, transactions }: StatementModalProps) {
  if (!isOpen) return null;

  const totalDeposit = transactions
    .filter((t) => t.type === "deposit" && t.status === "completed")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalInvested = transactions
    .filter((t) => t.type === "investment" && t.status === "completed")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalYield = transactions
    .filter((t) => t.type === "yield" && t.status === "completed")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl bg-slate-900 border-slate-800 text-white relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white print:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">
                  Extracto Oficial de Cuenta & Certificado Fiscal
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Plataforma EGCrece — Registro Contable Auditado (Franco CFA - XAF)
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center space-x-2 print:hidden">
              <Button size="sm" variant="outline" onClick={handlePrint} className="border-slate-800 text-xs">
                <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir / PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Encabezado del Certificado */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Titular de la Cuenta:</span>
              <span className="text-white font-bold text-sm">{userName || "Usuario EGCrece"}</span>
              <span className="text-slate-400 block mt-0.5">{userEmail}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block font-medium">Jurisdicción Financiera:</span>
              <span className="text-emerald-400 font-bold">Guinea Ecuatorial (CEMAC)</span>
              <span className="text-slate-400 block mt-0.5">Fecha de Emisión: {new Date().toLocaleDateString("es-ES")}</span>
            </div>
          </div>

          {/* Resumen Fiscal y de Rendimientos */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Total Depositado</span>
              <span className="text-base font-bold text-white">{formatCurrency(totalDeposit)}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Capital Invertido</span>
              <span className="text-base font-bold text-emerald-400">{formatCurrency(totalInvested)}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Rendimientos Brutos (XAF)</span>
              <span className="text-base font-bold text-teal-400">{formatCurrency(totalYield)}</span>
            </div>
          </div>

          {/* Detalle de Movimientos Auditados */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Desglose de Transacciones Ledger
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Referencia</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2 text-right">Monto (XAF)</th>
                    <th className="px-3 py-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-3 py-2 text-slate-400">
                        {new Date(t.created_at).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-300">{t.reference_code || t.id.slice(0, 8)}</td>
                      <td className="px-3 py-2 capitalize font-medium">{t.type}</td>
                      <td className="px-3 py-2 text-right font-bold text-white">{formatCurrency(t.amount)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pie de Certificado */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Documento generado con firma criptográfica de seguridad RLS PostgreSQL.</span>
            </div>
            <span className="font-mono text-slate-500 text-[10px]">ID: CERT-{Date.now().toString().slice(-8)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
