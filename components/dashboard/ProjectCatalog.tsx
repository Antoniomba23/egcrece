"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CreateProjectModal } from "@/components/dashboard/CreateProjectModal";
import { InvestModal } from "@/components/dashboard/InvestModal";
import { Building2, Sprout, Zap, PlusCircle, RefreshCw } from "lucide-react";

export interface InvestmentProject {
  id: string;
  title: string;
  category: string;
  location: string;
  targetAmount: number;
  raisedAmount: number;
  expectedReturn: number;
  durationMonths: number;
  riskLevel: "Bajo" | "Moderado" | "Alto";
}

const mockProjects: InvestmentProject[] = [
  {
    id: "proj-1",
    title: "Expansión Agrícola Bioko Norte",
    category: "Agroindustria",
    location: "Malabo, Guinea Ecuatorial",
    targetAmount: 50000000,
    raisedAmount: 32500000,
    expectedReturn: 10.5,
    durationMonths: 18,
    riskLevel: "Bajo",
  },
  {
    id: "proj-2",
    title: "Parque Solar Fotovoltaico Bata",
    category: "Energía Renovable",
    location: "Bata, Región Continental",
    targetAmount: 120000000,
    raisedAmount: 84000000,
    expectedReturn: 12.0,
    durationMonths: 24,
    riskLevel: "Moderado",
  },
  {
    id: "proj-3",
    title: "Centro Logístico Puerto de Malabo",
    category: "Infraestructura",
    location: "Puerto de Malabo",
    targetAmount: 85000000,
    raisedAmount: 41000000,
    expectedReturn: 9.2,
    durationMonths: 12,
    riskLevel: "Bajo",
  },
];

export function ProjectCatalog() {
  const [projects, setProjects] = useState<InvestmentProject[]>(mockProjects);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<InvestmentProject | null>(null);
  const [isInvestOpen, setIsInvestOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const supabase = createClient();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          location: p.location,
          targetAmount: Number(p.target_amount),
          raisedAmount: Number(p.raised_amount),
          expectedReturn: Number(p.expected_return),
          durationMonths: Number(p.duration_months),
          riskLevel: p.risk_level,
        }));
        setProjects(mapped);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          setIsAdmin(true);
        }
      }
    } catch (err) {
      // Fallback a mockProjects
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenInvest = (project: InvestmentProject) => {
    setSelectedProject(project);
    setIsInvestOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Proyectos disponibles en Guinea Ecuatorial y CEMAC
        </span>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchProjects}
            className="text-xs text-slate-400 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualizar Catálogo
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Publicar Nuevo Proyecto</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((project) => {
          const progressPercentage = Math.min(
            100,
            Math.round((project.raisedAmount / project.targetAmount) * 100)
          );

          return (
            <Card key={project.id} className="bg-slate-900 border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                    {project.category}
                  </Badge>
                  <span className="text-xs text-slate-400">{project.location}</span>
                </div>
                <CardTitle className="text-lg text-white font-bold leading-snug">
                  {project.title}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Plazo: {project.durationMonths} meses | Riesgo: {project.riskLevel}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Retorno Est. por Admin</span>
                  <span className="text-xl font-black text-emerald-400">+{project.expectedReturn}% Anual</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Recaudado: {formatCurrency(project.raisedAmount)}</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Meta: {formatCurrency(project.targetAmount)}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-slate-800/60">
                <Link href={`/proyectos/${project.id}`} className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-slate-800 text-emerald-400 hover:bg-emerald-950/60 hover:border-emerald-800 hover:text-emerald-300 text-xs h-10 font-bold transition-all"
                  >
                    Ver Detalle Completo del Proyecto
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Modal para Administradores: Crear Proyecto */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onProjectCreated={fetchProjects}
      />

      {/* Modal para Inversores: Realizar Inversión */}
      <InvestModal
        isOpen={isInvestOpen}
        onClose={() => setIsInvestOpen(false)}
        project={selectedProject}
        onInvestmentComplete={fetchProjects}
      />
    </div>
  );
}
