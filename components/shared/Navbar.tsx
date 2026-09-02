"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Wallet, ShieldCheck, PieChart, LogOut, LogIn, UserPlus, Menu, X, Home, Calculator, Building2, UserCheck, User as UserIcon, Sparkles, BookOpen } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const supabase = createClient();

    const fetchUserAndRole = async (u: User | null) => {
      setUser(u);
      if (u) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .single();
        setUserRole(prof?.role || "investor");
      } else {
        setUserRole(null);
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      fetchUserAndRole(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserAndRole(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    setUserRole(null);
    router.push("/");
    router.refresh();
  };

  const isAdmin = userRole === "admin";
  const isAuditor = userRole === "auditor";
  const isInvestor = userRole === "investor" || (user && !isAdmin && !isAuditor);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="container flex h-20 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <Logo className="h-12 sm:h-14 w-auto" />
        </Link>

        {/* Navegación Escritorio Basada en Rol */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
          {!user ? (
            /* Menú Público para Visitantes */
            <>
              <Link
                href="/proyectos"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/proyectos" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Proyectos
              </Link>
              <Link
                href="/presentar-proyecto"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/presentar-proyecto" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Buscar Financiación
              </Link>
              <Link
                href="/simulador"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/simulador" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Calculadora
              </Link>
              <Link
                href="/aprende"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/aprende" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Aprende
              </Link>
            </>
          ) : isAdmin ? (
            /* Menú para Administradores */
            <>
              <Link
                href="/dashboard"
                className={`transition-colors hover:text-emerald-400 font-semibold ${
                  pathname === "/dashboard" ? "text-emerald-400" : "text-white"
                }`}
              >
                Consola de Administración
              </Link>
              <Link
                href="/proyectos"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/proyectos" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Catálogo de Proyectos
              </Link>
              <Link
                href="/perfil"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/perfil" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Mi Perfil
              </Link>
            </>
          ) : isAuditor ? (
            /* Menú para Auditores */
            <>
              <Link
                href="/dashboard"
                className={`transition-colors hover:text-blue-400 font-semibold ${
                  pathname === "/dashboard" ? "text-blue-400" : "text-white"
                }`}
              >
                Panel de Auditoría
              </Link>
              <Link
                href="/proyectos"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/proyectos" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Proyectos
              </Link>
              <Link
                href="/perfil"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/perfil" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Mi Perfil
              </Link>
            </>
          ) : (
            /* Menú para Inversores Registrados */
            <>
              <Link
                href="/dashboard"
                className={`transition-colors hover:text-emerald-400 font-semibold ${
                  pathname === "/dashboard" ? "text-emerald-400" : "text-white"
                }`}
              >
                Mi Cartera
              </Link>
              <Link
                href="/proyectos"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/proyectos" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Explorar Proyectos
              </Link>
              <Link
                href="/simulador"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/simulador" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Calculadora
              </Link>
              <Link
                href="/aprende"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/aprende" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Glosario
              </Link>
              <Link
                href="/kyc"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/kyc" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Verificación KYC
              </Link>
              <Link
                href="/perfil"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/perfil" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Mi Perfil
              </Link>
            </>
          )}
        </nav>

        {/* Botones de Autenticación / Cuenta en Escritorio */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <Link href="/perfil" className="text-xs text-slate-300 hover:text-emerald-400 border border-slate-800 rounded-full px-3 py-1 bg-slate-900 truncate max-w-[170px] flex items-center space-x-1.5 transition-colors">
                <UserIcon className="h-3.5 w-3.5 text-emerald-400" />
                <span className="truncate">{user.email}</span>
                {isAdmin && <span className="text-[10px] text-amber-400 font-bold ml-1">(Admin)</span>}
                {isAuditor && <span className="text-[10px] text-blue-400 font-bold ml-1">(Auditor)</span>}
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-1 border-slate-800 hover:border-rose-500/50 hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <LogIn className="h-4 w-4" />
                  <span>Ingresar</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500">
                  <UserPlus className="h-4 w-4" />
                  <span>Registrarse</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Botón de Menú Hamburguesa Móvil */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:text-white hover:border-slate-700"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-emerald-400" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menú Desplegable Móvil (Drawer Limpio por Rol) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-4 animate-in slide-in-from-top-4 duration-200">
          {user && (
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400 block mb-0.5">Usuario conectado:</span>
                <span className="font-bold text-emerald-400 truncate block">{user.email}</span>
              </div>
              {isAdmin && <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded font-bold">ADMIN</span>}
              {isAuditor && <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-bold">AUDITOR</span>}
            </div>
          )}

          <nav className="flex flex-col space-y-1">
            {!user ? (
              /* Móvil Público */
              <>
                <Link
                  href="/"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Inicio</span>
                </Link>
                <Link
                  href="/proyectos"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/proyectos" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Catálogo de Proyectos</span>
                </Link>
                <Link
                  href="/presentar-proyecto"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/presentar-proyecto" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span>Buscar Financiación</span>
                </Link>
                <Link
                  href="/simulador"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/simulador" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <Calculator className="h-4 w-4" />
                  <span>Calculadora de Interés</span>
                </Link>
                <Link
                  href="/aprende"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/aprende" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Glosario de Términos</span>
                </Link>
              </>
            ) : isAdmin ? (
              /* Móvil Admin */
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/dashboard" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <PieChart className="h-4 w-4" />
                  <span>Consola de Administración</span>
                </Link>
                <Link
                  href="/proyectos"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/proyectos" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Catálogo de Proyectos</span>
                </Link>
                <Link
                  href="/perfil"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/perfil" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Mi Perfil Admin</span>
                </Link>
              </>
            ) : isAuditor ? (
              /* Móvil Auditor */
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/dashboard" ? "bg-blue-950/80 text-blue-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  <span>Panel de Auditoría</span>
                </Link>
                <Link
                  href="/proyectos"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/proyectos" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Proyectos</span>
                </Link>
                <Link
                  href="/perfil"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/perfil" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Mi Perfil</span>
                </Link>
              </>
            ) : (
              /* Móvil Inversor */
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/dashboard" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <PieChart className="h-4 w-4" />
                  <span>Mi Cartera</span>
                </Link>
                <Link
                  href="/proyectos"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/proyectos" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Explorar Proyectos</span>
                </Link>
                <Link
                  href="/simulador"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/simulador" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <Calculator className="h-4 w-4" />
                  <span>Calculadora</span>
                </Link>
                <Link
                  href="/aprende"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/aprende" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Glosario</span>
                </Link>
                <Link
                  href="/kyc"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/kyc" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Verificación KYC</span>
                </Link>
                <Link
                  href="/perfil"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/perfil" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Mi Perfil</span>
                </Link>
              </>
            )}
          </nav>

          <div className="pt-2 border-t border-slate-900 space-y-2">
            {user ? (
              <Button
                onClick={handleSignOut}
                className="w-full bg-slate-900 hover:bg-rose-950 text-rose-400 border border-slate-800 flex items-center justify-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full border-slate-800 text-xs">
                    Ingresar
                  </Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
