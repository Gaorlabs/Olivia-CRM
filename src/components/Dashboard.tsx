import React from "react";
import {
  Facebook,
  Instagram,
  Video,
  MessageSquare,
  Bot,
  ClipboardList,
  CreditCard,
  CheckCircle,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Award,
  ArrowUpRight
} from "lucide-react";
import { Card } from "./ui/Card.tsx";
import { Badge } from "./ui/Badge.tsx";
import { Button } from "./ui/Button.tsx";
import { SourceTag } from "./ui/SourceTag.tsx";
import { CRMStats, Lead, Conversacion } from "../types.ts";
import { formatSoles } from "../utils.ts";

interface DashboardProps {
  stats: CRMStats;
  recentLeads: Lead[];
  conversaciones: Conversacion[];
  setTab: (tab: string) => void;
  onSelectConv: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentLeads,
  conversaciones,
  setTab,
  onSelectConv
}) => {
  // Translate conversation status into badge variants and labels
  const getStatusBadge = (state: string) => {
    switch (state) {
      case "iniciada":
        return { variant: "gray" as const, label: "Iniciada" };
      case "consultando":
        return { variant: "amber" as const, label: "Consultando" };
      case "tomando_pedido":
        return { variant: "blue" as const, label: "Confirmando datos" };
      case "esperando_pago":
        return { variant: "purple" as const, label: "Esperando Pago" };
      case "completada":
        return { variant: "green" as const, label: "Venta Completada" };
      case "abandonada":
        return { variant: "red" as const, label: "Inactivo/Expirado" };
      default:
        return { variant: "gray" as const, label: state };
    }
  };

  return (
    <div className="space-y-6">
      {/* ── FLOW VISUALIZER "FLOWBAR" ── */}
      <div className="bg-[var(--bg0)] border border-[var(--bd)] rounded-[var(--rl)] p-5 shadow-[var(--shadow)] overflow-x-auto select-none">
        <div className="flex items-center justify-between min-w-[800px] gap-2">
          {/* Step 1 */}
          <div className="flex-1 flex flex-col items-center text-center relative px-2">
            <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2 border border-blue-100 shadow-sm">
              <Facebook size={18} />
            </div>
            <div className="text-[11px] font-semibold text-[var(--t1)]">Cliente ve Anuncio</div>
            <div className="text-[9.5px] text-[var(--t2)] mt-0.5 leading-tight">Facebook / Instagram AD</div>
            <div className="absolute top-[18px] right-[-10px] text-[var(--t2)] text-xs font-bold font-mono">→</div>
          </div>

          {/* Step 2 */}
          <div className="flex-1 flex flex-col items-center text-center relative px-2">
            <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-2 border border-green-100 shadow-sm">
              <MessageSquare size={18} />
            </div>
            <div className="text-[11px] font-semibold text-[var(--t1)]">Inicia WhatsApp</div>
            <div className="text-[9.5px] text-[var(--t2)] mt-0.5 leading-tight">Evolution API recibe</div>
            <div className="absolute top-[18px] right-[-10px] text-[var(--t2)] text-xs font-bold font-mono">→</div>
          </div>

          {/* Step 3 */}
          <div className="flex-1 flex flex-col items-center text-center relative px-2">
            <div className="w-9 h-9 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-2 border border-purple-100 shadow-sm">
              <Bot size={18} />
            </div>
            <div className="text-[11px] font-semibold text-[var(--t1)]">Asistente Responde</div>
            <div className="text-[9.5px] text-[var(--t2)] mt-0.5 leading-tight">Prompt personalizado de IA</div>
            <div className="absolute top-[18px] right-[-10px] text-[var(--t2)] text-xs font-bold font-mono">→</div>
          </div>

          {/* Step 4 */}
          <div className="flex-1 flex flex-col items-center text-center relative px-2">
            <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-2 border border-amber-100 shadow-sm">
              <ClipboardList size={18} />
            </div>
            <div className="text-[11px] font-semibold text-[var(--t1)] font-sans">Toma los datos</div>
            <div className="text-[9.5px] text-[var(--t2)] mt-0.5 leading-tight">Nombre y Dirección</div>
            <div className="absolute top-[18px] right-[-10px] text-[var(--t2)] text-xs font-bold font-mono">→</div>
          </div>

          {/* Step 5 */}
          <div className="flex-1 flex flex-col items-center text-center relative px-2">
            <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-2 border border-red-100 shadow-sm">
              <CreditCard size={18} />
            </div>
            <div className="text-[11px] font-semibold text-[var(--t1)]">Link Culqi</div>
            <div className="text-[9.5px] text-[var(--t2)] mt-0.5 leading-tight">Pasarela de pago instantánea</div>
            <div className="absolute top-[18px] right-[-10px] text-[var(--t2)] text-xs font-bold font-mono">→</div>
          </div>

          {/* Step 6 */}
          <div className="flex-1 flex flex-col items-center text-center relative px-1">
            <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-2 border border-emerald-100 shadow-sm">
              <CheckCircle size={18} />
            </div>
            <div className="text-[11px] font-semibold text-[var(--t1)]">Despacho y CRM</div>
            <div className="text-[9.5px] text-[var(--t2)] mt-0.5 leading-tight">Registro y cocina auto</div>
          </div>
        </div>
      </div>

      {/* ── STATS METRICS ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <Card className="flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-[var(--t2)] uppercase tracking-wider">Leads totales</div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-[22px] font-bold text-[var(--t0)]">{stats.leadsCount}</div>
            <Users size={18} className="text-[var(--grn)] opacity-70" />
          </div>
          <div className="text-[10.5px] text-[var(--grn-t)] font-medium mt-1">
            ✨ Capturados vía WhatsApp
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-[var(--t2)] uppercase tracking-wider">Pedidos Activos</div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-[22px] font-bold text-[var(--t0)]">{stats.activePedidos}</div>
            <ClipboardList size={18} className="text-[var(--blu)] opacity-70" />
          </div>
          <div className="text-[10.5px] text-[var(--blu)] font-medium mt-1">
            🏍️ En cocina / preparación
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-[var(--t2)] uppercase tracking-wider">Conversión de Bot</div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-[22px] font-bold text-[var(--t0)]">{stats.conversionRate}%</div>
            <Target size={18} className="text-[var(--pur)] opacity-70" />
          </div>
          <div className="text-[10.5px] text-[var(--pur-t)] font-medium mt-1">
            📈 Tráfico completado con éxito
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-[var(--t2)] uppercase tracking-wider">Ingresos totales</div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-[20px] font-bold text-[var(--t0)]">{formatSoles(stats.totalSales)}</div>
            <DollarSign size={18} className="text-emerald-600 opacity-70" />
          </div>
          <div className="text-[10.5px] text-emerald-700 font-medium mt-1">
            💰 Webhooks de Culqi procesados
          </div>
        </Card>
      </div>

      {/* ── LOWER MODULES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEADS RECENTES */}
        <Card>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--bd)]">
            <span className="text-[13px] font-bold text-[var(--t0)]">Leads del CRM · WhatsApp</span>
            <Button size="sm" onClick={() => setTab("leads")}>
              Ver todos <ArrowUpRight size={13} />
            </Button>
          </div>

          <div className="space-y-2.5">
            {conversaciones.slice(0, 4).map((c) => {
              const statusInfo = getStatusBadge(c.estado);
              const initials = c.lead?.nombre
                ? c.lead.nombre.split(" ").map(w => w[0]).join("").slice(0, 2)
                : "CL";

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setTab("conversaciones");
                    onSelectConv(c.id);
                  }}
                  className="flex items-center gap-3 p-2 bg-[var(--bg1)] rounded-lg hover:border hover:border-[var(--grn)] transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--grn-bg)] text-[var(--grn-t)] flex items-center justify-center text-[11px] font-bold font-mono">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-[var(--t0)] truncate">
                      {c.lead?.nombre || "Registrado"}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <SourceTag source={c.lead?.red_social || "directo"} />
                    </div>
                  </div>
                  <Badge variant={statusInfo.variant}>
                    {statusInfo.label}
                  </Badge>
                </div>
              );
            })}

            {conversaciones.length === 0 && (
              <div className="text-center py-8 text-[var(--t2)] text-xs">
                No hay leads capturados aún de WhatsApp.
              </div>
            )}
          </div>
        </Card>

        {/* PROMO ACTIVA CARD */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--bd)]">
              <span className="text-[13px] font-bold text-[var(--t0)]">Promo Activa en el Bot de IA</span>
              <Button variant="primary" size="sm" onClick={() => setTab("promociones")}>
                Gestionar promos <ArrowUpRight size={13} />
              </Button>
            </div>

            {stats.activePromo ? (
              <div className="bg-[var(--bg1)] rounded-[var(--r)] p-4 border border-[var(--bd)]">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[13px] font-bold text-[var(--t0)]">
                    {stats.activePromo.nombre}
                  </div>
                  <Badge variant="green">Activo</Badge>
                </div>
                <p className="text-[11.5px] text-[var(--t1)] leading-relaxed">
                  {stats.activePromo.descripcion || "Sin descripción corta"}
                </p>

                <div className="mt-3 flex items-baseline justify-between border-t border-[rgba(0,0,0,0.05)] pt-3">
                  <span className="text-[10px] text-[var(--t2)] tracking-wider uppercase font-semibold">Precio al cliente</span>
                  <span className="text-lg font-bold text-[var(--grn)]">
                    {formatSoles(stats.activePromo.precio)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[var(--t2)] bg-[var(--bg1)] rounded-[var(--r)] border border-dashed">
                <p className="font-semibold">No tienes promociones activas.</p>
                <p className="mt-1">Crea o activa una de ellas en la pestaña Promociones para potenciar el bot.</p>
              </div>
            )}
          </div>

          <div className="mt-4 bg-[var(--amb-bg)] text-[var(--amb)] p-3 rounded-lg text-[11px] leading-snug border border-[rgba(133,79,11,0.1)]">
            🌟 *Tip de Negocio*: Tu bot OlivIA de IA leerá la información de arriba automáticamente. No requieres realizar cambios técnicos en n8n ni programar nada cada vez que cambias tu oferta del día.
          </div>
        </Card>
      </div>
    </div>
  );
};
