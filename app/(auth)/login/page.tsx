"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { LogIn, AlertCircle } from "lucide-react";

import { Logo } from "@/components/shared/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al iniciar sesión");
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
            <LogIn className="h-5 w-5 text-emerald-400" />
            <span>Iniciar Sesión</span>
          </CardTitle>
          <CardDescription>
            Ingrese sus credenciales para acceder a su panel de inversión.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-md bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="inversor@ejemplo.gq"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Iniciando Sesión..." : "Acceder al Panel"}
            </Button>

            <div className="text-center text-xs text-slate-400">
              ¿No tiene una cuenta?{" "}
              <Link href="/register" className="text-emerald-400 hover:underline font-medium">
                Registrarse aquí
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
