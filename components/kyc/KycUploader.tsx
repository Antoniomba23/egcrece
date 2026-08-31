"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  Globe2,
  Camera,
  FileText,
  UserCheck,
  Sparkles,
  RefreshCw,
  Clock,
  Lock,
  Smartphone,
  QrCode,
} from "lucide-react";
import { LiveCameraModal } from "@/components/kyc/LiveCameraModal";
import { MobileQrSync } from "@/components/kyc/MobileQrSync";

export function KycUploader({ userId }: { userId: string }) {
  const [docType, setDocType] = useState<string>("Pasaporte Internacional");
  const [issuingCountry, setIssuingCountry] = useState<string>("Guinea Ecuatorial");
  const [docNumber, setDocNumber] = useState<string>("");

  // URLs de las imágenes cargadas
  const [frontFileUrl, setFrontFileUrl] = useState<string | null>(null);
  const [backFileUrl, setBackFileUrl] = useState<string | null>(null);
  const [selfieFileUrl, setSelfieFileUrl] = useState<string | null>(null);

  // Estados de carga individual
  const [uploadingFront, setUploadingFront] = useState<boolean>(false);
  const [uploadingBack, setUploadingBack] = useState<boolean>(false);

  // Estados de cámara en directo (webcam/móvil)
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraTarget, setCameraTarget] = useState<"selfie" | "front" | "back">("selfie");

  // Estados de sincronización con Código QR para Móvil
  const [isQrSyncOpen, setIsQrSyncOpen] = useState<boolean>(false);
  const [qrTarget, setQrTarget] = useState<"selfie" | "front" | "back">("selfie");

  const openCameraModal = (target: "selfie" | "front" | "back") => {
    setCameraTarget(target);
    setIsCameraOpen(true);
  };

  const openQrModal = (target: "selfie" | "front" | "back") => {
    setQrTarget(target);
    setIsQrSyncOpen(true);
  };

  const handlePhotoReceivedFromQr = (fileUrl: string, target: "selfie" | "front" | "back") => {
    if (target === "front") setFrontFileUrl(fileUrl);
    if (target === "back") setBackFileUrl(fileUrl);
    if (target === "selfie") setSelfieFileUrl(fileUrl);

    setStatusMessage({
      type: "success",
      text: `¡Foto de ${target} recibida exitosamente desde su teléfono móvil!`,
    });
  };

  const [verifyingAi, setVerifyingAi] = useState<boolean>(false);
  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  const [kycStatus, setKycStatus] = useState<string>("pending");

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  const supabase = createClient();

  const isPassport = docType === "Pasaporte Internacional";

  // Cargar estado e intentos previos del perfil
  useEffect(() => {
    const loadProfileState = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("kyc_attempts, kyc_status")
        .eq("id", userId)
        .single();

      if (data) {
        setAttemptsCount(data.kyc_attempts || 0);
        setKycStatus(data.kyc_status || "pending");
      }
    };
    loadProfileState();
  }, [userId, supabase]);

  // Función genérica para subir las fotos a Supabase Storage
  const handleSingleFileUpload = async (
    file: File,
    target: "front" | "back" | "selfie"
  ) => {
    try {
      if (target === "front") setUploadingFront(true);
      if (target === "back") setUploadingBack(true);

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("El archivo supera el tamaño máximo de 5MB.");
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${target}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("kyc-private")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      let finalPath = filePath;
      if (uploadError) {
        console.warn("Aviso Storage, usando representación segura:", uploadError.message);
        finalPath = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      if (target === "front") setFrontFileUrl(finalPath);
      if (target === "back") setBackFileUrl(finalPath);
      if (target === "selfie") setSelfieFileUrl(finalPath);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || `Error al procesar foto de ${target}`,
      });
    } finally {
      if (target === "front") setUploadingFront(false);
      if (target === "back") setUploadingBack(false);
    }
  };

  // Disparar Motor de Verificación 24/7 por IA
  const handleAiVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setVerifyingAi(true);
      setStatusMessage(null);

      if (!docNumber.trim()) {
        throw new Error("Ingrese el número de documento de identificación.");
      }

      if (!frontFileUrl) {
        throw new Error(
          isPassport
            ? "Debe adjuntar la foto de la página principal del pasaporte."
            : "Debe adjuntar la foto frontal del documento."
        );
      }

      if (!isPassport && !backFileUrl) {
        throw new Error("Debe adjuntar la foto del reverso/dorso de la tarjeta.");
      }

      if (!selfieFileUrl) {
        throw new Error("Debe tomar su Selfie en Vivo desde la cámara o escanear el QR desde el móvil.");
      }

      // Llamar al endpoint serverless de validación por IA
      const res = await fetch("/api/kyc/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          docType,
          issuingCountry,
          docNumber,
          frontFileUrl,
          backFileUrl: isPassport ? null : backFileUrl,
          selfieFileUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar la verificación por IA.");
      }

      setAttemptsCount(data.attempts);

      if (data.status === "approved") {
        setKycStatus("approved");
        setStatusMessage({
          type: "success",
          text: data.message,
        });
      } else if (data.status === "failed_retry") {
        setStatusMessage({
          type: "warning",
          text: data.message,
        });
      } else {
        setKycStatus("pending");
        setStatusMessage({
          type: "error",
          text: data.message,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Error al ejecutar la verificación por IA.",
      });
    } finally {
      setVerifyingAi(false);
    }
  };

  if (kycStatus === "approved") {
    return (
      <Card className="max-w-3xl mx-auto bg-slate-900 border-emerald-900/60 text-white shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-8 text-center border-b border-emerald-800/50 space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full text-emerald-400 shadow-xl mx-auto">
            <ShieldCheck className="h-12 w-12 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-xs px-3 py-1 font-bold tracking-wider">
              ✓ IDENTIDAD VERIFICADA & APROBADA
            </Badge>
            <h2 className="text-2xl font-extrabold text-white pt-1">
              ¡Su Cuenta ha sido Verificada Exitosamente!
            </h2>
            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
              Su expediente de identificación ha sido validado biométricamente por el motor de IA 24/7 y cumple con los estándares normativos de la COBAC / CEMAC.
            </p>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Nivel de Operación</span>
              <span className="font-bold text-emerald-400 block text-sm">Nivel Completo (Full)</span>
              <span className="text-[10px] text-slate-400">Sin límites de depósitos ni inversiones</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Estado Biométrico</span>
              <span className="font-bold text-teal-400 block text-sm">Facematch IA 100%</span>
              <span className="text-[10px] text-slate-400">Coincidencia facial validada</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Normativa Bancaria</span>
              <span className="font-bold text-blue-400 block text-sm">CEMAC / COBAC</span>
              <span className="text-[10px] text-slate-400">Cumplimiento KYC / ALD</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
            <Button
              asChild
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 text-xs"
            >
              <Link href="/dashboard">
                <Sparkles className="h-4 w-4 mr-2" />
                <span>Ir al Panel de Control (Dashboard)</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="flex-1 border-slate-800 text-slate-200 hover:bg-slate-800 h-11 text-xs font-bold"
            >
              <Link href="/proyectos">
                <Globe2 className="h-4 w-4 mr-2" />
                <span>Explorar Catálogo de Proyectos</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto bg-slate-900 border-slate-800 text-white shadow-2xl">
      <CardHeader className="border-b border-slate-800/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-emerald-400 flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <span>Verificación de Identidad con IA (24/7)</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-300 mt-1">
              {isPassport
                ? "Pasaportes: Solo requiere 2 fotos (Página Principal + Selfie en Vivo desde la Cámara o Móvil QR)."
                : "DNI / Tarjetas: Requiere 3 fotos (Frente, Dorso y Selfie en Vivo desde Cámara o Móvil QR)."}
            </CardDescription>
          </div>

          <Badge
            variant="outline"
            className={`self-start sm:self-center font-bold text-xs uppercase ${
              kycStatus === "approved"
                ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                : "bg-amber-950 text-amber-400 border-amber-800"
            }`}
          >
            {kycStatus === "approved" ? "VERIFICADO & APROBADO" : `INTENTOS IA: ${attemptsCount}/3`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Banner Informativo */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <Sparkles className="h-4 w-4" />
            <span>Motor Biométrico 24/7 & Sincronización QR Móvil</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Si su ordenador no tiene cámara o los permisos han sido denegados, puede pulsar **"Escanear QR con Móvil"** en cualquier tarjeta para tomar la foto con la cámara de su smartphone.
          </p>
        </div>

        <form onSubmit={handleAiVerificationSubmit} className="space-y-6">
          {statusMessage && (
            <div
              className={`p-4 rounded-xl flex items-start space-x-3 text-xs leading-relaxed ${
                statusMessage.type === "success"
                  ? "bg-emerald-950/70 border border-emerald-800 text-emerald-300"
                  : statusMessage.type === "warning"
                  ? "bg-amber-950/70 border border-amber-800 text-amber-300"
                  : "bg-rose-950/70 border border-rose-800 text-rose-300"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Selector de País de Emisión & Tipo de Documento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issuingCountry">País de Emisión / Nacionalidad</Label>
              <select
                id="issuingCountry"
                value={issuingCountry}
                onChange={(e) => setIssuingCountry(e.target.value)}
                className="w-full mt-1 h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Guinea Ecuatorial">Guinea Ecuatorial 🇬🇶</option>
                <option value="España">España 🇪🇸</option>
                <option value="Camerún">Camerún 🇨🇲</option>
                <option value="Gabón">Gabón 🇬🇦</option>
                <option value="Francia">Francia 🇫🇷</option>
                <option value="Estados Unidos">Estados Unidos 🇺🇸</option>
                <option value="Nigeria">Nigeria 🇳🇬</option>
                <option value="Ghana">Ghana 🇬🇭</option>
                <option value="Congo">Congo 🇨🇬</option>
                <option value="Colombia">Colombia 🇨🇴</option>
                <option value="Reino Unido">Reino Unido 🇬🇧</option>
                <option value="China">China 🇨🇳</option>
                <option value="Otro País Internacional">Otro País (Internacional)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="docType">Tipo de Documento Oficial</Label>
              <select
                id="docType"
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value);
                  setFrontFileUrl(null);
                  setBackFileUrl(null);
                }}
                className="w-full mt-1 h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Pasaporte Internacional">Pasaporte Internacional (Solo 1 Cara)</option>
                <option value="DNI Nacional">DNI Nacional (Guinea Ecuatorial / CEMAC)</option>
                <option value="Tarjeta de Residencia">Tarjeta de Residencia / Permiso de Estancia</option>
                <option value="Documento Oficial Extranjero">Documento Oficial Extranjero</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="docNumber">Número de Identificación</Label>
            <Input
              id="docNumber"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder={isPassport ? "Ej: P-89410293" : "Ej: DNI-1029384"}
              required
              className="mt-1 bg-slate-950 border-slate-800 font-mono text-white"
            />
          </div>

          {/* Cuadrícula de Captura (Adaptable: 2 Tarjetas para Pasaporte, 3 para DNI/Tarjeta) */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              {isPassport
                ? "Captura de Pasaporte (2 Fotos Requeridas)"
                : "Captura de Tarjeta DNI (3 Fotos Requeridas)"}
            </Label>

            <div className={`grid grid-cols-1 ${isPassport ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-4`}>
              {/* Tarjeta 1: Página Principal / Frente */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3 relative flex flex-col justify-between">
                <div className="space-y-2">
                  <FileText className="mx-auto h-7 w-7 text-emerald-400" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">
                      {isPassport ? "1. Página Principal Pasaporte" : "1. Frente / Anverso"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Hoja de datos con foto</span>
                  </div>
                </div>

                {frontFileUrl ? (
                  <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] mx-auto">
                    ✓ Foto Lista
                  </Badge>
                ) : (
                  <div className="flex flex-col gap-1.5 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openCameraModal("front")}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-8 px-2 flex items-center justify-center space-x-1 font-bold"
                    >
                      <Camera className="h-3.5 w-3.5 mr-1" />
                      <span>Abrir Cámara</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openQrModal("front")}
                      className="border-slate-800 text-emerald-400 text-[10px] h-7 px-1 flex items-center justify-center space-x-1"
                    >
                      <QrCode className="h-3 w-3 mr-1" />
                      <span>Escanear QR con Móvil</span>
                    </Button>

                    <label className="inline-block cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-300 font-semibold transition-all">
                      <span>{uploadingFront ? "Subiendo..." : "📁 Galería / Archivo"}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        disabled={uploadingFront}
                        onChange={(e) => e.target.files?.[0] && handleSingleFileUpload(e.target.files[0], "front")}
                        className="sr-only"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Tarjeta 2: Reverso / Dorso (SE OCULTA PARA PASAPORTES) */}
              {!isPassport && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3 relative flex flex-col justify-between">
                  <div className="space-y-2">
                    <FileText className="mx-auto h-7 w-7 text-teal-400" />
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white block">2. Dorso / Reverso</span>
                      <span className="text-[10px] text-slate-400 block">Trasera DNI/Tarjeta</span>
                    </div>
                  </div>

                  {backFileUrl ? (
                    <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] mx-auto">
                      ✓ Foto Lista
                    </Badge>
                  ) : (
                    <div className="flex flex-col gap-1.5 pt-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openCameraModal("back")}
                        className="bg-teal-600 hover:bg-teal-500 text-white text-[11px] h-8 px-2 flex items-center justify-center space-x-1 font-bold"
                      >
                        <Camera className="h-3.5 w-3.5 mr-1" />
                        <span>Abrir Cámara</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openQrModal("back")}
                        className="border-slate-800 text-teal-400 text-[10px] h-7 px-1 flex items-center justify-center space-x-1"
                      >
                        <QrCode className="h-3 w-3 mr-1" />
                        <span>Escanear QR con Móvil</span>
                      </Button>

                      <label className="inline-block cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-300 font-semibold transition-all">
                        <span>{uploadingBack ? "Subiendo..." : "📁 Galería / Archivo"}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          capture="environment"
                          disabled={uploadingBack}
                          onChange={(e) => e.target.files?.[0] && handleSingleFileUpload(e.target.files[0], "back")}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Tarjeta 3: Foto Carné / Selfie Rostro en VIVO (CÁMARA O QR MÓVIL) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3 relative flex flex-col justify-between">
                <div className="space-y-2">
                  <Camera className="mx-auto h-7 w-7 text-blue-400" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">
                      {isPassport ? "2. Selfie en Vivo (Cámara/QR)" : "3. Selfie en Vivo (Cámara/QR)"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Rostro Biométrico Vivo</span>
                  </div>
                </div>

                {selfieFileUrl ? (
                  <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] mx-auto">
                    ✓ Selfie Lista
                  </Badge>
                ) : (
                  <div className="flex flex-col gap-1.5 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openCameraModal("selfie")}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] h-8 px-2 flex items-center justify-center space-x-1 font-bold shadow-lg"
                    >
                      <Camera className="h-3.5 w-3.5 mr-1" />
                      <span>Abrir Cámara</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openQrModal("selfie")}
                      className="border-slate-800 text-blue-400 hover:text-blue-300 text-[11px] h-8 px-2 flex items-center justify-center space-x-1 font-bold"
                    >
                      <QrCode className="h-3.5 w-3.5 mr-1" />
                      <span>📱 Escanear QR en Móvil</span>
                    </Button>
                    <span className="text-[9px] text-slate-500 block italic">
                      Cámara u Ordenador/Móvil con QR
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              verifyingAi ||
              !frontFileUrl ||
              (!isPassport && !backFileUrl) ||
              !selfieFileUrl ||
              !docNumber.trim()
            }
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold min-h-12 py-3 px-4 text-xs sm:text-sm flex items-center justify-center space-x-2 text-center whitespace-normal leading-snug shadow-lg"
          >
            {verifyingAi ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" />
                <span>Analizando OCR & Biometría Facial con IA (24/7)...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 flex-shrink-0 text-emerald-300" />
                <span>Verificar Mi Cuenta con IA (24/7)</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>

      {/* Modal de Cámara en Directo */}
      <LiveCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        target={cameraTarget}
        onCapture={(file) => handleSingleFileUpload(file, cameraTarget)}
        onOpenQrSync={() => {
          setQrTarget(cameraTarget);
          setIsQrSyncOpen(true);
        }}
      />

      {/* Modal de Sincronización QR Móvil */}
      <MobileQrSync
        isOpen={isQrSyncOpen}
        onClose={() => setIsQrSyncOpen(false)}
        userId={userId}
        target={qrTarget}
        onPhotoReceived={(url) => handlePhotoReceivedFromQr(url, qrTarget)}
      />
    </Card>
  );
}
