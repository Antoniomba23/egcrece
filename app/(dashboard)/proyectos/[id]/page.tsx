"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InvestmentCheckoutModal } from "@/components/projects/InvestmentCheckoutModal";
import { DepositModal } from "@/components/dashboard/DepositModal";
import {
  Building2,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Clock,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  FileText,
  Layers,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface ProjectDetail {
  id: string;
  title: string;
  category: string;
  location: string;
  target_amount: number;
  raised_amount: number;
  expected_return: number;
  duration_months: number;
  risk_level: "Bajo" | "Moderado" | "Alto";
  status: string;
  description?: string | null;
  business_model?: string | null;
  risks_guarantees?: string | null;
  image_url?: string | null;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [calcAmount, setCalcAmount] = useState<number>(50000);
  const [activeTab, setActiveTab] = useState<"summary" | "risks" | "timeline" | "docs">("summary");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);

  const supabase = createClient();

  const fetchProjectDetail = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (!error && data) {
        setProject(data);
      } else {
        let localApproved: any[] = [];
        try {
          localApproved = JSON.parse(localStorage.getItem("egcrece_approved_projects") || "[]");
        } catch (e) {}
        const found = localApproved.find((p: any) => p.id === projectId);
        if (found) {
          setProject(found);
        } else {
          let localProps: any[] = [];
          try {
            localProps = JSON.parse(localStorage.getItem("egcrece_proposals") || "[]");
          } catch (e) {}
          const foundProp = localProps.find((p: any) => p.id === projectId);
          if (foundProp) {
            setProject({
              id: foundProp.id,
              title: foundProp.title,
              category: foundProp.category,
              location: foundProp.location,
              target_amount: foundProp.target_amount,
              raised_amount: foundProp.promoter_contribution || 0,
              expected_return: foundProp.expected_return,
              duration_months: foundProp.duration_months,
              risk_level: "Moderado",
              status: foundProp.status,
              description: foundProp.description,
              business_model: foundProp.business_model,
              risks_guarantees: foundProp.risks_guarantees,
            });
          } else {
            setProject(null);
          }
        }
      }
    } catch (err) {
      console.error("Error al cargar detalle del proyecto:", err);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetail();
  }, [projectId]);

  if (loading) {
    return (
      <div className="container mx-auto py-16 text-center text-slate-400 animate-pulse text-sm">
        Cargando expediente del proyecto...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-16 text-center text-white space-y-4">
        <h2 className="text-xl font-bold">Proyecto no encontrado</h2>
        <Link href="/proyectos">
          <Button variant="outline">Volver al Catálogo</Button>
        </Link>
      </div>
    );
  }

  // Cálculos de la Calculadora Integrada
  const raisedPercent = Math.min(100, Math.round((Number(project.raised_amount) / Number(project.target_amount)) * 100));
  const calcGrossReturn = (calcAmount * Number(project.expected_return)) / 100;
  const calcTotalReturn = calcAmount + calcGrossReturn;

  const projectImage = project.image_url || "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="space-y-8 pb-16">
      {/* Botón de Retorno al Catálogo */}
      <div>
        <Link href="/proyectos" className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Catálogo de Proyectos</span>
        </Link>
      </div>

      {/* Hero Visual Header */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="h-64 sm:h-80 w-full relative bg-slate-950">
          <img
            src={projectImage}
            alt={project.title}
            className="w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-semibold">
                {project.category}
              </Badge>
              <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>{project.location}</span>
              </Badge>

              <Badge
                variant="outline"
                className={`text-xs ${
                  project.risk_level === "Bajo"
                    ? "border-emerald-800 text-emerald-400 bg-emerald-950/60"
                    : project.risk_level === "Moderado"
                    ? "border-amber-800 text-amber-400 bg-amber-950/60"
                    : "border-rose-800 text-rose-400 bg-rose-950/60"
                }`}
              >
                Riesgo {project.risk_level}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {project.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Grid Principal: Tabs de Información Profunda + Sticky Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda (2/3): Pestañas dinámicas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex overflow-x-auto whitespace-nowrap space-x-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab("summary")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === "summary" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Resumen Ejecutivo
            </button>
            <button
              onClick={() => setActiveTab("risks")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === "risks" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Riesgos & Garantías
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === "timeline" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Cronograma de Ejecución
            </button>
            <button
              onClick={() => setActiveTab("docs")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === "docs" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Documentación Legal (PDF)
            </button>
          </div>

          {/* Tab 1: Resumen Ejecutivo */}
          {activeTab === "summary" && (
            <Card className="bg-slate-900 border-slate-800 text-white p-6 space-y-4">
              <h3 className="text-lg font-bold text-emerald-400">Descripción Narrativa del Proyecto</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {project.description ||
                  `Este proyecto de ${project.category} ubicado en ${project.location} tiene como objetivo impulsar el desarrollo económico local en Guinea Ecuatorial. El capital captado se destina al financiamiento directo y ejecución supervisada bajo estrictas normativas.`}
              </p>

              {project.business_model && (
                <>
                  <h4 className="text-sm font-bold text-white pt-2">Modelo de Negocio & Oportunidad Local</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{project.business_model}</p>
                </>
              )}
            </Card>
          )}

          {/* Tab 2: Análisis de Riesgos y Garantías */}
          {activeTab === "risks" && (
            <Card className="bg-slate-900 border-slate-800 text-white p-6 space-y-4">
              <h3 className="text-lg font-bold text-emerald-400 flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Colaterales y Garantías de Respaldo</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {project.risks_guarantees ||
                  `El proyecto cuenta con colaterales pignorados y garantías reales respaldadas por activos e inscritos formalmente en Guinea Ecuatorial (Nivel de riesgo: ${project.risk_level}).`}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <span className="font-bold text-emerald-400 block mb-1">Respaldo Colateral</span>
                  <span className="text-slate-400">Garantía real constituida ante notario oficial en {project.location}.</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <span className="font-bold text-teal-400 block mb-1">Supervisión Regulatoria</span>
                  <span className="text-slate-400">Auditoría contable y cumplimiento bajo directrices de la zona CEMAC.</span>
                </div>
              </div>
            </Card>
          )}

          {/* Tab 3: Cronograma de Ejecución */}
          {activeTab === "timeline" && (
            <Card className="bg-slate-900 border-slate-800 text-white p-6 space-y-6">
              <h3 className="text-lg font-bold text-emerald-400">Línea de Tiempo del Proyecto (Stepper)</h3>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-800">
                <div className="relative flex items-start space-x-4 pl-8">
                  <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-[10px]">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Fase 1: Recaudación de Fondos (En Curso)</h4>
                    <p className="text-xs text-slate-400">Meta: {formatCurrency(project.target_amount)}. Resguardo en custodia hasta completar el 100%.</p>
                  </div>
                </div>

                <div className="relative flex items-start space-x-4 pl-8">
                  <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">Fase 2: Adquisición de Activos e Inicio de Obras</h4>
                    <p className="text-xs text-slate-400">Desembolso supervisado de los recursos y ejecución técnica en {project.location}.</p>
                  </div>
                </div>

                <div className="relative flex items-start space-x-4 pl-8">
                  <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">Fase 3: Operación Comercial y Distribución de Cupones</h4>
                    <p className="text-xs text-slate-400">Generación de flujo de caja y abono de rendimientos durante {project.duration_months} meses.</p>
                  </div>
                </div>

                <div className="relative flex items-start space-x-4 pl-8">
                  <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                    4
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">Fase 4: Retorno del Principal & Liquidación Final</h4>
                    <p className="text-xs text-slate-400">Devolución íntegra del capital invertido más el cupón final a la billetera.</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Tab 4: Documentación Legal */}
          {activeTab === "docs" && (
            <Card className="bg-slate-900 border-slate-800 text-white p-6 space-y-4">
              <h3 className="text-lg font-bold text-emerald-400">Archivos PDF Descargables Configurados por Admin</h3>
              <div className="space-y-3">
                {((project as any).legal_documents && Array.isArray((project as any).legal_documents) && (project as any).legal_documents.length > 0
                  ? (project as any).legal_documents
                  : [
                      { name: "Dossier Comercial y Prospecto Informativo", url: "https://example.com/dossier.pdf", size: "2.4 MB" },
                      { name: "Borrador del Contrato de Mandato e Inversión", url: "https://example.com/contrato.pdf", size: "1.1 MB" },
                    ]
                ).map((doc: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-emerald-400" />
                      <div>
                        <span className="font-bold text-xs text-white block">{doc.name}</span>
                        <span className="text-[10px] text-slate-400">{doc.size || "PDF Document"}</span>
                      </div>
                    </div>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-slate-800 text-xs">
                        <Download className="h-3.5 w-3.5 mr-1" /> Descargar PDF
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Columna Derecha (1/3): Sticky Sidebar con Calculadora */}
        <div>
          <Card className="bg-slate-900 border-emerald-500/30 text-white p-6 space-y-6 sticky top-20 shadow-2xl">
            {/* Progress Bar Recaudación */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-400">Progreso Recaudación:</span>
                <span className="text-emerald-400">{raisedPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${raisedPercent}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                <span>{formatCurrency(project.raised_amount)}</span>
                <span className="font-bold text-slate-200">{formatCurrency(project.target_amount)}</span>
              </div>
            </div>

            {/* Grid de Datos Financieros Clave */}
            <div className="grid grid-cols-2 gap-3 border-y border-slate-800 py-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">TIR Anual Estimada:</span>
                <span className="text-lg font-extrabold text-emerald-400">+{project.expected_return}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Plazo Inmovilización:</span>
                <span className="text-lg font-extrabold text-white">{project.duration_months} Meses</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Frecuencia de Pago:</span>
                <span className="font-bold text-slate-200">Trimestral</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Monto Mínimo:</span>
                <span className="font-bold text-slate-200">FCFA 5.000</span>
              </div>
            </div>

            {/* Calculadora Integrada de Retorno */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                <TrendingUp className="h-4 w-4" />
                <span>Calculadora Integrada de Retorno Neto</span>
              </span>

              <div>
                <Label htmlFor="pdpCalcAmount" className="text-[11px] text-slate-400">Monto a Invertir (FCFA - XAF):</Label>
                <Input
                  id="pdpCalcAmount"
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  min={5000}
                  step={5000}
                  className="mt-1 bg-slate-900 border-slate-800 text-emerald-400 font-bold text-sm"
                />
              </div>

              <div className="space-y-1 text-xs pt-1">
                <div className="flex justify-between text-slate-400">
                  <span>Ganancia Neta Estimada:</span>
                  <span className="font-bold text-emerald-400">+{formatCurrency(calcGrossReturn)}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-slate-800">
                  <span>Capital Total al Vencimiento:</span>
                  <span className="text-teal-400">{formatCurrency(calcTotalReturn)}</span>
                </div>
              </div>
            </div>

            {/* Botón Principal de Acción */}
            <Button
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm shadow-lg"
            >
              Invertir en este proyecto
            </Button>
          </Card>
        </div>
      </div>

      {/* Modal de Checkout */}
      <InvestmentCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        project={{
          id: project.id,
          title: project.title,
          expectedReturn: Number(project.expected_return),
          targetAmount: Number(project.target_amount),
          raisedAmount: Number(project.raised_amount),
          durationMonths: Number(project.duration_months),
        }}
        initialAmount={calcAmount}
        onInvestmentComplete={fetchProjectDetail}
        onOpenDeposit={() => setIsDepositOpen(true)}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDepositComplete={fetchProjectDetail}
      />
    </div>
  );
}
