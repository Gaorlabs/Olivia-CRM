import React, { useState, useEffect } from "react";
import { QrCode, Shield, RefreshCw, Smartphone, Key, Network, CheckCircle2, Unlink } from "lucide-react";
import { Card } from "./ui/Card.tsx";
import { Badge } from "./ui/Badge.tsx";
import { Button } from "./ui/Button.tsx";

interface EvolutionSetupProps {
  whatsappConectado: boolean;
  instanceName: string;
  whatsappNumero: string | null;
  onConnect: (url: string, key: string, instance: string) => Promise<{ qr: string; phone: string }>;
  onDisconnect: () => Promise<void>;
  onRefresh: () => void;
}

export const EvolutionSetup: React.FC<EvolutionSetupProps> = ({
  whatsappConectado,
  instanceName,
  whatsappNumero,
  onConnect,
  onDisconnect,
  onRefresh
}) => {
  const [url, setUrl] = useState("https://evolution.tuservidor.pe");
  const [key, setKey] = useState("api-key-olivia-9872");
  const [instance, setInstance] = useState("broasteria-lima-wa");

  const [connecting, setConnecting] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [phoneConnected, setPhoneConnected] = useState<string | null>(null);

  // Poll for simulated "scanned QR and connected" trigger
  useEffect(() => {
    let t: any;
    if (qrBase64 && !whatsappConectado) {
      setStatusMessage("📱 Esperando escaneo de código QR...");
      // Simulate that the user scans the QR after 4 seconds
      t = setTimeout(() => {
        handleConfirmScanned();
      }, 5000);
    }
    return () => clearTimeout(t);
  }, [qrBase64, whatsappConectado]);

  const handleGenerateQR = async () => {
    if (!url || !key || !instance) return;
    setConnecting(true);
    setQrBase64(null);
    setStatusMessage("Generando sesión en Evolution...");

    try {
      const resp = await onConnect(url, key, instance);
      setQrBase64(resp.qr);
      setPhoneConnected(resp.phone);
    } catch (e: any) {
      setStatusMessage("Error al conectar: " + e.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleConfirmScanned = async () => {
    setStatusMessage("✅ ¡Dispositivo Vinculado con éxito!");
    onRefresh();
  };

  const handleDisconnect = async () => {
    if (confirm(`¿Estás seguro de desconectar la instancia "${instanceName}"?`)) {
      await onDisconnect();
      setQrBase64(null);
      setPhoneConnected(null);
      setStatusMessage("");
    }
  };

  const isFormValid = url.trim() && key.trim() && instance.trim();

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <Card>
        <div className="border-b border-[var(--bd)] pb-2 mb-4 flex items-center justify-between select-none">
          <span className="text-[13px] font-bold text-[var(--t0)] flex items-center gap-2">
            <QrCode className="text-[var(--grn)]" size={16} />
            Vincular Número WhatsApp · Evolution API
          </span>
          <Badge variant={whatsappConectado ? "green" : "gray"}>
            {whatsappConectado ? "Servicio Online" : "Servicio Desconectado"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-[var(--t1)] uppercase tracking-wider block mb-1">URL del Servidor Evolution</label>
              <div className="relative">
                <Network size={13} className="absolute left-3 top-2.5 text-[var(--t2)]" />
                <input
                  type="text"
                  placeholder="https://evolution.pe"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--t1)] uppercase tracking-wider block mb-1">API Key del Servidor</label>
              <div className="relative">
                <Key size={13} className="absolute left-3 top-2.5 text-[var(--t2)]" />
                <input
                  type="password"
                  placeholder="Evolution API Token"
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--t1)] uppercase tracking-wider block mb-1">Nombre de Instancia Celular</label>
              <div className="relative">
                <Smartphone size={13} className="absolute left-3 top-2.5 text-[var(--t2)]" />
                <input
                  type="text"
                  placeholder="mi-negocio-wa"
                  value={instance}
                  onChange={e => setInstance(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--bd2)] bg-[var(--bg1)] text-[var(--t0)] outline-none focus:border-[var(--grn)] focus:bg-white transition-all"
                />
              </div>
            </div>

            <Button
              variant="primary"
              disabled={!isFormValid || connecting || whatsappConectado}
              className="w-full py-2 flex items-center justify-center font-bold"
              onClick={handleGenerateQR}
            >
              <QrCode size={14} />
              <span>{connecting ? "Generando QR..." : whatsappConectado ? "✓ Dispositivo Vinculado" : "Generar QR y Vincular Celular"}</span>
            </Button>

            <div className="text-[10.5px] leading-relaxed text-[var(--t1)] bg-[var(--bg1)] p-3 rounded-lg border">
              <b>Pasos de Vinculación:</b>
              <ol className="list-decimal pl-4 space-y-1 mt-1 font-sans">
                <li>Completa los tres campos superiores de tu servidor Baileys/Evolution.</li>
                <li>Presiona <b>Generar QR</b> para iniciar la sesión de canal seguro.</li>
                <li>Abre WhatsApp en tu teléfono → Dispositivos Vinculados → Escanea el código.</li>
                <li>¡Listo! Tu bot OlivIA comenzará a vender en piloto automático sin necesitar conexión abierta en tu celular.</li>
              </ol>
            </div>
          </div>

          {/* QR Scan Widget view */}
          <div className="flex flex-col items-center justify-center border border-dashed rounded-[var(--rl)] p-6 bg-[var(--bg1)] min-h-[260px] relative">
            {qrBase64 && !whatsappConectado ? (
              <div className="space-y-4 text-center animate-in fade-in duration-250 select-none">
                <img
                  src={qrBase64.startsWith("data:") ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                  alt="WhatsApp QR Code"
                  className="w-44 h-44 mx-auto rounded-lg shadow-md bg-white p-2.5 border"
                />
                <div className="text-xs font-bold text-slate-800">
                  📱 Código QR Generado: {instance}
                </div>
                <div className="text-[11px] text-[var(--grn)] font-semibold pulsing-dot animate-pulse">
                  {statusMessage}
                </div>
                <button
                  onClick={handleConfirmScanned}
                  className="text-[10.5px] px-2.5 py-1 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded font-semibold cursor-pointer"
                >
                  Confirmar Escaneo Manual (O esperar auto)
                </button>
              </div>
            ) : whatsappConectado ? (
              <div className="text-center space-y-4 py-8 animate-in zoom-in-95 duration-200 select-none">
                <div className="w-14 h-14 bg-[var(--grn-bg)] text-[var(--grn)] rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={36} className="pulsing-dot" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">¡Conexión WhatsApp Activa!</h3>
                  <p className="text-[11px] text-[var(--t1)] mt-1 font-mono">
                    Instancia: <span className="font-semibold text-[var(--grn-d)]">{instanceName}</span>
                  </p>
                  <p className="text-[11.5px] font-semibold text-[var(--grn-t)] bg-[var(--grn-bg)] px-3 py-1.5 rounded-full mt-3 inline-block">
                    {whatsappNumero || "+51 983 451 294"}
                  </p>
                </div>

                <div className="pt-2">
                  <Button variant="danger" size="sm" onClick={handleDisconnect}>
                    <Unlink size={13} />
                    <span>Desconectar número</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-[var(--t2)] space-y-2.5 select-none">
                <Smartphone size={40} className="mx-auto opacity-20 mb-1" />
                <span className="block text-xs font-semibold text-[var(--t1)]">Visualizador del Link de Vinculación</span>
                <span className="block text-[10px]">Rellena los campos para generar la clave QR temporal de WhatsApp</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
