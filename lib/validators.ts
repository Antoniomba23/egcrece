import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingrese un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  fullName: z.string().min(3, "El nombre completo debe tener al menos 3 caracteres"),
  email: z.string().email("Ingrese un correo electrónico válido"),
  phoneNumber: z.string().min(8, "Ingrese un número de teléfono válido (ej: +240...)"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const kycSchema = z.object({
  documentType: z.enum(["DNI", "Pasaporte"]),
  documentNumber: z.string().min(5, "Número de documento no válido"),
});

export const simulationSchema = z.object({
  initialAmount: z.number().min(10000, "Monto inicial mínimo 10,000 XAF"),
  monthlyContribution: z.number().min(5000, "Aportación mensual mínima 5,000 XAF"),
  years: z.number().min(1, "Plazo mínimo 1 año").max(30, "Plazo máximo 30 años"),
  annualRate: z.number().min(1, "Tasa mínima 1%").max(30, "Tasa máxima 30%"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type KycInput = z.infer<typeof kycSchema>;
export type SimulationInput = z.infer<typeof simulationSchema>;
