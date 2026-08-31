import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-sm">
      <div className="container px-4 sm:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <Link href="/" className="inline-block">
            <Logo className="h-14 w-auto" />
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed">
            Plataforma abierta donde cualquier persona puede presentar su proyecto o invertir en iniciativas rentables en Guinea Ecuatorial.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-slate-200 mb-3">Plataforma</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/simulador" className="hover:text-emerald-400 transition-colors">Simulador de Interés</Link></li>
            <li><Link href="/proyectos" className="hover:text-emerald-400 transition-colors">Catálogo de Proyectos</Link></li>
            <li><Link href="/presentar-proyecto" className="hover:text-emerald-400 transition-colors font-bold text-emerald-400">Buscar Financiación / Promotores</Link></li>
            <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Panel Privado</Link></li>
            <li><Link href="/kyc" className="hover:text-emerald-400 transition-colors">Verificación de Identidad</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-200 mb-3">Monedas & Métodos de Pago</h4>
          <ul className="space-y-2 text-xs">
            <li className="text-slate-300 font-medium">Franco CFA (XAF) - Moneda Oficial</li>
            <li>Muni Dinero, RosaMoney, PacMoney</li>
            <li>Transferencias Bancarias & Oficina EGCrece</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-slate-200">Seguridad & Privacidad</h4>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-lg">
            <ShieldCheck className="h-5 w-5 flex-shrink-0" />
            <span>Estándares Bancarios COBAC/CEMAC & Cifrado AES-256</span>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Lock className="h-3 w-3 inline" /> Conexión Inmutable Protegida SSL
          </p>
        </div>
      </div>

      <div className="border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} EGCrece. Todos los derechos reservados.
      </div>
    </footer>
  );
}
