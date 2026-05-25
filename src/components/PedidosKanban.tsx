import React, { useState } from "react";
import { ClipboardList, ExternalLink, ShieldCheck, CheckCheck, Truck, RefreshCw, XCircle } from "lucide-react";
import { Card } from "./ui/Card.tsx";
import { Badge } from "./ui/Badge.tsx";
import { Button } from "./ui/Button.tsx";
import { Pedido, EstadoPedido } from "../types.ts";
import { formatSoles, formatDate } from "../utils.ts";

interface PedidosKanbanProps {
  pedidos: Pedido[];
  onUpdateStatus: (id: string, state: EstadoPedido) => void;
  onRefresh: () => void;
  onSimulateCulqiPayment: (ref: string) => void;
}

export const PedidosKanban: React.FC<PedidosKanbanProps> = ({
  pedidos,
  onUpdateStatus,
  onRefresh,
  onSimulateCulqiPayment
}) => {
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);

  // Kanban Column groupings
  const columns: { id: string; title: string; states: EstadoPedido[]; color: string }[] = [
    {
      id: "bot",
      title: "Bot tomó pedido",
      states: ["pendiente"],
      color: "border-t-2 border-amber-500"
    },
    {
      id: "link",
      title: "Link de pago",
      states: ["link_enviado"],
      color: "border-t-2 border-purple-500"
    },
    {
      id: "pagado",
      title: "Pago verificado",
      states: ["pagado", "en_preparacion", "en_camino"],
      color: "border-t-2 border-[var(--grn)]"
    },
    {
      id: "entregado",
      title: "Entregado",
      states: ["entregado"],
      color: "border-t-2 border-emerald-600 font-bold"
    }
  ];

  const getCardBorder = (estado: EstadoPedido): string => {
    switch (estado) {
      case "pagado":
      case "en_preparacion":
      case "en_camino":
        return "border-l-4 border-[#9FE1CB]";
      case "entregado":
        return "border-l-4 border-[#C0DD97]";
      default:
        return "border-l-4 border-amber-200";
    }
  };

  const getBadgeVariant = (estado: EstadoPedido) => {
    switch (estado) {
      case "pendiente": return "amber" as const;
      case "link_enviado": return "purple" as const;
      case "pagado": return "green" as const;
      case "en_preparacion": return "blue" as const;
      case "en_camino": return "purple" as const;
      case "entregado": return "green" as const;
      case "cancelado": return "red" as const;
      default: return "gray" as const;
    }
  };

  const getEstadoLabel = (estado: EstadoPedido) => {
    switch (estado) {
      case "pendiente": return "Tomado por Bot";
      case "link_enviado": return "Enviado Culqi";
      case "pagado": return "Pagado";
      case "en_preparacion": return "En Cocina / Preparando";
      case "en_camino": return "Repartidor 🛵";
      case "entregado": return "Entregado";
      case "cancelado": return "Cancelado";
      default: return estado;
    }
  };

  return (
    <div className="space-y-4">
      {/* ── TOOLBAR ── */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--t1)] font-medium bg-white px-3 py-1.5 rounded-lg border border-[var(--bd)] select-none">
          💰 Ventas Pipeline: S/ {pedidos.filter(p => !["cancelado"].includes(p.estado)).reduce((acc, c) => acc + c.total, 0).toFixed(2)} acumulado
        </div>
        <Button size="sm" onClick={onRefresh}>
          <RefreshCw size={13} />
          <span>Actualizar Pipeline</span>
        </Button>
      </div>

      {/* ── KANBAN BOARD GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {columns.map(col => {
          const colPedidos = pedidos.filter(p => col.states.includes(p.estado));
          return (
            <div key={col.id} className="bg-[var(--bg1)] rounded-[var(--r)] p-2.5 flex flex-col min-h-[460px] border border-[var(--bd)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-2.5 px-1.5 select-none">
                <span className="text-[10px] font-bold text-[var(--t1)] uppercase tracking-widest">{col.title}</span>
                <span className="bg-white border border-[var(--bd2)] text-[10px] font-bold px-2 py-0.5 rounded-full text-[var(--t0)]">
                  {colPedidos.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                {colPedidos.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPedido(p)}
                    className={`bg-white rounded-lg p-3 shadow-xs border border-[var(--bd)] cursor-pointer select-none hover:shadow-md hover:border-slate-300 transition-all ${getCardBorder(p.estado)}`}
                  >
                    <div className="text-[12px] font-bold text-[var(--t0)] truncate">
                      {p.lead?.nombre || "Venta de Bot"}
                    </div>
                    <div className="text-[11px] text-[var(--t2)] font-medium leading-relaxed truncate mt-1">
                      {p.promocion?.nombre || "Combo Familiar 🍗"}
                    </div>
                    <div className="flex items-center justify-between mt-3.5">
                      <span className="text-[12.5px] font-bold text-[var(--grn)]">
                        {formatSoles(p.total)}
                      </span>
                      <span className="text-[10px] bg-[var(--bg1)] px-1.5 py-0.5 rounded text-[var(--t1)] uppercase tracking-wider font-semibold">
                        {p.tipo_entrega}
                      </span>
                    </div>
                  </div>
                ))}

                {colPedidos.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-[var(--bd2)] rounded-lg min-h-[140px] text-[var(--t2)] text-[10.5px]">
                    <ClipboardList size={22} className="opacity-30 mb-1" />
                    <span>Sin pedidos en esta fase</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PEDIDODE DETALLE MODAL POPUP ── */}
      {selectedPedido && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[var(--rl)] overflow-hidden shadow-2xl border border-[var(--bd2)] w-full max-w-[480px] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-3.5 bg-[var(--bg1)] border-b border-[var(--bd)] flex items-center justify-between select-none">
              <span className="text-[13.5px] font-bold text-[var(--t0)]">Detalle del Pedido #{selectedPedido.id.slice(-5)}</span>
              <button
                onClick={() => setSelectedPedido(null)}
                className="text-[var(--t2)] hover:text-[var(--t0)] font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Cliente */}
              <div>
                <dt className="text-[10px] font-bold text-[var(--t2)] uppercase tracking-wide">Cliente WhatsApp</dt>
                <dd className="text-sm font-semibold text-[var(--t0)] mt-0.5">
                  {selectedPedido.lead?.nombre || "Cliente"} - {selectedPedido.lead?.telefono}
                </dd>
              </div>

              {/* Pedido Descriptivo */}
              <div className="grid grid-cols-2 gap-3.5 bg-[var(--bg1)] p-3 rounded-lg border border-[var(--bd)]">
                <div>
                  <span className="text-[10px] font-bold text-[var(--t2)] uppercase block">Artículos</span>
                  <span className="text-[12px] font-semibold text-[var(--t0)]">
                    {selectedPedido.cantidad}x {selectedPedido.promocion?.nombre || "Combo Broaster Familiar"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[var(--t2)] uppercase block">Tipo Entrega</span>
                  <span className="text-[11.5px] font-semibold text-[var(--t0)] uppercase">
                    {selectedPedido.tipo_entrega}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div>
                <dt className="text-[10px] font-bold text-[var(--t2)] uppercase tracking-wide">Dirección de Entrega</dt>
                <dd className="text-[12.5px] text-[var(--t1)] mt-0.5 leading-relaxed bg-[var(--bg1)] px-3 py-2 rounded border">
                  {selectedPedido.direccion_entrega || "No necesaria / Recojo en local"}
                </dd>
              </div>

              {/* Precios Desglosados */}
              <div className="space-y-1.5 border-t border-[var(--bd)] pt-3.5">
                <div className="flex justify-between text-xs text-[var(--t1)]">
                  <span>Subtotal afecto IGV</span>
                  <span>{formatSoles(selectedPedido.subtotal || selectedPedido.total / 1.18)}</span>
                </div>
                <div className="flex justify-between text-xs text-[var(--t1)]">
                  <span>IGV (18%)</span>
                  <span>{formatSoles(selectedPedido.igv || selectedPedido.total - (selectedPedido.total / 1.18))}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[var(--t0)] border-t border-dashed border-[var(--bd2)] pt-2">
                  <span>Costo Total</span>
                  <span className="text-[var(--grn)]">{formatSoles(selectedPedido.total)}</span>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="border-t border-[var(--bd)] pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--t1)]">Estado:</span>
                  <Badge variant={getBadgeVariant(selectedPedido.estado)}>
                    {getEstadoLabel(selectedPedido.estado)}
                  </Badge>
                </div>

                {/* MODAL SIMULATION BUTTONS - EXTREMELY HIGH INTERACTIVITY */}
                <div className="space-y-1.5 pt-2">
                  {/* Real-time Culqi Simulation trigger */}
                  {selectedPedido.estado === "pendiente" && (
                    <Button
                      variant="primary"
                      className="w-full flex items-center justify-center bg-purple-700 hover:bg-purple-800"
                      onClick={() => {
                        const refExterna = `chr_live_${selectedPedido.id.slice(-4)}`;
                        onSimulateCulqiPayment(refExterna);
                        setSelectedPedido(null);
                      }}
                    >
                      <ShieldCheck size={14} className="pulsing-dot" />
                      <span>Simular Pago Exitoso Culqi</span>
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {selectedPedido.estado === "pendiente" && (
                      <Button
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          onUpdateStatus(selectedPedido.id, "link_enviado");
                          setSelectedPedido(null);
                        }}
                      >
                        Enviar Link Pago
                      </Button>
                    )}

                    {selectedPedido.estado === "link_enviado" && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full bg-[#1D9E75] text-xs font-bold"
                        onClick={() => {
                          onUpdateStatus(selectedPedido.id, "pagado");
                          setSelectedPedido(null);
                        }}
                      >
                        <ShieldCheck size={12} /> Confirmar Pago
                      </Button>
                    )}

                    {selectedPedido.estado === "pagado" && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full text-xs"
                        onClick={() => {
                          onUpdateStatus(selectedPedido.id, "en_preparacion");
                          setSelectedPedido(null);
                        }}
                      >
                        Paso a Cocina 🍳
                      </Button>
                    )}

                    {selectedPedido.estado === "en_preparacion" && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full text-xs"
                        onClick={() => {
                          onUpdateStatus(selectedPedido.id, "en_camino");
                          setSelectedPedido(null);
                        }}
                      >
                        <Truck size={12} /> Despachar Reparto
                      </Button>
                    )}

                    {selectedPedido.estado === "en_camino" && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          onUpdateStatus(selectedPedido.id, "entregado");
                          setSelectedPedido(null);
                        }}
                      >
                        <CheckCheck size={12} /> Marcar Entregado
                      </Button>
                    )}

                    {selectedPedido.estado !== "entregado" && selectedPedido.estado !== "cancelado" && (
                      <Button
                        size="sm"
                        variant="danger"
                        className="w-full text-xs"
                        onClick={() => {
                          onUpdateStatus(selectedPedido.id, "cancelado");
                          setSelectedPedido(null);
                        }}
                      >
                        <XCircle size={12} /> Cancelar Pedido
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
