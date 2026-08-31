import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

interface WebhookPayload {
  reference_code: string;
  amount: number;
  status: string;
  user_id: string;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Faltan credenciales del servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload: WebhookPayload = await req.json();
    const { reference_code, amount, status, user_id } = payload;

    if (status === "SUCCESS") {
      // Inserción de transacción atómica en el ledger
      const { error } = await supabase.from("transactions").insert({
        user_id: user_id,
        amount: amount,
        currency: "XAF",
        type: "deposit",
        status: "completed",
        reference_code: reference_code,
      });

      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true, reference_code }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
