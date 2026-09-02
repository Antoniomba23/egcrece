import glosarioData from "@/data/glosario.json";
import { GlosarioClient, LevelItem, TermItem } from "@/components/aprende/GlosarioClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Glosario Financiero & Educación | EGCrece",
  description: "Aprende los conceptos financieros clave para gestionar e invertir tu capital de forma transparente.",
};

export default function AprendePage() {
  const levels = glosarioData.levels as LevelItem[];
  const terms = glosarioData.terms as TermItem[];

  return <GlosarioClient levels={levels} terms={terms} />;
}
