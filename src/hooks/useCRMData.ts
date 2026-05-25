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
import {
  initialStats,
  initialLeads,
  initialConversaciones,
  initialMessages,
  initialPedidos,
  initialPromociones
} from "../demoData.ts";

export function useCRMData() {
  const [tenantId] = useState<string>("demo-tenant");

  const [stats, setStats] = useState<CRMStats>(initialStats);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>(initialConversaciones);
  const [messages, setMessages] = useState<Mensaje[]>(initialMessages);
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos);
  const [promociones, setPromociones] = useState<Promocion[]>(initialPromociones);
  const [botConfig, setBotConfig] = useState<BotConfig>({
    humano_backup: true,
    bot_activo: true,
    whatsapp_conectado: true,
    webhook: {
      n8n_webhook_url: "mock-webhook",
      n8n_secret: "mock-secret"
    }
  });

  const [negocio] = useState<any>({ name: "Demo Farmacia" });

  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>("c1");

  // ── MOCK ACTIONS ──

  const updatePromo = async (id: string, fields: Partial<Promocion>) => {
    setPromociones(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
  };

  const createPromo = async (p: Omit<Promocion, "id" | "created_at" | "updated_at" | "prompt_generado">) => {
    const newPromo = { ...p, id: "pr-" + Date.now() };
    setPromociones(prev => [...prev, newPromo as Promocion]);
    return newPromo;
  };

  const deletePromo = async (id: string) => {
    setPromociones(prev => prev.filter(p => p.id !== id));
  };

  const updateLeadStatus = async (id: string, status: EstadoLead) => {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, status } : l)));
  };

  const updatePedidoStatus = async (id: string, estado: EstadoPedido) => {
    setPedidos(prev => prev.map(p => (p.id === id ? { ...p, estado } : p)));
  };

  const sendMessage = async (convId: string, rol: "bot" | "cliente", text: string) => {
    const optMsg: Mensaje = {
      id: "msg-opt-" + Date.now(),
      conversacion_id: convId,
      rol,
      contenido: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optMsg]);
  };

  const connectWhatsapp = async (_url: string, _key: string, _instance: string) => {
    setBotConfig(prev => ({ ...prev, whatsapp_conectado: true }));
    return { qr: "mock-qr", phone: "123456789" };
  };

  const disconnectWhatsapp = async () => {
    setBotConfig(prev => ({ ...prev, whatsapp_conectado: false }));
  };

  const updateBotConfig = async (fields: Record<string, any>) => {
    setBotConfig(prev => ({ ...prev, ...fields }));
  };

  const simulatePaymentWebhook = async (_chargeId: string) => {
    console.log("Simulating webhook...");
  };

  const addLeadManually = async (phone: string, name: string, social: string) => {
    const newLead: Lead = { id: "l-" + Date.now(), telefono: phone, nombre: name, red_social: social, status: "nuevo", created_at: new Date().toISOString() };
    setLeads(prev => [...prev, newLead]);
  };

  const createPedido = async (lead: Lead) => {
    const newPedido: Pedido = { id: "p-" + Date.now(), lead_id: lead.id, cliente: lead.nombre, telefono: lead.telefono, estado: "pendiente", monto: 0, detalles: "Pedido nuevo", created_at: new Date().toISOString() };
    setPedidos(prev => [...prev, newPedido]);
  };

  return {
    tenantId,
    setTenantId: () => {},
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
    refreshAll: () => {},
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
