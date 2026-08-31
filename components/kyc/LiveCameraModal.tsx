"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, RefreshCw, X, Check, FlipHorizontal, Lock, AlertTriangle } from "lucide-react";

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: "selfie" | "front" | "back";
  onCapture: (file: File) => void;
  onOpenQrSync?: () => void;
}

export function LiveCameraModal({ isOpen, onClose, target, onCapture, onOpenQrSync }: LiveCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    target === "selfie" ? "user" : "environment"
  );
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied">("prompt");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const requestCameraPermission = async (mode: "user" | "environment") => {
    try {
      setCameraError(null);
      setPermissionState("prompt");

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Solicitud explícita de permiso de vídeo al navegador
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setPermissionState("granted");
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Error o permiso de cámara denegado:", err);
      setPermissionState("denied");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Permiso de Cámara Denegado. Por favor, habilite el acceso a la cámara en el icono de candado de la barra de direcciones de su navegador."
        );
      } else {
        setCameraError("No se pudo iniciar la cámara. Verifique que no esté en uso por otra aplicación.");
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      const mode = target === "selfie" ? "user" : "environment";
      setFacingMode(mode);
      setCapturedImage(null);
      requestCameraPermission(mode);
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, target]);

  const toggleCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    requestCameraPermission(newMode);
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    requestCameraPermission(facingMode);
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;

    const arr = capturedImage.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    const filename = `${target}_live_${Date.now()}.jpg`;
    const file = new File([u8arr], filename, { type: mime });

    onCapture(file);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-slate-900 border-slate-800 text-white relative shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 text-slate-400 hover:text-white bg-slate-950/60 p-2 rounded-full border border-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-sm text-white">
              {target === "selfie"
                ? "Selfie Biométrico en Vivo (Cámara Obligatoria)"
                : target === "front"
                ? "Capturar Frente del Documento"
                : "Capturar Dorso del Documento"}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleCamera}
            className="text-slate-300 hover:text-emerald-400 text-xs flex items-center space-x-1"
          >
            <FlipHorizontal className="h-4 w-4 mr-1" />
            <span>Voltear</span>
          </Button>
        </div>

        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {permissionState === "denied" || cameraError ? (
            <div className="p-6 text-center text-xs text-rose-300 space-y-3 max-w-sm mx-auto">
              <Lock className="h-8 w-8 text-rose-400 mx-auto" />
              <p className="font-bold text-white text-sm">Permiso de Cámara Denegado o Sin Cámara</p>
              <p className="leading-relaxed text-slate-300">{cameraError}</p>
              
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => requestCameraPermission(facingMode)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  Reintentar Permiso de Cámara
                </Button>

                {onOpenQrSync && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onClose();
                      onOpenQrSync();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center space-x-1"
                  >
                    <span>📱 Usar Cámara del Móvil (Escanear QR)</span>
                  </Button>
                )}
              </div>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captura Biométrica" className="w-full h-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />

              {/* Guía de Enfoque en pantalla */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {target === "selfie" ? (
                  <div className="w-48 h-60 rounded-[50%] border-2 border-dashed border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex items-center justify-center">
                    <span className="text-[11px] text-emerald-300 font-bold bg-slate-950/80 px-3 py-1 rounded-full shadow-lg">
                      Centre su rostro aquí
                    </span>
                  </div>
                ) : (
                  <div className="w-[85%] h-[75%] rounded-xl border-2 border-dashed border-teal-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex items-center justify-center">
                    <span className="text-[11px] text-teal-300 font-bold bg-slate-950/80 px-3 py-1 rounded-full shadow-lg">
                      Enfoque la página principal
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-center space-x-4">
          {capturedImage ? (
            <>
              <Button
                variant="outline"
                onClick={retakePhoto}
                className="border-slate-800 text-slate-300 text-xs flex items-center space-x-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                <span>Repetir Foto</span>
              </Button>

              <Button
                onClick={confirmPhoto}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 px-6"
              >
                <Check className="h-4 w-4 mr-1" />
                <span>Usar Esta Foto</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={takeSnapshot}
              disabled={permissionState === "denied"}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-12 px-8 rounded-full shadow-xl flex items-center space-x-2"
            >
              <Camera className="h-5 w-5" />
              <span>Tomar Fotografía en Vivo</span>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
