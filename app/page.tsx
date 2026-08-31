import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SimuladorInversion } from "@/components/calculator/SimuladorInversion";
import { ShieldCheck, Smartphone, TrendingUp, Building2, Lock, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-20 border-b border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="container px-4 sm:px-8 mx-auto text-center relative z-10 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Invierte en el futuro de <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Guinea Ecuatorial
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Conectamos a inversores locales e internacionales con proyectos agroindustriales, energéticos, tecnológicos, comerciales, inmobiliarios y cualquier iniciativa empresarial en Guinea Ecuatorial.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 h-12">
                Empezar a Invertir Hoy
              </Button>
            </Link>
            <Link href="/simulador">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-800 text-slate-300 hover:bg-slate-900 px-8 h-12">
                Calcular Rendimientos
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left border-t border-slate-800/80 pt-8">
            <div>
              <span className="text-xs text-slate-400 block">Moneda Oficial</span>
              <span className="text-lg font-bold text-white">Franco CFA (XAF)</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Pagos Multicanal</span>
              <span className="text-lg font-bold text-emerald-400">Muni, Rosa, Bancos</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Rendimiento Estimado</span>
              <span className="text-lg font-bold text-white">Hasta 12% Anual</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Seguridad & Privacidad</span>
              <span className="text-lg font-bold text-emerald-400">Cifrado AES-256</span>
            </div>
          </div>
        </div>
      </section>

      {/* Simulator Section */}
      <section className="container px-4 sm:px-8 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-white">Simulador de Inversión Programada</h2>
          <p className="text-sm text-slate-400 mt-2">
            Calcula cuánto crecerá tu capital combinando un monto inicial con aportaciones periódicas en Franco CFA (XAF).
          </p>
        </div>
        <SimuladorInversion />
      </section>

      {/* Security & Mobile Money Section */}
      <section className="container px-4 sm:px-8 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Depósitos Multicanal Nacionales</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Recargas y retiros mediante Muni Dinero, RosaMoney, PacMoney, transferencias bancarias o efectivo en oficinas de EGCrece en Malabo y Bata.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Seguridad & Contabilidad Cifrada</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cada transacción se procesa bajo protocolos de seguridad inmutables de grado bancario y cifrado de privacidad de extremo a extremo.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Cualquier Proyecto en Guinea</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Financiación de proyectos empresariales, agrícolas, comerciales, tecnológicos o de desarrollo de infraestructuras en Guinea Ecuatorial.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
