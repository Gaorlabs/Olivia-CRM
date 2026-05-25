import fs from "fs";
import path from "path";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// ── TYPES FOR THE DATABASE SCHEMA ──

export interface Negocio {
  id: string;
  nombre: string;
  whatsapp_instancia: string;
  whatsapp_numero: string | null;
  zona_reparto: string | null;
  activo: boolean;
  created_at: string;

  // Custom Payment Methods per Business Option
  pago_yape_activo?: boolean;
  pago_yape_numero?: string;
  pago_yape_titular?: string;
  pago_yape_qr?: string;
  
  pago_transferencia_activa?: boolean;
  pago_transferencia_banco?: string;
  pago_transferencia_cuenta?: string;
  pago_transferencia_cci?: string;
  pago_transferencia_titular?: string;
  
  pago_efectivo_activo?: boolean;
  pago_efectivo_instrucciones?: string;
  
  pago_culqi_activo?: boolean;
  pago_culqi_api_key?: string;
}

export interface Promocion {
  id: string;
  negocio_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  igv_incluido: boolean;
  vigencia_fin: string | null; // CSS ISO
  condiciones: string | null;
  activa: boolean;
  prompt_generado: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  negocio_id: string;
  telefono: string; // E.164 format e.g. +51987654321
  nombre: string | null;
  canal_origen: string; // 'whatsapp' | 'facebook' | 'instagram' | 'tiktok' | 'directo'
  red_social: string | null;
  created_at: string;
}

export type EstadoConversacion = 'iniciada' | 'consultando' | 'tomando_pedido' | 'esperando_pago' | 'completada' | 'abandonada';

export interface Conversacion {
  id: string;
  lead_id: string;
  promocion_id: string | null;
  estado: EstadoConversacion;
  created_at: string;
  updated_at: string;
}

export interface Mensaje {
  id: string;
  conversacion_id: string;
  rol: "bot" | "cliente";
  contenido: string;
  created_at: string;
}

export type TipoEntrega = 'delivery' | 'recojo';
export type EstadoPedido = 'pendiente' | 'link_enviado' | 'pagado' | 'en_preparacion' | 'en_camino' | 'entregado' | 'cancelado';

export interface Pedido {
  id: string;
  lead_id: string;
  conversacion_id: string;
  promocion_id: string | null;
  direccion_entrega: string | null;
  tipo_entrega: TipoEntrega;
  cantidad: number;
  subtotal: number;
  igv: number;
  total: number;
  estado: EstadoPedido;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export type EstadoPago = 'pendiente' | 'pagado' | 'fallido' | 'reembolsado';

export interface Pago {
  id: string;
  pedido_id: string;
  monto: number;
  pasarela: string; // 'culqi' | 'yape'
  estado: EstadoPago;
  link_pago: string | null;
  referencia_externa: string | null;
  pagado_at: string | null;
  created_at: string;
}

export interface Usuario {
  id: string;
  username: string;
  nombre: string;
  password_hash: string;
  rol: "super_admin" | "superadmin" | "cliente";
  negocio_id: string | null;
  created_at: string;
}

export interface WebhookConfig {
  n8n_webhook_url: string;
  n8n_secret: string;
}

export interface CobroDistribuidor {
  id: string;
  negocio_id: string;
  plan_nombre: string;
  monto: number;
  estado: "cobrado" | "pendiente" | "vencido";
  fecha_pago: string;
}

export interface DatabaseState {
  negocios: Negocio[];
  usuarios: Usuario[];
  promociones: Promocion[];
  leads: Lead[];
  conversaciones: Conversacion[];
  mensajes: Mensaje[];
  pedidos: Pedido[];
  pagos: Pago[];
  botConfig: {
    humano_backup: boolean;
    bot_activo: boolean;
    whatsapp_conectado: boolean;
    webhook: WebhookConfig;
  };
  cobros_distribuidor?: CobroDistribuidor[];
}

// ── FILE DATABASE CONFIGURATION ──
const DB_FILE = path.join(process.cwd(), "data", "db.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// ── DEFAULT INITIAL DATA ──
const DEFAULT_NEGOCIO_ID = "negocio-pe-1234";

const defaultState: DatabaseState = {
  negocios: [
    {
      id: "negocio-olivia-hq",
      nombre: "OlivIA CRM Solutions",
      whatsapp_instancia: "olivia-crm-instance",
      whatsapp_numero: "+51 900 111 222",
      zona_reparto: "Licencias SaaS y Bots de WhatsApp",
      activo: true,
      created_at: new Date().toISOString(),
      pago_culqi_activo: true,
      pago_transferencia_activa: true,
      pago_transferencia_banco: "BCP",
      pago_transferencia_cuenta: "193-9876543-0-12",
      pago_transferencia_cci: "002-193-009876543012-14",
      pago_transferencia_titular: "OlivIA CRM Solutions S.A.C."
    },
    {
      id: "negocio-pe-1234",
      nombre: "Pollo Broaster OlivIA",
      whatsapp_instancia: "instancia-olivia-wa",
      whatsapp_numero: "+51 987 654 321",
      zona_reparto: "San Isidro, Miraflores, Surco",
      activo: true,
      created_at: new Date().toISOString(),
      pago_yape_activo: true,
      pago_yape_numero: "+51 987 654 321",
      pago_yape_titular: "Carlos Pollero",
      pago_efectivo_activo: true,
      pago_efectivo_instrucciones: "Paga al repartidor al recibir tu pedido (Efectivo o con POS)."
    },
    {
      id: "negocio-dent-555",
      nombre: "Consultorio Dental DentalGlow",
      whatsapp_instancia: "dentalglow-instance-wa",
      whatsapp_numero: "+51 911 222 333",
      zona_reparto: "San Borja, Jesús María, Lince",
      activo: true,
      created_at: new Date().toISOString(),
      pago_transferencia_activa: true,
      pago_transferencia_banco: "BBVA",
      pago_transferencia_cuenta: "0011-0123-0200456789",
      pago_transferencia_cci: "011-123-000200456789-10",
      pago_transferencia_titular: "Clínica DentalGlow S.A.C.",
      pago_yape_activo: true,
      pago_yape_numero: "+51 911 222 333",
      pago_yape_titular: "Dra. Ana López (DentalGlow)"
    },
    {
      id: "negocio-prod-777",
      nombre: "Biomarket Hojas Verdes",
      whatsapp_instancia: "hojasverdes-instance-wa",
      whatsapp_numero: "+51 944 555 666",
      zona_reparto: "Chorrillos, Barranco, Surco",
      activo: true,
      created_at: new Date().toISOString(),
      pago_culqi_activo: true,
      pago_yape_activo: true,
      pago_yape_numero: "+51 944 555 666",
      pago_yape_titular: "Hojas Verdes Biomarket",
      pago_transferencia_activa: true,
      pago_transferencia_banco: "Interbank",
      pago_transferencia_cuenta: "200-300456789",
      pago_transferencia_titular: "Hojas Verdes E.I.R.L."
    }
  ],
  usuarios: [
    {
      id: "user-1",
      username: "admin",
      nombre: "Administrador General (Tú)",
      password_hash: "oliviaadmin",
      rol: "super_admin",
      negocio_id: null,
      created_at: new Date().toISOString()
    },
    {
      id: "user-2",
      username: "broaster",
      nombre: "Gerente Broastería Pollo",
      password_hash: "broaster123",
      rol: "cliente",
      negocio_id: "negocio-pe-1234",
      created_at: new Date().toISOString()
    },
    {
      id: "user-3",
      username: "pedrodental",
      nombre: "Dra. Katherine Silva (DentalGlow)",
      password_hash: "dental123",
      rol: "cliente",
      negocio_id: "negocio-dent-555",
      created_at: new Date().toISOString()
    },
    {
      id: "user-4",
      username: "marcosnatural",
      nombre: "Juan Pérez (Biomarket)",
      password_hash: "natural123",
      rol: "cliente",
      negocio_id: "negocio-prod-777",
      created_at: new Date().toISOString()
    }
  ],
  promociones: [
    {
      id: "promo-1",
      negocio_id: "negocio-pe-1234",
      nombre: "Combo Broaster Familiar 🍗",
      descripcion: "1 pollo entero broaster + papas fritas familiares + bebestible 1.5L",
      precio: 49.90,
      igv_incluido: true,
      vigencia_fin: "2026-06-30",
      condiciones: "Válido para San Isidro y Miraflores. Costo de envío S/ 5.",
      activa: true,
      prompt_generado: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "promo-2",
      negocio_id: "negocio-pe-1234",
      nombre: "Dúo Broaster Crujiente 🍔",
      descripcion: "2 hamburguesas de pollo broaster + papas medianas + gaseosa 500ml",
      precio: 24.90,
      igv_incluido: true,
      vigencia_fin: "2026-06-15",
      condiciones: "Disponible en salón o delivery. Recorte de zona aplica.",
      activa: false,
      prompt_generado: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "promo-dent-1",
      negocio_id: "negocio-dent-555",
      nombre: "Tratamiento de Brackets Completo 🦷",
      descripcion: "Instalación completa de brackets metálicos, radiografía panorámica de diagnóstico gratis y primera cita de control.",
      precio: 1200.00,
      igv_incluido: true,
      vigencia_fin: "2026-07-31",
      condiciones: "Sujeto a evaluación odontológica previa libre de costo.",
      activa: true,
      prompt_generado: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "promo-dent-2",
      negocio_id: "negocio-dent-555",
      nombre: "Profilaxis Dental Avanzada ✨",
      descripcion: "Destartraje ultrasónico, profilaxis con pasta abrasiva y fluorización en gel.",
      precio: 89.00,
      igv_incluido: true,
      vigencia_fin: "2026-06-30",
      condiciones: "Cita previa requerida en Sede Principal San Borja.",
      activa: true,
      prompt_generado: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "promo-prod-1",
      negocio_id: "negocio-prod-777",
      nombre: "Pack Matcha Premium Orgánico 🍵",
      descripcion: "Matcha japonés orgánico ceremonial de 100g de alta pureza + batidor de bambú tradicional.",
      precio: 35.00,
      igv_incluido: true,
      vigencia_fin: "2026-06-30",
      condiciones: "Envío a domicilio gratuito en Barranco y Miraflores.",
      activa: true,
      prompt_generado: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "promo-prod-2",
      negocio_id: "negocio-prod-777",
      nombre: "Suero Anti-Edad Colágeno & Argán 🌿",
      descripcion: "Suero facial reparador botánico concentrado de 50ml enriquecido con aceites puros.",
      precio: 59.95,
      igv_incluido: true,
      vigencia_fin: "2026-06-20",
      condiciones: "Para todo tipo de pieles sensibles.",
      activa: false,
      prompt_generado: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  leads: [
    {
      id: "lead-1",
      negocio_id: "negocio-pe-1234",
      telefono: "+51987654321",
      nombre: "María Ríos",
      canal_origen: "whatsapp",
      red_social: "facebook",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "lead-2",
      negocio_id: "negocio-pe-1234",
      telefono: "+51912345678",
      nombre: "Juan Carlos P.",
      canal_origen: "whatsapp",
      red_social: "instagram",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: "lead-dent-1",
      negocio_id: "negocio-dent-555",
      telefono: "+51944555666",
      nombre: "Lucía Fernández",
      canal_origen: "whatsapp",
      red_social: "facebook",
      created_at: new Date(Date.now() - 3600000 * 1).toISOString()
    },
    {
      id: "lead-dent-2",
      negocio_id: "negocio-dent-555",
      telefono: "+51955666777",
      nombre: "Carlos Mendívil",
      canal_origen: "whatsapp",
      red_social: "instagram",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: "lead-prod-1",
      negocio_id: "negocio-prod-777",
      telefono: "+51977888999",
      nombre: "Gaby Flores",
      canal_origen: "whatsapp",
      red_social: "instagram",
      created_at: new Date(Date.now() - 3600000 * 3).toISOString()
    }
  ],
  conversaciones: [
    {
      id: "conv-1",
      lead_id: "lead-1",
      promocion_id: "promo-1",
      estado: "consultando",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "conv-2",
      lead_id: "lead-2",
      promocion_id: "promo-1",
      estado: "completada",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: "conv-dent-1",
      lead_id: "lead-dent-1",
      promocion_id: "promo-dent-1",
      estado: "tomando_pedido",
      created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "conv-dent-2",
      lead_id: "lead-dent-2",
      promocion_id: "promo-dent-2",
      estado: "completada",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: "conv-prod-1",
      lead_id: "lead-prod-1",
      promocion_id: "promo-prod-1",
      estado: "consultando",
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  mensajes: [
    {
      id: "msg-1-1",
      conversacion_id: "conv-1",
      rol: "cliente",
      contenido: "Hola, ¿de qué se trata el Combo Familiar?",
      created_at: new Date(Date.now() - 3600000 * 1.9).toISOString()
    },
    {
      id: "msg-1-2",
      conversacion_id: "conv-1",
      rol: "bot",
      contenido: "¡Hola María! 😊 El Combo Broaster Familiar 🍗 incluye un riquísimo pollo entero broaster crocante, porción familiar de papas fritas y un bebestible de 1.5L. Todo por S/ 49.90 (IGV incluido). Hacemos Delivery en San Isidro, Miraflores y Surco. ¿Deseas ordenar uno para hoy?",
      created_at: new Date(Date.now() - 3600000 * 1.8).toISOString()
    },
    {
      id: "msg-dent-1",
      conversacion_id: "conv-dent-1",
      rol: "cliente",
      contenido: "Hola, me interesa saber los costos de la cuota del tratamiento de brackets",
      created_at: new Date(Date.now() - 3600000 * 0.9).toISOString()
    },
    {
      id: "msg-dent-2",
      conversacion_id: "conv-dent-1",
      rol: "bot",
      contenido: "¡Hola Lucía! Qué gusto saludarte 🦷. Nuestra promoción vigente de 'Tratamiento de Brackets Completo' es de S/ 1200.00. Contempla la instalación completa de brackets metálicos, radiografía panorámica de diagnóstico gratis y primera cita de control. Para los siguientes controles mensuales, la cuota es súper cómoda (S/ 120 al mes). ¿Te gustaría agendar tu cita de evaluación gratuita?",
      created_at: new Date(Date.now() - 3600000 * 0.8).toISOString()
    },
    {
      id: "msg-prod-1",
      conversacion_id: "conv-prod-1",
      rol: "cliente",
      contenido: "Buenas tardes, ¿tienen stock de Matcha Ceremonial con el batidor?",
      created_at: new Date(Date.now() - 3600000 * 2.9).toISOString()
    },
    {
      id: "msg-prod-2",
      conversacion_id: "conv-prod-1",
      rol: "bot",
      contenido: "¡Buenas tardes Gaby! 🍵 Sí, tenemos stock del espectacular Pack Matcha Premium Orgánico por S/ 35.00 con el batidor de bambú tradicional incluido. Es 100% orgánico ceremonial importado. ¿Te gustaría coordinar el delivery o prefieres recogerlo?",
      created_at: new Date(Date.now() - 3600000 * 2.8).toISOString()
    }
  ],
  pedidos: [
    {
      id: "ped-1",
      lead_id: "lead-1",
      conversacion_id: "conv-1",
      promocion_id: "promo-1",
      direccion_entrega: "Calle Antero Aspillaga 240, Dpto 502, San Isidro",
      tipo_entrega: "delivery",
      cantidad: 1,
      subtotal: 42.29,
      igv: 7.61,
      total: 49.90,
      estado: "pendiente",
      notas: "Traer vuelto de S/ 100",
      created_at: new Date(Date.now() - 1500000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "ped-2",
      lead_id: "lead-2",
      conversacion_id: "conv-2",
      promocion_id: "promo-1",
      direccion_entrega: "Av Larco 542, Miraflores",
      tipo_entrega: "delivery",
      cantidad: 1,
      subtotal: 42.29,
      igv: 7.61,
      total: 49.90,
      estado: "pagado",
      notas: "Pago confirmado mediante webhook",
      created_at: new Date(Date.now() - 3600000 * 4.5).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "ped-dent-2",
      lead_id: "lead-dent-2",
      conversacion_id: "conv-dent-2",
      promocion_id: "promo-dent-2",
      direccion_entrega: "Consultorio Sede principal San Borja",
      tipo_entrega: "recojo",
      cantidad: 1,
      subtotal: 75.42,
      igv: 13.58,
      total: 89.00,
      estado: "pagado",
      notas: "Cita pagada por adelantado por el cliente",
      created_at: new Date(Date.now() - 3600000 * 3.5).toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  pagos: [
    {
      id: "pago-1",
      pedido_id: "ped-2",
      monto: 49.90,
      pasarela: "culqi",
      estado: "pagado",
      link_pago: "https://pago.culqi.com/pay/q_olivia_9872",
      referencia_externa: "chr_live_9872138",
      pagado_at: new Date(Date.now() - 3600000 * 4.4).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 4.5).toISOString()
    },
    {
      id: "pago-dent-2",
      pedido_id: "ped-dent-2",
      monto: 89.00,
      pasarela: "culqi",
      estado: "pagado",
      link_pago: "https://pago.culqi.com/pay/q_olivia_7721",
      referencia_externa: "chr_live_441092",
      pagado_at: new Date(Date.now() - 3600000 * 3.4).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 3.5).toISOString()
    }
  ],
  botConfig: {
    humano_backup: true,
    bot_activo: true,
    whatsapp_conectado: true,
    webhook: {
      n8n_webhook_url: "https://n8n.tuservidor.com/webhook/olivia-wa",
      n8n_secret: "secreto-compartido-12345"
    }
  },
  cobros_distribuidor: [
    {
      id: "cobro-1",
      negocio_id: "negocio-pe-1234",
      plan_nombre: "Plan Standard OlivIA CRM - Mensual",
      monto: 150.00,
      estado: "cobrado",
      fecha_pago: "2026-05-18T10:30:00.000Z"
    },
    {
      id: "cobro-2",
      negocio_id: "negocio-dent-555",
      plan_nombre: "Plan Premium OlivIA CRM + Evolution API - Mensual",
      monto: 250.00,
      estado: "cobrado",
      fecha_pago: "2026-05-20T14:45:00.000Z"
    },
    {
      id: "cobro-3",
      negocio_id: "negocio-prod-777",
      plan_nombre: "Plan Básico OlivIA - Mensual",
      monto: 120.00,
      estado: "pendiente",
      fecha_pago: "2026-06-01T00:00:00.000Z"
    }
  ]
};

// ── BUILD SYSTEM PROMPT FOR BOT ──

export function buildPrompt(promosList: Promocion[], negocio?: Negocio): string {
  const activeOnly = promosList.filter(p => p.activa);
  const promosText = activeOnly.length > 0 
    ? activeOnly.map((p, idx) => {
        return `### OPCIÓN DE PROMOCIÓN ${idx + 1}: ${p.nombre}
Nombre: ${p.nombre}
Descripción: ${p.descripcion || "Sin descripción"}
Precio: S/ ${p.precio.toFixed(2)} (${p.igv_incluido ? "IGV incluido" : "más IGV"})
Vigencia: ${p.vigencia_fin ? `Hasta el ${p.vigencia_fin}` : "Vigencia indeterminada"}
Condiciones: ${p.condiciones || "Sin condiciones especiales"}`;
      }).join("\n\n")
    : "No hay promociones activas registradas en este momento.";

  const negocioNombre = negocio ? negocio.nombre : "Pollo Broaster OlivIA";

  let metodosPagoTexto = "";
  if (negocio) {
    const list: string[] = [];
    if (negocio.pago_yape_activo) {
      list.push(`- **Yape / Plin (Pago con QR o celular)**: Celular ${negocio.pago_yape_numero || ""} a nombre de ${negocio.pago_yape_titular || "el titular"}.`);
    }
    if (negocio.pago_transferencia_activa) {
      list.push(`- **Transferencia Bancaria**: Banco ${negocio.pago_transferencia_banco || ""}, Cuenta: ${negocio.pago_transferencia_cuenta || ""}${negocio.pago_transferencia_cci ? `, CCI: ${negocio.pago_transferencia_cci}` : ""}, Titular: ${negocio.pago_transferencia_titular || ""}.`);
    }
    if (negocio.pago_efectivo_activo) {
      list.push(`- **Efectivo / Contra entrega**: ${negocio.pago_efectivo_instrucciones || "Paga al recibir el pedido."}`);
    }
    if (negocio.pago_culqi_activo) {
      list.push(`- **Culqi / Tarjetas de Crédito**: Ofrecer enviar un link de pago digital seguro.`);
    }

    if (list.length > 0) {
      metodosPagoTexto = `\n\n### MÉTODOS DE PAGO DISPONIBLES EN NUESTRA TIENDA:\n${list.join("\n")}\n*(Importante: Cuando el cliente pregunte cómo pagar o confirme su pedido, explícale claramente cuáles de estos métodos de pago específicos de nuestro negocio están habilitados y proporciónale los datos arriba listados.)*`;
    } else {
      metodosPagoTexto = `\n\n### MÉTODOS DE PAGO DISPONIBLES EN NUESTRA TIENDA:\n- Efectivo o transferencia bancaria coordinando con el asesor humano.`;
    }
  } else {
    metodosPagoTexto = `\n\n### MÉTODOS DE PAGO DISPONIBLES:\n- Yape/Móvil o Efectivo contra entrega por defecto.`;
  }

  return `## PROMOCIONES ACTIVAS DISPONIBLES EN EL NEGOCIO:
${promosText}

## INSTRUCCIONES DEL BOT (Vendedor Automatizado)
Eres "OlivIA", el asistente inteligente de ventas de ${negocioNombre}. Tu objetivo primordial es tomar pedidos de forma rápida, eficiente y amable.${metodosPagoTexto}

### REGLAS DE COMPORTAMIENTO:
1. Sé cálido, usa emojis amigables, sé breve y habla en español peruano natural, pero profesional.
2. Si el cliente pregunta por alguna de nuestras promociones vigentes, preséntale la información de manera limpia con viñetas.
3. Ofrece tomar el pedido al final de cada respuesta informativa.
4. Para realizar una venta y armar un pedido, debes recopilar de manera obligada los siguientes 3 datos:
   - Nombre completo del cliente.
   - Tipo de entrega: si desea que se lo enviemos a domicilio ("delivery") o prefiere recogerlo ("recojo").
   - Dirección de entrega exacta (si eligió delivery).
5. No asumas datos; si falta alguno, solicítalo con amabilidad.
6. **MUY IMPORTANTE**: En el momento en que tengas TODO lo necesario (Nombre del cliente, Tipo de entrega y Dirección de entrega si aplica), debes confirmar el total (sumando la promoción elegida) y responder al cliente preguntándole cómo prefiere pagar, e INCLUIR al final de tu mensaje el siguiente identificador con la estructura exacta de cierre:
   [CONFIRM_ORDER: PromoId: <PromoId_elegida>, Cantidad: 1, Tipo: <delivery_o_recojo>, Direccion: <direccion_especificada>, Nombre: <nombre_cliente>]
   
   Ejem de etiqueta de cierre:
   [CONFIRM_ORDER: PromoId: promo-1, Cantidad: 1, Tipo: delivery, Direccion: Calle Antero Aspillaga 240, Nombre: Maria Diaz]
  `;
}
   
  export class FileDB {
  private data: DatabaseState;

  constructor() {
    this.data = this.load();
    this.ensureAdminNegocio();
    this.updatePrompts();
  }

  private ensureAdminNegocio() {
    const adminNegId = "negocio-olivia-hq";
    
    // Ensure business exists
    const hasAdmin = this.data.negocios.some(n => n.id === adminNegId);
    if (!hasAdmin) {
      this.data.negocios.unshift({
        id: adminNegId,
        nombre: "OlivIA CRM Solutions",
        whatsapp_instancia: "olivia-crm-instance",
        whatsapp_numero: "+51 900 111 222",
        zona_reparto: "Licencias SaaS y Bots de WhatsApp",
        activo: true,
        created_at: new Date().toISOString()
      });
    }

    // Ensure default promotions (SaaS Plans) exist for admin
    const hasAdminPromos = this.data.promociones.some(p => p.negocio_id === adminNegId);
    if (!hasAdminPromos) {
      this.data.promociones.push(
        {
          id: "promo-olivia-1",
          negocio_id: adminNegId,
          nombre: "Licencia OlivIA Mensual - Plan Básico Lite ⚡",
          descripcion: "Asistente de IA (Gemini Lite) + Integración con Evolution WhatsApp + CRM unificado para control de Leads.",
          precio: 99.00,
          igv_incluido: true,
          vigencia_fin: "2027-12-31",
          condiciones: "Suscripción recurrente mensual con débito automático Culqi.",
          activa: true,
          prompt_generado: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "promo-olivia-2",
          negocio_id: adminNegId,
          nombre: "Licencia OlivIA Gold - Plan Enterprise 💎",
          descripcion: "Asistente AI Pro (Gemini Flash) + Recepción de Pedidos con lógica de Carrito + Agendamiento de Citas + Campañas Promocionales de Fidelización Masiva.",
          precio: 199.00,
          igv_incluido: true,
          vigencia_fin: "2027-12-31",
          condiciones: "Incluye soporte prioritario 24/7 y servidores redundantes.",
          activa: true,
          prompt_generado: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
    }

    // Ensure default leads exist for admin
    const hasAdminLeads = this.data.leads.some(l => l.negocio_id === adminNegId);
    if (!hasAdminLeads) {
      this.data.leads.push(
        {
          id: "lead-olivia-1",
          negocio_id: adminNegId,
          telefono: "+51933333333",
          nombre: "Lic. Felipe Delgado (Clínica Oftalmo)",
          canal_origen: "whatsapp",
          red_social: "facebook",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "lead-olivia-2",
          negocio_id: adminNegId,
          telefono: "+51944444444",
          nombre: "Sra. Roxana Toledo (Cafetería Aromas)",
          canal_origen: "whatsapp",
          red_social: "instagram",
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      );
    }

    // Ensure default conversations & messages exist for admin
    const hasAdminConvs = this.data.conversaciones.some(c => c.id === "conv-olivia-1");
    if (!hasAdminConvs) {
      this.data.conversaciones.push(
        {
          id: "conv-olivia-1",
          lead_id: "lead-olivia-1",
          promocion_id: null,
          estado: "consultando",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "conv-olivia-2",
          lead_id: "lead-olivia-2",
          promocion_id: null,
          estado: "iniciada",
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      );
      this.data.mensajes.push(
        {
          id: "msg-ol-1",
          conversacion_id: "conv-olivia-1",
          rol: "cliente",
          contenido: "Hola, me gustaría automatizar mi clínica oftalmológica para que los pacientes reserven su cita por WhatsApp usando OlivIA. ¿Qué planes tienen?",
          created_at: new Date(Date.now() - 3600000 * 1.9).toISOString()
        },
        {
          id: "msg-ol-2",
          conversacion_id: "conv-olivia-1",
          rol: "bot",
          contenido: "¡Hola, Felipe! Un placer atenderte de parte de OlivIA CRM Solutions. Excelentes noticias, contamos con el Plan Enterprise que incluye Agendamiento de Citas Automatizado con sincronización de agenda. El precio es S/ 199.00 al mes.",
          created_at: new Date(Date.now() - 3600000 * 1.8).toISOString()
        },
        {
          id: "msg-ol-3",
          conversacion_id: "conv-olivia-2",
          rol: "cliente",
          contenido: "Hola, tengo una cafetería y quiero automatizar la toma de pedidos a domicilio. ¿Pueden ayudarme?",
          created_at: new Date(Date.now() - 3600000 * 4.9).toISOString()
        }
      );
    }

    this.save();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        // Ensure nesting is complete
        return {
          ...defaultState,
          ...parsed,
          botConfig: { ...defaultState.botConfig, ...parsed.botConfig },
          negocios: parsed.negocios || defaultState.negocios,
          usuarios: parsed.usuarios || defaultState.usuarios,
          promociones: parsed.promociones || defaultState.promociones,
          leads: parsed.leads || defaultState.leads,
          conversaciones: parsed.conversaciones || defaultState.conversaciones,
          mensajes: parsed.mensajes || defaultState.mensajes,
          pedidos: parsed.pedidos || defaultState.pedidos,
          pagos: parsed.pagos || defaultState.pagos,
          cobros_distribuidor: parsed.cobros_distribuidor || defaultState.cobros_distribuidor
        };
      }
    } catch (e) {
      console.error("Error reading db.json, falling back to defaultState", e);
    }
    return defaultState;
  }

  private save() {
    try {
      ensureDirectoryExistence(DB_FILE);
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing to db.json", e);
    }
  }

  public getRawData(): DatabaseState {
    return this.data;
  }

  // ── UPDATE AUTOGENERATED PROMPTS ──
  public updatePrompts() {
    this.data.promociones.forEach(p => {
      p.prompt_generado = buildPrompt([p]);
    });
    this.save();
  }

  // ── BUSINESS ──
  public getNegocio(id?: string): Negocio {
    if (id) {
      const found = this.data.negocios.find(n => n.id === id);
      if (found) return found;
    }
    return this.data.negocios[0];
  }

  public updateNegocio(id: string, fields: Partial<Negocio>): Negocio | null {
    const n = this.getNegocio(id);
    if (!n) return null;
    Object.assign(n, fields);
    this.save();
    return n;
  }

  // ── PROMOTIONS ──
  public getPromociones(negocioId?: string): Promocion[] {
    if (negocioId) {
      return this.data.promociones.filter(p => p.negocio_id === negocioId);
    }
    return this.data.promociones;
  }

  public createPromocion(p: Omit<Promocion, "id" | "created_at" | "updated_at" | "prompt_generado">): Promocion {
    const newPromo: Promocion = {
      ...p,
      id: "promo-" + Date.now().toString(),
      prompt_generado: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.promociones.push(newPromo);
    this.updatePrompts();
    return newPromo;
  }

  public updatePromocion(id: string, fields: Partial<Promocion>): Promocion | null {
    const idx = this.data.promociones.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const oldPromo = this.data.promociones[idx];

    const updated = {
      ...oldPromo,
      ...fields,
      updated_at: new Date().toISOString()
    };
    this.data.promociones[idx] = updated;
    this.updatePrompts();
    return updated;
  }

  public deletePromocion(id: string): boolean {
    const len = this.data.promociones.length;
    this.data.promociones = this.data.promociones.filter(p => p.id !== id);
    if (this.data.promociones.length < len) {
      this.updatePrompts();
      return true;
    }
    return false;
  }

  // ── LEADS ──
  public getLeads(negocioId?: string): Lead[] {
    if (negocioId) {
      return this.data.leads.filter(l => l.negocio_id === negocioId);
    }
    return this.data.leads;
  }

  public resolveLead(phone: string, optionalName?: string, socialNetwork?: string, negocioId?: string): Lead {
    const cleanPhone = phone.trim();
    const nId = negocioId || DEFAULT_NEGOCIO_ID;
    let lead = this.data.leads.find(l => l.telefono === cleanPhone && l.negocio_id === nId);
    if (!lead) {
      lead = {
        id: "lead-" + Date.now().toString(),
        negocio_id: nId,
        telefono: cleanPhone,
        nombre: optionalName || `Cliente ${cleanPhone.slice(-4)}`,
        canal_origen: "whatsapp",
        red_social: socialNetwork || "directo",
        created_at: new Date().toISOString()
      };
      this.data.leads.unshift(lead);
      this.save();
    } else if (optionalName && (lead.nombre.startsWith("Cliente ") || lead.nombre === "María Ríos")) {
      lead.nombre = optionalName;
      this.save();
    }
    return lead;
  }

  // ── CONVERSATIONS ──
  public getConversaciones(negocioId?: string): (Conversacion & { lead: Lead; ultimoMensaje: Mensaje | null })[] {
    const mapped = this.data.conversaciones.map(c => {
      const lead = this.data.leads.find(l => l.id === c.lead_id) || {
        id: c.lead_id,
        negocio_id: DEFAULT_NEGOCIO_ID,
        telefono: "",
        nombre: "Desconocido",
        canal_origen: "whatsapp",
        red_social: "directo",
        created_at: ""
      };
      const cMsgs = this.data.mensajes.filter(m => m.conversacion_id === c.id);
      cMsgs.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const lastMsg = cMsgs.length > 0 ? cMsgs[cMsgs.length - 1] : null;

      return {
        ...c,
        lead,
        ultimoMensaje: lastMsg
      };
    });

    if (negocioId) {
      return mapped.filter(item => item.lead.negocio_id === negocioId);
    }
    return mapped;
  }

  public getOrCreateConversacion(leadId: string): Conversacion {
    let conv = this.data.conversaciones.find(c => c.lead_id === leadId);
    if (!conv) {
      const lead = this.data.leads.find(l => l.id === leadId);
      const nId = lead ? lead.negocio_id : DEFAULT_NEGOCIO_ID;
      const activeP = this.data.promociones.find(p => p.activa && p.negocio_id === nId);
      conv = {
        id: "conv-" + Date.now().toString(),
        lead_id: leadId,
        promocion_id: activeP ? activeP.id : null,
        estado: "iniciada",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.data.conversaciones.unshift(conv);
      this.save();
    }
    return conv;
  }

  public updateConversacionEstado(id: string, estado: EstadoConversacion) {
    const conv = this.data.conversaciones.find(c => c.id === id);
    if (conv) {
      conv.estado = estado;
      conv.updated_at = new Date().toISOString();
      this.save();
    }
  }

  // ── MESSAGES ──
  public getMensajes(convId: string): Mensaje[] {
    const msgs = this.data.mensajes.filter(m => m.conversacion_id === convId);
    msgs.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return msgs;
  }

  public addMensaje(convId: string, rol: "bot" | "cliente", contenido: string): Mensaje {
    const msg: Mensaje = {
      id: "msg-" + Date.now().toString() + "-" + Math.floor(Math.random() * 1000),
      conversacion_id: convId,
      rol,
      contenido,
      created_at: new Date().toISOString()
    };
    this.data.mensajes.push(msg);

    const conv = this.data.conversaciones.find(c => c.id === convId);
    if (conv) {
      conv.updated_at = new Date().toISOString();
    }

    this.save();
    return msg;
  }

  // ── ORDERS ──
  public getPedidos(negocioId?: string): (Pedido & { lead: Lead; promocion: Promocion | null })[] {
    const mapped = this.data.pedidos.map(p => {
      const lead = this.data.leads.find(l => l.id === p.lead_id) || {
        id: p.lead_id,
        negocio_id: DEFAULT_NEGOCIO_ID,
        telefono: "",
        nombre: "Desconocido",
        canal_origen: "whatsapp",
        red_social: "directo",
        created_at: ""
      };
      const promocion = this.data.promociones.find(pr => pr.id === p.promocion_id) || null;
      return {
        ...p,
        lead,
        promocion
      };
    });

    if (negocioId) {
      return mapped.filter(item => item.lead.negocio_id === negocioId);
    }
    return mapped;
  }

  public createPedido(p: Omit<Pedido, "id" | "subtotal" | "igv" | "created_at" | "updated_at">): Pedido {
    const subtotal = Number((p.total / 1.18).toFixed(2));
    const igv = Number((p.total - subtotal).toFixed(2));
    const newPedido: Pedido = {
      ...p,
      id: "ped-" + Date.now().toString(),
      subtotal,
      igv,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.pedidos.unshift(newPedido);
    this.save();
    return newPedido;
  }

  public updatePedidoEstado(id: string, estado: EstadoPedido): Pedido | null {
    const p = this.data.pedidos.find(ped => ped.id === id);
    if (!p) return null;
    p.estado = estado;
    p.updated_at = new Date().toISOString();

    if (estado === "pagado") {
      let pago = this.data.pagos.find(pay => pay.pedido_id === id);
      if (!pago) {
        pago = {
          id: "pago-" + Date.now().toString(),
          pedido_id: id,
          monto: p.total,
          pasarela: "culqi",
          estado: "pagado",
          link_pago: `https://pago.culqi.com/pay/q_olivia_${id.slice(-4)}`,
          referencia_externa: `chr_webhook_${Date.now().toString().slice(-6)}`,
          pagado_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        this.data.pagos.push(pago);
      } else {
        pago.estado = "pagado";
        pago.pagado_at = new Date().toISOString();
      }
    }
    this.save();
    return p;
  }

  // ── PAYMENTS ──
  public getPagos(negocioId?: string): Pago[] {
    if (!negocioId) return this.data.pagos;
    // Map payments to their negocio matching lead
    const validPedidoIds = this.getPedidos(negocioId).map(p => p.id);
    return this.data.pagos.filter(p => validPedidoIds.includes(p.pedido_id));
  }

  public updatePagoEstadoByRef(ref: string, estado: EstadoPago): Pago | null {
    let p = this.data.pagos.find(pay => pay.referencia_externa === ref);
    if (!p) {
      // Fallback for live simulation strings like "chr_live_<order_id_suffix>"
      if (ref.startsWith("chr_live_")) {
        const orderSuffix = ref.replace("chr_live_", "");
        const matchedPedido = this.data.pedidos.find(ped => ped.id.endsWith(orderSuffix));
        if (matchedPedido) {
          p = this.data.pagos.find(pay => pay.pedido_id === matchedPedido.id);
        }
      }
    }
    if (!p) return null;
    p.estado = estado;
    p.pagado_at = estado === "pagado" ? new Date().toISOString() : null;

    if (estado === "pagado") {
      const pedido = this.data.pedidos.find(ped => ped.id === p.pedido_id);
      if (pedido) {
        pedido.estado = "pagado";
        pedido.updated_at = new Date().toISOString();
      }
    }
    this.save();
    return p;
  }

  // ── MULTI-TENANT CONFIGS ──
  public getBotConfig() {
    return this.data.botConfig;
  }

  public updateBotConfig(fields: Partial<DatabaseState["botConfig"]>) {
    this.data.botConfig = {
      ...this.data.botConfig,
      ...fields
    };
    this.save();
    return this.data.botConfig;
  }

  // ── ADMIN AND LOGIN METHODS ──
  public getUsuarios(): Usuario[] {
    return this.data.usuarios || [];
  }

  public createUsuario(u: Omit<Usuario, "id" | "created_at">): Usuario {
    const newUser: Usuario = {
      ...u,
      id: "user-" + Date.now().toString(),
      created_at: new Date().toISOString()
    };
    if (!this.data.usuarios) this.data.usuarios = [];
    this.data.usuarios.push(newUser);
    this.save();
    return newUser;
  }

  public getNegocios(): Negocio[] {
    return this.data.negocios || [];
  }

  public createNegocio(n: Omit<Negocio, "id" | "created_at">): Negocio {
    const newNeg: Negocio = {
      ...n,
      id: "negocio-" + Date.now().toString(),
      created_at: new Date().toISOString()
    };
    this.data.negocios.push(newNeg);
    this.save();
    return newNeg;
  }

  public updateUsuario(id: string, fields: Partial<Usuario> & { password?: string }): Usuario | null {
    const u = this.data.usuarios?.find(x => x.id === id);
    if (!u) return null;
    if (fields.nombre !== undefined) u.nombre = fields.nombre;
    if (fields.username !== undefined) u.username = fields.username;
    if (fields.rol !== undefined) u.rol = fields.rol as any;
    if (fields.negocio_id !== undefined) u.negocio_id = fields.negocio_id;
    if (fields.password !== undefined) u.password_hash = fields.password;
    this.save();
    return u;
  }

  public deleteUsuario(id: string): boolean {
    if (!this.data.usuarios) return false;
    const initialLen = this.data.usuarios.length;
    this.data.usuarios = this.data.usuarios.filter(x => x.id !== id);
    if (this.data.usuarios.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public deleteNegocio(id: string): boolean {
    if (!this.data.negocios) return false;
    const initialLen = this.data.negocios.length;
    this.data.negocios = this.data.negocios.filter(x => x.id !== id);
    if (this.data.negocios.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getCobrosDistribuidor(): CobroDistribuidor[] {
    return this.data.cobros_distribuidor || [];
  }

  public createCobroDistribuidor(c: Omit<CobroDistribuidor, "id" | "fecha_pago">): CobroDistribuidor {
    const newCobro: CobroDistribuidor = {
      ...c,
      id: "cobro-" + Date.now().toString(),
      fecha_pago: new Date().toISOString()
    };
    if (!this.data.cobros_distribuidor) {
      this.data.cobros_distribuidor = [];
    }
    this.data.cobros_distribuidor.push(newCobro);
    this.save();
    return newCobro;
  }

  public updateCobroDistribuidor(id: string, fields: Partial<CobroDistribuidor>): CobroDistribuidor | null {
    const c = this.data.cobros_distribuidor?.find(x => x.id === id);
    if (!c) return null;
    if (fields.plan_nombre !== undefined) c.plan_nombre = fields.plan_nombre;
    if (fields.monto !== undefined) c.monto = fields.monto;
    if (fields.estado !== undefined) c.estado = fields.estado as any;
    if (fields.negocio_id !== undefined) c.negocio_id = fields.negocio_id;
    this.save();
    return c;
  }

  public deleteCobroDistribuidor(id: string): boolean {
    if (!this.data.cobros_distribuidor) return false;
    const initialLen = this.data.cobros_distribuidor.length;
    this.data.cobros_distribuidor = this.data.cobros_distribuidor.filter(x => x.id !== id);
    if (this.data.cobros_distribuidor.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

// Global variable database instance
export const db = new FileDB();

// ── LAZY INIT GEMINI API INTEGRATION & CHAT AUTOMATION ──

let ai_client: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!ai_client) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      ai_client = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
  }
  return ai_client;
}

/**
 * Simulates or runs Gemini AI sales agent against custom text input
 * returns bot message text
 */
export async function triggerBotResponse(conversacionId: string, text: string): Promise<string> {
  const conv = db.getRawData().conversaciones.find(c => c.id === conversacionId);
  if (!conv) return "Error: conversación no encontrada";

  const lead = db.getRawData().leads.find(l => l.id === conv.lead_id);
  const clientName = lead ? lead.nombre || "Cliente" : "Cliente";
  const negocioId = lead ? lead.negocio_id : "negocio-pe-1234";
  const negocio = db.getNegocio(negocioId);
  const negocioPromociones = db.getPromociones(negocioId);

  // Build complete history context for prompt
  const previousMsgs = db.getMensajes(conversacionId);
  // Max last 10 messages for token friendliness
  const relevantHistory = previousMsgs.slice(-10);

  const historyPrompt = relevantHistory.map(m => {
    return `${m.rol === "cliente" ? "Cliente" : "Bot (OlivIA)"}: ${m.contenido}`;
  }).join("\n");

  const systemInstructions = buildPrompt(negocioPromociones, negocio);

  const ai = getAIClient();
  let responseText = "";

  if (ai) {
    try {
      const prompt = `HISTORIAL DE LA CONVERSACIÓN:\n${historyPrompt}\n\nCliente: ${text}\n\nBot (OlivIA):`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstructions,
          temperature: 0.7,
        }
      });
      responseText = response.text || "";
    } catch (e: any) {
      console.error("Gemini invocation failed, falling back to rule-based parser.", e);
      responseText = generateFallbackReply(text, clientName, negocioPromociones);
    }
  } else {
    responseText = generateFallbackReply(text, clientName, negocioPromociones);
  }

  // ── INTEGRATED POST-PROCESSING: PARSE ORDER CONFIRMATION TAGS ──
  // E.g. [CONFIRM_ORDER: PromoId: promo-1, Cantidad: 1, Tipo: delivery, Direccion: Av Larco 123, Nombre: Maria]

  const match = responseText.match(/\[CONFIRM_ORDER:\s*PromoId:\s*([^\s,\]]+),\s*Cantidad:\s*(\d+),\s*Tipo:\s*([^\s,\]]+),\s*Direccion:\s*([^\]]+?)(?:,\s*Nombre:\s*([^\]]+))?\]/);

  if (match) {
    const promoId = match[1].trim();
    const cant = parseInt(match[2].trim()) || 1;
    let tipo = match[3].trim().toLowerCase() as TipoEntrega;
    if (tipo !== "delivery" && tipo !== "recojo") tipo = "delivery";
    let rawAddressAndName = match[4].trim();
    let name = clientName;
    let address = rawAddressAndName;

    // Parse out potential name embedded or trailing
    const nameMatch = rawAddressAndName.match(/Direccion:\s*([^,]+)/);
    if (match[5]) {
      name = match[5].trim();
    }

    const selectedPromo = db.getPromociones().find(p => p.id === promoId) || db.getPromociones()[0];
    const totalCost = selectedPromo ? selectedPromo.precio * cant : 49.90 * cant;

    // Create the order in db
    const order = db.createPedido({
      lead_id: conv.lead_id,
      conversacion_id: conversacionId,
      promocion_id: promoId,
      direccion_entrega: tipo === "delivery" ? address : "Recojo en local",
      tipo_entrega: tipo,
      cantidad: cant,
      total: totalCost,
      estado: "pendiente",
      notas: `Auto-creado por el Bot OlivIA para ${name}`
    });

    // Create payment registry
    const linkPago = `https://pago.culqi.com/pay/q_olivia_${order.id.slice(-4)}`;
    const extRef = `chr_${Date.now().toString().slice(-6)}`;
    
    let pasarela = "manual";
    if (negocio?.pago_culqi_activo) {
      pasarela = "culqi";
    } else if (negocio?.pago_yape_activo) {
      pasarela = "yape";
    } else if (negocio?.pago_transferencia_activa) {
      pasarela = "transferencia";
    } else if (negocio?.pago_efectivo_activo) {
      pasarela = "efectivo";
    }

    db.getRawData().pagos.push({
      id: "pago-" + Date.now().toString(),
      pedido_id: order.id,
      monto: totalCost,
      pasarela: pasarela,
      estado: "pendiente",
      link_pago: negocio?.pago_culqi_activo ? linkPago : null,
      referencia_externa: extRef,
      pagado_at: null,
      created_at: new Date().toISOString()
    });
    db["save"]();

    // Clean up the tag from the final customer visible response
    responseText = responseText.replace(/\[CONFIRM_ORDER:[^\]]+\]/, "");

    // Modify state
    db.updateConversacionEstado(conversacionId, "esperando_pago");

    // Generate dynamic payment directions for business multi-tenancy
    let paymentInstructions = "";
    const list: string[] = [];

    if (negocio) {
      if (negocio.pago_yape_activo) {
        list.push(`📱 *Yape o Plin*: Envía tu depósito al celular *${negocio.pago_yape_numero || ""}* a nombre de *${negocio.pago_yape_titular || ""}*`);
      }
      if (negocio.pago_transferencia_activa) {
        list.push(`🏦 *Transferencia Bancaria*: Banco *${negocio.pago_transferencia_banco || ""}*\n  • Cuenta: *${negocio.pago_transferencia_cuenta || ""}*\n  • CCI: *${negocio.pago_transferencia_cci || "No disponible"}*\n  • Beneficiario: *${negocio.pago_transferencia_titular || ""}*`);
      }
      if (negocio.pago_efectivo_activo) {
        list.push(`💵 *Efectivo contra entrega*: ${negocio.pago_efectivo_instrucciones || "Pagas al recibir tu pedido."}`);
      }
      if (negocio.pago_culqi_activo) {
        list.push(`💳 *Pago seguro con Tarjeta (Culqi)*: Accede al portal seguro aquí: ${linkPago}`);
      }

      if (list.length > 0) {
        paymentInstructions = `Puedes completar tu pago mediante cualquiera de los métodos habilitados por nuestra tienda:\n\n${list.join("\n\n")}\n\n*Recuerda enviarnos la constancia o captura de pago para preparar y despachar tu pedido lo antes posible.* 🌟`;
      } else {
        paymentInstructions = `Por favor, coordina tu pago directamente enviando un mensaje al soporte humano.`;
      }
    } else {
      paymentInstructions = `Puedes realizar tu pago contra entrega en efectivo o mediante link de pago digital Culqi: ${linkPago}`;
    }

    // Push confirm alert
    responseText += `\n\n🛵 *¡He reservado tu pedido con éxito!* El total es *S/ ${totalCost.toFixed(2)}* por tu: *${selectedPromo ? selectedPromo.nombre : "orden"}*.\n\n${paymentInstructions}`;
  } else {
    // Standard status update
    if (text.toLowerCase().includes("hola") || text.toLowerCase().includes("buenas")) {
      db.updateConversacionEstado(conversacionId, "consultando");
    } else if (text.toLowerCase().includes("pedido") || text.toLowerCase().includes("quiero") || text.toLowerCase().includes("comprar")) {
      db.updateConversacionEstado(conversacionId, "tomando_pedido");
    }
  }

  return responseText;
}

/**
 * Standard rule-based Sales Bot Fallback in peruvian spanish when Gemini key is empty
 */
function generateFallbackReply(text: string, name: string, activePromos: Promocion[]): string {
  const norm = text.toLowerCase();
  const mainPromo = activePromos.find(p => p.activa) || activePromos[0];

  if (norm.includes("hola") || norm.includes("buenas") || norm.includes("info")) {
    return `¡Hola ${name}! 🍗 Gusto en saludarte. Soy OlivIA, tu asistente virtual de Pollo Broaster OlivIA. \n\nTenemos espectacular nuestra promo activa:\n🔥 *${mainPromo.nombre}*\n👉 ${mainPromo.descripcion}\n💰 *Precio Especial: S/ ${mainPromo.precio.toFixed(2)}* (IGV Incluido).\n\n¿Llegamos a tu distrito? Hacemos delivery en San Isidro, Surco y Miraflores.\n\n¿Te gustaría que te tomemos un pedido ahora? 😉`;
  }

  if (norm.includes("precio") || norm.includes("cuanto cuesta") || norm.includes("costo")) {
    return `¡Claro que sí! El precio de la promo *${mainPromo.nombre}* es de tan solo *S/ ${mainPromo.precio.toFixed(2)}* con IGV incluido. Adicional, el delivery es S/ 5 o puedes recogerlo gratis.\n\n¿Gustas pedir uno? Necesito tu nombre completo y dirección.`;
  }

  if (norm.includes("delivery") || norm.includes("surco") || norm.includes("san isidro") || norm.includes("miraflores")) {
    return `¡Buenísimo! Sí cubrimos tu distrito. Para agendar tu combo, por favor confírmanos tu nombre completo y tu dirección exacta para enviarte el link de pago seguro de Culqi. 🛵🍟`;
  }

  // Fallback to auto closing order simulation if they provide a pseudo-address
  if (norm.includes("calle") || norm.includes("av.") || norm.includes("avenida") || norm.includes("dpto") || norm.includes("urbanizacion")) {
    const cleanAddress = text.replace(/confirm/gi, "").trim();
    return `Excelente. Recopilé tus datos:\n👤 Nombre: ${name}\n📍 Entrega: ${cleanAddress}\n📦 Combo: ${mainPromo.nombre}\n\n[CONFIRM_ORDER: PromoId: ${mainPromo.id}, Cantidad: 1, Tipo: delivery, Direccion: ${cleanAddress}, Nombre: ${name}]`;
  }

  return `Entendido, María. ¿Te gustaría la promoción de ${mainPromo.nombre} por S/ ${mainPromo.precio.toFixed(2)}? \n\nPor favor, compártenos tu nombre completo y dirección para preparar tu delivery de inmediato! ✨`;
}
