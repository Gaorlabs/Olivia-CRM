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
  vigencia_fin: string | null;
  condiciones: string | null;
  activa: boolean;
  prompt_generado: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  negocio_id: string;
  telefono: string;
  nombre: string | null;
  canal_origen: string;
  red_social: "facebook" | "instagram" | "tiktok" | "directo" | string | null;
  status: EstadoLead;
  created_at: string;
}

export type EstadoLead = 'nuevo' | 'contactado' | 'interesado' | 'anulado' | 'cancelado';

export type EstadoConversacion = 'iniciada' | 'consultando' | 'tomando_pedido' | 'esperando_pago' | 'completada' | 'abandonada';

export interface Conversacion {
  id: string;
  lead_id: string;
  promocion_id: string | null;
  estado: EstadoConversacion;
  created_at: string;
  updated_at: string;
  lead?: Lead;
  ultimoMensaje?: Mensaje | null;
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
  lead?: Lead;
  promocion?: Promocion | null;
}

export type EstadoPago = 'pendiente' | 'pagado' | 'fallido' | 'reembolsado';

export interface Pago {
  id: string;
  pedido_id: string;
  monto: number;
  pasarela: string;
  estado: EstadoPago;
  link_pago: string | null;
  referencia_externa: string | null;
  pagado_at: string | null;
  created_at: string;
}

export interface BotConfig {
  humano_backup: boolean;
  bot_activo: boolean;
  whatsapp_conectado: boolean;
  webhook: {
    n8n_webhook_url: string;
    n8n_secret: string;
  };
}

export interface CRMStats {
  leadsCount: number;
  activePedidos: number;
  totalSales: number;
  conversionRate: number;
  activePromo: Promocion | null;
}
