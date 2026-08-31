import { ProjectCatalog } from "@/components/dashboard/ProjectCatalog";

export default function ProyectosPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Catálogo de Proyectos Inmobiliarios y Productivos</h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore oportunidades de inversión directa en Guinea Ecuatorial denominadas en Franco CFA (XAF).
        </p>
      </div>

      <ProjectCatalog />
    </div>
  );
}
