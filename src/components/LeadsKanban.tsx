import React from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button.tsx";
import { Lead, EstadoLead } from "../types.ts";
import { formatDate } from "../utils.ts";
import { SourceTag } from "./ui/SourceTag.tsx";

interface LeadsKanbanProps {
  leads: Lead[];
  onUpdateStatus: (id: string, status: EstadoLead) => void;
  onRefresh: () => void;
  onConvertToPedido: (lead: Lead) => void;
}

export const LeadsKanban: React.FC<LeadsKanbanProps> = ({
  leads,
  onUpdateStatus,
  onRefresh,
  onConvertToPedido
}) => {
  // Kanban Column groupings
  const columns: { id: EstadoLead; title: string }[] = [
    { id: "nuevo", title: "Nuevo" },
    { id: "contactado", title: "Contactado" },
    { id: "interesado", title: "Interesado" },
    { id: "anulado", title: "Anulado/Cancelado" },
  ];

  const filteredLeads = (status: EstadoLead) => {
      if (status === "anulado") {
          return leads.filter(l => l.status === "anulado" || l.status === "cancelado");
      }
      return leads.filter(l => l.status === status || (!l.status && status === "nuevo"));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--t1)] font-medium bg-white px-3 py-1.5 rounded-lg border border-[var(--bd)] select-none">
          Total Leads: {leads.length}
        </div>
        <Button size="sm" onClick={onRefresh}>
          <RefreshCw size={13} />
          <span>Actualizar</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {columns.map(col => {
          const colLeads = filteredLeads(col.id);
          return (
            <div key={col.id} className="bg-[var(--bg1)] rounded-[var(--r)] p-2.5 flex flex-col min-h-[460px] border border-[var(--bd)]">
              <div className="flex items-center justify-between mb-2.5 px-1.5 select-none">
                <span className="text-[10px] font-bold text-[var(--t1)] uppercase tracking-widest">{col.title}</span>
                <span className="bg-white border border-[var(--bd2)] text-[10px] font-bold px-2 py-0.5 rounded-full text-[var(--t0)]">
                  {colLeads.length}
                </span>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                {colLeads.map(l => (
                  <div
                    key={l.id}
                    className="bg-white rounded-lg p-3 shadow-xs border border-[var(--bd)] select-none"
                  >
                    <div className="text-[12px] font-bold text-[var(--t0)]">
                      {l.nombre || "Sin nombre"}
                    </div>
                    <div className="text-[11px] text-[var(--t2)] mt-0.5">
                      {l.telefono}
                    </div>
                    <div className="mt-2 text-[10px] text-[var(--t2)]">
                      {formatDate(l.created_at)}
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <SourceTag source={l.red_social || "directo"} />
                            <select
                              value={l.status || 'nuevo'}
                              onChange={(e) => onUpdateStatus(l.id, e.target.value as EstadoLead)}
                              className="text-[10px] bg-slate-50 border p-1 rounded"
                            >
                              <option value="nuevo">Nuevo</option>
                              <option value="contactado">Contactado</option>
                              <option value="interesado">Interesado</option>
                              <option value="anulado">Anulado</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                        </div>
                        <Button size="xs" variant="primary" onClick={() => onConvertToPedido(l)}>Crear Pedido</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
