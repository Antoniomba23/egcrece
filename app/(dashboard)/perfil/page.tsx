"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  User,
  Phone,
  Mail,
  Key,
  ShieldCheck,
  Lock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  CreditCard,
  UserCheck,
  RefreshCw,
  Sliders,
} from "lucide-react";
import Link from "next/link";

interface ProfileData {
  id: string;
  full_name: string;
  phone_number: string;
  role: "investor" | "admin" | "auditor";
  kyc_status: "pending" | "approved" | "rejected";
  status: "active" | "suspended" | "frozen";
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [savingPassword, setSavingPassword] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"info" | "security" | "kyc" | "limits">("info");

  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;
      setUserEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setPhoneNumber(data.phone_number || "");
      }
    } catch (err) {
      console.error("Error al cargar perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileMessage(null);

      if (!profile) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfileMessage({
        type: "success",
        text: "Datos personales actualizados correctamente.",
      });

      await fetchProfile();
    } catch (err: any) {
      setProfileMessage({
        type: "error",
        text: err.message || "Error al actualizar perfil.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPassword(true);
      setPasswordMessage(null);

      if (newPassword.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden.");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordMessage({
        type: "success",
        text: "Contraseña actualizada exitosamente.",
      });

      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage({
        type: "error",
        text: err.message || "Error al cambiar contraseña.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 text-center text-slate-400 animate-pulse text-sm">
        Cargando perfil de usuario...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-16 text-center text-white space-y-4">
        <h2 className="text-xl font-bold">No se encontró el perfil de usuario</h2>
        <Link href="/login">
          <Button variant="outline">Iniciar Sesión</Button>
        </Link>
      </div>
    );
  }

  // Iniciales del avatar
  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "EG";

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8 max-w-5xl">
      {/* Cabecera Principal de Perfil & Avatar */}
      <Card className="bg-slate-900 border-slate-800 text-white relative overflow-hidden shadow-2xl">
        <div className="h-28 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-slate-800/80" />

        <CardContent className="px-4 sm:px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-10 sm:-mt-12 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-3 sm:space-y-0 sm:space-x-4 min-w-0 flex-1">
              {/* Contenedor de Avatar con Iniciales */}
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black text-xl sm:text-2xl flex items-center justify-center border-4 border-slate-900 shadow-xl shrink-0">
                {initials}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight break-words min-w-0">
                  {profile.full_name || "Usuario EGCrece"}
                </h1>
                <p className="text-xs text-slate-400 flex items-center space-x-1 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{userEmail}</span>
                </p>
              </div>
            </div>

            {/* Badges de Estado y Rol */}
            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
              <Badge variant="outline" className="bg-emerald-950/80 text-emerald-400 border-emerald-800 uppercase font-bold text-xs">
                {(profile.role || "investor").toUpperCase()}
              </Badge>

              <Badge
                variant="outline"
                className={`uppercase font-bold text-xs ${
                  !profile.status || profile.status === "active"
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                    : "bg-rose-950 text-rose-400 border-rose-800"
                }`}
              >
                CUENTA {!profile.status || profile.status === "active" ? "ACTIVA" : profile.status.toUpperCase()}
              </Badge>

              <Badge
                variant="outline"
                className={`uppercase font-bold text-xs ${
                  profile.kyc_status === "approved"
                    ? "bg-teal-950 text-teal-400 border-teal-800"
                    : "bg-amber-950 text-amber-400 border-amber-800"
                }`}
              >
                KYC {profile.kyc_status === "approved" ? "VERIFICADO" : "PENDIENTE"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pestañas de Gestión de Perfil */}
      <div className="space-y-6">
        <div className="flex max-w-full overflow-x-auto whitespace-nowrap space-x-2 border-b border-slate-800 pb-2 no-scrollbar">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
              activeTab === "info" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Datos Personales</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
              activeTab === "security" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Key className="h-4 w-4" />
            <span>Seguridad & Acceso</span>
          </button>

          <button
            onClick={() => setActiveTab("kyc")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
              activeTab === "kyc" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Verificación KYC</span>
          </button>

          <button
            onClick={() => setActiveTab("limits")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
              activeTab === "limits" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Límites & Residencia CEMAC</span>
          </button>
        </div>

        {/* Tab 1: Datos Personales */}
        {activeTab === "info" && (
          <Card className="bg-slate-900 border-slate-800 text-white p-6 space-y-6">
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-bold text-emerald-400 flex items-center space-x-2">
                <User className="h-5 w-5 text-emerald-400" />
                <span>Información Personal & Contacto</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Mantenga actualizado su número de teléfono para recibir transferencias vía Mobile Money (Orange / MTN GE).
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileMessage && (
                <div
                  className={`p-3 rounded-md text-xs flex items-center space-x-2 ${
                    profileMessage.type === "success"
                      ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                      : "bg-rose-950/60 border border-rose-800 text-rose-300"
                  }`}
                >
                  {profileMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pFullName">Nombre Completo</Label>
                  <Input
                    id="pFullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="mt-1 bg-slate-950 border-slate-800 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="pPhone">Teléfono Mobile Money (Orange / MTN)</Label>
                  <Input
                    id="pPhone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ej: +240 222 123 456"
                    required
                    className="mt-1 bg-slate-950 border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pEmail">Correo Electrónico (Auth)</Label>
                  <Input
                    id="pEmail"
                    value={userEmail}
                    disabled
                    className="mt-1 bg-slate-950/50 border-slate-800 text-slate-400 font-mono text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <Label htmlFor="pCurrency">Moneda Principal de Cuenta</Label>
                  <Input
                    id="pCurrency"
                    value="Franco CFA (XAF / FCFA) - Zona CEMAC"
                    disabled
                    className="mt-1 bg-slate-950/50 border-slate-800 text-emerald-400 font-bold text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingProfile}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 px-6"
              >
                {savingProfile ? "Guardando..." : "Guardar Cambios de Perfil"}
              </Button>
            </form>
          </Card>
        )}

        {/* Tab 2: Seguridad & Contraseña */}
        {activeTab === "security" && (
          <Card className="bg-slate-900 border-slate-800 text-white p-6 space-y-6">
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-bold text-emerald-400 flex items-center space-x-2">
                <Key className="h-5 w-5 text-emerald-400" />
                <span>Gestión de Contraseña & Seguridad de Acceso</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Cambie su contraseña de acceso a la plataforma. Le recomendamos utilizar una clave robusta con letras y números.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              {passwordMessage && (
                <div
                  className={`p-3 rounded-md text-xs flex items-center space-x-2 ${
                    passwordMessage.type === "success"
                      ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                      : "bg-rose-950/60 border border-rose-800 text-rose-300"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <div>
                <Label htmlFor="nPass">Nueva Contraseña</Label>
                <Input
                  id="nPass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="mt-1 bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label htmlFor="cPass">Confirmar Nueva Contraseña</Label>
                <Input
                  id="cPass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita la contraseña"
                  required
                  className="mt-1 bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={savingPassword}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 px-6"
              >
                {savingPassword ? "Actualizando..." : "Actualizar Contraseña"}
              </Button>
            </form>
          </Card>
        )}

        {/* Tab 3: Verificación KYC */}
        {activeTab === "kyc" && (
          <Card className="bg-slate-900 border-slate-800 text-white p-6 space-y-6">
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-bold text-emerald-400 flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Estado de Verificación KYC e Identidad</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Verifique el estado oficial de su expediente de identidad conforme a la normativa financiera de la zona CEMAC.
              </CardDescription>
            </CardHeader>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Estado del Expediente:</span>
                <Badge
                  variant="outline"
                  className={`uppercase font-bold text-xs ${
                    profile.kyc_status === "approved"
                      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                      : "bg-amber-950 text-amber-400 border-amber-800"
                  }`}
                >
                  {profile.kyc_status === "approved" ? "VERIFICADO & APROBADO" : "REVISIÓN PENDIENTE"}
                </Badge>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {profile.kyc_status === "approved"
                  ? "Su documento de identidad (DNI / Pasaporte) ha sido validado. Disfruta de acceso completo para depositar, invertir y solicitar retiros de fondos en Franco CFA (XAF)."
                  : "Su expediente de identidad se encuentra en cola de revisión por el equipo de cumplimiento. Puede subir o corregir su documento en la sección dedicada."}
              </p>

              {profile.kyc_status !== "approved" && (
                <Link href="/kyc" className="inline-block">
                  <Button className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold">
                    Ir a Verificación KYC / Subir Documento
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}

        {/* Tab 4: Límites Operativos & Residencia CEMAC */}
        {activeTab === "limits" && (
          <Card className="bg-slate-900 border-slate-800 text-white p-6 space-y-6">
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-bold text-emerald-400 flex items-center space-x-2">
                <Sliders className="h-5 w-5 text-emerald-400" />
                <span>Límites Operativos & Residencia Fiscal CEMAC</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Parámetros regulatorios aplicables a su perfil de inversión en Guinea Ecuatorial.
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-bold block uppercase">Límite Diario Depósito</span>
                <span className="text-xl font-extrabold text-emerald-400">10.000.000 XAF</span>
                <span className="text-[11px] text-slate-500 block">Vía Mobile Money Orange/MTN</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-bold block uppercase">Límite Diario Retiro</span>
                <span className="text-xl font-extrabold text-teal-400">5.000.000 XAF</span>
                <span className="text-[11px] text-slate-500 block">Transferencia directa a cuenta</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-bold block uppercase">Residencia Fiscal</span>
                <span className="text-sm font-bold text-white block">Guinea Ecuatorial (Zona CEMAC)</span>
                <span className="text-[11px] text-slate-500 block">Moneda oficial: Franco CFA</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-bold block uppercase">Retención Fiscal Intereses</span>
                <span className="text-sm font-bold text-emerald-400 block">0% (Incentivos Microinversión)</span>
                <span className="text-[11px] text-slate-500 block">Exención para capital nacional</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
