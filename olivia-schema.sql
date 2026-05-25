-- SQL Script de Migración para Supabase / PostgreSQL VPS
-- Schema: olivia
-- Propósito: Inicializar la base de datos de OlivIA CRM Multi-Tenant

-- 1. Crear el esquema si no existe
CREATE SCHEMA IF NOT EXISTS olivia;

-- 2. Eliminar tablas existentes para evitar conflictos si se desea re-crear (Opcional, con CASCADE para limpiar relaciones antiguas)
-- DROP TABLE IF EXISTS olivia.pagos CASCADE;
-- DROP TABLE IF EXISTS olivia.pedidos CASCADE;
-- DROP TABLE IF EXISTS olivia.mensajes CASCADE;
-- DROP TABLE IF EXISTS olivia.conversaciones CASCADE;
-- DROP TABLE IF EXISTS olivia.leads CASCADE;
-- DROP TABLE IF EXISTS olivia.promociones CASCADE;
-- DROP TABLE IF EXISTS olivia.usuarios CASCADE;
-- DROP TABLE IF EXISTS olivia.negocios CASCADE;

--------------------------------------------------------------------------------
-- EXPLICACIÓN DEL ERROR: "ERROR: 42883: operator does not exist: character varying = uuid"
-- Este error ocurre en PostgreSQL cuando intentas comparar o unir (JOIN) dos columnas
-- donde una es de tipo UUID (por ejemplo, negocios.id) y la otra es de tipo VARCHAR
-- (por ejemplo, promociones.negocio_id). PostgreSQL es estrictamente tipado y no autoconvierte
-- varchar a uuid para compararlos con '='.
--
-- SOLUCIÓN IMPLEMENTADA AQUÍ:
-- Para máxima compatibilidad con IDs personalizados de integraciones n8n, n8n webhook, Culqi
-- y mock-testers (como "negocio-pe-1234", "promo-1", "lead-1"), definiremos las claves primarias
-- y secundarias como VARCHAR(100). De esta forma se soluciona de raíz el error de tipado
-- y la base de datos funcionará perfectamente sin conversiones innecesarias.
--------------------------------------------------------------------------------

-- 3. Tabla de NEGOCIOS (Multi-Tenant)
CREATE TABLE IF NOT EXISTS olivia.negocios (
    id VARCHAR(100) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    whatsapp_instancia VARCHAR(255) DEFAULT 'instancia-olivia-wa',
    whatsapp_numero VARCHAR(50) NULL,
    zona_reparto VARCHAR(500) NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de USUARIOS Y PERFILES (Para dar acceso a los clientes de cada negocio)
CREATE TABLE IF NOT EXISTS olivia.usuarios (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Contraseña del cliente o administrador
    rol VARCHAR(50) DEFAULT 'cliente', -- 'superadmin' o 'cliente'
    negocio_id VARCHAR(100) NULL REFERENCES olivia.negocios(id) ON DELETE SET NULL, -- Null si es superadmin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de PROMOCIONES (Vinculada a cada negocio)
CREATE TABLE IF NOT EXISTS olivia.promociones (
    id VARCHAR(100) PRIMARY KEY,
    negocio_id VARCHAR(100) NOT NULL REFERENCES olivia.negocios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    igv_incluido BOOLEAN DEFAULT true,
    vigencia_fin VARCHAR(50) NULL, -- Guardado en formato CSS ISO o Date string
    condiciones TEXT,
    activa BOOLEAN DEFAULT false,
    prompt_generado TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de LEADS (Clientes que inician chat. Vinculados al negocio que los recibe)
CREATE TABLE IF NOT EXISTS olivia.leads (
    id VARCHAR(100) PRIMARY KEY,
    negocio_id VARCHAR(100) NOT NULL REFERENCES olivia.negocios(id) ON DELETE CASCADE,
    telefono VARCHAR(50) NOT NULL, -- Formato E.164 (Ej: +51987654321)
    nombre VARCHAR(150) NULL,
    canal_origen VARCHAR(100) DEFAULT 'whatsapp', -- 'whatsapp', 'facebook', etc.
    red_social VARCHAR(100) NULL, -- 'facebook', 'instagram', 'directo'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de CONVERSACIONES (Estado del embudo del lead en tiempo real)
CREATE TABLE IF NOT EXISTS olivia.conversaciones (
    id VARCHAR(100) PRIMARY KEY,
    lead_id VARCHAR(100) NOT NULL REFERENCES olivia.leads(id) ON DELETE CASCADE,
    promocion_id VARCHAR(100) NULL REFERENCES olivia.promociones(id) ON DELETE SET NULL,
    estado VARCHAR(100) DEFAULT 'iniciada', -- 'iniciada', 'consultando', 'tomando_pedido', 'esperando_pago', 'completada', 'abandonada'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla de MENSAJES de Chat
CREATE TABLE IF NOT EXISTS olivia.mensajes (
    id VARCHAR(100) PRIMARY KEY,
    conversacion_id VARCHAR(100) NOT NULL REFERENCES olivia.conversaciones(id) ON DELETE CASCADE,
    rol VARCHAR(50) NOT NULL, -- 'bot' o 'cliente'
    contenido TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabla de PEDIDOS (Kanban Pipeline, vinculada al lead y promoción)
CREATE TABLE IF NOT EXISTS olivia.pedidos (
    id VARCHAR(100) PRIMARY KEY,
    lead_id VARCHAR(100) NOT NULL REFERENCES olivia.leads(id) ON DELETE CASCADE,
    conversacion_id VARCHAR(100) NOT NULL REFERENCES olivia.conversaciones(id) ON DELETE CASCADE,
    promocion_id VARCHAR(100) NULL REFERENCES olivia.promociones(id) ON DELETE SET NULL,
    direccion_entrega TEXT NULL,
    tipo_entrega VARCHAR(50) DEFAULT 'delivery', -- 'delivery' o 'recojo'
    cantidad INTEGER DEFAULT 1,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    igv DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(100) DEFAULT 'pendiente', -- 'pendiente', 'link_enviado', 'pagado', 'en_preparacion', 'en_camino', 'entregado', 'cancelado'
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabla de PAGOS (Reflejo del Webhook de Culqi/Yape)
CREATE TABLE IF NOT EXISTS olivia.pagos (
    id VARCHAR(100) PRIMARY KEY,
    pedido_id VARCHAR(100) NOT NULL REFERENCES olivia.pedidos(id) ON DELETE CASCADE,
    monto DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    pasarela VARCHAR(100) DEFAULT 'culqi', -- 'culqi' o 'yape'
    estado VARCHAR(100) DEFAULT 'pendiente', -- 'pendiente', 'pagado', 'fallido'
    link_pago TEXT NULL,
    referencia_externa VARCHAR(255) NULL, -- Código chr_xxx de Culqi
    pagado_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

--------------------------------------------------------------------------------
-- 11. INSERCIÓN DE DATOS DEMO (SEEDS)
-- Registramos Pollería, Consultorio Odontológico y Comercio de Productos Naturales
--------------------------------------------------------------------------------

-- Negocios
INSERT INTO olivia.negocios (id, nombre, whatsapp_instancia, whatsapp_numero, zona_reparto) 
VALUES 
('negocio-pe-1234', 'Pollo Broaster OlivIA', 'instancia-olivia-wa', '+51 987 654 321', 'San Isidro, Miraflores, Surco'),
('negocio-dent-555', 'Consultorio Dental DentalGlow', 'dentalglow-instance-wa', '+51 911 222 333', 'San Borja, Jesús María, Lince'),
('negocio-prod-777', 'Biomarket Hojas Verdes', 'hojasverdes-instance-wa', '+51 944 555 666', 'Chorrillos, Barranco, Surco')
ON CONFLICT (id) DO NOTHING;

-- Usuarios (Password_hash ficticios listos para el login del crm)
INSERT INTO olivia.usuarios (id, username, nombre, password_hash, rol, negocio_id) 
VALUES 
('user-1', 'admin', 'Administrador General (Tú)', 'admin123', 'superadmin', NULL),
('user-2', 'broaster', 'Gerente Broastería Pollo', 'broaster123', 'cliente', 'negocio-pe-1234'),
('user-3', 'dental', 'Dra. Katherine Silva (DentalGlow)', 'dental123', 'cliente', 'negocio-dent-555'),
('user-4', 'natural', 'Juan Pérez (Biomarket)', 'natural123', 'cliente', 'negocio-prod-777')
ON CONFLICT (id) DO NOTHING;

-- Promociones
INSERT INTO olivia.promociones (id, negocio_id, nombre, descripcion, precio, igv_incluido, vigencia_fin, condiciones, activa) 
VALUES 
('promo-1', 'negocio-pe-1234', 'Combo Broaster Familiar 🍗', '1 pollo entero broaster + papas fritas familiares + bebestible 1.5L', 49.90, true, '2026-06-30', 'Válido para San Isidro y Miraflores. Costo de envío S/ 5.', true),
('promo-2', 'negocio-pe-1234', 'Dúo Broaster Crujiente 🍔', '2 hamburguesas de pollo broaster + papas medianas + gaseosa 500ml', 24.90, true, '2026-06-15', 'Disponible en salón o delivery. Recorte de zona aplica.', false),
('promo-dent-1', 'negocio-dent-555', 'Tratamiento de Brackets Completo 🦷', 'Instalación completa de brackets metálicos, radiografía panorámica de diagnóstico gratis y primera cita de control.', 1200.00, true, '2026-07-31', 'Sujeto a evaluación odontológica previa libre de costo.', true),
('promo-dent-2', 'negocio-dent-555', 'Profilaxis Dental Avanzada ✨', 'Destartraje ultrasónico, profilaxis con pasta abrasiva y fluorización en gel.', 89.00, true, '2026-06-30', 'Cita previa requerida en sede Sede Principal San Borja.', true),
('promo-prod-1', 'negocio-prod-777', 'Pack Matcha Premium Orgánico 🍵', 'Matcha japonés orgánico ceremonial de 100g de alta pureza + batidor de bambú tradicional.', 35.00, true, '2026-06-30', 'Envío a domicilio gratuito en Barranco y Miraflores.', true),
('promo-prod-2', 'negocio-prod-777', 'Suero Anti-Edad Colágeno & Argán 🌿', 'Suero facial reparador botánico concentrado de 50ml enriquecido con aceites puros.', 59.95, true, '2026-06-20', 'Para todo tipo de pieles sensibles.', false)
ON CONFLICT (id) DO NOTHING;

-- Leads
INSERT INTO olivia.leads (id, negocio_id, telefono, nombre, canal_origen, red_social) 
VALUES 
('lead-1', 'negocio-pe-1234', '+51987654321', 'María Ríos', 'whatsapp', 'facebook'),
('lead-2', 'negocio-pe-1234', '+51912345678', 'Juan Carlos P.', 'whatsapp', 'instagram'),
('lead-dent-1', 'negocio-dent-555', '+51944555666', 'Lucía Fernández', 'whatsapp', 'facebook'),
('lead-dent-2', 'negocio-dent-555', '+51955666777', 'Carlos Mendívil', 'whatsapp', 'instagram'),
('lead-prod-1', 'negocio-prod-777', '+51977888999', 'Gaby Flores', 'whatsapp', 'instagram')
ON CONFLICT (id) DO NOTHING;

-- Conversaciones
INSERT INTO olivia.conversaciones (id, lead_id, promocion_id, estado) 
VALUES 
('conv-1', 'lead-1', 'promo-1', 'consultando'),
('conv-2', 'lead-2', 'promo-1', 'completada'),
('conv-dent-1', 'lead-dent-1', 'promo-dent-1', 'tomando_pedido'),
('conv-dent-2', 'lead-dent-2', 'promo-dent-2', 'completada'),
('conv-prod-1', 'lead-prod-1', 'promo-prod-1', 'consultando')
ON CONFLICT (id) DO NOTHING;

-- Mensajes de chat
INSERT INTO olivia.mensajes (id, conversacion_id, rol, contenido) 
VALUES 
('msg-1', 'conv-1', 'cliente', 'Hola, ¿de qué se trata el Combo Familiar?'),
('msg-2', 'conv-1', 'bot', '¡Hola María! 😊 El Combo Broaster Familiar 🍗 incluye un riquísimo pollo entero broaster crocante, porción familiar de papas fritas y un bebestible de 1.5L. Todo por S/ 49.90 (IGV incluido). Hacemos Delivery en San Isidro, Miraflores y Surco. ¿Deseas ordenar uno para hoy?'),
('msg-3', 'conv-dent-1', 'cliente', 'Hola me interesa saber los costos de la cuota del tratamiento de brackets'),
('msg-4', 'conv-dent-1', 'bot', '¡Hola Lucía! Qué gusto saludarte 🦷. Nuestra promoción vigente de "Tratamiento de Brackets Completo" es de S/ 1200.00. Contempla la instalación completa, el diagnóstico de radiografía pancreática gratuita y el primer control. Para los siguientes controles mensuales, la cuota es súper cómoda (S/ 120 al mes). ¿Te gustaría agendar tu cita de evaluación gratuita?'),
('msg-5', 'conv-prod-1', 'cliente', 'Buenas tardes, ¿tienen stock de de Matcha Ceremonial con el batidor?'),
('msg-6', 'conv-prod-1', 'bot', '¡Buenas tardes Gaby! 🍵 Sí, tenemos stock del espectacular Pack Matcha Premium Orgánico por S/ 35.00 con el batidor tradicional de bambú incluido. Es 100% orgánico y ceremonial importado. ¿Te gustaría coordinar el delivery o prefieres recogerlo?')
ON CONFLICT (id) DO NOTHING;

-- Pedidos
INSERT INTO olivia.pedidos (id, lead_id, conversacion_id, promocion_id, direccion_entrega, tipo_entrega, cantidad, subtotal, igv, total, estado, notas) 
VALUES 
('ped-1', 'lead-1', 'conv-1', 'promo-1', 'Calle Antero Aspillaga 240, Dpto 502, San Isidro', 'delivery', 1, 42.29, 7.61, 49.90, 'pendiente', 'Traer vuelto de S/ 100'),
('ped-2', 'lead-2', 'conv-2', 'promo-1', 'Av Larco 542, Miraflores', 'delivery', 1, 42.29, 7.61, 49.90, 'pagado', 'Confirmado por Culqi'),
('ped-dent-2', 'lead-dent-2', 'conv-dent-2', 'promo-dent-2', 'Sede Principal San Borja', 'recojo', 1, 75.42, 13.58, 89.00, 'pagado', 'Cita pagada por adelantado por el cliente')
ON CONFLICT (id) DO NOTHING;
