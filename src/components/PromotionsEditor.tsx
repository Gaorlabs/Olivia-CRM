import React, { useState, useEffect } from "react";
import { Megaphone, PlusCircle, Trash2, Save, FileCode2, Copy, Sparkles, AlertCircle } from "lucide-react";
import { Card } from "./ui/Card.tsx";
import { Badge } from "./ui/Badge.tsx";
import { Button } from "./ui/Button.tsx";
import { Promocion } from "../types.ts";
import { formatSoles } from "../utils.ts";

interface PromotionsEditorProps {
  promociones: Promocion[];
  onCreatePromo: (p: Omit<Promocion, "id" | "created_at" | "updated_at" | "prompt_generado">) => Promise<void>;
  onUpdatePromo: (id: string, p: Partial<Promocion>) => Promise<void>;
  onDeletePromo: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export const PromotionsEditor: React.FC<PromotionsEditorProps> = ({
  promociones,
  onCreatePromo,
  onUpdatePromo,
  onDeletePromo,
  onRefresh
}) => {
  const [selectedId, setSelectedId] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("0");
  const [igvIncluido, setIgvIncluido] = useState(true);
  const [vigenciaFin, setVigenciaFin] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [activa, setActiva] = useState(false);

  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved'

  // Custom modals/dialogs state to avoid iframe sandboxing blocks
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPromoName, setNewPromoName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Selected promo model
  const activePromo = promociones.find(p => p.id === selectedId) || promociones[0];

  // Helper local state to trace when user shifts selection
  const [lastId, setLastId] = useState<string>("");

  useEffect(() => {
    if (activePromo) {
      if (activePromo.id !== lastId) {
        setSelectedId(activePromo.id);
        setLastId(activePromo.id);
        setNombre(activePromo.nombre);
        setDescripcion(activePromo.descripcion || "");
        setPrecio(activePromo.precio.toString());
        setIgvIncluido(activePromo.igv_incluido);
        setVigenciaFin(activePromo.vigencia_fin || "");
        setCondiciones(activePromo.condiciones || "");
        setActiva(activePromo.activa);
      }
    }
  }, [activePromo, lastId]);

  // Client-side Prompt builder matching server structure for beautiful real-time preview
  const buildClientPrompt = () => {
    return `## PROMOCIÓN ACTIVA:
Nombre: ${nombre || "Sin nombre"}
Descripción: ${descripcion || "Sin descripción"}
Precio: S/ ${Number(precio).toFixed(2)} (${igvIncluido ? "IGV incluido" : "más IGV"})
${vigenciaFin ? `Vigente hasta: ${vigenciaFin}` : ""}
${condiciones ? `Condiciones de reparto: ${condiciones}` : ""}

## INSTRUCCIONES DEL BOT (OlivIA)
Eres un asistente de ventas amable y eficiente de Pollo Broaster OlivIA. Cuando el cliente pregunte por la promo, comparte los detalles anteriores con emojis tentadores (🍗🍟🥤) de forma clara y amigable.
Ofrece tomar el pedido al final de cada respuesta informativa.
Al confirmar el pedido, recopila de manera obligatoria: nombre completo, dirección exacta de entrega y tipo de entrega (delivery o recojo).
Una vez confirmados los datos, informa el total y genera la etiqueta [CONFIRM_ORDER: ...] para autodespachar el pedido.
Mantén un tono cálido y profesional en español peruano natural.`;
  };

  const currentPrompt = buildClientPrompt();

  const handleSave = async () => {
    if (!selectedId) return;
    setSaveStatus("saving");

    try {
      await onUpdatePromo(selectedId, {
        nombre,
        descripcion,
        precio: parseFloat(precio) || 0,
        igv_incluido: igvIncluido,
        vigencia_fin: vigenciaFin || null,
        condiciones: condiciones || null,
        activa
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (e) {
      setSaveStatus("idle");
      console.error(e);
    }
  };

  const openCreateDialog = () => {
    setNewPromoName("");
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!newPromoName.trim()) return;
    try {
      const createdObj = await onCreatePromo({
        negocio_id: "negocio-pe-1234",
        nombre: newPromoName.trim(),
        descripcion: "Sabor increíble de pollo broaster crocante",
        precio: 39.90,
        igv_incluido: true,
        vigencia_fin: "30 de junio 2026",
        condiciones: "Costo de envío S/ 5.",
        activa: false
      });
      
      // Select the new promotion directly
      if (createdObj && createdObj.id) {
        setSelectedId(createdObj.id);
        setLastId(createdObj.id);
      }
      setShowCreateModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const openDeleteDialog = () => {
    if (!selectedId) return;
    if (promociones.length <= 1) {
      setAlertMessage("Debes mantener al menos una promoción en la base de datos para el bot de OlivIA CRM.");
      setShowAlertModal(true);
      return;
    }
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    try {
      await onDeletePromo(selectedId);
      setShowDeleteModal(false);
      // Select the next available promotion
      const remaining = promociones.filter(p => p.id !== selectedId);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
        setLastId(remaining[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckboxToggle = async (checked: boolean) => {
    setActiva(checked);
    if (selectedId) {
      try {
        await onUpdatePromo(selectedId, { activa: checked });
      } catch (e) {
        console.error("Error toggling promo status:", e);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-7xl mx-auto pb-10">
      {/* ── LEFT DRAWER: PROMO SELECTION LIST (4 Cols) ── */}
      <div className="lg:col-span-4 space-y-3.5">
        <Card>
          <div className="flex items-center justify-between mb-3 border-b border-[var(--bd)] pb-2 select-none">
            <span className="text-xs font-bold text-[var(--t0)]">Tus Promociones</span>
            <Button size="sm" variant="primary" onClick={openCreateDialog}>
              <PlusCircle size={13} />
              <span>Añadir</span>
            </Button>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {promociones.map(p => {
              const isSelected = p.id === selectedId;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`p-3 rounded-lg border cursor-pointer select-none transition-all ${
                    isSelected
                      ? "bg-[var(--grn-bg)] border-[var(--grn)] text-[var(--grn-t)] font-semibold"
                      : "bg-[var(--bg1)] border-[var(--bd)] text-[var(--t0)] hover:border-[var(--bd2)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium truncate max-w-[150px]">{p.nombre}</span>
                    
                    {/* Fast Toggler on click of Badge */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdatePromo(p.id, { activa: !p.activa });
                        if (p.id === selectedId) {
                          setActiva(!p.activa);
                        }
                      }}
                      title="Haz clic para activar o desactivar instantáneamente"
                      className="transition-transform hover:scale-110 active:scale-95 duration-100"
                    >
                      <Badge variant={p.activa ? "green" : "gray"}>
                        {p.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      {formatSoles(p.precio)}
                    </span>
                    {p.vigencia_fin && (
                      <span className="text-[9.5px] text-[var(--t2)] font-semibold">
                        Exp: {p.vigencia_fin}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── CENTRAL DRAWER: EDIT AND REAL-TIME PROMPT BUILDER (8 Cols) ── */}
      <div className="lg:col-span-8">
        {activePromo ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Form Fields */}
              <Card className="space-y-3">
                <div className="border-b border-[var(--bd)] pb-2 select-none flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--t0)]">Editar Información Comercial</span>
                  <Button size="sm" variant="danger" onClick={openDeleteDialog} title="Eliminar Promo">
                    <Trash2 size={13} />
                  </Button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--t1)] uppercase tracking-wider block mb-1">Nombre de la Promo</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--t1)] uppercase tracking-wider block mb-1">Descripción del Combo</label>
                  <textarea
                    rows={2}
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--t1)] uppercase tracking-wider block mb-1">Precio Soles (S/.)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={precio}
                      onChange={e => setPrecio(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--t1)] uppercase tracking-wider block mb-1">Gravado IGV</label>
                    <select
                      value={igvIncluido ? "incluido" : "no-incluido"}
                      onChange={e => setIgvIncluido(e.target.value === "incluido")}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="incluido">IGV Incluido</option>
                      <option value="no-incluido">Más IGV</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--t1)] uppercase tracking-wider block mb-1">Vigencia Límite</label>
                  <input
                    type="text"
                    placeholder="Ej. 30 de junio 2026"
                    value={vigenciaFin}
                    onChange={e => setVigenciaFin(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--t1)] uppercase tracking-wider block mb-1">Condiciones de Despacho</label>
                  <input
                    type="text"
                    placeholder="Ej. Delivery San Isidro, envío S/ 5"
                    value={condiciones}
                    onChange={e => setCondiciones(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 bg-[var(--bg1)] p-2.5 rounded-lg border border-[var(--bd)] select-none">
                  <input
                    id="active-toggle"
                    type="checkbox"
                    checked={activa}
                    onChange={e => handleCheckboxToggle(e.target.checked)}
                    className="w-4 h-4 text-[var(--grn)] accent-[var(--grn)] cursor-pointer"
                  />
                  <label htmlFor="active-toggle" className="text-xs font-semibold text-[var(--t1)] cursor-pointer select-none">
                    Activar esta promoción en el Bot de IA
                  </label>
                </div>

                <Button
                  variant="primary"
                  className="w-full py-2 flex items-center justify-center font-bold"
                  onClick={handleSave}
                  disabled={saveStatus === "saving"}
                >
                  <Save size={14} />
                  <span>
                    {saveStatus === "saving"
                      ? "Sincronizando..."
                      : saveStatus === "saved"
                      ? "✓ ¡Guardado para el Bot!"
                      : "Guardar y Publicar al Bot"}
                  </span>
                </Button>
              </Card>

              {/* Prompt Preview Panel */}
              <Card className="flex flex-col">
                <div className="border-b border-[var(--bd)] pb-2 mb-3 select-none flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--t0)] flex items-center gap-1">
                    <FileCode2 size={13} className="text-[var(--grn)]" />
                    Visualizador de Prompt del Bot de IA
                  </span>
                  <Button size="sm" onClick={handleCopy}>
                    <Copy size={12} />
                    <span>{copied ? "Copiado!" : "Copiar"}</span>
                  </Button>
                </div>

                {/* Code layout */}
                <div className="flex-1 bg-slate-950 rounded-lg p-3.5 font-mono text-[9px] text-[#A1DCC3] overflow-y-auto max-h-[340px] leading-relaxed whitespace-pre-wrap select-text border border-slate-900 shadow-inner">
                  {currentPrompt}
                </div>

                <div className="mt-3.5 bg-purple-50 rounded-lg border border-purple-100 p-2.5 flex items-start gap-2 select-none">
                  <Sparkles size={16} className="text-purple-700 flex-shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-[10px] leading-relaxed text-purple-900">
                    <b>Generación en tiempo real</b>: OlivIA CRM traduce tus campos comerciales a un prompt de comportamiento para la IA. n8n u otros canales usarán esta info automáticamente. No requieres realizar deploy de código.
                  </p>
                </div>
              </Card>
            </div>
            
          </>
        ) : (
          <Card className="p-12 text-center text-[var(--t2)] font-semibold flex flex-col items-center justify-center">
            <Megaphone size={32} className="opacity-15 mb-2.5" />
            <span>Crea una promoción en la columna izquierda para configurar tu bot automatizado</span>
          </Card>
        )}
      </div>

      {/* ── MODAL Overlay: AÑADIR NUEVA PROMOCIÓN ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-100 select-none">
            <div className="flex items-center gap-2 text-[var(--grn)] mb-3 pb-2 border-b border-slate-100">
              <PlusCircle size={18} />
              <h3 className="text-sm font-bold text-slate-800">Nueva Promoción Comercial</h3>
            </div>
            
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
              Define el título comercial que usará la IA n8n / Evolution API para vender este combo por WhatsApp:
            </p>

            <input
              type="text"
              placeholder="Ej. Súper Pack OlivIA Especial 🍟🍗"
              value={newPromoName}
              onChange={e => setNewPromoName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 mb-4 outline-none focus:border-[var(--grn)] focus:bg-white transition-all text-slate-800"
              autoFocus
              onKeyDown={e => {
                if (e.key === "Enter") handleCreate();
              }}
            />

            <div className="flex items-center justify-end gap-2.5">
              <Button size="sm" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button size="sm" variant="primary" onClick={handleCreate} disabled={!newPromoName.trim()}>
                Crear Promoción
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL Overlay: CONFIRMAR ELIMINACIÓN ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-100 select-none">
            <div className="flex items-center gap-2 text-rose-600 mb-3 pb-2 border-b border-slate-100">
              <Trash2 size={18} />
              <h3 className="text-sm font-bold text-slate-800">¿Eliminar Promoción?</h3>
            </div>
            
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente la promoción <b>"{nombre}"</b>? Esta acción no se puede deshacer y el Bot ya no podrá ofrecer este combo.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <Button size="sm" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </Button>
              <Button size="sm" variant="danger" onClick={executeDelete}>
                Sí, Eliminar de la BD
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL Overlay: ALERT BLOCKED OPERATIONS ── */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-100 select-none">
            <div className="flex items-center gap-2 text-amber-500 mb-3 pb-2 border-b border-slate-100">
              <AlertCircle size={18} />
              <h3 className="text-sm font-bold text-slate-800">Aviso del Sistema</h3>
            </div>
            
            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
              {alertMessage}
            </p>

            <div className="flex items-center justify-end">
              <Button size="sm" variant="primary" onClick={() => setShowAlertModal(false)}>
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
