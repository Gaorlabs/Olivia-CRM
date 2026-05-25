import React, { useState, useEffect, useRef } from "react";
import { Send, Smartphone, Sparkles, MessageSquare, RefreshCw, Bot } from "lucide-react";
import { Card } from "./ui/Card.tsx";
import { Badge } from "./ui/Badge.tsx";
import { Button } from "./ui/Button.tsx";
import { SourceTag } from "./ui/SourceTag.tsx";
import { Conversacion, Mensaje } from "../types.ts";
import { formatTime } from "../utils.ts";

interface ConversationsHubProps {
  conversaciones: Conversacion[];
  selectedConvId: string | null;
  onSelectConv: (id: string) => void;
  onRefresh: () => void;
  messages: Mensaje[];
  onSendMessage: (convId: string, rol: "bot" | "cliente", text: string) => Promise<void>;
  loadingMessages: boolean;
}

export const ConversationsHub: React.FC<ConversationsHubProps> = ({
  conversaciones,
  selectedConvId,
  onSelectConv,
  onRefresh,
  messages,
  onSendMessage,
  loadingMessages
}) => {
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loadingMessages]);

  const activeConv = conversaciones.find(c => c.id === selectedConvId);

  const handleSend = async (e: React.FormEvent, senderRole: "cliente" | "bot") => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId || sending) return;

    setSending(true);
    const textToSend = inputText;
    setInputText("");

    try {
      await onSendMessage(selectedConvId, senderRole, textToSend);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const getStatusLabelColor = (state: string) => {
    switch (state) {
      case "iniciada": return "bg-slate-100 text-slate-700";
      case "consultando": return "bg-amber-100 text-amber-800";
      case "tomando_pedido": return "bg-blue-100 text-blue-800";
      case "esperando_pago": return "bg-purple-100 text-purple-800";
      case "completada": return "bg-emerald-100 text-emerald-800";
      case "abandonada": return "bg-rose-100 text-rose-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabelText = (state: string) => {
    switch (state) {
      case "iniciada": return "Iniciada";
      case "consultando": return "Consultando";
      case "tomando_pedido": return "Toma de datos";
      case "esperando_pago": return "Pendiente Pago Link";
      case "completada": return "Vendido S/";
      case "abandonada": return "Abandonado / Expiró";
      default: return state;
    }
  };

  return (
    <Card className="p-0 overflow-hidden border border-[var(--bd)] h-[580px] flex flex-col md:flex-row select-none">
      {/* ── CHATS LIST (LEFT SIDEBAR) ── */}
      <div className="w-full md:w-60 border-r border-[var(--bd)] flex flex-col bg-[var(--bg0)] flex-shrink-0">
        <div className="p-3 bg-[var(--bg1)] border-b border-[var(--bd)] flex items-center justify-between">
          <span className="text-[11px] font-bold text-[var(--t1)] uppercase tracking-wider">Chats Activos</span>
          <Button size="sm" onClick={onRefresh} title="Actualizar Chats">
            <RefreshCw size={11} />
          </Button>
        </div>

        <div className="flex-grow overflow-y-auto divide-y divide-[var(--bd)]">
          {conversaciones.map(c => {
            const isSelected = c.id === selectedConvId;
            const initials = c.lead?.nombre
              ? c.lead.nombre.split(" ").map(w => w[0]).join("").slice(0, 2)
              : "CL";

            return (
              <div
                key={c.id}
                onClick={() => onSelectConv(c.id)}
                className={`p-3 cursor-pointer transition-colors relative hover:bg-[var(--bg1)] ${
                  isSelected ? "bg-[var(--grn-bg)]!" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10.5px] font-bold font-mono border">
                    {initials}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[var(--t0)] truncate">
                        {c.lead?.nombre || "Cliente"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--t2)] truncate mt-0.5 font-medium">
                      {c.ultimoMensaje?.contenido || "Sin mensajes en el chat"}
                    </p>
                    <div className="flex items-center justify-between mt-2 gap-1.5">
                      <SourceTag source={c.lead?.red_social || "directo"} />
                      <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${getStatusLabelColor(c.estado)}`}>
                        {getStatusLabelText(c.estado)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {conversaciones.length === 0 && (
            <div className="p-8 text-center text-xs text-[var(--t2)]">
              No hay chats de WhatsApp registrados.
            </div>
          )}
        </div>
      </div>

      {/* ── CONVERSATION TRANSCRIPT (RIGHT WORKSPACE) ── */}
      <div className="flex-grow flex flex-col bg-[var(--bg1)]">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b bg-white border-[var(--bd)] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--t0)]">
                  {activeConv.lead?.nombre || "Lead"} ({activeConv.lead?.telefono})
                </span>
                <p className="text-[10px] text-[var(--t2)] mt-0.5 font-mono">
                  Canal de Origen: E.164 Whatsapp · {activeConv.lead?.red_social || "directo"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={activeConv.estado === "completada" ? "green" : "amber"}>
                  {getStatusLabelText(activeConv.estado)}
                </Badge>
              </div>
            </div>

            {/* Bubble Messages Area */}
            <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto flex flex-col gap-3.5 bg-[var(--bg2)]/40">
              {loadingMessages ? (
                <div className="flex-grow flex items-center justify-center text-xs text-[var(--t2)]">
                  Cargando mensajes del chat...
                </div>
              ) : (
                messages.map(m => {
                  const isBot = m.rol === "bot";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[80%] ${
                        isBot ? "self-start" : "self-end"
                      }`}
                    >
                      {/* Bubble */}
                      <div
                        className={`px-4 py-2.5 shadow-xs leading-relaxed text-xs break-words ${
                          isBot
                            ? "bg-[var(--grn-bg)] text-[var(--grn-t)] rounded-[12px_12px_12px_3px]"
                            : "bg-white text-[var(--t0)] rounded-[12px_12px_3px_12px] border border-[var(--bd)]"
                        }`}
                      >
                        {/* Render bold headers and tags neatly */}
                        <div className="whitespace-pre-wrap">
                          {m.contenido}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <span className={`text-[10px] text-[var(--t2)] mt-1 ${isBot ? "self-start pl-1" : "self-end pr-1"}`}>
                        {isBot ? "🤖 Bot OlivIA" : "👤 Cliente"}  · {formatTime(m.created_at)}
                      </span>
                    </div>
                  );
                })
              )}

              {messages.length === 0 && !loadingMessages && (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-[var(--t2)] text-[11px]">
                  <MessageSquare size={32} className="opacity-15 mb-1.5" />
                  <span>El chat está vacío. Envía un mensaje como Cliente para iniciar el chatbot de IA.</span>
                </div>
              )}
            </div>

            {/* Simulated typing Area (Client Playground) */}
            <div className="p-3 bg-white border-t border-[var(--bd)]">
              <div className="mb-2 px-1 text-[10px] items-center gap-1 font-semibold text-purple-800 bg-[var(--pur-bg)] w-max px-2 py-0.5 rounded flex select-none">
                <Sparkles size={11} className="animated pulse" />
                <span>Simulador de Entrada de Cliente (Test del Bot con IA Gemini)</span>
              </div>

              <form onSubmit={e => handleSend(e, "cliente")} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Simula lo que diría tu cliente... (Ej: 'Hola, dame info del combo')"
                  value={inputText}
                  disabled={sending}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-grow px-3.5 py-2 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all"
                />

                <Button
                  disabled={sending || !inputText.trim()}
                  type="submit"
                  variant="primary"
                >
                  <Send size={13} />
                  <span>{sending ? "IA pensando..." : "Enviar Cliente"}</span>
                </Button>

                {/* Agent Intervene overrides bot option */}
                <Button
                  disabled={sending || !inputText.trim()}
                  onClick={e => handleSend(e, "bot")}
                  type="button"
                  variant="secondary"
                  title="Intervenir como Agente Humano (apaga el bot para este mensaje)"
                >
                  <Bot size={13} className="text-amber-700" />
                  <span>Firma Humano</span>
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-12 text-center text-[var(--t2)] text-xs font-semibold">
            <Smartphone size={36} className="opacity-20 mb-2.5" />
            <span>Selecciona una conversación del canal izquierdo para ver su historial y simular respuestas con la IA</span>
          </div>
        )}
      </div>
    </Card>
  );
};
