# OlivIA CRM 🍗🍟
> Sistema CRM Inteligente y Automatización de Ventas por WhatsApp con Inteligencia Artificial para comercios y restaurantes peruanos.

OlivIA CRM es una solución integral que automatiza el embudo conversacional de ventas integrando **WhatsApp (Evolution API)**, **Orquestadores (n8n)**, **Pasarelas de Pago (Culqi)** y **Motores de IA (Gemini API / Claude)** en una base de datos segura (**Supabase/FileDB**).

---

## 🚀 Flujo Completo de Automatización

1. **Captura del Lead**: El cliente ve un anuncio en redes (Facebook, Instagram, TikTok) y pulsa el enlace a WhatsApp.
2. **Recepción del Mensaje**: El webhook de Evolution API recibe el texto y se comunica con n8n.
3. **Consola del Bot con IA**: n8n consulta la promoción activa en el CRM, compone el system prompt, y pide a la IA de Gemini redactar respuestas amigables e informativas en español peruano natural.
4. **Toma de Pedido**: El bot recolecta información obligatoria como: **Nombre completo, Tipo de entrega (delivery o recojo), y dirección exacta**.
5. **Cierre de Venta y Pago**: Al confirmar datos, el bot gatilla un tag de cierre, el CRM genera un enlace de pago Culqi seguro. El cliente paga, el webhook de Culqi valida la transacción, cambia el pedido a **Pagado** en el Kanban y avisa a cocina!

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 para diseño fluido y de alto contraste.
- **Backend**: Node.js + Express + TSX para una pasarela proxy robusta y segura que oculta tus llaves API.
- **Base de Datos**: PostgreSQL / JSON Store con estados optimistas locales.
- **Canal WhatsApp**: Evolution API (Llamadas directas por REST).
- **Procesador de IA**: Google Gen AI SDK (`@google/genai` con modelo `gemini-3.5-flash`).

---

## 📦 Instrucciones de Instalación Local

### 1. Clonar el Repositorio y Entrar
```bash
git clone https://github.com/tu-usuario/olivia-crm.git
cd olivia-crm
```

### 2. Configurar Variables de Entorno (`.env`)
Crea un archivo `.env` en la raíz con el siguiente formato:
```env
# Llave secreta para Gemini AI (Requerida en server.ts)
GEMINI_API_KEY="AIzaSy..."

# Entorno local / URL desplegada
APP_URL="http://localhost:3000"
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Lanzar en Desarrollo Full-Stack
Para iniciar el servidor Express + Vite en caliente:
```bash
npm run dev
```
La aplicación estará disponible de inmediato en: `http://localhost:3000`

---

## 🎯 Configuración de Integraciones del Negocio

### ⛓️ evolution API (WhatsApp)
1. Entra a la pestaña **Evolution API** del CRM.
2. Introduce la URL de tu panel Evolution, tu API Token y un nombre de instancia único.
3. Haz clic en **Generar QR**. Escanea el código en pantalla desde tu menú de WhatsApp (*Dispositivos Vinculados*).
4. El CRM detectará el escaneo automáticamente y mantendrá la conexión en vivo.

### 💳 Generación Automática de Links de Pago - Culqi
La pasarela está integrada para leer tus llaves secretas y componer cargos. En una conversación en el CRM, introduce frases de consentimiento de entrega para autogenerar links Culqi y probar el simulador visual.
- Dirección de webhook para Culqi: `/api/webhooks/culqi`

### 💜 Orquestador de Robots n8n
- Configura un webhook de tipo **POST** apuntando al endpoint del CRM: `/api/webhooks/n8n`.
- Asegura la cabecera `x-webhook-secret: secreto-compartido-12345`.
- Los eventos soportados para n8n son: `nuevo_lead` y `mensaje_recibido`.
