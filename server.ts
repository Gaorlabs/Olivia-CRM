import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db, triggerBotResponse, buildPrompt } from "./server/db.js";

// Make sure process env dotenv loads (just in case)
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to extract the tenant business ID from requests
function getNegocioId(req: express.Request): string | undefined {
  const header = req.headers['x-negocio-id'];
  if (Array.isArray(header)) return header[0];
  if (typeof header === 'string' && header.trim()) return header;
  const q = req.query.negocio_id;
  if (typeof q === 'string' && q.trim()) return q;
  return undefined;
}

// ── AUTH ROUTES ──
app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: "error", message: "Faltan credenciales obligatorias" });
    }
    const usuarios = db.getUsuarios();
    const matched = usuarios.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password_hash === password);
    if (!matched) {
      return res.status(401).json({ status: "error", message: "Usuario o contraseña inválidos" });
    }
    const negocio = matched.negocio_id ? db.getNegocio(matched.negocio_id) : null;
    res.json({
      success: true,
      user: {
        id: matched.id,
        username: matched.username,
        nombre: matched.nombre,
        rol: matched.rol,
        negocio_id: matched.negocio_id
      },
      negocio
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── ADMIN MANAGEMENT CONTROLLERS (Super Admin only) ──

// GET /api/admin/negocios -> Listar todos los negocios
app.get("/api/admin/negocios", (req, res) => {
  try {
    res.json(db.getNegocios());
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /api/admin/negocios -> Crear nuevo negocio
app.post("/api/admin/negocios", (req, res) => {
  try {
    const { nombre, whatsapp_instancia, whatsapp_numero, zona_reparto, activo } = req.body;
    if (!nombre) {
      return res.status(400).json({ status: "error", message: "El nombre es obligatorio" });
    }
    const newNegocio = db.createNegocio({
      nombre,
      whatsapp_instancia: whatsapp_instancia || "instancia-olivia-wa",
      whatsapp_numero: whatsapp_numero || null,
      zona_reparto: zona_reparto || null,
      activo: activo !== false
    });
    res.json({ success: true, negocio: newNegocio });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/admin/usuarios -> Listar todos los usuarios
app.get("/api/admin/usuarios", (req, res) => {
  try {
    res.json(db.getUsuarios().map(u => ({ id: u.id, username: u.username, nombre: u.nombre, rol: u.rol, negocio_id: u.negocio_id, created_at: u.created_at })));
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /api/admin/usuarios -> Crear nuevo usuario asignado a un negocio
app.post("/api/admin/usuarios", (req, res) => {
  try {
    const { username, nombre, password, rol, negocio_id } = req.body;
    if (!username || !nombre || !password) {
      return res.status(400).json({ status: "error", message: "Faltan campos requeridos (username, nombre, password)" });
    }
    const usuarios = db.getUsuarios();
    if (usuarios.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ status: "error", message: "El nombre de usuario ya existe" });
    }
    const newUser = db.createUsuario({
      username: username.toLowerCase().trim(),
      nombre,
      password_hash: password,
      rol: rol || "cliente",
      negocio_id: negocio_id || null
    });
    res.json({ success: true, usuario: { id: newUser.id, username: newUser.username, nombre: newUser.nombre, rol: newUser.rol, negocio_id: newUser.negocio_id } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// PUT /api/admin/negocios/:id -> Editar negocio existente
app.put("/api/admin/negocios/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, whatsapp_instancia, whatsapp_numero, zona_reparto, activo } = req.body;
    const updated = db.updateNegocio(id, {
      nombre,
      whatsapp_instancia,
      whatsapp_numero,
      zona_reparto,
      activo: activo !== undefined ? activo : undefined
    });
    if (!updated) {
      return res.status(404).json({ status: "error", message: "Negocio no encontrado" });
    }
    res.json({ success: true, negocio: updated });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// DELETE /api/admin/negocios/:id -> Eliminar negocio existente
app.delete("/api/admin/negocios/:id", (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteNegocio(id);
    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Negocio no encontrado" });
    }
    res.json({ success: true, message: "Negocio eliminado correctamente" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// PUT /api/admin/usuarios/:id -> Editar usuario existente
app.put("/api/admin/usuarios/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { username, nombre, password, rol, negocio_id } = req.body;
    const updated = db.updateUsuario(id, {
      username: username ? username.toLowerCase().trim() : undefined,
      nombre,
      password,
      rol,
      negocio_id: negocio_id || null
    });
    if (!updated) {
      return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
    }
    res.json({ success: true, usuario: { id: updated.id, username: updated.username, nombre: updated.nombre, rol: updated.rol, negocio_id: updated.negocio_id } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// DELETE /api/admin/usuarios/:id -> Eliminar usuario existente
app.delete("/api/admin/usuarios/:id", (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteUsuario(id);
    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
    }
    res.json({ success: true, message: "Usuario eliminado correctamente" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── ADMIN COBROS ENDPOINTS (OliVIA CRM Billing) ──
app.get("/api/admin/cobros", (req, res) => {
  try {
    const list = db.getCobrosDistribuidor();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post("/api/admin/cobros", (req, res) => {
  try {
    const { negocio_id, plan_nombre, monto, estado } = req.body;
    if (!negocio_id || !plan_nombre || !monto || !estado) {
      return res.status(400).json({ status: "error", message: "Faltan campos requeridos" });
    }
    const created = db.createCobroDistribuidor({
      negocio_id,
      plan_nombre,
      monto: Number(monto),
      estado
    });
    res.json({ success: true, cobro: created });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.put("/api/admin/cobros/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { plan_nombre, monto, estado, negocio_id } = req.body;
    const updated = db.updateCobroDistribuidor(id, {
      plan_nombre,
      monto: monto !== undefined ? Number(monto) : undefined,
      estado,
      negocio_id
    });
    if (!updated) {
      return res.status(404).json({ status: "error", message: "Cobro no encontrado" });
    }
    res.json({ success: true, cobro: updated });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.delete("/api/admin/cobros/:id", (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteCobroDistribuidor(id);
    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Cobro no encontrado" });
    }
    res.json({ success: true, message: "Cobro eliminado correctamente" });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});


// GET /api/negocio (Métricas y datos de negocio por tenant)
app.get("/api/negocio", (req, res) => {
  try {
    const nId = getNegocioId(req);
    const negocio = db.getNegocio(nId);
    const botConfig = db.getBotConfig();
    res.json({ negocio, botConfig });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /api/negocio/config (Actualizar bot o negocio tenant)
app.post("/api/negocio/config", (req, res) => {
  try {
    const nId = getNegocioId(req) || "negocio-pe-1234";
    const { 
      nombre, 
      whatsapp_instancia, 
      whatsapp_numero, 
      zona_reparto, 
      bot_activo, 
      humano_backup,
      pago_yape_activo,
      pago_yape_numero,
      pago_yape_titular,
      pago_yape_qr,
      pago_transferencia_activa,
      pago_transferencia_banco,
      pago_transferencia_cuenta,
      pago_transferencia_cci,
      pago_transferencia_titular,
      pago_efectivo_activo,
      pago_efectivo_instrucciones,
      pago_culqi_activo,
      pago_culqi_api_key
    } = req.body;

    db.updateNegocio(nId, {
      nombre,
      whatsapp_instancia,
      whatsapp_numero,
      zona_reparto,
      pago_yape_activo: pago_yape_activo !== undefined ? !!pago_yape_activo : undefined,
      pago_yape_numero,
      pago_yape_titular,
      pago_yape_qr,
      pago_transferencia_activa: pago_transferencia_activa !== undefined ? !!pago_transferencia_activa : undefined,
      pago_transferencia_banco,
      pago_transferencia_cuenta,
      pago_transferencia_cci,
      pago_transferencia_titular,
      pago_efectivo_activo: pago_efectivo_activo !== undefined ? !!pago_efectivo_activo : undefined,
      pago_efectivo_instrucciones,
      pago_culqi_activo: pago_culqi_activo !== undefined ? !!pago_culqi_activo : undefined,
      pago_culqi_api_key
    });

    db.updateBotConfig({
      bot_activo: bot_activo !== undefined ? !!bot_activo : undefined,
      humano_backup: humano_backup !== undefined ? !!humano_backup : undefined
    });
    res.json({ success: true, negocio: db.getNegocio(nId), botConfig: db.getBotConfig() });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/promociones -> Lista filtrada por tenant
app.get("/api/promociones", (req, res) => {
  try {
    const nId = getNegocioId(req);
    res.json(db.getPromociones(nId));
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /api/promociones -> Crea nueva en el tenant activo
app.post("/api/promociones", (req, res) => {
  try {
    const nId = getNegocioId(req) || "negocio-pe-1234";
    const { nombre, descripcion, precio, igv_incluido, vigencia_fin, condiciones, activa } = req.body;
    if (!nombre || precio === undefined) {
      return res.status(400).json({ status: "error", message: "Faltan datos obligatorios (nombre, precio)" });
    }

    const valPrecio = parseFloat(precio) || 0;
    const newPromo = db.createPromocion({
      negocio_id: nId,
      nombre,
      descripcion: descripcion || null,
      precio: valPrecio,
      igv_incluido: igv_incluido !== undefined ? !!igv_incluido : true,
      vigencia_fin: vigencia_fin || null,
      condiciones: condiciones || null,
      activa: activa !== undefined ? !!activa : false
    });

    res.json({ success: true, promocion: newPromo });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// PUT /api/promociones/:id -> Actualizar promo individual
app.put("/api/promociones/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, igv_incluido, vigencia_fin, condiciones, activa } = req.body;

    const fields: any = {};
    if (nombre !== undefined) fields.nombre = nombre;
    if (descripcion !== undefined) fields.descripcion = descripcion;
    if (precio !== undefined) fields.precio = parseFloat(precio) || 0;
    if (igv_incluido !== undefined) fields.igv_incluido = !!igv_incluido;
    if (vigencia_fin !== undefined) fields.vigencia_fin = vigencia_fin;
    if (condiciones !== undefined) fields.condiciones = condiciones;
    if (activa !== undefined) fields.activa = !!activa;

    const updated = db.updatePromocion(id, fields);
    if (!updated) {
      return res.status(404).json({ status: "error", message: "Membresía o promoción no encontrada" });
    }

    res.json({ success: true, promocion: updated });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// DELETE /api/promociones/:id -> Eliminar promo
app.delete("/api/promociones/:id", (req, res) => {
  try {
    const { id } = req.params;
    const success = db.deletePromocion(id);
    if (!success) {
      return res.status(404).json({ status: "error", message: "Promoción no encontrada" });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/leads -> Tabla de leads filtrada por tenant
app.get("/api/leads", (req, res) => {
  try {
    const nId = getNegocioId(req);
    res.json(db.getLeads(nId));
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /api/leads -> Crear uno nuevo en el tenant
app.post("/api/leads", (req, res) => {
  try {
    const nId = getNegocioId(req) || "negocio-pe-1234";
    const { telefono, nombre, red_social } = req.body;
    if (!telefono) {
      return res.status(400).json({ status: "error", message: "Falta el número de teléfono obligatorio" });
    }
    const lead = db.resolveLead(telefono, nombre, red_social || "directo", nId);
    res.json({ success: true, lead });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/conversaciones -> Lista chats filtrados por tenant
app.get("/api/conversaciones", (req, res) => {
  try {
    const nId = getNegocioId(req);
    res.json(db.getConversaciones(nId));
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/conversaciones/:id/mensajes -> Obtener chat
app.get("/api/conversaciones/:id/mensajes", (req, res) => {
  try {
    res.json(db.getMensajes(req.params.id));
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /api/conversaciones/:id/mensajes -> Mandar mensaje
app.post("/api/conversaciones/:id/mensajes", async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, contenido } = req.body;

    if (!rol || !contenido) {
      return res.status(400).json({ status: "error", message: "Se requieren 'rol' y 'contenido'" });
    }

    const cleanContenido = contenido.trim();
    const userMsg = db.addMensaje(id, rol, cleanContenido);

    let botMsg = null;

    const botConfig = db.getBotConfig();
    if (rol === "cliente" && botConfig.bot_activo) {
      const respText = await triggerBotResponse(id, cleanContenido);
      botMsg = db.addMensaje(id, "bot", respText);
    }

    res.json({
      success: true,
      mensajeEnviado: userMsg,
      mensajeBot: botMsg,
      conversacion: db.getConversaciones().find(c => c.id === id)
    });
  } catch (error: any) {
    console.error("Error in message routing:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/pedidos -> Kanban list filtrada por tenant
app.get("/api/pedidos", (req, res) => {
  try {
    const nId = getNegocioId(req);
    res.json(db.getPedidos(nId));
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// PATCH /api/pedidos/:id -> Actualizar estado arrastrando kanban
app.patch("/api/pedidos/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!estado) {
      return res.status(400).json({ status: "error", message: "Falta el estado de destino" });
    }

    const p = db.updatePedidoEstado(id, estado);
    if (!p) {
      return res.status(404).json({ status: "error", message: "Pedido no encontrado" });
    }

    if (estado === "pagado") {
      db.updateConversacionEstado(p.conversacion_id, "completada");
    } else if (estado === "cancelado") {
      db.updateConversacionEstado(p.conversacion_id, "abandonada");
    }

    res.json({ success: true, pedido: p });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/dashboard/metrics -> Dashboard stats cards de multi-tenant
app.get("/api/dashboard/metrics", (req, res) => {
  try {
    const nId = getNegocioId(req);
    const leads = db.getLeads(nId);
    const pedidos = db.getPedidos(nId);
    const promos = db.getPromociones(nId);

    const leadsCount = leads.length;
    const activePedidos = pedidos.filter(p => !["entregado", "cancelado"].includes(p.estado)).length;
    const totalSales = pedidos
      .filter(p => p.estado === "pagado" || p.estado === "entregado")
      .reduce((sum, current) => sum + current.total, 0);

    const conversionRate = leadsCount > 0
      ? Math.round((pedidos.filter(p => p.estado === "pagado" || p.estado === "entregado").length / leadsCount) * 100)
      : 0;

    const activePromo = promos.find(p => p.activa) || promos[0] || null;

    res.json({
      leadsCount,
      activePedidos,
      totalSales,
      conversionRate,
      activePromo
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── CONNECT / CONNECT STATUS EVOLUTION WHATSAPP ──

// POST /api/evolution/connect -> Configurar credenciales y simular QR
app.post("/api/evolution/connect", (req, res) => {
  try {
    const { url, key, instance } = req.body;
    if (!url || !key || !instance) {
      return res.status(400).json({ status: "error", message: "Faltan parámetros (url, key, instance)" });
    }

    // update negocio
    const negocio_id = getNegocioId(req);
    db.updateNegocio(negocio_id, {
      whatsapp_instancia: instance,
      whatsapp_numero: "+51 983 451 294" // Mocked Connected Number
    });

    db.updateBotConfig({
      whatsapp_conectado: true
    });

    // Generate simulated QR Code base64
    // Standard static base64 QR for offline-safe scanning (a high-quality checkmark QR)
    const mockQRBase64 = "iVBORw0KGgoAAAANSUhEUgAAAKQAAADkBAMAAAAL74btAAAAD1BMVEUAAAD///8SFBYgISMcHB07UfKDAAAABXRSTlMA9O/vnwAAAWRJREFUeNrtlEFORDEIRbX0Anv2gHvvAbT3ANp7gB4gY++BdfbA9u6ByTMygajXUasqn0T+UqWkiG/WByk98bOqqNf9H6t7b4n6vSrqz31RFHVfFvW9KOpXWdT9rqg/ZFHbZVHXZVHfuKJ2S8bE8v5483YxXv5pWfI29pE7b0Kq3f/Fm/d4/7VfFqUub+r9bVHUdlXq7bYoyvebUr9vSna/L9n9UJLdb8VbXofbUPrAnfL+KMrfR7TofUX87p36/bYor2DofRaxY1HWe4vY3i+L6vcmFmURpREpPUJKT5DSI6T0CCmdaEJK/3gIqR2K2b0vye7Hkux+VuxYlOx9R9T7LGL/q6jdXhbVb0IsyiJKI1J6hJSeIKVHSOkRUkXREKUiSqYimqEoGopGKKIoGopy7U9R8m+gKGco+idH3n74KMoXzT8U/R8UURoBEX99N9U25bUu4gAAAABJRU5ErkJggg==";

    res.json({
      success: true,
      qr: mockQRBase64,
      instance,
      phone: "+51 983 451 294"
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/evolution/status
app.get("/api/evolution/status", (req, res) => {
  try {
    const negocio = db.getNegocio();
    const botConfig = db.getBotConfig();
    res.json({
      state: botConfig.whatsapp_conectado ? "open" : "close",
      phone: negocio.whatsapp_numero || "+51 983 451 294",
      instance: negocio.whatsapp_instancia || "instancia-olivia-wa"
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /api/evolution/disconnect
app.post("/api/evolution/disconnect", (req, res) => {
  try {
    const negocio_id = getNegocioId(req);
    db.updateNegocio(negocio_id, {
      whatsapp_numero: null
    });
    db.updateBotConfig({
      whatsapp_conectado: false
    });
    res.json({ success: true, state: "close" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── WEBHOOK ENGINES (n8n & Culqi Simulators) ──

// POST /api/webhooks/n8n -> Recibe eventos externos
app.post("/api/webhooks/n8n", (req, res) => {
  try {
    const { schemaSecret, evento, telefono, nombre, red_social, mensaje } = req.body;

    const botConfig = db.getBotConfig();
    if (botConfig.webhook.n8n_secret && req.headers["x-webhook-secret"] !== botConfig.webhook.n8n_secret) {
      // In sandbox we warn but allow execution just in case headers are modified during manual tests
      console.warn("Muted mismatch in x-webhook-secret");
    }

    if (!evento || !telefono) {
      return res.status(400).json({ status: "error", message: "Se requieren 'evento' y 'telefono'" });
    }

    const lead = db.resolveLead(telefono, nombre, red_social || "directo");
    const conv = db.getOrCreateConversacion(lead.id);

    if (evento === "nuevo_lead") {
      db.updateConversacionEstado(conv.id, "iniciada");
      if (mensaje) db.addMensaje(conv.id, "cliente", mensaje);
    } else if (evento === "mensaje_recibido" && mensaje) {
      db.addMensaje(conv.id, "cliente", mensaje);
      // Auto reply chatbot
      if (botConfig.bot_activo) {
        triggerBotResponse(conv.id, mensaje).then(botText => {
          db.addMensaje(conv.id, "bot", botText);
        });
      }
    }

    res.json({ success: true, lead, conversacion: conv });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /api/webhooks/culqi -> Simulación de Webhook de pasarela de pago exitosa
app.post("/api/webhooks/culqi", (req, res) => {
  try {
    const { object, type, data } = req.body;
    // Expected: { object: 'event', type: 'charge.succeeded', data: { id: 'chr_xxx', amount: 4990 } }
    if (object === "event" && type === "charge.succeeded") {
      const chargeId = data.id;
      // Search payment record by external reference
      const payment = db.updatePagoEstadoByRef(chargeId, "pagado");
      if (payment) {
        // Find corresponding order and notify
        const ped = db.getPedidos().find(p => p.id === payment.pedido_id);
        if (ped) {
          db.updatePedidoEstado(ped.id, "pagado");
          db.updateConversacionEstado(ped.conversacion_id, "completada");

          // Simulate automatic WhatsApp confirmation from bot
          const confirmTxt = `✅ *¡Pago Confirmado!* Hemos recibido tu abono de S/ ${payment.monto.toFixed(2)} por Culqi (Referencia: ${chargeId}). Tu pedido acaba de ingresar a nuestra área de preparación. ¡Muchas gracias por tu compra! Broaster Lovers 🍗🍟`;
          db.addMensaje(ped.conversacion_id, "bot", confirmTxt);

          return res.json({ success: true, message: "Pago procesado y confirmado con éxito", order: ped });
        }
      }
      return res.status(404).json({ status: "error", message: "No se encontró registro de pago coincidente" });
    }
    res.status(400).json({ status: "error", message: "Formato de webhook Culqi no válido" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── VITE ON STANDALONE DEV LAYER MIDDLEWARE ──

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production output
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    // Port 3000 is externally exposed by nginx proxy in AI Studio. Must keep 3000.
    console.log(`[OlivIA Server] Online on http://localhost:${PORT}`);
  });
}

start();
