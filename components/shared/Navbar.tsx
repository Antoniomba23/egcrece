"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Wallet, ShieldCheck, PieChart, LogOut, LogIn, UserPlus, Menu, X, Home, Calculator, Building2, UserCheck, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <Logo className="h-8 sm:h-9 w-auto" />
        </Link>

        {/* Navegación Escritorio */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
          <Link
            href="/simulador"
            className={`transition-colors hover:text-emerald-400 ${
              pathname === "/simulador" ? "text-emerald-400 font-semibold" : ""
            }`}
          >
            Calculadora
          </Link>
          <Link
            href="/proyectos"
            className={`transition-colors hover:text-emerald-400 ${
              pathname === "/proyectos" ? "text-emerald-400 font-semibold" : ""
            }`}
          >
            Proyectos
          </Link>
          {user && (
            <>
              <Link
                href="/dashboard"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/dashboard" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Panel de Control
              </Link>
              <Link
                href="/perfil"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/perfil" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Mi Perfil
              </Link>
              <Link
                href="/kyc"
                className={`transition-colors hover:text-emerald-400 ${
                  pathname === "/kyc" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                Verificación KYC
              </Link>
            </>
          )}
        </nav>

        {/* Botones de Autenticación / Cuenta en Escritorio */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <Link href="/perfil" className="text-xs text-slate-300 hover:text-emerald-400 border border-slate-800 rounded-full px-3 py-1 bg-slate-900 truncate max-w-[160px] flex items-center space-x-1.5 transition-colors">
                <UserIcon className="h-3.5 w-3.5 text-emerald-400" />
                <span className="truncate">{user.email}</span>
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

      {/* Menú Desplegable Móvil (Drawer) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-4 animate-in slide-in-from-top-4 duration-200">
          {user && (
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs">
              <span className="text-slate-400 block mb-0.5">Usuario conectado:</span>
              <span className="font-bold text-emerald-400 truncate block">{user.email}</span>
            </div>
          )}

          <nav className="flex flex-col space-y-1">
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
              href="/simulador"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === "/simulador" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              <Calculator className="h-4 w-4" />
              <span>Calculadora de Interés</span>
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

            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/dashboard" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <PieChart className="h-4 w-4" />
                  <span>Panel Privado</span>
                </Link>

                <Link
                  href="/perfil"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === "/perfil" ? "bg-emerald-950/80 text-emerald-400 font-bold" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Mi Perfil de Usuario</span>
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
