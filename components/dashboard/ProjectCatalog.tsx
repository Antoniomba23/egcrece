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
import { Skeleton } from "@/components/ui/skeleton";
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

export function ProjectCatalog() {
  const [projects, setProjects] = useState<InvestmentProject[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<InvestmentProject | null>(null);
  const [isInvestOpen, setIsInvestOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      const dbProjects = (!error && data) ? data : [];

      let localApproved: any[] = [];
      try {
        localApproved = JSON.parse(localStorage.getItem("egcrece_approved_projects") || "[]");
      } catch (e) {}

      let localProposals: any[] = [];
      try {
        localProposals = JSON.parse(localStorage.getItem("egcrece_proposals") || "[]");
      } catch (e) {}

      const approvedProposals = localProposals.filter((p: any) => p.status === "approved");

      const combinedRaw = [...dbProjects];
      for (const la of localApproved) {
        if (!combinedRaw.some((p: any) => p.id === la.id)) {
          combinedRaw.push(la);
        }
      }
      for (const ap of approvedProposals) {
        if (!combinedRaw.some((p: any) => p.id === ap.id)) {
          combinedRaw.push({
            id: ap.id,
            title: ap.title,
            category: ap.category,
            location: ap.location,
            target_amount: ap.target_amount,
            raised_amount: ap.promoter_contribution || 0,
            expected_return: ap.expected_return,
            duration_months: ap.duration_months,
            risk_level: "Moderado",
          });
        }
      }

      const mapped = combinedRaw.map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        location: p.location,
        targetAmount: Number(p.target_amount),
        raisedAmount: Number(p.raised_amount || 0),
        expectedReturn: Number(p.expected_return),
        durationMonths: Number(p.duration_months),
        riskLevel: p.risk_level || "Moderado",
      }));

      setProjects(mapped);

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
      console.error("Error al cargar proyectos:", err);
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-24 rounded-full bg-slate-800" />
                <Skeleton className="h-4 w-28 bg-slate-800" />
              </div>
              <Skeleton className="h-6 w-3/4 bg-slate-800" />
              <Skeleton className="h-4 w-1/2 bg-slate-800" />
              <div className="space-y-2 pt-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 bg-slate-800" />
                  <Skeleton className="h-5 w-16 bg-slate-800" />
                </div>
                <Skeleton className="h-2 w-full rounded-full bg-slate-800" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg bg-slate-800" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 my-6 shadow-xl">
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">No hay proyectos activos en la Base de Datos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Actualmente no existen proyectos publicados en la base de datos oficial. Los nuevos proyectos autorizados por la administración se reflejarán automáticamente en esta sección.
            </p>
          </div>

          {isAdmin && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-6 shadow-lg mt-2"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              <span>Publicar Nuevo Proyecto en la Base de Datos</span>
            </Button>
          )}
        </div>
      ) : (
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
      )}

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
