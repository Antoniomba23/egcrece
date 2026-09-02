import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { proposal } = body;

    if (!proposal || !proposal.id) {
      return NextResponse.json({ error: "Proposal ID is required" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const projectPayload: any = {
      title: proposal.title,
      category: proposal.category,
      location: proposal.location,
      target_amount: Number(proposal.target_amount),
      raised_amount: Number(proposal.promoter_contribution || 0),
      expected_return: Number(proposal.expected_return),
      duration_months: Number(proposal.duration_months),
      risk_level: "Moderado",
      status: "active",
      description: proposal.description || null,
      business_model: proposal.business_model || null,
      risks_guarantees: proposal.risks_guarantees || null,
    };

    // 1. Insert into public.projects
    let { data: newProject, error: projErr } = await supabaseAdmin
      .from("projects")
      .insert(projectPayload)
      .select()
      .single();

    if (projErr) {
      console.warn("Retrying approve insert with core fields:", projErr.message);
      const corePayload = {
        title: proposal.title,
        category: proposal.category,
        location: proposal.location,
        target_amount: Number(proposal.target_amount),
        raised_amount: Number(proposal.promoter_contribution || 0),
        expected_return: Number(proposal.expected_return),
        duration_months: Number(proposal.duration_months),
        risk_level: "Moderado",
        status: "active",
      };

      const res2 = await supabaseAdmin
        .from("projects")
        .insert(corePayload)
        .select()
        .single();

      if (res2.error) {
        return NextResponse.json({ error: res2.error.message }, { status: 400 });
      }
      newProject = res2.data;
    }

    // 2. Update project_proposals status to approved
    await supabaseAdmin
      .from("project_proposals")
      .update({ status: "approved" })
      .eq("id", proposal.id);

    return NextResponse.json({ success: true, project: newProject });
  } catch (err: any) {
    console.error("Error in /api/projects/approve:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
