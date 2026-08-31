import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-sm">
      <div className="container px-4 sm:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <Link href="/" className="inline-block">
            <Logo className="h-8 w-auto" />
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed">
            Plataforma fintech de microinversiones y ahorro programado adaptada al mercado de Guinea Ecuatorial y la zona CEMAC.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-slate-200 mb-3">Plataforma</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/simulador" className="hover:text-emerald-400 transition-colors">Simulador de Interés</Link></li>
            <li><Link href="/proyectos" className="hover:text-emerald-400 transition-colors">Proyectos de Inversión</Link></li>
            <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Panel Privado</Link></li>
            <li><Link href="/kyc" className="hover:text-emerald-400 transition-colors">Verificación de Identidad</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-200 mb-3">Monedas & Pagos</h4>
          <ul className="space-y-2 text-xs">
            <li className="text-slate-300 font-medium">Franco CFA (XAF) - Moneda Principal</li>
            <li>Soporte Mobile Money (Orange / MTN)</li>
            <li>Depósitos Atómicos & Ledger Inmutable</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-slate-200">Seguridad Financiera</h4>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-lg">
            <ShieldCheck className="h-5 w-5 flex-shrink-0" />
            <span>Políticas RLS en PostgreSQL y Encriptación JWT</span>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Lock className="h-3 w-3 inline" /> Conexión protegida SSL 256-bit
          </p>
        </div>
      </div>

      <div className="border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} EGCrece. Todos los derechos reservados.
      </div>
    </footer>
  );
}
