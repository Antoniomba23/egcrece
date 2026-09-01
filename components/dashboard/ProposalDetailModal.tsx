"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  FileText,
  Building2,
  Users,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileCheck,
} from "lucide-react";

export interface ProjectProposal {
  id: string;
  user_id: string | null;
  promoter_name: string;
  phone: string;
  email: string;
  title: string;
  category: string;
  location: string;
  target_amount: number;
  promoter_contribution: number;
  expected_return: number;
  duration_months: number;
  description: string;
  business_model?: string;
  risks_guarantees?: string;
  dossier_url?: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  created_at: string;
}

interface ProposalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: ProjectProposal | null;
  onApprove: (proposal: ProjectProposal) => void;
  onReject: (proposalId: string) => void;
}

export function ProposalDetailModal({
  isOpen,
  onClose,
  proposal,
  onApprove,
  onReject,
}: ProposalDetailModalProps) {
  if (!isOpen || !proposal) return null;

  const totalCapital = Number(proposal.target_amount) + Number(proposal.promoter_contribution || 0);
  const investorSharePercent = totalCapital > 0 ? Math.round((Number(proposal.target_amount) / totalCapital) * 100) : 0;
  const promoterSharePercent = 100 - investorSharePercent;

  // Formatear WhatsApp y Email
  const cleanPhone = proposal.phone.replace(/[^0-9]/g, "");
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

  // Obtener enlace público del dossier
  let publicDossierUrl: string | null = null;
  if (proposal.dossier_url) {
    if (proposal.dossier_url.startsWith("http") || proposal.dossier_url.startsWith("data:")) {
      publicDossierUrl = proposal.dossier_url;
    } else {
      const supabase = createClient();
      const { data } = supabase.storage.from("kyc-private").getPublicUrl(proposal.dossier_url);
      publicDossierUrl = data?.publicUrl || proposal.dossier_url;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="bg-slate-900 border-slate-800 text-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in-50 zoom-in-95">
        <CardHeader className="border-b border-slate-800 pb-4 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={`text-xs ${
                proposal.status === "approved"
                  ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                  : proposal.status === "rejected"
                  ? "bg-rose-950 text-rose-400 border-rose-800"
                  : "bg-amber-950 text-amber-400 border-amber-800"
              }`}
            >
              ESTADO: {proposal.status.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
              {proposal.category}
            </Badge>
          </div>

          <CardTitle className="text-xl font-bold text-white pt-2 leading-snug">
            {proposal.title}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 flex items-center gap-2">
            <span>Ubicación: <strong className="text-slate-200">{proposal.location}</strong></span>
            <span>•</span>
            <span>Fecha Registro: <strong className="text-slate-200">{new Date(proposal.created_at).toLocaleDateString("es-ES")}</strong></span>
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6 text-xs">
          {/* 1. Datos del Promotor */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Users className="h-4 w-4" /> 1. Datos de Contacto del Promotor
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Promotor / Razón Social:</span>
                <span className="font-bold text-white text-sm block">{proposal.promoter_name}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Teléfono / WhatsApp:</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-bold text-slate-200 font-mono">{proposal.phone}</span>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded hover:bg-emerald-900"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Correo Electrónico:</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-teal-400" />
                  <a href={`mailto:${proposal.email}`} className="font-semibold text-teal-400 hover:underline">
                    {proposal.email}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Estructura Financiera */}
          <div className="space-y-3">
            <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" /> 2. Estructura Financiera del Proyecto
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Capital Requerido</span>
                <span className="text-base font-extrabold text-emerald-400">{formatCurrency(proposal.target_amount)}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Aportación Promotor</span>
                <span className="text-base font-bold text-teal-400">{formatCurrency(proposal.promoter_contribution || 0)}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">TIR / Rendimiento</span>
                <span className="text-base font-extrabold text-white">+{proposal.expected_return}% Anual</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Plazo Ejecución</span>
                <span className="text-base font-bold text-slate-200">{proposal.duration_months} Meses</span>
              </div>
            </div>

            {/* Simulador de Reparto */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Reparto Participativo Estimado:</span>
              <div className="space-x-3 font-bold">
                <span className="text-emerald-400">Inversores: {investorSharePercent}%</span>
                <span className="text-teal-400">Promotor: {promoterSharePercent}%</span>
              </div>
            </div>
          </div>

          {/* 3. Memoria Descriptiva & Plan de Negocio */}
          <div className="space-y-4 pt-1">
            <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> 3. Plan de Negocio & Garantías
            </span>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">Descripción Narrativa del Proyecto:</span>
                <p className="text-slate-300 leading-relaxed">{proposal.description}</p>
              </div>

              {proposal.business_model && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">Modelo de Negocio e Ingresos:</span>
                  <p className="text-slate-300 leading-relaxed">{proposal.business_model}</p>
                </div>
              )}

              {proposal.risks_guarantees && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">Garantías & Colaterales de Respaldo:</span>
                  <p className="text-slate-300 leading-relaxed">{proposal.risks_guarantees}</p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Archivo Adjunto Dossier PDF */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileCheck className="h-4 w-4" /> 4. Dossier Ejecutivo Adjunto por el Promotor
            </span>

            {publicDossierUrl ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3 truncate">
                  <FileText className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-white block truncate">Dossier de Proyecto / Plan de Negocio</span>
                    <span className="text-[11px] text-slate-400 truncate block">Documento de respaldo PDF / Imagen</span>
                  </div>
                </div>

                <a href={publicDossierUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-emerald-800 text-emerald-400 hover:bg-emerald-950 text-xs font-bold shrink-0">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Abrir Documento PDF
                  </Button>
                </a>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 text-center">
                El promotor no adjuntó un archivo PDF secundario. Se utilizará la memoria descriptiva registrada.
              </div>
            )}
          </div>

          {/* Botones de Acción del Administrador */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
            >
              Cerrar Expediente
            </Button>

            {proposal.status === "pending" && (
              <div className="flex w-full sm:w-auto space-x-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    onReject(proposal.id);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none text-xs font-bold"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar Solicitud
                </Button>

                <Button
                  onClick={() => {
                    onApprove(proposal);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprobar y Publicar en Catálogo
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
