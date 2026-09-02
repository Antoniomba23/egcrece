"use client";

import { useState, useMemo } from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Search,
  Info,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Calculator,
  LayoutGrid,
  List,
  ArrowRight,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

export interface TermItem {
  id: string;
  levelId: number;
  term: string;
  badge: string;
  tooltip: string;
  microCapsula: string;
  ejemploPractico: string;
}

export interface LevelItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
}

interface GlosarioClientProps {
  levels: LevelItem[];
  terms: TermItem[];
}

export function GlosarioClient({ levels, terms }: GlosarioClientProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | 0>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    inflacion: true, // Abrir el primero por defecto para mejor UX
  });
  const [viewMode, setViewMode] = useState<"accordion" | "grid">("accordion");

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredTerms = useMemo(() => {
    return terms.filter((item) => {
      const matchesLevel = selectedLevel === 0 || item.levelId === selectedLevel;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.term.toLowerCase().includes(q) ||
        item.tooltip.toLowerCase().includes(q) ||
        item.microCapsula.toLowerCase().includes(q) ||
        item.ejemploPractico.toLowerCase().includes(q);

      return matchesLevel && matchesSearch;
    });
  }, [terms, selectedLevel, searchQuery]);

  const getLevelBadgeColor = (levelId: number) => {
    switch (levelId) {
      case 1:
        return "bg-emerald-950/80 text-emerald-400 border-emerald-800/60";
      case 2:
        return "bg-blue-950/80 text-blue-400 border-blue-800/60";
      case 3:
        return "bg-amber-950/80 text-amber-400 border-amber-800/60";
      default:
        return "bg-slate-900 text-slate-300 border-slate-800";
    }
  };

  const getLevelIcon = (levelId: number) => {
    switch (levelId) {
      case 1:
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 2:
        return <ShieldCheck className="h-4 w-4 text-blue-400" />;
      case 3:
        return <Calculator className="h-4 w-4 text-amber-400" />;
      default:
        return <BookOpen className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 p-6 md:p-10 border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Glosario Estratégico EGCrece</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Aprende a Invertir en tu Economía Real
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Explicaciones sencillas, transparentes y libres de jerga abstracta. Conoce los conceptos clave para proteger tu capital y hacer crecer tu patrimonio.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Ejemplos reales</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Sectores productivos locales</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Formato Resumen / Cápsula / Práctico</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controles: Filtros por Nivel y Búsqueda */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar concepto (ej: TIR, Inflación, Preahorro, Billetera...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 text-sm"
            />
          </div>

          {/* Selector de Modo de Vista */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-end md:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("accordion")}
              className={`px-3 py-1.5 h-8 text-xs flex items-center space-x-1.5 ${
                viewMode === "accordion"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Desplegable</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 h-8 text-xs flex items-center space-x-1.5 ${
                viewMode === "grid"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Tarjetas Grid</span>
            </Button>
          </div>
        </div>

        {/* Tabs de Niveles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => setSelectedLevel(0)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedLevel === 0
                ? "bg-emerald-950/60 border-emerald-500/50 text-white shadow-lg shadow-emerald-950/40"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Vista Completa
            </div>
            <div className="text-sm font-bold flex items-center justify-between">
              <span>Todos los Niveles</span>
              <Badge variant="outline" className="text-xs border-slate-700 bg-slate-950">
                {terms.length}
              </Badge>
            </div>
          </button>

          {levels.map((lvl) => {
            const count = terms.filter((t) => t.levelId === lvl.id).length;
            const isSelected = selectedLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-emerald-950/60 border-emerald-500/50 text-white shadow-lg shadow-emerald-950/40"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center space-x-1.5 text-xs font-semibold mb-1">
                  {getLevelIcon(lvl.id)}
                  <span className="truncate">Nivel {lvl.id}</span>
                </div>
                <div className="text-sm font-bold truncate flex items-center justify-between">
                  <span className="truncate">{lvl.title.split(":")[1]?.trim() || lvl.title}</span>
                  <Badge variant="outline" className="text-xs border-slate-700 bg-slate-950 shrink-0 ml-1">
                    {count}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resultados vacíos */}
      {filteredTerms.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-800 text-center py-12 px-4">
          <CardContent className="space-y-3">
            <HelpCircle className="h-10 w-10 text-slate-500 mx-auto" />
            <h3 className="text-lg font-semibold text-slate-200">No se encontraron términos</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Prueba modificando los términos de tu búsqueda o seleccionando otro nivel en los filtros.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedLevel(0);
              }}
              className="border-slate-700 text-xs mt-2"
            >
              Restablecer Filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {/* MODO DESPLEGABLE (ACCORDION) */}
      {viewMode === "accordion" && filteredTerms.length > 0 && (
        <div className="space-y-6">
          {levels
            .filter((lvl) => selectedLevel === 0 || selectedLevel === lvl.id)
            .map((lvl) => {
              const lvlTerms = filteredTerms.filter((t) => t.levelId === lvl.id);
              if (lvlTerms.length === 0) return null;

              return (
                <div key={lvl.id} className="space-y-4">
                  {/* Encabezado del Nivel */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        {getLevelIcon(lvl.id)}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <span>{lvl.title}</span>
                        </h2>
                        <p className="text-xs text-slate-400">{lvl.subtitle}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${getLevelBadgeColor(lvl.id)} text-xs hidden sm:inline-flex`}>
                      {lvlTerms.length} conceptos
                    </Badge>
                  </div>

                  {/* Lista de Acordeones */}
                  <Card className="bg-slate-900/60 border-slate-800 overflow-hidden divide-y divide-slate-800/80">
                    {lvlTerms.map((item) => {
                      const isOpen = !!openItems[item.id];

                      return (
                        <AccordionItem key={item.id} value={item.id} className="px-4 md:px-6">
                          <AccordionTrigger
                            onClick={() => toggleItem(item.id)}
                            isOpen={isOpen}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                                {item.term}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[11px] px-2 py-0.5 border ${getLevelBadgeColor(item.levelId)}`}
                              >
                                {item.badge}
                              </Badge>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent isOpen={isOpen}>
                            <div className="space-y-4 pt-1">
                              {/* 1. TOOLTIP UI */}
                              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex items-start space-x-3">
                                <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 block mb-0.5">
                                    Resumen
                                  </span>
                                  <p className="text-xs text-emerald-200/90 font-medium leading-relaxed">
                                    {item.tooltip}
                                  </p>
                                </div>
                              </div>

                              {/* 2. MICRO-CÁPSULA */}
                              <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-300 block">
                                  Explicación del Concepto
                                </span>
                                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3.5 rounded-lg border border-slate-800/60">
                                  {item.microCapsula}
                                </p>
                              </div>

                              {/* 3. EJEMPLO PRÁCTICO */}
                              <div className="space-y-1">
                                <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                  <span>Ejemplo Práctico</span>
                                </span>
                                <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-900/40 text-xs text-slate-200 leading-relaxed">
                                  {item.ejemploPractico}
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Card>
                </div>
              );
            })}
        </div>
      )}

      {/* MODO TARJETAS GRID */}
      {viewMode === "grid" && filteredTerms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTerms.map((item) => (
            <Card key={item.id} className="bg-slate-900/60 border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge variant="outline" className={`text-[11px] ${getLevelBadgeColor(item.levelId)}`}>
                    Nivel {item.levelId} • {item.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-white">
                  {item.term}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 flex-1">
                {/* Tooltip box */}
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex items-start space-x-2 text-xs">
                  <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-emerald-200/90 italic">{item.tooltip}</span>
                </div>

                {/* Micro-cápsula */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.microCapsula}
                </p>

                {/* Ejemplo Práctico */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="font-semibold text-emerald-400 block text-[11px]">
                    Caso Práctico:
                  </span>
                  <p className="text-slate-300 leading-relaxed">{item.ejemploPractico}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Banner inferior de Llamada a la Acción */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="space-y-2 text-center md:text-left max-w-xl">
          <h3 className="text-xl font-bold text-white">
            ¿Listo para poner en práctica tus conocimientos?
          </h3>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Utiliza nuestro simulador de interés compuesto o explora los proyectos activos en la economía productiva de Guinea Ecuatorial.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <Link href="/simulador">
            <Button variant="outline" className="border-slate-700 text-slate-200 hover:text-white text-xs">
              Ir al Simulador
            </Button>
          </Link>
          <Link href="/proyectos">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center space-x-1">
              <span>Ver Proyectos Activos</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
