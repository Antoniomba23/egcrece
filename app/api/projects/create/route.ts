import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      category,
      location,
      target_amount,
      raised_amount = 0,
      expected_return,
      duration_months,
      risk_level = "Moderado",
      description,
      business_model,
      risks_guarantees,
      image_url,
      legal_documents = [],
      status = "active",
    } = body;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fullPayload: any = {
      title,
      category,
      location,
      target_amount: Number(target_amount),
      raised_amount: Number(raised_amount),
      expected_return: Number(expected_return),
      duration_months: Number(duration_months),
      risk_level,
      status,
      description: description || null,
      business_model: business_model || null,
      risks_guarantees: risks_guarantees || null,
      image_url: image_url || null,
      legal_documents,
    };

    // Attempt full insert
    let { data, error } = await supabaseAdmin
      .from("projects")
      .insert(fullPayload)
      .select()
      .single();

    // Fallback if extended columns are missing in remote SQL schema
    if (error) {
      console.warn("Retrying insert with core fields due to schema error:", error.message);
      const corePayload = {
        title,
        category,
        location,
        target_amount: Number(target_amount),
        raised_amount: Number(raised_amount),
        expected_return: Number(expected_return),
        duration_months: Number(duration_months),
        risk_level,
        status,
      };

      const res2 = await supabaseAdmin
        .from("projects")
        .insert(corePayload)
        .select()
        .single();

      if (res2.error) {
        return NextResponse.json({ error: res2.error.message }, { status: 400 });
      }
      data = res2.data;
    }

    return NextResponse.json({ success: true, project: data });
  } catch (err: any) {
    console.error("Error in /api/projects/create:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
