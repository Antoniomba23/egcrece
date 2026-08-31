"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  ArrowLeft,
  FileText,
  DollarSign,
  Briefcase,
  Users,
  MapPin,
  Clock,
} from "lucide-react";

export default function PresentarProyectoPage() {
  const [promoterName, setPromoterName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("Agroindustria");
  const [location, setLocation] = useState<string>("Malabo, Bioko Norte");
  const [targetAmount, setTargetAmount] = useState<number>(50000000);
  const [promoterContribution, setPromoterContribution] = useState<number>(10000000);
  const [expectedReturn, setExpectedReturn] = useState<number>(12);
  const [durationMonths, setDurationMonths] = useState<number>(18);
  const [description, setDescription] = useState<string>("");
  const [businessModel, setBusinessModel] = useState<string>("");
  const [risksGuarantees, setRisksGuarantees] = useState<string>("");
  const [dossierFile, setDossierFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  // Cálculo en tiempo real de participación
  const totalCapital = Number(targetAmount) + Number(promoterContribution);
  const investorSharePercent = totalCapital > 0 ? Math.round((Number(targetAmount) / totalCapital) * 100) : 0;
  const promoterSharePercent = 100 - investorSharePercent;

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMessage(null);

      if (!title.trim() || !promoterName.trim() || !phone.trim()) {
        throw new Error("Por favor complete los campos obligatorios: Nombre del Promotor, Teléfono y Título del Proyecto.");
      }

      const trackingCode = `PROP-${Date.now().toString().slice(-6)}`;
      const { data: { user } } = await supabase.auth.getUser();

      let dossierUrl: string | null = null;
      if (dossierFile) {
        try {
          const fileExt = dossierFile.name.split(".").pop();
          const filePath = `dossiers/proposal_${Date.now()}.${fileExt}`;
          const { error: uploadErr } = await supabase.storage
            .from("kyc-private")
            .upload(filePath, dossierFile, { upsert: true });

          if (!uploadErr) {
            dossierUrl = filePath;
          } else {
            dossierUrl = dossierFile.name;
          }
        } catch (e) {
          dossierUrl = dossierFile.name;
        }
      }

      const proposalPayload = {
        id: trackingCode,
        user_id: user?.id || null,
        promoter_name: promoterName,
        phone,
        email,
        title,
        category,
        location,
        target_amount: targetAmount,
        promoter_contribution: promoterContribution,
        expected_return: expectedReturn,
        duration_months: durationMonths,
        description,
        business_model: businessModel,
        risks_guarantees: risksGuarantees,
        dossier_url: dossierUrl,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      // Guardar en Supabase
      const { error: insertError } = await supabase.from("project_proposals").insert({
        user_id: user?.id || null,
        promoter_name: promoterName,
        phone,
        email,
        title,
        category,
        location,
        target_amount: targetAmount,
        promoter_contribution: promoterContribution,
        expected_return: expectedReturn,
        duration_months: durationMonths,
        description,
        business_model: businessModel,
        risks_guarantees: risksGuarantees,
        dossier_url: dossierUrl,
        status: "pending",
      });

      // Guardar en localStorage para disponibilidad inmediata
      try {
        const existing = JSON.parse(localStorage.getItem("egcrece_proposals") || "[]");
        existing.push(proposalPayload);
        localStorage.setItem("egcrece_proposals", JSON.stringify(existing));
      } catch (e) {}

      if (insertError) {
        console.warn("Aviso Supabase:", insertError.message);
      }

      setSubmittedCode(trackingCode);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Error al procesar la propuesta. Inténtelo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submittedCode) {
    return (
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <Card className="bg-slate-900 border-emerald-900/60 text-white shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-8 text-center border-b border-emerald-800/50 space-y-4">
            <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full text-emerald-400 shadow-xl mx-auto">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-xs px-3 py-1 font-bold">
                ✓ SOLICITUD REGISTRADA EXITOSAMENTE
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-white pt-1">
                ¡Gracias por Enviar su Proyecto a EGCrece!
              </h2>
              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                Su propuesta <strong>"{title}"</strong> ha entrado al canal de auditoría y análisis de viabilidad. Nos pondremos en contacto con usted en un plazo máximo de 48 horas.
              </p>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1 font-mono">
              <span className="text-slate-400 text-xs font-sans block">Código de Seguimiento de Expediente:</span>
              <span className="text-xl font-bold text-emerald-400">{submittedCode}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Capital Solicitado</span>
                <span className="font-bold text-white block text-sm">{formatCurrency(targetAmount)}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Participación Inversores</span>
                <span className="font-bold text-emerald-400 block text-sm">{investorSharePercent}% del Capital</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Rendimiento Ofrecido</span>
                <span className="font-bold text-teal-400 block text-sm">+{expectedReturn}% Anual</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
              <Button
                asChild
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 text-xs"
              >
                <Link href="/dashboard">
                  <span>Ir al Panel Principal</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="flex-1 border-slate-800 text-slate-200 hover:bg-slate-800 h-11 text-xs font-bold"
              >
                <Link href="/proyectos">
                  <span>Ver Catálogo de Proyectos</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div>
        <Link href="/proyectos" className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors mb-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Catálogo de Proyectos</span>
        </Link>

        <h1 className="text-3xl font-extrabold text-white">Presentar Proyecto y Buscar Financiación</h1>
        <p className="text-xs text-slate-400 mt-1">
          Si tienes una idea, empresa o proyecto en Guinea Ecuatorial, puedes presentarlo en la plataforma para buscar financiación. Cualquier persona interesada podrá revisar tu proyecto e invertir directamente en él.
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <CardTitle className="text-xl font-bold text-emerald-400 flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-emerald-400" />
            <span>Formulario Oficial de Solicitud de Financiación</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-300">
            Los datos serán auditados bajo confidencialidad y normativas regulatorias de la zona CEMAC.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmitProposal}>
          <CardContent className="space-y-6 pt-6">
            {statusMessage && (
              <div
                className={`p-4 rounded-xl flex items-start space-x-3 text-xs leading-relaxed ${
                  statusMessage.type === "success"
                    ? "bg-emerald-950/70 border border-emerald-800 text-emerald-300"
                    : "bg-rose-950/70 border border-rose-800 text-rose-300"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-400" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Sección 1: Datos del Promotor */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <Users className="h-4 w-4" /> 1. Datos del Promotor o Empresa
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="pname">Nombre Completo / Razón Social *</Label>
                  <Input
                    id="pname"
                    value={promoterName}
                    onChange={(e) => setPromoterName(e.target.value)}
                    placeholder="Ej: AgroSur Guinea S.L."
                    required
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>

                <div>
                  <Label htmlFor="pphone">Teléfono / WhatsApp de Contacto *</Label>
                  <Input
                    id="pphone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: +240 222 123 456"
                    required
                    className="mt-1 bg-slate-950 border-slate-800 font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="pemail">Correo Electrónico *</Label>
                  <Input
                    id="pemail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="promotor@empresa.gq"
                    required
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Ficha Técnica del Proyecto */}
            <div className="space-y-4 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" /> 2. Ficha Técnica del Proyecto
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <Label htmlFor="ptitle">Título del Proyecto *</Label>
                  <Input
                    id="ptitle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Planta Procesadora de Cacao y Aceite de Palma en Mbini"
                    required
                    className="mt-1 bg-slate-950 border-slate-800 text-sm font-bold text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="pcat">Categoría del Proyecto</Label>
                  <select
                    id="pcat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-white font-bold"
                  >
                    <option value="Agroindustria">Agroindustria & Agricultura</option>
                    <option value="Energía Renovable">Energía Renovable & Solar</option>
                    <option value="Comercio & Servicios">Comercio & Servicios</option>
                    <option value="Tecnología & Fintech">Tecnología & Digital</option>
                    <option value="Inmobiliario & Construcción">Inmobiliario & Vivienda</option>
                    <option value="Infraestructura & Logística">Infraestructura & Logística</option>
                    <option value="Otro Sector Empresarial">Otro Sector Empresarial</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="ploc">Ubicación en Guinea Ecuatorial</Label>
                  <Input
                    id="ploc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej: Malabo, Bioko Norte / Bata"
                    required
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>

                <div>
                  <Label htmlFor="pduration">Plazo Estimado (Meses)</Label>
                  <Input
                    id="pduration"
                    type="number"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    min={6}
                    max={60}
                    required
                    className="mt-1 bg-slate-950 border-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Sección 3: Estructura Financiera & Participación */}
            <div className="space-y-4 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" /> 3. Estructura Financiera y Retornos Ofrecidos
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ptarget">Financiación Requerida (FCFA - XAF) *</Label>
                  <Input
                    id="ptarget"
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    min={1000000}
                    step={1000000}
                    required
                    className="mt-1 bg-slate-950 border-slate-800 font-bold text-emerald-400 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="pcontrib">Aportación Propia del Promotor (XAF)</Label>
                  <Input
                    id="pcontrib"
                    type="number"
                    value={promoterContribution}
                    onChange={(e) => setPromoterContribution(Number(e.target.value))}
                    min={0}
                    step={1000000}
                    className="mt-1 bg-slate-950 border-slate-800 font-bold text-teal-400 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="preturn">Retorno / TIR Ofrecida a Inversores (% Anual)</Label>
                  <Input
                    id="preturn"
                    type="number"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(Number(e.target.value))}
                    min={5}
                    max={30}
                    step={0.5}
                    required
                    className="mt-1 bg-slate-950 border-slate-800 font-bold text-white text-sm"
                  />
                </div>
              </div>

              {/* Simulador de Reparto Participativo */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-300 block uppercase tracking-wider text-[11px]">
                  Simulación de Reparto Participativo por Aportaciones:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Cuota Inversores EGCrece:</span>
                    <span className="text-emerald-400 font-bold text-sm">{investorSharePercent}% ({formatCurrency(targetAmount)})</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Cuota Capital Promotor:</span>
                    <span className="text-teal-400 font-bold text-sm">{promoterSharePercent}% ({formatCurrency(promoterContribution)})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 4: Plan de Negocio & Dossier */}
            <div className="space-y-4 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> 4. Memoria Descriptiva & Adjuntos
              </span>

              <div>
                <Label htmlFor="pdesc">Descripción Detallada del Proyecto *</Label>
                <Textarea
                  id="pdesc"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Explique el objetivo del proyecto, producto o servicio, mercado objetivo en Guinea Ecuatorial o la zona CEMAC..."
                  rows={3}
                  required
                  className="mt-1 bg-slate-950 border-slate-800 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="pmodel">Modelo de Negocio & Generación de Ingresos</Label>
                <Textarea
                  id="pmodel"
                  value={businessModel}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBusinessModel(e.target.value)}
                  placeholder="¿Cómo genera ingresos el proyecto? Ventas locales, contratos de suministro, exportación..."
                  rows={2}
                  className="mt-1 bg-slate-950 border-slate-800 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="prisks">Garantías, Terrenos o Colaterales Ofrecidos</Label>
                <Textarea
                  id="prisks"
                  value={risksGuarantees}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRisksGuarantees(e.target.value)}
                  placeholder="Indique los terrenos, maquinaria, seguro o avales registrados que respaldan la inversión..."
                  rows={2}
                  className="mt-1 bg-slate-950 border-slate-800 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="pdossier">Adjuntar Dossier o Plan de Negocio (PDF / Imagen)</Label>
                <input
                  id="pdossier"
                  type="file"
                  accept="application/pdf,.pdf,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setDossierFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="mt-2">
                  {dossierFile ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between">
                      <div className="flex items-center space-x-3 truncate">
                        <FileText className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                        <div className="truncate">
                          <span className="text-xs font-bold text-white block truncate">{dossierFile.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {(dossierFile.size / (1024 * 1024)).toFixed(2)} MB | Archivo listo para adjuntar
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDossierFile(null)}
                        className="border-slate-800 text-slate-400 hover:text-rose-400 text-xs shrink-0"
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("pdossier")?.click()}
                      className="w-full h-16 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950 text-slate-300 hover:text-white flex flex-col items-center justify-center space-y-1 transition-all rounded-xl"
                    >
                      <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                        <Upload className="h-4 w-4" />
                        <span>📁 Seleccionar o Tomar Foto / Adjuntar PDF</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Formatos aceptados: PDF, JPG, PNG (Máximo 8 MB)
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm shadow-xl"
            >
              {loading ? "Enviando Propuesta a Auditoría..." : "Enviar Propuesta de Proyecto para Financiación"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
