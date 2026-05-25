import { useState, useEffect, useCallback } from "react";
import {
  Pedido,
  Lead,
  Conversacion,
  Promocion,
  Mensaje,
  BotConfig,
  CRMStats,
  EstadoPedido,
  EstadoLead
} from "../types.ts";

export function useCRMData() {
  const [tenantId, _setTenantId] = useState<string>(() => {
    try {
      const cached = localStorage.getItem("olivia_tenant_id");
      if (cached) return cached;
      const userStr = localStorage.getItem("olivia_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.rol === "super_admin") return "negocio-olivia-hq";
        return u.negocioId || u.negocio_id || "";
      }
    } catch (e) {}
    return "negocio-olivia-hq"; // fallback default Admin
  });

  const [stats, setStats] = useState<CRMStats>({
    leadsCount: 12,
    activePedidos: 3,
    totalSales: 249.50,
    conversionRate: 33,
    activePromo: null
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [botConfig, setBotConfig] = useState<BotConfig>({
    humano_backup: true,
    bot_activo: true,
    whatsapp_conectado: true,
    webhook: {
      n8n_webhook_url: "webhook-default",
      n8n_secret: "secret-default"
    }
  });

  const [negocio, setNegocio] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  // Helper to change tenant and trigger side-effects
  const setTenantId = useCallback((id: string) => {
    _setTenantId(id);
    localStorage.setItem("olivia_tenant_id", id);
  }, []);

  // Helper to construct headers with the current Tenant Id
  const getHeaders = useCallback((custom: Record<string, string> = {}) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...custom
    };
    if (tenantId) {
      headers["x-negocio-id"] = tenantId;
    }
    return headers;
  }, [tenantId]);

  // ── CORE DATA FETCH ──

  const fetchAllData = useCallback(async () => {
    try {
      // 1. Fetch Stats
      const statsRes = await fetch("/api/dashboard/metrics", { headers: getHeaders() });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Leads
      const leadsRes = await fetch("/api/leads", { headers: getHeaders() });
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData);
      }

      // 3. Fetch Conversaciones
      const convsRes = await fetch("/api/conversaciones", { headers: getHeaders() });
      if (convsRes.ok) {
        const convsData = await convsRes.json();
        setConversaciones(convsData);

        // Auto-select first conversation if none selected
        if (convsData.length > 0 && !selectedConvId) {
          setSelectedConvId(convsData[0].id);
        }
      }

      // 4. Fetch Pedidos
      const pedsRes = await fetch("/api/pedidos", { headers: getHeaders() });
      if (pedsRes.ok) {
        const pedsData = await pedsRes.json();
        setPedidos(pedsData);
      }

      // 5. Fetch Promociones
      const promosRes = await fetch("/api/promociones", { headers: getHeaders() });
      if (promosRes.ok) {
        const promosData = await promosRes.json();
        setPromociones(promosData);
      }

      // 6. Fetch Business Configs
      const nRes = await fetch("/api/negocio", { headers: getHeaders() });
      if (nRes.ok) {
        const nd = await nRes.json();
        setNegocio(nd.negocio);
        setBotConfig(nd.botConfig);
      }
    } catch (e) {
      console.error("Error fetching CRM records", e);
    } finally {
      setLoading(false);
    }
  }, [selectedConvId, getHeaders]);

  // Fetch individual chat messages
  const fetchMessages = useCallback(async (convId: string) => {
    if (!convId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversaciones/${convId}/mensajes`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Error fetching messages", e);
    } finally {
      setLoadingMessages(false);
    }
  }, [getHeaders]);

  // Sync messages on conversation select
  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId, fetchMessages]);

  // General initial loading & periodic state syncing (every 5 seconds)
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAllData, tenantId]); // trigger reload when tenant changes!

  // ── CORE ACTIONS ──

  // 1. Update Promo
  const updatePromo = async (id: string, fields: Partial<Promocion>) => {
    try {
      const res = await fetch(`/api/promociones/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(fields)
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Create Promo
  const createPromo = async (p: Omit<Promocion, "id" | "created_at" | "updated_at" | "prompt_generado">) => {
    try {
      const res = await fetch("/api/promociones", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(p)
      });
      if (res.ok) {
        const data = await res.json();
        await fetchAllData();
        return data.promocion;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // 3. Delete Promo
  const deletePromo = async (id: string) => {
    try {
      const res = await fetch(`/api/promociones/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4a. Update lead status
  const updateLeadStatus = async (id: string, status: EstadoLead) => {
    try {
      setLeads(prev =>
        prev.map(l => (l.id === id ? { ...l, status } : l))
      );

      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Update order status
  const updatePedidoStatus = async (id: string, estado: EstadoPedido) => {
    try {
      setPedidos(prev =>
        prev.map(p => (p.id === id ? { ...p, estado } : p))
      );

      const res = await fetch(`/api/pedidos/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ estado })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Send chat message
  const sendMessage = async (convId: string, rol: "bot" | "cliente", text: string) => {
    try {
      const optMsg: Mensaje = {
        id: "msg-opt-" + Date.now(),
        conversacion_id: convId,
        rol,
        contenido: text,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, optMsg]);

      if (rol === "cliente" && botConfig.bot_activo) {
        const thinkingBotMsg: Mensaje = {
          id: "msg-opt-thinking-" + Date.now(),
          conversacion_id: convId,
          rol: "bot",
          contenido: "OlivIA está redactando...",
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, thinkingBotMsg]);
      }

      const res = await fetch(`/api/conversaciones/${convId}/mensajes`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ rol, contenido: text })
      });

      if (res.ok) {
        await fetchMessages(convId);
        await fetchAllData();
      }
    } catch (e) {
      console.error("Error sending message", e);
    }
  };

  // 6. Connect Whatsapp (simulate)
  const connectWhatsapp = async (url: string, key: string, instance: string) => {
    const res = await fetch("/api/evolution/connect", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ url, key, instance })
    });
    if (!res.ok) throw new Error("No se pudo iniciar instancia en el servidor Evolution.");
    const data = await res.json();
    await fetchAllData();
    return { qr: data.qr, phone: data.phone };
  };

  // 7. Disconnect Whatsapp (simulate)
  const disconnectWhatsapp = async () => {
    await fetch("/api/evolution/disconnect", {
      method: "POST",
      headers: getHeaders()
    });
    await fetchAllData();
  };

  // 8. General config update
  const updateBotConfig = async (fields: Record<string, any>) => {
    try {
      const res = await fetch("/api/negocio/config", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(fields)
      });
      if (res.ok) {
        const data = await res.json();
        setBotConfig(data.botConfig);
        setNegocio(data.negocio);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 9. Culqi Webhook Payment trigger simulation
  const simulatePaymentWebhook = async (chargeId: string) => {
    try {
      const res = await fetch("/api/webhooks/culqi", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          object: "event",
          type: "charge.succeeded",
          data: {
            id: chargeId,
            amount: 4990
          }
        })
      });
      if (res.ok) {
        await fetchAllData();
        if (selectedConvId) await fetchMessages(selectedConvId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 10. Add lead manually
  const addLeadManually = async (phone: string, name: string, social: string) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ telefono: phone, nombre: name, red_social: social })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 11. Create Pedido from Lead
  const createPedido = async (lead: Lead) => {
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          lead_id: lead.id,
          cliente: lead.nombre,
          telefono: lead.telefono,
          estado: "pendiente",
          monto: 0,
          detalles: "Pedido creado desde Lead"
        })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return {
    tenantId,
    setTenantId,
    stats,
    leads,
    conversaciones,
    selectedConvId,
    setConvId: setSelectedConvId,
    messages,
    pedidos,
    promociones,
    botConfig,
    negocio,
    loading,
    loadingMessages,
    refreshAll: fetchAllData,
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
  };
}
