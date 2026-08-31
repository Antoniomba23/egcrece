import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Variables de entorno de servidor no configuradas" },
        { status: 500 }
      );
    }

    // Cliente con Service Role para bypass de RLS en operaciones de webhook de sistema
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body = await request.json();
    const { reference_code, amount, status, user_id, currency = "XAF" } = body;

    if (!reference_code || !amount || !user_id || !status) {
      return NextResponse.json(
        { error: "Payload incompleto o inválido" },
        { status: 400 }
      );
    }

    if (status === "SUCCESS" || status === "completed") {
      // Inserción atómica en el ledger inmutable
      const { data, error } = await supabaseAdmin.from("transactions").insert({
        user_id: user_id,
        amount: Number(amount),
        currency: currency,
        type: "deposit",
        status: "completed",
        reference_code: reference_code,
      }).select().single();

      if (error) {
        // Prevenir duplos por clave única en reference_code
        if (error.code === "23505") {
          return NextResponse.json(
            { message: "Transacción duplicada ignorada", reference_code },
            { status: 200 }
          );
        }
        throw error;
      }

      return NextResponse.json(
        { success: true, transaction_id: data.id, reference_code },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Estado de pago no completado", status },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error procesando el webhook de Mobile Money" },
      { status: 500 }
    );
  }
}
