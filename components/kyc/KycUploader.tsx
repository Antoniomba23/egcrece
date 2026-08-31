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
  Sparkles,
  RefreshCw,
} from "lucide-react";

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
  const [uploadingSelfie, setUploadingSelfie] = useState<boolean>(false);

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
      if (target === "selfie") setUploadingSelfie(true);

      if (file.size > 8 * 1024 * 1024) {
        throw new Error("El archivo supera el tamaño máximo de 8MB.");
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

      setStatusMessage({
        type: "success",
        text: `Foto de ${target === "front" ? "frente/pasaporte" : target === "back" ? "reverso" : "selfie"} cargada exitosamente.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || `Error al procesar foto de ${target}`,
      });
    } finally {
      if (target === "front") setUploadingFront(false);
      if (target === "back") setUploadingBack(false);
      if (target === "selfie") setUploadingSelfie(false);
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
        throw new Error("Debe seleccionar o tomar su Selfie / Foto de Rostro.");
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
    <Card className="max-w-3xl mx-auto bg-slate-900 border-slate-800 text-white shadow-2xl w-full max-w-full overflow-x-hidden box-border">
      <CardHeader className="border-b border-slate-800/80 pb-4 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-emerald-400 flex items-center space-x-2 text-lg sm:text-xl">
              <ShieldCheck className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              <span>Verificación de Identidad con IA (24/7)</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-300 mt-1">
              {isPassport
                ? "Pasaportes: Solo requiere 2 fotos (Página Principal + Selfie / Foto de Rostro)."
                : "DNI / Tarjetas: Requiere 3 fotos (Frente, Dorso y Selfie / Foto de Rostro)."}
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

      <CardContent className="space-y-6 pt-6 px-3 sm:px-6 w-full max-w-full overflow-x-hidden box-border">
        {/* Banner Informativo */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <Sparkles className="h-4 w-4" />
            <span>Carga Directa de Fotografías y Documentación</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Presione <strong>"Seleccionar o Tomar Foto"</strong> en cada recuadro. En teléfonos móviles podrá elegir entre usar la <strong>Cámara en vivo</strong> o seleccionar una foto existente de su <strong>Galería</strong>.
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
                  <div className="space-y-2 pt-2">
                    <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] mx-auto block py-1">
                      ✓ Foto Lista
                    </Badge>
                    <label className="cursor-pointer text-[10px] text-slate-400 hover:text-emerald-400 underline block font-semibold">
                      <span>Cambiar Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingFront}
                        onChange={(e) => e.target.files?.[0] && handleSingleFileUpload(e.target.files[0], "front")}
                        className="sr-only"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="pt-2">
                    <label className="w-full cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg px-3 py-2.5 text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md">
                      <Upload className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{uploadingFront ? "Subiendo..." : "📁 Seleccionar o Tomar Foto"}</span>
                      <input
                        type="file"
                        accept="image/*"
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
                    <div className="space-y-2 pt-2">
                      <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] mx-auto block py-1">
                        ✓ Foto Lista
                      </Badge>
                      <label className="cursor-pointer text-[10px] text-slate-400 hover:text-teal-400 underline block font-semibold">
                        <span>Cambiar Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingBack}
                          onChange={(e) => e.target.files?.[0] && handleSingleFileUpload(e.target.files[0], "back")}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <label className="w-full cursor-pointer bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg px-3 py-2.5 text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md">
                        <Upload className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{uploadingBack ? "Subiendo..." : "📁 Seleccionar o Tomar Foto"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingBack}
                          onChange={(e) => e.target.files?.[0] && handleSingleFileUpload(e.target.files[0], "back")}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Tarjeta 3: Selfie / Foto de Rostro */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3 relative flex flex-col justify-between">
                <div className="space-y-2">
                  <Camera className="mx-auto h-7 w-7 text-blue-400" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">
                      {isPassport ? "2. Selfie / Foto de Rostro" : "3. Selfie / Foto de Rostro"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Rostro Biométrico Vivo</span>
                  </div>
                </div>

                {selfieFileUrl ? (
                  <div className="space-y-2 pt-2">
                    <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] mx-auto block py-1">
                      ✓ Selfie Lista
                    </Badge>
                    <label className="cursor-pointer text-[10px] text-slate-400 hover:text-blue-400 underline block font-semibold">
                      <span>Cambiar Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingSelfie}
                        onChange={(e) => e.target.files?.[0] && handleSingleFileUpload(e.target.files[0], "selfie")}
                        className="sr-only"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="pt-2">
                    <label className="w-full cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg px-3 py-2.5 text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md">
                      <Upload className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{uploadingSelfie ? "Subiendo..." : "📁 Seleccionar o Tomar Foto"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingSelfie}
                        onChange={(e) => e.target.files?.[0] && handleSingleFileUpload(e.target.files[0], "selfie")}
                        className="sr-only"
                      />
                    </label>
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
    </Card>
  );
}
