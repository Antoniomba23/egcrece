"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { EditProjectModal } from "@/components/dashboard/EditProjectModal";
import { CreateProjectModal } from "@/components/dashboard/CreateProjectModal";
import { ProposalDetailModal } from "@/components/dashboard/ProposalDetailModal";
import { ShieldCheck, Users, FileCheck, CheckCircle2, XCircle, RefreshCw, Edit, TrendingUp, AlertTriangle, ArrowUpRight, Lock, Unlock, Settings, Activity, PlusCircle, Search, Building2, FileSearch } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  phone_number: string | null;
  role: string;
  kyc_status: string;
  status: "active" | "suspended" | "frozen";
  created_at: string;
}

interface DBProject {
  id: string;
  title: string;
  category: string;
  location: string;
  target_amount: number;
  raised_amount: number;
  expected_return: number;
  duration_months: number;
  risk_level: "Bajo" | "Moderado" | "Alto";
  status: "draft" | "active" | "funded" | "executing" | "completed" | "closed";
}

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  phone_number: string;
  payment_method: string;
  status: "pending" | "approved" | "rejected" | "completed";
  reference_code: string;
  created_at: string;
}

interface ProjectProposal {
  id: string;
  user_id: string | null;
  promoter_name: string;
  phone: string;
  email: string;
  title: string;
  category: string;
  location: string;
  target_amount: number;
  promoter_contribution: number;
  expected_return: number;
  duration_months: number;
  description: string;
  business_model?: string;
  risks_guarantees?: string;
  dossier_url?: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  created_at: string;
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"tasks" | "proposals" | "projects" | "users" | "yields" | "settings">("tasks");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [proposals, setProposals] = useState<ProjectProposal[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionWthId, setActionWthId] = useState<string | null>(null);
  const [actionPropId, setActionPropId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState<string>("");
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [yieldingProjectId, setYieldingProjectId] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<ProjectProposal | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState<boolean>(false);

  // Configuraciones globales
  const [feePercent, setFeePercent] = useState<number>(1.5);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(2000);

  const supabase = createClient();

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // 1. Solicitudes de Retiro
      const { data: wthData } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });
      setWithdrawals(wthData || []);

      // 2. Perfiles
      const { data: profData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setProfiles(profData || []);

      // 3. Proyectos
      const { data: projData } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      setProjects(projData || []);

      // 4. Propuestas de Proyectos de Promotores
      const { data: propData } = await supabase
        .from("project_proposals")
        .select("*")
        .order("created_at", { ascending: false });

      let localProps: any[] = [];
      try {
        localProps = JSON.parse(localStorage.getItem("egcrece_proposals") || "[]");
      } catch (e) {}

      const combinedProposals = [...(propData || [])];
      for (const lp of localProps) {
        if (!combinedProposals.some((p) => p.id === lp.id)) {
          combinedProposals.push(lp);
        }
      }

      setProposals(combinedProposals);

      // 5. Ajustes globales
      const { data: settingsData } = await supabase.from("platform_settings").select("*");
      if (settingsData) {
        const feeSetting = settingsData.find((s) => s.key === "withdrawal_fee_percent");
        const minSetting = settingsData.find((s) => s.key === "min_withdrawal_amount");
        if (feeSetting) setFeePercent(feeSetting.value.value);
        if (minSetting) setMinWithdrawal(minSetting.value.value);
      }
    } catch (err: any) {
      console.error("Error al cargar consola administrativa:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const createAuditLog = async (action: string, targetType: string, targetId: string, metadata: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action,
        target_type: targetType,
        target_id: targetId,
        metadata,
      });
    } catch (e) {
      console.error("Error al registrar log de auditoría:", e);
    }
  };

  // Aprobar / Rechazar Retiro
  const handleProcessWithdrawal = async (wth: WithdrawalRequest, newStatus: "approved" | "rejected") => {
    try {
      setActionWthId(wth.id);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: newStatus,
          approved_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wth.id);

      if (error) throw error;

      if (newStatus === "approved") {
        await supabase.from("transactions").insert({
          user_id: wth.user_id,
          amount: wth.amount,
          currency: "XAF",
          type: "withdrawal",
          status: "completed",
          reference_code: wth.reference_code,
        });
      }

      await createAuditLog(
        newStatus === "approved" ? "WITHDRAWAL_APPROVED" : "WITHDRAWAL_REJECTED",
        "withdrawal",
        wth.id,
        { amount: wth.amount, user_id: wth.user_id, reference_code: wth.reference_code }
      );

      alert(`Solicitud de retiro ${newStatus === "approved" ? "APROBADA y abonada" : "RECHAZADA"}.`);
      await fetchAdminData();
    } catch (err: any) {
      alert(`Error al procesar retiro: ${err.message}`);
    } finally {
      setActionWthId(null);
    }
  };

  // Aprobar / Rechazar KYC
  const handleUpdateKyc = async (userId: string, newStatus: "approved" | "rejected") => {
    try {
      setActionUserId(userId);
      const { error } = await supabase
        .from("profiles")
        .update({ kyc_status: newStatus })
        .eq("id", userId);

      if (error) throw error;

      await createAuditLog(
        newStatus === "approved" ? "KYC_APPROVED" : "KYC_REJECTED",
        "user",
        userId,
        { new_status: newStatus }
      );

      await fetchAdminData();
    } catch (err: any) {
      alert(`Error al actualizar KYC: ${err.message}`);
    } finally {
      setActionUserId(null);
    }
  };

  // Congelar / Descongelar Cuenta
  const handleToggleAccountStatus = async (userProf: UserProfile) => {
    try {
      setActionUserId(userProf.id);
      const nextStatus = userProf.status === "frozen" ? "active" : "frozen";

      const { error } = await supabase
        .from("profiles")
        .update({ status: nextStatus })
        .eq("id", userProf.id);

      if (error) throw error;

      await createAuditLog(
        nextStatus === "frozen" ? "ACCOUNT_FROZEN" : "ACCOUNT_UNFROZEN",
        "user",
        userProf.id,
        { previous_status: userProf.status, new_status: nextStatus }
      );

      alert(`Cuenta de ${userProf.full_name} actualizada a estado: ${nextStatus.toUpperCase()}`);
      await fetchAdminData();
    } catch (err: any) {
      alert(`Error al cambiar estado de cuenta: ${err.message}`);
    } finally {
      setActionUserId(null);
    }
  };

  // Promover / Degradar Rol de Usuario (Investor <-> Admin <-> Auditor)
  const handleChangeUserRole = async (userId: string, newRole: "investor" | "admin" | "auditor") => {
    try {
      setActionUserId(userId);
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      await createAuditLog("USER_ROLE_CHANGED", "profile", userId, { new_role: newRole });
      alert(`Rol del usuario actualizado a: ${newRole.toUpperCase()}`);
      await fetchAdminData();
    } catch (err: any) {
      alert(`Error actualizando rol: ${err.message}`);
    } finally {
      setActionUserId(null);
    }
  };

  // Aprobar propuesta y publicar automáticamente en el Catálogo de Proyectos
  const handleApproveProposalAndPublish = async (prop: ProjectProposal) => {
    try {
      setActionPropId(prop.id);

      // 1. Insertar el nuevo proyecto en la tabla public.projects
      const { data: newProject, error: projErr } = await supabase
        .from("projects")
        .insert({
          title: prop.title,
          category: prop.category,
          location: prop.location,
          target_amount: prop.target_amount,
          raised_amount: prop.promoter_contribution || 0,
          expected_return: prop.expected_return,
          duration_months: prop.duration_months,
          risk_level: "Moderado",
          status: "active",
          description: prop.description,
          business_model: prop.business_model,
          risks_guarantees: prop.risks_guarantees,
        })
        .select()
        .single();

      if (projErr) throw projErr;

      // 2. Actualizar estado de la propuesta a 'approved'
      await supabase
        .from("project_proposals")
        .update({ status: "approved" })
        .eq("id", prop.id);

      await createAuditLog("PROPOSAL_APPROVED_AND_PUBLISHED", "project_proposal", prop.id, {
        project_id: newProject.id,
        title: prop.title,
      });

      alert(`¡La propuesta "${prop.title}" fue APROBADA y PUBLICADA exitosamente en el catálogo de proyectos!`);
      await fetchAdminData();
    } catch (err: any) {
      alert(`Error al aprobar propuesta: ${err.message}`);
    } finally {
      setActionPropId(null);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    try {
      setActionPropId(proposalId);
      await supabase
        .from("project_proposals")
        .update({ status: "rejected" })
        .eq("id", proposalId);

      await createAuditLog("PROPOSAL_REJECTED", "project_proposal", proposalId);
      alert("Solicitud de proyecto marcada como RECHAZADA.");
      await fetchAdminData();
    } catch (err: any) {
      alert(`Error al rechazar propuesta: ${err.message}`);
    } finally {
      setActionPropId(null);
    }
  };

  // Cambiar Ciclo de Vida del Proyecto
  const handleChangeProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", projectId);

      if (error) throw error;

      await createAuditLog("PROJECT_STATUS_CHANGED", "project", projectId, { new_status: newStatus });
      await fetchAdminData();
    } catch (err: any) {
      alert(`Error al cambiar estado del proyecto: ${err.message}`);
    }
  };

  // Guardar Ajustes Globales
  const handleSaveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("platform_settings").upsert({
        key: "withdrawal_fee_percent",
        value: { value: feePercent },
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      });

      await supabase.from("platform_settings").upsert({
        key: "min_withdrawal_amount",
        value: { value: minWithdrawal },
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      });

      await createAuditLog("PLATFORM_SETTINGS_UPDATED", "system", "global", { feePercent, minWithdrawal });
      alert("Configuración de plataforma guardada correctamente.");
    } catch (err: any) {
      alert(`Error guardando ajustes: ${err.message}`);
    }
  };

  const handleEditClick = (p: DBProject) => {
    setEditingProject({
      id: p.id,
      title: p.title,
      category: p.category,
      location: p.location,
      targetAmount: Number(p.target_amount),
      raisedAmount: Number(p.raised_amount),
      expectedReturn: Number(p.expected_return),
      durationMonths: Number(p.duration_months),
      riskLevel: p.risk_level,
      status: p.status,
    });
    setIsEditOpen(true);
  };

  const handleDistributeYield = async (project: DBProject) => {
    try {
      setYieldingProjectId(project.id);
      const yieldPercent = Number(project.expected_return) / 4;

      const { data: investments, error: invErr } = await supabase
        .from("transactions")
        .select("user_id, amount")
        .eq("type", "investment")
        .eq("status", "completed");

      if (invErr) throw invErr;

      if (!investments || investments.length === 0) {
        alert("No hay inversiones registradas aún para liquidar rendimientos.");
        return;
      }

      for (const inv of investments) {
        const yieldAmount = (Number(inv.amount) * yieldPercent) / 100;

        await supabase.from("transactions").insert({
          user_id: inv.user_id,
          amount: Math.round(yieldAmount),
          currency: "XAF",
          type: "yield",
          status: "completed",
          reference_code: `YLD-${project.id.slice(0, 4)}-${Date.now().toString().slice(-5)}`,
        });
      }

      await createAuditLog("YIELD_DISTRIBUTED", "project", project.id, { yieldPercent, count: investments.length });
      alert(`Liquidación de rendimientos (${yieldPercent.toFixed(2)}%) abonada a los inversores.`);
      await fetchAdminData();
    } catch (err: any) {
      alert(`Error distribuyendo rendimientos: ${err.message}`);
    } finally {
      setYieldingProjectId(null);
    }
  };

  // KPIs de Plataforma
  const totalTVL = projects.reduce((acc, curr) => acc + Number(curr.raised_amount), 0);
  const pendingWithdrawalVol = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  const pendingKycCount = profiles.filter((p) => p.kyc_status === "pending").length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === "pending").length;

  // Filtrado de usuarios por búsqueda
  const filteredProfiles = profiles.filter((p) => {
    const q = userSearch.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.phone_number?.toLowerCase().includes(q) ||
      p.role?.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="bg-slate-900 border-emerald-500/30 shadow-2xl space-y-6">
      <CardHeader className="border-b border-slate-800 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl text-emerald-400 flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <span>Consola Empresarial de Administración EGCrece</span>
            </CardTitle>
            <CardDescription className="text-slate-300">
              Vista Operativa y de Gestión: Tareas críticas, aprobación de retiros, control de usuarios y catálogo.
            </CardDescription>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center space-x-1"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>+ Nuevo Proyecto</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdminData}
              disabled={loading}
              className="border-slate-800 text-xs flex items-center space-x-1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>

        {/* Pestañas de la Consola Administrativa (Horiz. Scroll en Móvil) */}
        <div className="flex overflow-x-auto gap-2 mt-4 pt-2 border-t border-slate-800/80 pb-1 whitespace-nowrap">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${
              activeTab === "tasks" ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white"
            }`}
          >
            Bandeja Tareas Críticas ({pendingWithdrawalsCount + pendingKycCount})
          </button>
          <button
            onClick={() => setActiveTab("proposals")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${
              activeTab === "proposals" ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white"
            }`}
          >
            Solicitudes Promotores ({proposals.filter((p) => p.status === "pending").length})
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${
              activeTab === "projects" ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white"
            }`}
          >
            Gestión de Catálogo ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${
              activeTab === "users" ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white"
            }`}
          >
            Control de Usuarios ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab("yields")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${
              activeTab === "yields" ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white"
            }`}
          >
            Pago Masivo Intereses
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${
              activeTab === "settings" ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white"
            }`}
          >
            Ajustes Globales
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* KPIs de Plataforma (4 Tarjetas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            <div>
              <span className="text-[11px] text-slate-400 block uppercase font-medium">TVL Global Bloqueado</span>
              <span className="text-lg font-bold text-white">{formatCurrency(totalTVL)}</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <Users className="h-8 w-8 text-teal-400" />
            <div>
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Usuarios Registrados</span>
              <span className="text-lg font-bold text-white">{profiles.length} cuentas</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <ArrowUpRight className="h-8 w-8 text-amber-400" />
            <div>
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Vol. Retiros Pendientes</span>
              <span className="text-lg font-bold text-amber-400">{formatCurrency(pendingWithdrawalVol)}</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <FileCheck className="h-8 w-8 text-blue-400" />
            <div>
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Alertas KYC en Cola</span>
              <span className="text-lg font-bold text-blue-400">{pendingKycCount} pendientes</span>
            </div>
          </div>
        </div>

        {/* Pestaña 1: Bandeja de Tareas Críticas (Unificada Retiros + KYC) */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>1. Solicitudes de Retiro Fiat Pendientes ({pendingWithdrawalsCount})</span>
              </h4>
              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Referencia</th>
                      <th className="px-4 py-3">Teléfono</th>
                      <th className="px-4 py-3">Monto Solicitado</th>
                      <th className="px-4 py-3 text-right">Acción Intervención</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {withdrawals.filter((w) => w.status === "pending").length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                          Sin solicitudes de retiro pendientes de aprobación.
                        </td>
                      </tr>
                    ) : (
                      withdrawals
                        .filter((w) => w.status === "pending")
                        .map((w) => (
                          <tr key={w.id} className="hover:bg-slate-900/40">
                            <td className="px-4 py-3 text-slate-400">{new Date(w.created_at).toLocaleDateString("es-ES")}</td>
                            <td className="px-4 py-3 font-mono text-slate-300">{w.reference_code}</td>
                            <td className="px-4 py-3 font-semibold">{w.phone_number}</td>
                            <td className="px-4 py-3 font-bold text-teal-400">{formatCurrency(w.amount)}</td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <Button
                                size="sm"
                                disabled={actionWthId === w.id}
                                onClick={() => handleProcessWithdrawal(w, "approved")}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-7 px-2.5"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Aprobar Retiro
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={actionWthId === w.id}
                                onClick={() => handleProcessWithdrawal(w, "rejected")}
                                className="text-[11px] h-7 px-2.5"
                              >
                                <XCircle className="h-3 w-3 mr-1" /> Rechazar
                              </Button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                <FileCheck className="h-4 w-4 text-blue-400" />
                <span>2. Documentos de Identidad KYC Pendientes ({pendingKycCount})</span>
              </h4>
              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Teléfono</th>
                      <th className="px-4 py-3">Estado KYC</th>
                      <th className="px-4 py-3 text-right">Acción Verificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {profiles.filter((p) => p.kyc_status === "pending").length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                          Sin revisiones KYC pendientes en cola.
                        </td>
                      </tr>
                    ) : (
                      profiles
                        .filter((p) => p.kyc_status === "pending")
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-slate-900/40">
                            <td className="px-4 py-3 font-medium text-white">{p.full_name || "Sin nombre"}</td>
                            <td className="px-4 py-3 text-slate-400">{p.phone_number || "N/A"}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="bg-amber-950 text-amber-400 border-amber-800 text-[10px]">
                                PENDIENTE
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <Button
                                size="sm"
                                disabled={actionUserId === p.id}
                                onClick={() => handleUpdateKyc(p.id, "approved")}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-7 px-2.5"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Aprobar DNI
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={actionUserId === p.id}
                                onClick={() => handleUpdateKyc(p.id, "rejected")}
                                className="text-[11px] h-7 px-2.5"
                              >
                                <XCircle className="h-3 w-3 mr-1" /> Rechazar
                              </Button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Solicitudes de Proyectos Recibidas (Promotores & Emprendedores) */}
        {activeTab === "proposals" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-emerald-400" />
                <span>Solicitudes de Financiación de Promotores Recibidas ({proposals.length})</span>
              </h4>
            </div>

            {/* Vista Escritorio: Tabla (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Proyecto / Promotor</th>
                    <th className="px-4 py-3">Ubicación</th>
                    <th className="px-4 py-3">Capital Requerido</th>
                    <th className="px-4 py-3">Aportación Promotor</th>
                    <th className="px-4 py-3">TIR Ofrecida</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acción Intervención</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {proposals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No hay solicitudes de financiación registradas por promotores actualmente.
                      </td>
                    </tr>
                  ) : (
                    proposals.map((prop) => (
                      <tr key={prop.id} className="hover:bg-slate-900/40">
                        <td className="px-4 py-3">
                          <span className="font-bold text-white block">{prop.title}</span>
                          <span className="text-[11px] text-slate-400">
                            Promotor: {prop.promoter_name} | {prop.phone} ({prop.email})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <span className="block font-medium">{prop.category}</span>
                          <span className="text-[11px] text-slate-400">{prop.location}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-400">{formatCurrency(prop.target_amount)}</td>
                        <td className="px-4 py-3 font-semibold text-teal-400">{formatCurrency(prop.promoter_contribution || 0)}</td>
                        <td className="px-4 py-3 font-bold text-white">+{prop.expected_return}%</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              prop.status === "approved"
                                ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                                : prop.status === "rejected"
                                ? "bg-rose-950 text-rose-400 border-rose-800"
                                : "bg-amber-950 text-amber-400 border-amber-800"
                            }`}
                          >
                            {prop.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProposal(prop);
                              setIsProposalModalOpen(true);
                            }}
                            className="border-slate-700 hover:border-emerald-500 text-emerald-400 text-[11px] h-7 px-2.5 font-semibold"
                          >
                            <FileSearch className="h-3 w-3 mr-1" /> Ver Expediente
                          </Button>
                          {prop.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                disabled={actionPropId === prop.id}
                                onClick={() => handleApproveProposalAndPublish(prop)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-7 px-2.5 font-bold"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Aprobar y Publicar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={actionPropId === prop.id}
                                onClick={() => handleRejectProposal(prop.id)}
                                className="text-[11px] h-7 px-2.5"
                              >
                                <XCircle className="h-3 w-3 mr-1" /> Rechazar
                              </Button>
                            </>
                          )}
                          {prop.status === "approved" && (
                            <span className="text-[11px] text-emerald-400 font-bold ml-2">✓ Publicado</span>
                          )}
                          {prop.status === "rejected" && (
                            <span className="text-[11px] text-rose-400 font-semibold ml-2">Desestimado</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Vista Móvil Extrema: Tarjetas Apilables (<768px) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {proposals.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                  No hay solicitudes de financiación registradas por promotores actualmente.
                </div>
              ) : (
                proposals.map((prop) => (
                  <div key={prop.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-white text-sm block">{prop.title}</span>
                        <span className="text-[11px] text-slate-400 block">{prop.category} • {prop.location}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          prop.status === "approved"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : prop.status === "rejected"
                            ? "bg-rose-950 text-rose-400 border-rose-800"
                            : "bg-amber-950 text-amber-400 border-amber-800"
                        }`}
                      >
                        {prop.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900 p-2.5 rounded-lg">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Capital Meta</span>
                        <span className="font-bold text-emerald-400">{formatCurrency(prop.target_amount)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">TIR Ofrecida</span>
                        <span className="font-bold text-white">+{prop.expected_return}%</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProposal(prop);
                          setIsProposalModalOpen(true);
                        }}
                        className="border-slate-700 hover:border-emerald-500 text-emerald-400 text-[11px] h-8 flex-1 font-semibold"
                      >
                        <FileSearch className="h-3.5 w-3.5 mr-1" /> Expediente
                      </Button>

                      {prop.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            disabled={actionPropId === prop.id}
                            onClick={() => handleApproveProposalAndPublish(prop)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-8 flex-1 font-bold"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={actionPropId === prop.id}
                            onClick={() => handleRejectProposal(prop.id)}
                            className="text-[11px] h-8 px-3"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Pestaña 2: Gestión de Catálogo de Proyectos */}
        {activeTab === "projects" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">Catálogo de Proyectos y Control de Ciclo de Vida</h4>
              <Button size="sm" onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                + Crear Nuevo Proyecto
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Proyecto</th>
                    <th className="px-4 py-3">Meta (XAF)</th>
                    <th className="px-4 py-3">Recaudado</th>
                    <th className="px-4 py-3">Retorno %</th>
                    <th className="px-4 py-3">Estado Ciclo Vida</th>
                    <th className="px-4 py-3 text-right">Acción Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {projects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-medium text-white">{proj.title}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(proj.target_amount)}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">{formatCurrency(proj.raised_amount)}</td>
                      <td className="px-4 py-3 font-bold text-teal-400">+{proj.expected_return}%</td>
                      <td className="px-4 py-3">
                        <select
                          value={proj.status}
                          onChange={(e) => handleChangeProjectStatus(proj.id, e.target.value)}
                          className="h-7 bg-slate-900 border border-slate-700 rounded px-2 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="draft">Borrador</option>
                          <option value="active">Recaudando</option>
                          <option value="funded">100% Recaudado</option>
                          <option value="executing">En Ejecución</option>
                          <option value="completed">Liquidado / Dividendos</option>
                          <option value="closed">Cerrado</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(proj)}
                          className="border-slate-700 hover:border-emerald-500 text-[11px] h-7 px-2.5"
                        >
                          <Edit className="h-3 w-3 mr-1 text-emerald-400" /> Editar Parámetros
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pestaña 3: Control de Usuarios & Acciones Extremas */}
        {activeTab === "users" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h4 className="text-sm font-semibold text-white">Auditoría Individual y Control de Seguridad de Usuarios</h4>
              <div className="relative max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="h-8 pl-8 text-xs bg-slate-950 border-slate-800"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Estado KYC</th>
                    <th className="px-4 py-3">Estado Cuenta</th>
                    <th className="px-4 py-3 text-right">Acción Extrema</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-medium text-white">{p.full_name || "Sin nombre"}</td>
                      <td className="px-4 py-3 text-slate-400">{p.phone_number || "N/A"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={p.role}
                          disabled={actionUserId === p.id}
                          onChange={(e) => handleChangeUserRole(p.id, e.target.value as any)}
                          className="h-7 bg-slate-900 border border-slate-700 rounded px-2 text-[11px] font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="investor">INVESTOR</option>
                          <option value="admin">ADMIN</option>
                          <option value="auditor">AUDITOR</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">{p.kyc_status.toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                            p.status === "active"
                              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                              : "bg-rose-950 text-rose-400 border-rose-800"
                          }`}
                        >
                          {p.status || "active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionUserId === p.id}
                          onClick={() => handleToggleAccountStatus(p)}
                          className={`text-[11px] h-7 px-2.5 border-slate-700 ${
                            p.status === "frozen" ? "hover:bg-emerald-900 text-emerald-300" : "hover:bg-rose-900 text-rose-300"
                          }`}
                        >
                          {p.status === "frozen" ? (
                            <>
                              <Unlock className="h-3 w-3 mr-1 text-emerald-400" /> Descongelar Cuenta
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 mr-1 text-rose-400" /> Congelar Cuenta
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pestaña 4: Pago Masivo Intereses */}
        {activeTab === "yields" && (
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Disparar Pago Masivo de Intereses / Cupones</h4>
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-white block">{proj.title}</span>
                    <span className="text-xs text-slate-400">
                      Tasa Anual: <strong className="text-emerald-400">+{proj.expected_return}%</strong> | Recaudado: {formatCurrency(proj.raised_amount)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    disabled={yieldingProjectId === proj.id}
                    onClick={() => handleDistributeYield(proj)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  >
                    {yieldingProjectId === proj.id ? "Procesando..." : "Disparar Pago Dividendos"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pestaña 5: Ajustes Globales */}
        {activeTab === "settings" && (
          <div className="max-w-xl space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Settings className="h-4 w-4 text-emerald-400" />
              <span>Configuración Global de Comisiones y Límites Operativos</span>
            </h4>

            <div>
              <Label htmlFor="fee">Comisión de Retiro de Plataforma (%)</Label>
              <Input
                id="fee"
                type="number"
                step="0.1"
                value={feePercent}
                onChange={(e) => setFeePercent(Number(e.target.value))}
                className="mt-1 bg-slate-950 border-slate-800 text-white font-bold"
              />
            </div>

            <div>
              <Label htmlFor="minWth">Monto Mínimo de Retiro (FCFA - XAF)</Label>
              <Input
                id="minWth"
                type="number"
                step="1000"
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                className="mt-1 bg-slate-950 border-slate-800 text-white font-bold"
              />
            </div>

            <Button onClick={handleSaveSettings} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              Guardar Variables Globales
            </Button>
          </div>
        )}
      </CardContent>

      <EditProjectModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        project={editingProject}
        onProjectUpdated={fetchAdminData}
      />

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onProjectCreated={fetchAdminData}
      />

      <ProposalDetailModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        proposal={selectedProposal}
        onApprove={handleApproveProposalAndPublish}
        onReject={handleRejectProposal}
      />
    </Card>
  );
}
