import React, { useState, useEffect } from "react";
import { 
  Sliders, 
  HelpCircle, 
  Webhook, 
  CreditCard, 
  Smartphone, 
  Building, 
  DollarSign, 
  Save, 
  CheckCircle, 
  Info, 
  QrCode,
  Check,
  AlertCircle
} from "lucide-react";
import { Card } from "./ui/Card.tsx";
import { Badge } from "./ui/Badge.tsx";
import { Button } from "./ui/Button.tsx";
import { BotConfig } from "../types.ts";

interface BotSetupProps {
  config: BotConfig;
  negocio?: any;
  onUpdateConfig: (updated: Record<string, any>) => Promise<void>;
  onRefresh: () => void;
}

export const BotSetup: React.FC<BotSetupProps> = ({
  config,
  negocio,
  onUpdateConfig,
  onRefresh
}) => {
  const [botActivo, setBotActivo] = useState(config.bot_activo);
  const [humanoBackup, setHumanoBackup] = useState(config.humano_backup);
  const [savingPayment, setSavingPayment] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local states for custom payment methods
  const [yapeActivo, setYapeActivo] = useState(false);
  const [yapeNumero, setYapeNumero] = useState("");
  const [yapeTitular, setYapeTitular] = useState("");

  const [transferenciaActiva, setTransferenciaActiva] = useState(false);
  const [transferenciaBanco, setTransferenciaBanco] = useState("");
  const [transferenciaCuenta, setTransferenciaCuenta] = useState("");
  const [transferenciaCci, setTransferenciaCci] = useState("");
  const [transferenciaTitular, setTransferenciaTitular] = useState("");

  const [efectivoActivo, setEfectivoActivo] = useState(false);
  const [efectivoInstrucciones, setEfectivoInstrucciones] = useState("");

  const [culqiActivo, setCulqiActivo] = useState(false);
  const [culqiApiKey, setCulqiApiKey] = useState("");

  // Sync state with negocio prop when available
  useEffect(() => {
    if (negocio) {
      setYapeActivo(!!negocio.pago_yape_activo);
      setYapeNumero(negocio.pago_yape_numero || "");
      setYapeTitular(negocio.pago_yape_titular || "");

      setTransferenciaActiva(!!negocio.pago_transferencia_activa);
      setTransferenciaBanco(negocio.pago_transferencia_banco || "BCP");
      setTransferenciaCuenta(negocio.pago_transferencia_cuenta || "");
      setTransferenciaCci(negocio.pago_transferencia_cci || "");
      setTransferenciaTitular(negocio.pago_transferencia_titular || "");

      setEfectivoActivo(!!negocio.pago_efectivo_activo);
      setEfectivoInstrucciones(negocio.pago_efectivo_instrucciones || "");

      setCulqiActivo(!!negocio.pago_culqi_activo);
      setCulqiApiKey(negocio.pago_culqi_api_key || "");
    }
  }, [negocio]);

  const handleToggleBot = async () => {
    const nextVal = !botActivo;
    setBotActivo(nextVal);
    await onUpdateConfig({ bot_activo: nextVal });
  };

  const handleToggleBackup = async () => {
    const nextVal = !humanoBackup;
    setHumanoBackup(nextVal);
    await onUpdateConfig({ humano_backup: nextVal });
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPayment(true);
    setSaveSuccess(false);

    try {
      await onUpdateConfig({
        pago_yape_activo: yapeActivo,
        pago_yape_numero: yapeNumero,
        pago_yape_titular: yapeTitular,
        pago_transferencia_activa: transferenciaActiva,
        pago_transferencia_banco: transferenciaBanco,
        pago_transferencia_cuenta: transferenciaCuenta,
        pago_transferencia_cci: transferenciaCci,
        pago_transferencia_titular: transferenciaTitular,
        pago_efectivo_activo: efectivoActivo,
        pago_efectivo_instrucciones: efectivoInstrucciones,
        pago_culqi_activo: culqiActivo,
        pago_culqi_api_key: culqiApiKey
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in font-sans pb-10">
      
      {/* SECTION 1: BOT CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Ajustes del Asistente</h3>
          <p className="text-[11.5px] text-slate-500 leading-normal">
            Configura el comportamiento del agente de inteligencia de OlivIA para este canal. También controla cómo intervienen tus asesores humanos.
          </p>
          
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-2">
            <div className="flex gap-2">
              <AlertCircle size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-indigo-950 font-bold leading-normal">Multi-Tenant Inteligente</p>
            </div>
            <p className="text-[10.5px] text-indigo-700 leading-relaxed">
              Cada negocio gestiona su propia moneda, métodos de depósito y flujos de cobro. OlivIA adaptará sus respuestas dinámicamente según la configuración de abajo.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Card id="bot-general-controls">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center gap-2 select-none">
              <Sliders className="text-indigo-600" size={16} />
              <span className="text-[13px] font-bold text-slate-800">Estado del Agente OlivIA</span>
            </div>

            {/* 1. Bot Automático */}
            <div className="flex items-start justify-between py-3 border-b border-slate-100 gap-3">
              <div className="flex-1">
                <h4 className="text-[12.5px] font-bold text-slate-800">Respuestas Automáticas con IA Gemini</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Cuando está activo, el bot responde de inmediato a los mensajes de tus leads usando la API de Gemini 3.5 Flash, basándose en la promoción de tu negocio y recolectando datos.
                </p>
              </div>
              <button
                onClick={handleToggleBot}
                className={`w-[48px] h-[26px] p-0.5 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${
                  botActivo ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-[22px] h-[22px] bg-white rounded-full shadow-md transition-all absolute top-0.5 ${
                    botActivo ? "left-[24px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {/* 2. Respaldo Humano */}
            <div className="flex items-start justify-between py-3 gap-3">
              <div className="flex-1">
                <h4 className="text-[12.5px] font-bold text-slate-800">Respaldo Humano Interactivo (Alerta Agente)</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Si se activa, el bot se desconectará temporalmente para un chat en específico si el usuario pide explícitamente conversar con un humano, permitiendo intervención limpia del CRM.
                </p>
              </div>
              <button
                onClick={handleToggleBackup}
                className={`w-[48px] h-[26px] p-0.5 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${
                  humanoBackup ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-[22px] h-[22px] bg-white rounded-full shadow-md transition-all absolute top-0.5 ${
                    humanoBackup ? "left-[24px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </Card>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* SECTION 2: INDIVIDUAL PAYMENT METHODS (THE CORE ASK) */}
      <form onSubmit={handleSavePaymentConfig} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Métodos de Pago Autorizados</h3>
          <p className="text-[11.5px] text-slate-500 leading-normal">
            Define cómo recauda tu negocio. Puedes activar depósitos directos, billeteras móviles peruanas como <strong>Yape</strong>, cobrar en <strong>efectivo</strong> al entregar, o automatizar con links de <strong>Culqi</strong>. 
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Visualización en WhatsApp</span>
            <div className="space-y-1.5 font-mono text-[10px] text-slate-600 bg-white border border-slate-100 p-3 rounded-lg leading-relaxed shadow-sm">
              <p className="text-indigo-600 font-bold mb-1">🤖 OlivIA informará en el chat:</p>
              {yapeActivo && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  <span>"Puedes pagar con Yape al {yapeNumero}"</span>
                </div>
              )}
              {transferenciaActiva && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span>"Aceptamos transferencias {transferenciaBanco}"</span>
                </div>
              )}
              {efectivoActivo && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>"Pagas en efectivo contra entrega"</span>
                </div>
              )}
              {culqiActivo && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                  <span>"Bot generará link Visa/Mastercard"</span>
                </div>
              )}
              {!yapeActivo && !transferenciaActiva && !efectivoActivo && !culqiActivo && (
                <p className="text-yellow-600 italic">No has habilitado métodos d pago. El bot pedirá coordinar con un humano.</p>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-5">
          <Card id="payment-methods-config">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="text-emerald-600" size={17} />
                <span className="text-[13px] font-bold text-slate-800">
                  Canales de Pago · {negocio?.nombre || "Cargando..."}
                </span>
              </div>
              <Badge variant="blue">Configuración Directa</Badge>
            </div>

            <div className="space-y-6">
              
              {/* METHOD 1: YAPE / PLIN */}
              <div className={`p-4 rounded-xl border transition-all ${yapeActivo ? "border-purple-200 bg-purple-50/20" : "border-slate-100 bg-white"}`}>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center text-purple-700">
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <h4 className="text-[12.5px] font-extrabold text-slate-800">Billeteras Digitales (Yape / Plin)</h4>
                      <p className="text-[10.5px] text-slate-500">Habilita pagos inmediatos vía celular con confirmación rápida.</p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setYapeActivo(!yapeActivo)}
                    className={`w-[40px] h-[22px] p-0.5 rounded-full transition-colors relative cursor-pointer outline-none ${
                      yapeActivo ? "bg-purple-600" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`w-[18px] h-[18px] bg-white rounded-full transition-all absolute top-0.5 ${
                        yapeActivo ? "left-[20px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                {yapeActivo && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5 border-t border-purple-100/50 animate-fade-in">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Número Celular Yape/Plin</label>
                      <input 
                        type="text" 
                        value={yapeNumero}
                        onChange={(e) => setYapeNumero(e.target.value)}
                        placeholder="Ej. +51 987 654 321"
                        className="w-full text-[12px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 font-mono"
                        required={yapeActivo}
                      />
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Nombre del Titular</label>
                      <input 
                        type="text" 
                        value={yapeTitular}
                        onChange={(e) => setYapeTitular(e.target.value)}
                        placeholder="Ej. Juan Pérez Ramos"
                        className="w-full text-[12px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                        required={yapeActivo}
                      />
                    </div>

                    <div className="sm:col-span-2 bg-purple-500/5 border border-purple-100 p-2.5 rounded-lg flex items-center justify-between gap-3 text-purple-950">
                      <div className="flex items-center gap-2">
                        <QrCode size={18} className="text-purple-600 shrink-0" />
                        <div className="text-[10.5px]">
                          <span className="font-bold">QR Auto-Generado de WhatsApp</span>
                          <span className="block text-slate-500 text-[9.5px]">Se simulará un QR escaneable en el chat en base al número registrado.</span>
                        </div>
                      </div>
                      <Badge variant="purple">Activo</Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* METHOD 2: DEPOSITOS & TRANSFERENCIAS */}
              <div className={`p-4 rounded-xl border transition-all ${transferenciaActiva ? "border-blue-200 bg-blue-50/20" : "border-slate-100 bg-white"}`}>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-700">
                      <Building size={16} />
                    </div>
                    <div>
                      <h4 className="text-[12.5px] font-extrabold text-slate-800">Transferencias Bancarias (BCP, BBVA, Interbank)</h4>
                      <p className="text-[10.5px] text-slate-500">Perfecto para montos corporativos u órdenes medianas.</p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setTransferenciaActiva(!transferenciaActiva)}
                    className={`w-[40px] h-[22px] p-0.5 rounded-full transition-colors relative cursor-pointer outline-none ${
                      transferenciaActiva ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`w-[18px] h-[18px] bg-white rounded-full transition-all absolute top-0.5 ${
                        transferenciaActiva ? "left-[20px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                {transferenciaActiva && (
                  <div className="space-y-3 pt-1.5 border-t border-blue-100/50 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Banco</label>
                        <select 
                          value={transferenciaBanco}
                          onChange={(e) => setTransferenciaBanco(e.target.value)}
                          className="w-full text-[12px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                        >
                          <option value="BCP">BCP Banco de Crédito</option>
                          <option value="BBVA">BBVA continental</option>
                          <option value="Interbank">Interbank</option>
                          <option value="Scotiabank">Scotiabank</option>
                          <option value="Banco de la Nación">Banco de la Nación</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1 font-mono">Nombre de Cuenta Titular</label>
                        <input 
                          type="text" 
                          value={transferenciaTitular}
                          onChange={(e) => setTransferenciaTitular(e.target.value)}
                          placeholder="Ej. Inversiones Alimentos Perú S.A."
                          className="w-full text-[12px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                          required={transferenciaActiva}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Número de Cuenta</label>
                        <input 
                          type="text" 
                          value={transferenciaCuenta}
                          onChange={(e) => setTransferenciaCuenta(e.target.value)}
                          placeholder="Ej. 193-9874561-0-14"
                          className="w-full text-[12px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                          required={transferenciaActiva}
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1 font-mono">Código Interbancario CCI (Opcional)</label>
                        <input 
                          type="text" 
                          value={transferenciaCci}
                          onChange={(e) => setTransferenciaCci(e.target.value)}
                          placeholder="Ej. 002-193-009874561014-11"
                          className="w-full text-[12px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* METHOD 3: EFECTIVO / CONTRA ENTREGA */}
              <div className={`p-4 rounded-xl border transition-all ${efectivoActivo ? "border-emerald-200 bg-emerald-50/20" : "border-slate-100 bg-white"}`}>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-700">
                      <DollarSign size={16} />
                    </div>
                    <div>
                      <h4 className="text-[12.5px] font-extrabold text-slate-800">Efectivo contra Entrega (Cash on Delivery)</h4>
                      <p className="text-[10.5px] text-slate-500">Permite al cliente pagar físicamente con billetes o tarjeta en POS al repartidor.</p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setEfectivoActivo(!efectivoActivo)}
                    className={`w-[40px] h-[22px] p-0.5 rounded-full transition-colors relative cursor-pointer outline-none ${
                      efectivoActivo ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`w-[18px] h-[18px] bg-white rounded-full transition-all absolute top-0.5 ${
                        efectivoActivo ? "left-[20px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                {efectivoActivo && (
                  <div className="pt-1.5 border-t border-emerald-100/50 animate-fade-in">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Instrucciones y condiciones de pago</label>
                      <textarea 
                        value={efectivoInstrucciones}
                        onChange={(e) => setEfectivoInstrucciones(e.target.value)}
                        placeholder="Ej. Paga al repartidor al recibir. Por favor, especifica si necesitas cambio para billetes de S/ 100 o si requieres POS físico."
                        className="w-full text-[12px] p-2.5 h-16 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 leading-normal"
                        required={efectivoActivo}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* METHOD 4: AUTOMATED CULQI INTEGRATION */}
              <div className={`p-4 rounded-xl border transition-all ${culqiActivo ? "border-pink-200 bg-pink-50/20" : "border-slate-100 bg-white"}`}>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-pink-600/10 flex items-center justify-center text-pink-700">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <h4 className="text-[12.5px] font-extrabold text-slate-800">Conexión Culqi (Generación de Links de Pago Visa, Mastercard)</h4>
                      <p className="text-[10.5px] text-slate-500">Pasarela online segura. OlivIA genera un Link Culqi instantáneo cuando el cliente aprueba la orden.</p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setCulqiActivo(!culqiActivo)}
                    className={`w-[40px] h-[22px] p-0.5 rounded-full transition-colors relative cursor-pointer outline-none ${
                      culqiActivo ? "bg-pink-600" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`w-[18px] h-[18px] bg-white rounded-full transition-all absolute top-0.5 ${
                        culqiActivo ? "left-[20px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                {culqiActivo && (
                  <div className="space-y-3.5 pt-1.5 border-t border-pink-100/50 animate-fade-in">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1 font-mono">Culqi Private Key (Sandbox / Producción)</label>
                      <input 
                        type="password" 
                        value={culqiApiKey}
                        onChange={(e) => setCulqiApiKey(e.target.value)}
                        placeholder="Ej. sk_test_88741de75e8f49..."
                        className="w-full text-[12px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500 font-mono"
                        required={culqiActivo}
                      />
                      <span className="text-[9.5px] text-slate-400 mt-1 block leading-normal">
                        Las transacciones de link de pago irán abonadas al comercio registrado con esta Token Key.
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* FORM FOOTER ACTION BUTTON */}
            <div className="border-t border-slate-100 pt-5 mt-6 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10.5px]">
                <Info size={14} className="text-slate-400 shrink-0" />
                <span>Cambios se aplican en tiempo real al motor de IA de WhatsApp de tu commerce.</span>
              </div>
              
              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-[11.5px] font-bold text-emerald-600 animate-pulse flex items-center gap-1">
                    <Check size={14} /> ¡Ajustes actualizados con éxito!
                  </span>
                )}
                
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer font-bold select-none text-[12px] px-5 py-2 rounded-xl"
                  disabled={savingPayment}
                >
                  <Save size={14} />
                  {savingPayment ? "Guardando..." : "Guardar Métodos de Pago"}
                </Button>
              </div>
            </div>

          </Card>
        </div>
      </form>

      <hr className="border-slate-200" />

      {/* ── n8n AUTOTRANSLATE WEBHOOK SUMMARY ── */}
      <Card>
        <div className="flex items-center gap-2 mb-3 select-none">
          <Webhook size={16} className="text-purple-700" />
          <span className="text-[13px] font-bold text-slate-800">Orquestador de Automatizaciones (n8n Webhook de Canal)</span>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
          Copia las claves e integra el webhook de n8n con tu instancia celular de WhatsApp de Evolution API para coordinar el registro automático de leads e inicios de flujos conversacionales.
        </p>

        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div>
            <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Endpoints de Recepción</span>
            <div className="font-mono text-[10px] text-purple-900 bg-white p-2.5 rounded-lg border border-slate-100 truncate select-all">
              {window.location.origin}/api/webhooks/n8n
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div>
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Método HTTP</span>
              <div className="font-extrabold text-[11.5px] text-slate-800">POST</div>
            </div>
            <div>
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Cabecera de Seguridad</span>
              <div className="font-mono text-[10.5px] text-slate-600 truncate">
                x-webhook-secret: <span className="text-emerald-700 font-bold">secreto-compartido-12345</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
