"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Smartphone,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Send,
  Ticket,
  Globe2,
  MapPin,
  Banknote,
} from "lucide-react";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositComplete: () => void;
}

type RegionType = "national" | "cemac";
type NationalMethod = "Muni Dinero" | "Efectivo en Oficina" | "RosaMoney" | "PacMoney" | "Transferencia Bancaria";
type CemacMethod = "Orange Money" | "MTN Mobile Money";

export function DepositModal({ isOpen, onClose, onDepositComplete }: DepositModalProps) {
  const [region, setRegion] = useState<RegionType>("national");
  const [nationalMethod, setNationalMethod] = useState<NationalMethod>("Muni Dinero");
  const [cemacMethod, setCemacMethod] = useState<CemacMethod>("Orange Money");

  // Campos específicos
  const [phone, setPhone] = useState<string>("+240 222 ");
  const [amount, setAmount] = useState<number>(50000);
  const [senderName, setSenderName] = useState<string>("");
  const [remittanceCode, setRemittanceCode] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("BANGE");
  const [bankReceiptCode, setBankReceiptCode] = useState<string>("");
  const [officeLocation, setOfficeLocation] = useState<string>("Malabo (Edificio Presidencia)");

  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  if (!isOpen) return null;

  const currentProviderName = region === "national" ? nationalMethod : cemacMethod;

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMessage(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Debe iniciar sesión para realizar un depósito.");
      }

      // 1. Verificar SoD del perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        throw new Error(
          "Separación de Funciones (SoD): Los administradores no pueden realizar depósitos a título personal. Use una cuenta de Inversor."
        );
      }

      // 2. Generar código de referencia según el método de pago
      let referenceCode = "";
      let isInstant = true;

      if (region === "national") {
        if (nationalMethod === "Muni Dinero") {
          referenceCode = `DEP-MUNI-${Date.now().toString().slice(-6)}`;
        } else if (nationalMethod === "Efectivo en Oficina") {
          referenceCode = `TKT-${officeLocation.includes("Malabo") ? "MLB" : "BAT"}-${Date.now().toString().slice(-6)}`;
          isInstant = false;
        } else if (nationalMethod === "RosaMoney" || nationalMethod === "PacMoney") {
          if (!remittanceCode) throw new Error("Ingrese el código de giro / número de transacción.");
          referenceCode = `${nationalMethod === "RosaMoney" ? "ROSA" : "PAC"}-${remittanceCode.trim()}`;
        } else if (nationalMethod === "Transferencia Bancaria") {
          if (!bankReceiptCode) throw new Error("Ingrese el número de comprobante o referencia bancaria.");
          referenceCode = `${selectedBank}-${bankReceiptCode.trim()}`;
        }
      } else {
        referenceCode = `DEP-${cemacMethod === "Orange Money" ? "OM" : "MTN"}-${Date.now().toString().slice(-6)}`;
      }

      // 3. Registrar en Supabase
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        amount: amount,
        currency: "XAF",
        type: "deposit",
        status: isInstant ? "completed" : "pending",
        reference_code: referenceCode,
      });

      if (error) throw error;

      setStatusMessage({
        type: "success",
        text: isInstant
          ? `Depósito de ${formatCurrency(amount)} procesado vía ${currentProviderName} [Ref: ${referenceCode}].`
          : `Ticket registrado [${referenceCode}]. Presente este código en la oficina o cargue el justificante.`,
      });

      setTimeout(() => {
        onDepositComplete();
        onClose();
      }, 2000);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Error procesando el depósito",
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
          <CardTitle className="text-xl font-bold text-emerald-400 flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Recarga de Billetera (Franco CFA - XAF)</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-300">
            Seleccione su método de recarga preferido en Guinea Ecuatorial o la zona CEMAC.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleDeposit}>
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

            {/* Selector de Región: Guinea Ecuatorial vs CEMAC */}
            <div>
              <Label className="text-xs text-slate-300 font-bold uppercase tracking-wider block mb-1.5">Origen de los Fondos</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegion("national")}
                  className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    region === "national"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
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

            {/* Selector de Métodos de Guinea Ecuatorial */}
            {region === "national" && (
              <div>
                <Label className="text-xs text-slate-300 font-bold uppercase tracking-wider block mb-1.5">Método Nacional</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNationalMethod("Muni Dinero")}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left ${
                      nationalMethod === "Muni Dinero"
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    Muni Dinero
                  </button>

                  <button
                    type="button"
                    onClick={() => setNationalMethod("Efectivo en Oficina")}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left ${
                      nationalMethod === "Efectivo en Oficina"
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    Efectivo en Caja
                  </button>

                  <button
                    type="button"
                    onClick={() => setNationalMethod("RosaMoney")}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left ${
                      nationalMethod === "RosaMoney"
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
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
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
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
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    Banco (BANGE/CCEI/BGFI/Ecobank)
                  </button>
                </div>
              </div>
            )}

            {/* Selector de Métodos Subregionales (CEMAC) */}
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

            {/* Formulario Dinámico según el método seleccionado */}

            {/* 1. Muni Dinero */}
            {region === "national" && nationalMethod === "Muni Dinero" && (
              <div>
                <Label htmlFor="muniPhone">Número Muni Dinero (+240)</Label>
                <Input
                  id="muniPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+240 222 123 456"
                  required
                  className="mt-1 bg-slate-950 border-slate-800 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Recibirás un mensaje de aprobación USSD en tu teléfono MUNI.</span>
              </div>
            )}

            {/* 2. Efectivo en Oficina */}
            {region === "national" && nationalMethod === "Efectivo en Oficina" && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <Label>Seleccionar Agencia EGCrece</Label>
                  <select
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="Malabo (Edificio Presidencia)">Malabo - Agencia Presidencia / Ela Nguema</option>
                    <option value="Bata (Paseo Marítimo)">Bata - Agencia Central Paseo Marítimo</option>
                  </select>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <p className="font-bold text-emerald-400 flex items-center space-x-1">
                    <Ticket className="h-3.5 w-3.5" />
                    <span>Pago en Ventanilla (Horario: 8:00 - 16:30 h)</span>
                  </p>
                  <p>Al confirmar, se generará un código de Ticket de 48 horas para ingresar el efectivo en caja.</p>
                </div>
              </div>
            )}

            {/* 3. RosaMoney / PacMoney */}
            {region === "national" && (nationalMethod === "RosaMoney" || nationalMethod === "PacMoney") && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="senderN">Nombre del Remitente</Label>
                  <Input
                    id="senderN"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Nombre completo según comprobante"
                    required
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
                <div>
                  <Label htmlFor="remitCode">Código de Giro / Transacción ({nationalMethod})</Label>
                  <Input
                    id="remitCode"
                    value={remittanceCode}
                    onChange={(e) => setRemittanceCode(e.target.value)}
                    placeholder="Ej: ROSA-894120 o PAC-391824"
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
                  <Label>Seleccionar Banco Destino</Label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-bold"
                  >
                    <option value="BANGE">BANGE (Banco Nacional de Guinea Ecuatorial)</option>
                    <option value="CCEI Bank GE">CCEI Bank GE</option>
                    <option value="BGFIBank GE">BGFIBank GE</option>
                    <option value="Ecobank GE">Ecobank GE</option>
                  </select>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-1 font-mono">
                  <span className="text-slate-400 font-sans block font-bold text-xs">Datos Cuenta Corporativa EGCrece:</span>
                  <p className="text-white">Cuenta: <span className="text-emerald-400 font-bold">30005 00001 12345678901 88</span></p>
                  <p className="text-slate-300">Titular: EGCrece Finanzas & Inversión S.A.</p>
                </div>

                <div>
                  <Label htmlFor="bankRec">Número de Justificante / Referencia Bancaria</Label>
                  <Input
                    id="bankRec"
                    value={bankReceiptCode}
                    onChange={(e) => setBankReceiptCode(e.target.value)}
                    placeholder="Ej: TRX-BANGE-981240"
                    required
                    className="mt-1 bg-slate-950 border-slate-800 font-mono"
                  />
                </div>
              </div>
            )}

            {/* 5. Mobile Money CEMAC */}
            {region === "cemac" && (
              <div>
                <Label htmlFor="cphone">Número de Teléfono ({cemacMethod})</Label>
                <Input
                  id="cphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +237 699 123 456"
                  required
                  className="mt-1 bg-slate-950 border-slate-800 font-mono"
                />
              </div>
            )}

            {/* Monto Global */}
            <div>
              <Label htmlFor="amount">Monto a Recargar (FCFA - XAF)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1000}
                step={5000}
                required
                className="mt-1 text-lg font-bold text-emerald-400 bg-slate-950 border-slate-800"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold mt-2 h-11"
            >
              {loading ? "Procesando Solicitud..." : `Recargar ${formatCurrency(amount)} vía ${currentProviderName}`}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
