import React, { useState } from "react";
import { MessageCircle, Filter, Search, UserPlus2, RefreshCw, Info } from "lucide-react";
import { Card } from "./ui/Card.tsx";
import { Badge } from "./ui/Badge.tsx";
import { Button } from "./ui/Button.tsx";
import { SourceTag } from "./ui/SourceTag.tsx";
import { Lead, EstadoLead } from "../types.ts";
import { formatDate } from "../utils.ts";

interface LeadsManagerProps {
  leads: Lead[];
  onSelectLeadChat: (phone: string, name: string) => void;
  onRefresh: () => void;
  onAddLead: (phone: string, name: string, social: string) => void;
  onUpdateLeadStatus: (id: string, status: EstadoLead) => void;
  onConvertToPedido: (lead: Lead) => void;
}

export const LeadsManager: React.FC<LeadsManagerProps> = ({
  leads,
  onSelectLeadChat,
  onRefresh,
  onAddLead,
  onUpdateLeadStatus,
  onConvertToPedido
}) => {
  const [search, setSearch] = useState("");
  const [filterSocial, setFilterSocial] = useState<string>("todos");

  // State for adding lead manually
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [newSocial, setNewSocial] = useState("directo");

  // Filtering
  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      (l.nombre || "").toLowerCase().includes(search.toLowerCase()) ||
      l.telefono.includes(search);

    const matchesSocial =
      filterSocial === "todos" ||
      (l.red_social || "directo").toLowerCase() === filterSocial.toLowerCase();

    return matchesSearch && matchesSocial;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone) return;
    onAddLead(newPhone, newName || `Cliente manual`, newSocial);
    setNewPhone("");
    setNewName("");
    setNewSocial("directo");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      {/* ── TOOLBAR ── */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-2 flex items-start gap-2">
        <Info size={16} className="text-emerald-700 flex-shrink-0 mt-0.5"/>
        <p className="text-[11px] text-emerald-800 leading-relaxed">
          <b>Leads: Clientes Potenciales</b><br/>
          Aquí aparecen los usuarios que iniciaron contacto por WhatsApp, pero que aún no han concretado una venta automática. Utiliza esta lista para gestionar manualmente el cierre de ventas o seguimiento personalizado.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Filters */}
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative flex-1 md:flex-none">
            <Search size={14} className="absolute left-3 top-2.5 text-[var(--t2)]" />
            <input
              type="text"
              placeholder="Buscar por nombre o número..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-full md:w-64 text-xs rounded-lg border border-[var(--bd2)] bg-white text-[var(--t0)] outline-none focus:border-[var(--grn)] transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[var(--bd)] px-2.5 py-1.5 rounded-lg">
            <Filter size={12} className="text-[var(--t2)]" />
            <select
              value={filterSocial}
              onChange={e => setFilterSocial(e.target.value)}
              className="text-xs text-[var(--t1)] bg-transparent outline-none cursor-pointer"
            >
              <option value="todos">Todos los Orígenes</option>
              <option value="facebook">Facebook Ads</option>
              <option value="instagram">Instagram DM</option>
              <option value="tiktok">TikTok Video</option>
              <option value="directo">Tráfico Directo</option>
            </select>
          </div>
        </div>

        {/* Action button */}
        <div className="flex gap-2 justify-end">
          <Button size="sm" onClick={onRefresh} title="Actualizar">
            <RefreshCw size={13} />
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <UserPlus2 size={13} />
            <span>Nuevo Lead</span>
          </Button>
        </div>
      </div>

      {/* ── MANUALLY ADD LEAD DRAWER / FORM ── */}
      {showAddForm && (
        <Card className="animate-in fade-in slide-in-from-top-4 duration-250">
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-end">
            <div>
              <label className="text-[10px] font-bold text-[var(--t1)] uppercase block mb-1">Teléfono*</label>
              <input
                required
                type="text"
                placeholder="+51999999999"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--t1)] uppercase block mb-1">Nombre Completo</label>
              <input
                type="text"
                placeholder="Nombre de cliente"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--t1)] uppercase block mb-1">Origen / Canal</label>
              <select
                value={newSocial}
                onChange={e => setNewSocial(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all cursor-pointer"
              >
                <option value="directo">Tráfico Directo</option>
                <option value="facebook">Facebook Ads</option>
                <option value="instagram">Instagram DM</option>
                <option value="tiktok">TikTok Video</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" className="flex-1">
                Guardar Lead
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── TABLE VIEW ── */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg1)] select-none">
                <th className="text-[11px] font-semibold text-[var(--t2)] uppercase tracking-wide px-5 py-3 text-left">
                  Contacto
                </th>
                <th className="text-[11px] font-semibold text-[var(--t2)] uppercase tracking-wide px-5 py-3 text-left">
                  Origen
                </th>
                <th className="text-[11px] font-semibold text-[var(--t2)] uppercase tracking-wide px-5 py-3 text-left">
                  Estado
                </th>
                <th className="text-[11px] font-semibold text-[var(--t2)] uppercase tracking-wide px-5 py-3 text-left">
                  Fecha Registro
                </th>
                <th className="text-[11px] font-semibold text-[var(--t2)] uppercase tracking-wide px-5 py-3 text-center">
                  Chat Privado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bd)]">
              {filteredLeads.map(l => (
                <tr key={l.id} className="hover:bg-[var(--bg1)] transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-[12.5px] font-semibold text-[var(--t0)]">
                      {l.nombre || "Cliente Registrado"}
                    </div>
                    <div className="text-[11px] text-[var(--t2)] mt-0.5 tracking-wider font-mono">
                      {l.telefono}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <SourceTag source={l.red_social || "directo"} />
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={l.status || 'nuevo'}
                      onChange={(e) => onUpdateLeadStatus(l.id, e.target.value as EstadoLead)}
                      className="text-[11px] bg-white border border-[var(--bd)] px-2 py-1 rounded-md outline-none"
                    >
                      <option value="nuevo">Nuevo</option>
                      <option value="contactado">Contactado</option>
                      <option value="interesado">Interesado</option>
                      <option value="anulado">Anulado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-[11.5px] text-[var(--t1)]">
                    {formatDate(l.created_at)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onSelectLeadChat(l.telefono, l.nombre || "Cliente")}
                      >
                        <MessageCircle size={13} />
                        <span>Chat</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onConvertToPedido(l)}
                      >
                        <span>Crear Pedido</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-xs text-[var(--t2)] font-medium">
                    No se encontraron leads con la búsqueda especificada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
