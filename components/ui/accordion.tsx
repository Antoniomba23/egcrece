"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isOpen?: boolean;
}

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <div className={cn("border-b border-slate-800/80 last:border-b-0", className)}>
      {children}
    </div>
  );
}

export function AccordionTrigger({ children, className, onClick, isOpen }: AccordionTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between py-4 text-left font-medium text-slate-100 transition-all hover:text-emerald-400 focus:outline-none group",
        className
      )}
    >
      <div className="flex-1 pr-4">{children}</div>
      <div className={cn("p-1.5 rounded-full bg-slate-900 border border-slate-800 group-hover:border-emerald-500/30 transition-colors shrink-0")}>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:text-emerald-400",
            isOpen && "rotate-180 text-emerald-400"
          )}
        />
      </div>
    </button>
  );
}

export function AccordionContent({ children, className, isOpen }: AccordionContentProps) {
  if (!isOpen) return null;

  return (
    <div className={cn("pb-5 pt-1 animate-in fade-in-50 duration-200 text-slate-300 text-sm leading-relaxed", className)}>
      {children}
    </div>
  );
}
