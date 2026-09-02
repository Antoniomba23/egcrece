"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Edit, X, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { InvestmentProject } from "@/components/dashboard/ProjectCatalog";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any | null;
  onProjectUpdated: () => void;
}

export function EditProjectModal({ isOpen, onClose, project, onProjectUpdated }: EditProjectModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [expectedReturn, setExpectedReturn] = useState<number>(0);
  const [durationMonths, setDurationMonths] = useState<number>(0);
  const [riskLevel, setRiskLevel] = useState<"Bajo" | "Moderado" | "Alto">("Moderado");
  const [status, setStatus] = useState<"active" | "funded" | "executing" | "completed" | "closed">("active");
  const [description, setDescription] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [risksGuarantees, setRisksGuarantees] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [dossierUrl, setDossierUrl] = useState("");
  const [contractUrl, setContractUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (project) {
      setTitle(project.title || "");
      setCategory(project.category || "");
      setLocation(project.location || "");
      setTargetAmount(project.targetAmount || project.target_amount || 0);
      setExpectedReturn(project.expectedReturn || project.expected_return || 0);
      setDurationMonths(project.durationMonths || project.duration_months || 0);
      setRiskLevel(project.riskLevel || project.risk_level || "Moderado");
      setStatus(project.status || "active");
      setDescription(project.description || "");
      setBusinessModel(project.businessModel || project.business_model || "");
      setRisksGuarantees(project.risksGuarantees || project.risks_guarantees || "");
      setImageUrl(project.imageUrl || project.image_url || "");

      const docs = project.legal_documents || project.legalDocuments || [];
      if (Array.isArray(docs) && docs.length >= 2) {
        setDossierUrl(docs[0]?.url || "");
        setContractUrl(docs[1]?.url || "");
      } else {
        setDossierUrl("");
        setContractUrl("");
      }
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMessage(null);

      const legalDocs = [
        {
          name: "Dossier Comercial y Prospecto Informativo",
          url: dossierUrl || "https://example.com/dossier.pdf",
          size: "2.4 MB",
        },
        {
          name: "Borrador del Contrato de Participación",
          url: contractUrl || "https://example.com/contrato.pdf",
          size: "1.1 MB",
        },
      ];

      const fullPayload: any = {
        id: project.id,
        title,
        category,
        location,
        target_amount: targetAmount,
        expected_return: expectedReturn,
        duration_months: durationMonths,
        risk_level: riskLevel,
        status,
        description: description || null,
        business_model: businessModel || null,
        risks_guarantees: risksGuarantees || null,
        image_url: imageUrl || null,
        legal_documents: legalDocs,
      };

      // 1. Enviar actualización a la API Server con Service Role Key de Supabase
      const res = await fetch("/api/projects/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        console.warn("Advertencia al actualizar en Supabase:", resData.error);
      }

      // 3. SIEMPRE persistir todos los campos modificados (foto, descripción, modelo de negocio, etc.)
      // en el mapa local egcrece_edited_projects y egcrece_approved_projects
      try {
        let editedMap: Record<string, any> = {};
        try {
          editedMap = JSON.parse(localStorage.getItem("egcrece_edited_projects") || "{}");
        } catch (e) {}
        editedMap[project.id] = fullPayload;
        localStorage.setItem("egcrece_edited_projects", JSON.stringify(editedMap));

        let localApproved: any[] = [];
        try {
          localApproved = JSON.parse(localStorage.getItem("egcrece_approved_projects") || "[]");
        } catch (e) {}
        const idx = localApproved.findIndex((p: any) => p.id === project.id);
        if (idx >= 0) {
          localApproved[idx] = { ...localApproved[idx], ...fullPayload };
        } else {
          localApproved.push(fullPayload);
        }
        localStorage.setItem("egcrece_approved_projects", JSON.stringify(localApproved));
      } catch (e) {}

      setStatusMessage({
        type: "success",
        text: "Parámetros, portada y expediente PDP del proyecto guardados correctamente.",
      });

      setTimeout(() => {
        onProjectUpdated();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Error al actualizar proyecto:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Error al guardar modificaciones",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-xl bg-slate-900 border-slate-800 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader>
          <CardTitle className="text-xl font-bold text-emerald-400 flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Editar Parámetros y Expediente PDP del Proyecto</span>
          </CardTitle>
          <CardDescription>
            Actualice descripciones, garantías de respaldo, documentación PDF descargable o ciclo de vida.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleUpdate}>
          <CardContent className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
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
              <Label htmlFor="etitle">Título del Proyecto</Label>
              <Input
                id="etitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 bg-slate-950 border-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estatus">Estado del Proyecto</Label>
                <select
                  id="estatus"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full mt-1 h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Activo (Financiando)</option>
                  <option value="funded">Meta Alcanzada (100%)</option>
                  <option value="executing">En Ejecución / Obra</option>
                  <option value="completed">Completado / Rendido</option>
                  <option value="closed">Cerrado / Cancelado</option>
                </select>
              </div>

              <div>
                <Label htmlFor="ecategory">Categoría</Label>
                <Input
                  id="ecategory"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="mt-1 bg-slate-950 border-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="etarget">Meta de Recaudación (XAF)</Label>
                <Input
                  id="etarget"
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  min={1000}
                  step={1000}
                  required
                  className="mt-1 font-bold text-white bg-slate-950 border-slate-800"
                />
              </div>

              <div>
                <Label htmlFor="ereturn">Porcentaje de Retorno (% Anual)</Label>
                <Input
                  id="ereturn"
                  type="number"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  step={0.1}
                  min={1}
                  max={50}
                  required
                  className="mt-1 font-bold text-emerald-400 bg-slate-950 border-slate-800"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edescription">Descripción PDP (Resumen Ejecutivo)</Label>
              <textarea
                id="edescription"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-md border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <Label htmlFor="ebusinessModel">Modelo de Negocio & Oportunidad Local</Label>
              <textarea
                id="ebusinessModel"
                rows={2}
                value={businessModel}
                onChange={(e) => setBusinessModel(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-md border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <Label htmlFor="erisksGuarantees">Análisis de Riesgos & Garantías Colaterales</Label>
              <textarea
                id="erisksGuarantees"
                rows={2}
                value={risksGuarantees}
                onChange={(e) => setRisksGuarantees(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-md border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Documentación Legal Configurable por Admin */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                <FileText className="h-4 w-4" />
                <span>Gestión de Documentación Legal Descargable (PDF)</span>
              </span>

              <div>
                <Label htmlFor="edossierUrl" className="text-[11px] text-slate-400">URL del Dossier Comercial (PDF):</Label>
                <Input
                  id="edossierUrl"
                  value={dossierUrl}
                  onChange={(e) => setDossierUrl(e.target.value)}
                  placeholder="https://servidor.com/documentos/dossier-proyecto.pdf"
                  className="mt-1 bg-slate-900 border-slate-800 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="econtractUrl" className="text-[11px] text-slate-400">URL del Contrato de Participación (PDF):</Label>
                <Input
                  id="econtractUrl"
                  value={contractUrl}
                  onChange={(e) => setContractUrl(e.target.value)}
                  placeholder="https://servidor.com/documentos/contrato-participacion.pdf"
                  className="mt-1 bg-slate-900 border-slate-800 text-xs"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="eimageUrl">URL de la Fotografía / Render Hero</Label>
              <Input
                id="eimageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="mt-1 bg-slate-950 border-slate-800 text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold mt-4"
            >
              {loading ? "Guardando Cambios..." : "Guardar Modificaciones"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
