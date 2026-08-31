"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowUpRight,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Globe2,
  Building2,
  Banknote,
  Send,
} from "lucide-react";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onWithdrawComplete: () => void;
}

type RegionType = "national" | "cemac";
type NationalWithdrawMethod = "Muni Dinero" | "Cobro en Ventanilla" | "RosaMoney" | "PacMoney" | "Transferencia Bancaria";
type CemacWithdrawMethod = "Orange Money" | "MTN Mobile Money";

export function WithdrawModal({ isOpen, onClose, availableBalance, onWithdrawComplete }: WithdrawModalProps) {
  const [region, setRegion] = useState<RegionType>("national");
  const [nationalMethod, setNationalMethod] = useState<NationalWithdrawMethod>("Muni Dinero");
  const [cemacMethod, setCemacMethod] = useState<CemacWithdrawMethod>("Orange Money");

  const [phone, setPhone] = useState<string>("+240 ");
  const [amount, setAmount] = useState<number>(10000);
  const [receiverName, setReceiverName] = useState<string>("");
  const [bankName, setBankName] = useState<string>("BANGE");
  const [bankAccountNumber, setBankAccountNumber] = useState<string>("");
  const [officeLocation, setOfficeLocation] = useState<string>("Malabo (Edificio Presidencia)");

  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  if (!isOpen) return null;

  const currentProviderName = region === "national" ? nationalMethod : cemacMethod;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMessage(null);

      if (amount > availableBalance) {
        throw new Error("El monto solicitado supera el saldo disponible para retiro.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Debe iniciar sesión.");

      // Verificar rol, estado y KYC del perfil
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("role, status, kyc_status")
        .eq("id", user.id)
        .single();

      if (profErr || !profile) throw new Error("Error al obtener el perfil de usuario.");

      if (profile.role === "admin") {
        throw new Error("Separación de Funciones (SoD): Los administradores no pueden solicitar retiros desde cuentas corporativas.");
      }

      if (profile.status !== "active") {
        throw new Error("Su cuenta se encuentra suspendida o congelada por seguridad.");
      }

      if (profile.kyc_status !== "approved") {
        throw new Error("Debe completar la verificación de identidad (KYC) antes de solicitar retiros de fondos.");
      }

      const referenceCode = `WTH-${Date.now().toString().slice(-6)}`;

      // Formatear detalles del método de pago
      let paymentDetail: string = currentProviderName;
      if (region === "national") {
        if (nationalMethod === "Muni Dinero") {
          paymentDetail = `Muni Dinero (${phone})`;
        } else if (nationalMethod === "Cobro en Ventanilla") {
          paymentDetail = `Ventanilla EGCrece [${officeLocation}]`;
        } else if (nationalMethod === "RosaMoney" || nationalMethod === "PacMoney") {
          paymentDetail = `${nationalMethod} (${receiverName || "Remitente"} - ${phone})`;
        } else if (nationalMethod === "Transferencia Bancaria") {
          if (!bankAccountNumber) throw new Error("Ingrese el número de cuenta bancaria (RIB / IBAN).");
          paymentDetail = `Banco ${bankName} [Cuenta: ${bankAccountNumber}]`;
        }
      } else {
        paymentDetail = `${cemacMethod} (${phone})`;
      }

      // 1. Insertar en withdrawal_requests
      const { error } = await supabase.from("withdrawal_requests").insert({
        user_id: user.id,
        amount: amount,
        currency: "XAF",
        phone_number: phone,
        payment_method: paymentDetail,
        status: "pending",
        reference_code: referenceCode,
      });

      if (error) {
        // Fallback a transactions
        const { error: txError } = await supabase.from("transactions").insert({
          user_id: user.id,
          amount: amount,
          currency: "XAF",
          type: "withdrawal",
          status: "pending",
          reference_code: referenceCode,
        });
        if (txError) throw txError;
      }

      setStatusMessage({
        type: "success",
        text: `Solicitud de retiro de ${formatCurrency(amount)} enviada correctamente vía ${currentProviderName} [Ref: ${referenceCode}].`,
      });

      setTimeout(() => {
        onWithdrawComplete();
        onClose();
      }, 2000);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Error procesando el retiro",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-slate-900 border-slate-800 text-white relative shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-teal-400 flex items-center space-x-2">
            <ArrowUpRight className="h-5 w-5" />
            <span>Solicitar Retiro de Fondos (XAF)</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-300">
            Retire fondos de su billetera a su cuenta bancaria o billetera móvil en Guinea Ecuatorial o la zona CEMAC.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleWithdraw}>
          <CardContent className="space-y-4">
            {statusMessage && (
              <div
                className={`p-3 rounded-md flex items-center space-x-2 text-xs ${
                  statusMessage.type === "success"
                    ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                    : "bg-rose-950/60 border border-rose-800 text-rose-300"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Saldo Disponible para Retiro:</span>
              <span className="text-emerald-400 font-bold text-sm">{formatCurrency(availableBalance)}</span>
            </div>

            {/* Selector de Región: Guinea Ecuatorial vs CEMAC */}
            <div>
              <Label className="text-xs text-slate-300 font-bold uppercase tracking-wider block mb-1.5">Destino de los Fondos</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegion("national")}
                  className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    region === "national"
                      ? "border-teal-500 bg-teal-500/10 text-teal-400"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span>Guinea Ecuatorial 🇬🇶</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegion("cemac")}
                  className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    region === "cemac"
                      ? "border-teal-500 bg-teal-500/10 text-teal-400"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                  }`}
                >
                  <Globe2 className="h-4 w-4" />
                  <span>África Central (CEMAC)</span>
                </button>
              </div>
            </div>

            {/* Selector de Métodos Nacionales */}
            {region === "national" && (
              <div>
                <Label className="text-xs text-slate-300 font-bold uppercase tracking-wider block mb-1.5">Método de Retiro</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNationalMethod("Muni Dinero")}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left ${
                      nationalMethod === "Muni Dinero"
                        ? "border-teal-500 bg-teal-500/20 text-teal-300"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    Muni Dinero
                  </button>

                  <button
                    type="button"
                    onClick={() => setNationalMethod("Cobro en Ventanilla")}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left ${
                      nationalMethod === "Cobro en Ventanilla"
                        ? "border-teal-500 bg-teal-500/20 text-teal-300"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    Ventanilla Oficina
                  </button>

                  <button
                    type="button"
                    onClick={() => setNationalMethod("RosaMoney")}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left ${
                      nationalMethod === "RosaMoney"
                        ? "border-teal-500 bg-teal-500/20 text-teal-300"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    RosaMoney
                  </button>

                  <button
                    type="button"
                    onClick={() => setNationalMethod("PacMoney")}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left ${
                      nationalMethod === "PacMoney"
                        ? "border-teal-500 bg-teal-500/20 text-teal-300"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    PacMoney
                  </button>

                  <button
                    type="button"
                    onClick={() => setNationalMethod("Transferencia Bancaria")}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left col-span-2 sm:col-span-2 ${
                      nationalMethod === "Transferencia Bancaria"
                        ? "border-teal-500 bg-teal-500/20 text-teal-300"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    Banco (BANGE/CCEI/BGFI/Ecobank)
                  </button>
                </div>
              </div>
            )}

            {/* Selector de Métodos CEMAC */}
            {region === "cemac" && (
              <div>
                <Label className="text-xs text-slate-300 font-bold uppercase tracking-wider block mb-1.5">Proveedor CEMAC</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCemacMethod("Orange Money")}
                    className={`p-3 rounded-lg border text-xs font-bold text-center transition-all ${
                      cemacMethod === "Orange Money"
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    Orange Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setCemacMethod("MTN Mobile Money")}
                    className={`p-3 rounded-lg border text-xs font-bold text-center transition-all ${
                      cemacMethod === "MTN Mobile Money"
                        ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    MTN Mobile Money
                  </button>
                </div>
              </div>
            )}

            {/* Campos Específicos por Método */}

            {/* 1. Muni Dinero / Mobile Money */}
            {(nationalMethod === "Muni Dinero" || region === "cemac") && (
              <div>
                <Label htmlFor="wphone">Número de Teléfono (+240)</Label>
                <Input
                  id="wphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+240 222 123 456"
                  required
                  className="mt-1 bg-slate-950 border-slate-800 font-mono"
                />
              </div>
            )}

            {/* 2. Ventanilla Oficina */}
            {region === "national" && nationalMethod === "Cobro en Ventanilla" && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <Label>Seleccionar Agencia de Cobro</Label>
                  <select
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="Malabo (Edificio Presidencia)">Malabo - Agencia Presidencia / Ela Nguema</option>
                    <option value="Bata (Paseo Marítimo)">Bata - Agencia Central Paseo Marítimo</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-400">
                  Deberá presentar su **DNI o Pasaporte físico** coincidente con su expediente KYC al momento de la retirada en caja.
                </p>
              </div>
            )}

            {/* 3. RosaMoney / PacMoney */}
            {region === "national" && (nationalMethod === "RosaMoney" || nationalMethod === "PacMoney") && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="recN">Nombre del Beneficiario</Label>
                  <Input
                    id="recN"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="Nombre completo registrado en DNI"
                    required
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
                <div>
                  <Label htmlFor="recP">Teléfono de Notificación (+240)</Label>
                  <Input
                    id="recP"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+240 222 123 456"
                    required
                    className="mt-1 bg-slate-950 border-slate-800 font-mono"
                  />
                </div>
              </div>
            )}

            {/* 4. Transferencia Bancaria */}
            {region === "national" && nationalMethod === "Transferencia Bancaria" && (
              <div className="space-y-3">
                <div>
                  <Label>Banco Destino</Label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-bold"
                  >
                    <option value="BANGE">BANGE (Banco Nacional de Guinea Ecuatorial)</option>
                    <option value="CCEI Bank GE">CCEI Bank GE</option>
                    <option value="BGFIBank GE">BGFIBank GE</option>
                    <option value="Ecobank GE">Ecobank GE</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="wBankNum">Número de Cuenta Bancaria (RIB / IBAN)</Label>
                  <Input
                    id="wBankNum"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="Ej: 30005 00001 12345678901 88"
                    required
                    className="mt-1 bg-slate-950 border-slate-800 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Monto de Retiro */}
            <div>
              <Label htmlFor="wamount">Monto a Retirar (FCFA - XAF)</Label>
              <Input
                id="wamount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={2000}
                max={availableBalance > 0 ? availableBalance : 2000}
                step={2000}
                required
                className="mt-1 text-lg font-bold text-teal-400 bg-slate-950 border-slate-800"
              />
            </div>

            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px] flex items-center space-x-2">
              <Clock className="h-4 w-4 flex-shrink-0 text-amber-400" />
              <span>Las solicitudes de retiro son procesadas tras la aprobación de cumplimiento AML del administrador.</span>
            </div>

            <Button
              type="submit"
              disabled={loading || availableBalance <= 0}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold mt-2 h-11"
            >
              {loading ? "Enviando Solicitud..." : `Solicitar Retiro de ${formatCurrency(amount)}`}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
