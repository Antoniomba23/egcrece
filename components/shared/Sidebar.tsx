"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShieldCheck, PieChart, Calculator, FolderKanban, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Resumen General", href: "/dashboard", icon: LayoutDashboard },
  { name: "Aprende / Glosario", href: "/aprende", icon: BookOpen },
  { name: "Simulador de Ahorro", href: "/simulador", icon: Calculator },
  { name: "Catálogo de Proyectos", href: "/proyectos", icon: FolderKanban },
  { name: "Verificación KYC", href: "/kyc", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 p-4 hidden md:block min-h-[calc(100vh-4rem)]">
      <div className="mb-6 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg">
        <span className="text-xs text-slate-400 block">Entorno Financiero</span>
        <span className="text-sm font-semibold text-emerald-400">EGCrece XAF</span>
      </div>

      <nav className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-emerald-400" : "text-slate-500")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
