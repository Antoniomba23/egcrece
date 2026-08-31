"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export default function RegisterPage() {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      if (password !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            role: "investor",
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setSuccessMessage("Cuenta registrada exitosamente. Redirigiendo al panel...");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al registrar la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)] px-4 py-12">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <div className="flex justify-center pt-6 pb-2">
          <Link href="/">
            <Logo className="h-16 w-auto" />
          </Link>
        </div>
        <CardHeader className="space-y-1 pt-0">
          <CardTitle className="text-xl font-bold text-white flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-emerald-400" />
            <span>Crear Cuenta Inversor</span>
          </CardTitle>
          <CardDescription>
            Cree su perfil para comenzar a invertir en Franco CFA (XAF).
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-md bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-md bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div>
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Nsue Ondo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan.nsue@ejemplo.gq"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono (Mobile Money)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+240 222 123 456"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita su contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
                className="mt-1"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              {loading ? "Creando Cuenta..." : "Registrar Cuenta Inversor"}
            </Button>

            <div className="text-center text-xs text-slate-400">
              ¿Ya posee una cuenta?{" "}
              <Link href="/login" className="text-emerald-400 hover:underline font-medium">
                Iniciar Sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
