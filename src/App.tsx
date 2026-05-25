import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar.tsx";
import { Topbar } from "./components/Topbar.tsx";
import { Dashboard } from "./components/Dashboard.tsx";
import { LeadsManager } from "./components/LeadsManager.tsx";
import { LeadsKanban } from "./components/LeadsKanban.tsx";
import { PedidosKanban } from "./components/PedidosKanban.tsx";
import { ConversationsHub } from "./components/ConversationsHub.tsx";
import { PromotionsEditor } from "./components/PromotionsEditor.tsx";
import { BotSetup } from "./components/BotSetup.tsx";
import { EvolutionSetup } from "./components/EvolutionSetup.tsx";
import { LoginPortal } from "./components/LoginPortal.tsx";
import { AdminConsole } from "./components/AdminConsole.tsx";
import { Button } from "./components/ui/Button.tsx";
import { useCRMData } from "./hooks/useCRMData.ts";

export default function App() {
  const [currentTab, setTab] = useState<string>("dashboard");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [leadsViewMode, setLeadsViewMode] = useState<"list" | "kanban">("list");
  const [user, setUser] = useState<any>(() => {
    try {
      const cached = localStorage.getItem("olivia_user");
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  });

  const {
    tenantId,
    setTenantId,
    stats,
    leads,
    conversaciones,
    selectedConvId,
    setConvId,
    messages,
    pedidos,
    promociones,
    botConfig,
    negocio,
    loading,
    loadingMessages,
    refreshAll,
    updatePromo,
    createPromo,
    deletePromo,
    updatePedidoStatus,
    updateLeadStatus,
    createPedido,
    sendMessage,
    connectWhatsapp,
    disconnectWhatsapp,
    updateBotConfig,
    simulatePaymentWebhook,
    addLeadManually
  } = useCRMData();

  const handleLoginSuccess = (usr: any, neg: any) => {
    setUser(usr);
    if (usr.rol === "super_admin") {
      setTenantId("negocio-olivia-hq"); // Default to Super Admin's own SaaS workspace
    } else if (usr.negocio_id) {
      setTenantId(usr.negocio_id);
    }
    setTab("dashboard");
    refreshAll();
  };

  const handleLogout = () => {
    localStorage.removeItem("olivia_user");
    localStorage.removeItem("olivia_tenant_id");
    setUser(null);
    setTenantId("negocio-olivia-hq");
  };

  // Maps tabs to user-friendly titles
  const getTabTitle = () => {
    switch (currentTab) {
      case "dashboard":
        return "Dashboard · Resumen del Negocio";
      case "leads":
        return "Leads · Clientes Potenciales de WhatsApp";
      case "pedidos":
        return "Pedidos · Pipeline de Preparación y Despacho";
      case "conversaciones":
        return "Conversaciones · Inbox en tiempo real";
      case "promociones":
        return "Promociones · Ofertas y Prompt Constructor";
      case "bot":
        return "Configuración del Bot · Parámetros del Asistente";
      case "evolution":
        return "Evolution API · Vincular Celular WhatsApp";
      case "admin":
        return "Consola Admin · Multi-Compañía y Permisos";
      default:
        return "OlivIA CRM";
    }
  };

  // 1. If not authenticated, render Login Screen
  if (!user) {
    return <LoginPortal onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Loading state while database is reading
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center font-sans select-none text-slate-100">
        <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-emerald-400 uppercase tracking-widest animate-pulse">
          Cargando Directorio Multi-Tenant OlivIA CRM...
        </p>
      </div>
    );
  }

  const activeInstanceName = botConfig.whatsapp_conectado ? "instancia-olivia-wa" : "sin-instancia";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg1)] font-sans">
      {/* ── LEFT FIXED SIDEBAR DRAWER ── */}
      <div
        className={`${
          isSidebarOpen ? "fixed inset-0 z-50 bg-black/50" : "hidden"
        } md:hidden`}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={`${
          isSidebarOpen ? "fixed" : "hidden"
        } md:flex z-50 md:z-auto h-full w-[206px]`}
      >
        <Sidebar
          currentTab={currentTab}
          setTab={(tab) => {
            setTab(tab);
            setSidebarOpen(false);
          }}
          whatsappConectado={botConfig.whatsapp_conectado}
          instanceName={activeInstanceName}
          user={user}
        />
      </div>

      {/* ── RIGHT MAIN WORKSPACE CANVAS ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header info */}
        <Topbar
          title={getTabTitle()}
          user={user}
          tenantId={tenantId}
          setTenantId={setTenantId}
          onLogout={handleLogout}
          onMenuToggle={() => setSidebarOpen(!isSidebarOpen)}
        />

        {/* IMPERSONATION NOTIFICATION BANNER */}
        {user && user.rol === "super_admin" && tenantId !== "negocio-olivia-hq" && currentTab !== "admin" && (
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border-b border-indigo-900/40 px-6 py-2 flex items-center justify-between text-white text-[12px] shadow-sm select-none shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <strong className="text-emerald-400">Modo de Auditoría:</strong>
              <span className="text-slate-200 font-medium">
                Inspeccionando leads, pedidos y el bot OlivIA de la empresa ID <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold font-mono text-[11px]">{tenantId}</code>
              </span>
            </div>
            <button
              onClick={() => setTab("admin")}
              className="bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 px-3 py-1 rounded-lg text-[11px] font-extrabold text-white transition-all cursor-pointer shadow-sm"
            >
              ⬅️ Regresar a la Consola Admin
            </button>
          </div>
        )}

        {/* Dynamic Inner Tab View */}
        <div className="flex-grow p-[18px] md:p-6 overflow-y-auto bg-slate-50/70">
          {currentTab === "dashboard" && (
            <Dashboard
              stats={stats}
              recentLeads={leads}
              conversaciones={conversaciones}
              setTab={setTab}
              onSelectConv={setConvId}
            />
          )}

          {currentTab === "leads" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setLeadsViewMode("list")} variant={leadsViewMode === "list" ? "primary" : "secondary"}>Listado</Button>
                <Button size="sm" onClick={() => setLeadsViewMode("kanban")} variant={leadsViewMode === "kanban" ? "primary" : "secondary"}>Kanban</Button>
              </div>
              {leadsViewMode === "list" ? (
                  <LeadsManager
                    leads={leads}
                    onSelectLeadChat={(phone, name) => {
                      const matchedLead = leads.find(l => l.telefono === phone);
                      if (matchedLead) {
                        const correlatedConv = conversaciones.find(c => c.lead_id === matchedLead.id);
                        if (correlatedConv) {
                          setConvId(correlatedConv.id);
                        }
                      }
                      setTab("conversaciones");
                    }}
                    onRefresh={refreshAll}
                    onAddLead={addLeadManually}
                    onUpdateLeadStatus={updateLeadStatus}
                    onConvertToPedido={async (lead) => {
                        await createPedido(lead);
                        setTab("pedidos");
                    }}
                  />
              ) : (
                  <LeadsKanban
                    leads={leads}
                    onUpdateStatus={updateLeadStatus}
                    onRefresh={refreshAll}
                    onConvertToPedido={async (lead) => {
                        await createPedido(lead);
                        setTab("pedidos");
                    }}
                  />
              )}
            </div>
          )}

          {currentTab === "pedidos" && (
            <PedidosKanban
              pedidos={pedidos}
              onUpdateStatus={updatePedidoStatus}
              onRefresh={refreshAll}
              onSimulateCulqiPayment={simulatePaymentWebhook}
            />
          )}

          {currentTab === "conversaciones" && (
            <ConversationsHub
              conversaciones={conversaciones}
              selectedConvId={selectedConvId}
              onSelectConv={setConvId}
              onRefresh={refreshAll}
              messages={messages}
              onSendMessage={sendMessage}
              loadingMessages={loadingMessages}
            />
          )}

          {currentTab === "promociones" && (
            <PromotionsEditor
              promociones={promociones}
              onCreatePromo={createPromo}
              onUpdatePromo={updatePromo}
              onDeletePromo={deletePromo}
              onRefresh={refreshAll}
            />
          )}

          {currentTab === "bot" && (
            <BotSetup
              config={botConfig}
              negocio={negocio}
              onUpdateConfig={updateBotConfig}
              onRefresh={refreshAll}
            />
          )}

          {currentTab === "evolution" && (
            <EvolutionSetup
              whatsappConectado={botConfig.whatsapp_conectado}
              instanceName={activeInstanceName}
              whatsappNumero={botConfig.whatsapp_conectado ? "+51 983 451 294" : null}
              onConnect={connectWhatsapp}
              onDisconnect={disconnectWhatsapp}
              onRefresh={refreshAll}
            />
          )}

          {currentTab === "admin" && user.rol === "super_admin" && (
            <AdminConsole
              onImpersonate={(id) => {
                setTenantId(id);
                setTab("dashboard");
                refreshAll();
              }}
              activeTenantId={tenantId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
