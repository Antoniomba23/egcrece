"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Smartphone, CheckCircle2, RefreshCw, X, Copy, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MobileQrSyncProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  target: "selfie" | "front" | "back";
  onPhotoReceived: (fileUrl: string) => void;
}

export function MobileQrSync({ isOpen, onClose, userId, target, onPhotoReceived }: MobileQrSyncProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [waiting, setWaiting] = useState<boolean>(true);
  const [receivedPhoto, setReceivedPhoto] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;

    // Obtener la URL base actual (host local o dominio de producción)
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const syncSessionId = `${userId}_${target}_${Date.now()}`;
    const url = `${origin}/kyc?userId=${userId}&target=${target}&session=${syncSessionId}&mode=mobile`;

    setMobileUrl(url);

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 220,
        margin: 2,
        color: {
          dark: "#059669",
          light: "#020617",
        },
      }).catch((err) => console.error("Error al generar QR:", err));
    }

    // Escuchar actualizaciones en tiempo real de Supabase cuando el móvil suba la foto
    const channel = supabase
      .channel(`kyc_sync_${syncSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "kyc_documents",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Foto recibida desde el móvil:", payload);
          const newDoc = payload.new;
          let photoUrl = newDoc.file_url;
          if (target === "selfie" && newDoc.selfie_file_url) photoUrl = newDoc.selfie_file_url;
          if (target === "front" && newDoc.front_file_url) photoUrl = newDoc.front_file_url;
          if (target === "back" && newDoc.back_file_url) photoUrl = newDoc.back_file_url;

          setReceivedPhoto(photoUrl);
          setWaiting(false);
          onPhotoReceived(photoUrl);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, userId, target, supabase, onPhotoReceived]);

  const copyLink = () => {
    if (mobileUrl) {
      navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white relative shadow-2xl overflow-hidden p-6 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white bg-slate-950/60 p-2 rounded-full border border-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-950/80 border border-emerald-800 rounded-full text-emerald-400 mb-1">
            <Smartphone className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Continuar Captura en el Móvil</h3>
          <p className="text-xs text-slate-300">
            Escanee este código QR con la cámara de su teléfono smartphone para tomar la foto directamente.
          </p>
        </div>

        {/* Código QR */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
            <canvas ref={canvasRef} className="rounded-lg" />
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-semibold">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Sincronizando en tiempo real con su ordenador...</span>
          </div>
        </div>

        {/* Pasos a seguir */}
        <div className="space-y-2 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-start space-x-2">
            <span className="bg-emerald-900/60 text-emerald-400 font-bold px-2 py-0.5 rounded-full text-[10px]">1</span>
            <span>Abra la app de Cámara en su teléfono móvil.</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-emerald-900/60 text-emerald-400 font-bold px-2 py-0.5 rounded-full text-[10px]">2</span>
            <span>Apunte la cámara al código QR y toque el enlace que aparece.</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-emerald-900/60 text-emerald-400 font-bold px-2 py-0.5 rounded-full text-[10px]">3</span>
            <span>Tome la foto en el móvil. Esta pantalla se actualizará automáticamente.</span>
          </div>
        </div>

        {/* Enlace alternativo copiar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyLink}
            className="w-full border-slate-800 text-slate-300 text-xs flex items-center justify-center space-x-1"
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            <span>{copied ? "¡Enlace Copiado!" : "Copiar Enlace al Portapapeles"}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
