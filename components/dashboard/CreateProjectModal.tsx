"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, X, CheckCircle2, AlertCircle, FileText } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Agroindustria");
  const [location, setLocation] = useState("Malabo, Guinea Ecuatorial");
  const [targetAmount, setTargetAmount] = useState<number>(50000000);
  const [expectedReturn, setExpectedReturn] = useState<number>(10.5);
  const [durationMonths, setDurationMonths] = useState<number>(18);
  const [riskLevel, setRiskLevel] = useState<"Bajo" | "Moderado" | "Alto">("Moderado");
  const [description, setDescription] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [risksGuarantees, setRisksGuarantees] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [dossierUrl, setDossierUrl] = useState("");
  const [contractUrl, setContractUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

      const { error } = await supabase.from("projects").insert({
        title,
        category,
        location,
        target_amount: targetAmount,
        raised_amount: 0,
        expected_return: expectedReturn,
        duration_months: durationMonths,
        risk_level: riskLevel,
        description: description || null,
        business_model: businessModel || null,
        risks_guarantees: risksGuarantees || null,
        image_url: imageUrl || null,
        legal_documents: legalDocs,
        status: "active",
      });

      if (error) throw error;

      setStatusMessage({
        type: "success",
        text: "Proyecto publicado exitosamente en el catálogo con todos los datos y documentación PDP.",
      });

      setTimeout(() => {
        onProjectCreated();
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Error al crear el proyecto",
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
            <PlusCircle className="h-5 w-5" />
            <span>Publicar Nuevo Proyecto (Exclusivo Admin)</span>
          </CardTitle>
          <CardDescription>
            Establezca las condiciones financieras, expediente narrativo, garantías y documentación legal descargable.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
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
              <Label htmlFor="title">Título del Proyecto</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Planta Procesadora Cacao Riaba"
                required
                className="mt-1 bg-slate-950 border-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Agroindustria">Agroindustria</option>
                  <option value="Energía Renovable">Energía Renovable</option>
                  <option value="Infraestructura">Infraestructura</option>
                  <option value="Inmobiliario">Inmobiliario</option>
                  <option value="Tecnología">Tecnología</option>
                </select>
              </div>

              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Malabo / Bata"
                  required
                  className="mt-1 bg-slate-950 border-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target">Meta de Recaudación (XAF)</Label>
                <Input
                  id="target"
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  min={1000000}
                  step={1000000}
                  required
                  className="mt-1 bg-slate-950 border-slate-800"
                />
              </div>

              <div>
                <Label htmlFor="return">Retorno Anual (%)</Label>
                <Input
                  id="return"
                  type="number"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  step={0.1}
                  min={1}
                  max={40}
                  required
                  className="mt-1 font-bold text-emerald-400 bg-slate-950 border-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Plazo (Meses)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  min={1}
                  max={120}
                  required
                  className="mt-1 bg-slate-950 border-slate-800"
                />
              </div>

              <div>
                <Label htmlFor="risk">Nivel de Riesgo</Label>
                <select
                  id="risk"
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as any)}
                  className="w-full mt-1 h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Bajo">Bajo</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Alto">Alto</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción Narrativa PDP (Resumen Ejecutivo)</Label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describa el problema que resuelve y el objetivo del proyecto en Guinea Ecuatorial..."
                className="w-full mt-1 p-2.5 rounded-md border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <Label htmlFor="businessModel">Modelo de Negocio & Oportunidad Local</Label>
              <textarea
                id="businessModel"
                rows={2}
                value={businessModel}
                onChange={(e) => setBusinessModel(e.target.value)}
                placeholder="Ej: Acuerdos off-take, sustitución de importaciones..."
                className="w-full mt-1 p-2.5 rounded-md border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <Label htmlFor="risksGuarantees">Análisis de Riesgos & Garantías Colaterales</Label>
              <textarea
                id="risksGuarantees"
                rows={2}
                value={risksGuarantees}
                onChange={(e) => setRisksGuarantees(e.target.value)}
                placeholder="Ej: Terreno registrado pignorado, maquinaría asegurada..."
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
                <Label htmlFor="dossierUrl" className="text-[11px] text-slate-400">URL del Dossier Comercial (PDF):</Label>
                <Input
                  id="dossierUrl"
                  value={dossierUrl}
                  onChange={(e) => setDossierUrl(e.target.value)}
                  placeholder="https://servidor.com/documentos/dossier-proyecto.pdf"
                  className="mt-1 bg-slate-900 border-slate-800 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="contractUrl" className="text-[11px] text-slate-400">URL del Contrato de Participación (PDF):</Label>
                <Input
                  id="contractUrl"
                  value={contractUrl}
                  onChange={(e) => setContractUrl(e.target.value)}
                  placeholder="https://servidor.com/documentos/contrato-participacion.pdf"
                  className="mt-1 bg-slate-900 border-slate-800 text-xs"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">URL de la Fotografía / Render Hero</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="mt-1 bg-slate-950 border-slate-800 text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold mt-4"
            >
              {loading ? "Publicando Proyecto..." : "Publicar Proyecto en Catálogo"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
