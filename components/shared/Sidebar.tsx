"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  ShieldCheck,
  Calculator,
  FolderKanban,
  BookOpen,
  Eye,
  UserCheck,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("investor");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (prof?.role) setRole(prof.role);
      }
    });
  }, []);

  const isAdmin = role === "admin";
  const isAuditor = role === "auditor";

  const navigationItems = isAdmin
    ? [
        { name: "Consola de Administración", href: "/dashboard", icon: LayoutDashboard },
        { name: "Catálogo de Proyectos", href: "/proyectos", icon: FolderKanban },
        { name: "Mi Perfil Admin", href: "/perfil", icon: UserIcon },
      ]
    : isAuditor
    ? [
        { name: "Panel de Auditoría", href: "/dashboard", icon: Eye },
        { name: "Catálogo de Proyectos", href: "/proyectos", icon: FolderKanban },
        { name: "Mi Perfil", href: "/perfil", icon: UserIcon },
      ]
    : [
        { name: "Mi Cartera / Resumen", href: "/dashboard", icon: LayoutDashboard },
        { name: "Explorar Proyectos", href: "/proyectos", icon: FolderKanban },
        { name: "Calculadora de Interés", href: "/simulador", icon: Calculator },
        { name: "Glosario Financiero", href: "/aprende", icon: BookOpen },
        { name: "Verificación KYC", href: "/kyc", icon: UserCheck },
      ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 p-4 hidden md:block min-h-[calc(100vh-4rem)]">
      <div className="mb-6 px-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-0.5">
        <span className="text-[11px] text-slate-400 block uppercase font-medium">Panel Privado EGCrece</span>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-emerald-400">
            {isAdmin ? "Administración" : isAuditor ? "Auditoría Externa" : "Cartera Inversor"}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isAdmin
                ? "bg-amber-950 text-amber-400 border border-amber-800"
                : isAuditor
                ? "bg-blue-950 text-blue-400 border border-blue-800"
                : "bg-emerald-950 text-emerald-400 border border-emerald-800"
            }`}
          >
            {role.toUpperCase()}
          </span>
        </div>
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
