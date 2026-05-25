export const initialStats = {
  leadsCount: 12,
  activePedidos: 3,
  totalSales: 249.50,
  conversionRate: 33,
  activePromo: null
};

export const initialLeads = [
  { id: "l1", nombre: "Juan Perez", telefono: "999888777", red_social: "WhatsApp", status: "nuevo" as const, created_at: new Date().toISOString() },
  { id: "l2", nombre: "Maria Lopez", telefono: "911222333", red_social: "Instagram", status: "contactado" as const, created_at: new Date().toISOString() }
];

export const initialConversaciones = [
  { id: "c1", lead_id: "l1", last_message: "Hola, información de precio", created_at: new Date().toISOString() }
];

export const initialMessages = [
  { id: "m1", conversacion_id: "c1", rol: "cliente" as const, contenido: "Hola, información de precio", created_at: new Date().toISOString() },
  { id: "m2", conversacion_id: "c1", rol: "bot" as const, contenido: "Hola! Claro, ¿qué producto te interesa?", created_at: new Date().toISOString() }
];

export const initialPedidos = [
  { id: "p1", lead_id: "l1", cliente: "Juan Perez", telefono: "999888777", estado: "pendiente" as const, monto: 50.00, detalles: "Crema hidratante", created_at: new Date().toISOString() }
];

export const initialPromociones = [
  { 
    id: "pr1", 
    negocio_id: "demo-tenant",
    nombre: "Oferta Verano", 
    descripcion: "20% de descuento", 
    precio: 29.90,
    igv_incluido: true,
    vigencia_fin: "2026-06-01", 
    condiciones: "Válido por WhatsApp", 
    activa: true,
    prompt_generado: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
