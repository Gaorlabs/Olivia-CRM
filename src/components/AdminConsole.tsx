import React, { useState, useEffect } from "react";
import { 
  Building2, 
  UserPlus, 
  Users, 
  Plus, 
  ShieldCheck, 
  Mail, 
  Key, 
  UserCheck, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  MapPin, 
  CheckCircle, 
  XCircle,
  Smartphone,
  Info,
  Target,
  Wallet,
  Megaphone,
  Percent,
  Activity,
  ArrowRightLeft,
  DollarSign,
  Settings,
  CreditCard,
  Brain
} from "lucide-react";

interface Negocio {
  id: string;
  nombre: string;
  whatsapp_instancia: string;
  whatsapp_numero: string | null;
  zona_reparto: string | null;
  activo: boolean;
  created_at: string;
}

interface Usuario {
  id: string;
  username: string;
  nombre: string;
  password_hash?: string;
  rol: string;
  negocio_id: string | null;
  created_at: string;
}

interface CobroDistribuidor {
  id: string;
  negocio_id: string;
  plan_nombre: string;
  monto: number;
  estado: "cobrado" | "pendiente" | "vencido";
  fecha_pago: string;
}

interface LeadOlivia {
  id: string;
  nombre: string;
  telefono: string;
  canal_origen: string;
  red_social: string;
  created_at: string;
}

interface OfertaOlivia {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  igv_incluido: boolean;
  activa: boolean;
  created_at: string;
}

interface AdminConsoleProps {
  onImpersonate?: (negocioId: string) => void;
  activeTenantId?: string;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onImpersonate, activeTenantId }) => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cobros, setCobros] = useState<CobroDistribuidor[]>([]);
  const [leadsOlivia, setLeadsOlivia] = useState<LeadOlivia[]>([]);
  const [ofertasOlivia, setOfertasOlivia] = useState<OfertaOlivia[]>([]);
  
  const [activeTab, setActiveTab] = useState<"negocios" | "usuarios" | "leads" | "cobros" | "ofertas">("negocios");
  const [loading, setLoading] = useState(false);

  // Business Profile States
  const [selectedProfileNeg, setSelectedProfileNeg] = useState<Negocio | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<"funcionalidades" | "pagos" | "credenciales">("funcionalidades");
  const [negocioFuncs, setNegocioFuncs] = useState<Record<string, Record<string, boolean>>>(() => {
    try {
      const cached = localStorage.getItem("olivia_negocios_funcionalidades");
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      "negocio-pe-1234": {
        "ia_generativa": true,
        "pedidos_realtime": true,
        "agendamiento": false,
        "recordatorios": true,
        "fidelizacion": true
      },
      "negocio-dent-5678": {
        "ia_generativa": true,
        "pedidos_realtime": false,
        "agendamiento": true,
        "recordatorios": true,
        "fidelizacion": false
      }
    };
  });

  const [botPrompts, setBotPrompts] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem("olivia_negocios_prompts");
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      "negocio-pe-1234": "Eres OlivIA, la asistente de IA de la Pollería El Buen Gusto. Ayuda a los clientes a elegir combos, bebidas y a registrar su pedido de pollo a la brasa de manera amable solicitando su dirección.",
      "negocio-dent-5678": "Eres OlivIA, asistente de la Clínica Dental OdontoSurg. Gestiona la reserva de citas de ortodoncia, profilaxis y blanqueamiento, confirmando el horario y pidiendo sus datos."
    };
  });

  const saveNegocioFuncs = (newFuncs: Record<string, Record<string, boolean>>) => {
    setNegocioFuncs(newFuncs);
    localStorage.setItem("olivia_negocios_funcionalidades", JSON.stringify(newFuncs));
  };

  const saveBotPrompts = (newPrompts: Record<string, string>) => {
    setBotPrompts(newPrompts);
    localStorage.setItem("olivia_negocios_prompts", JSON.stringify(newPrompts));
  };
  
  // Create Business Form State
  const [negNombre, setNegNombre] = useState("");
  const [negInstancia, setNegInstancia] = useState("");
  const [negNumero, setNegNumero] = useState("");
  const [negZona, setNegZona] = useState("");
  const [negSuccess, setNegSuccess] = useState<string | null>(null);
  const [negError, setNegError] = useState<string | null>(null);

  // Edit Business Overlay State
  const [editingNeg, setEditingNeg] = useState<Negocio | null>(null);
  const [editNegNombre, setEditNegNombre] = useState("");
  const [editNegInstancia, setEditNegInstancia] = useState("");
  const [editNegNumero, setEditNegNumero] = useState("");
  const [editNegZona, setEditNegZona] = useState("");
  const [editNegActivo, setEditNegActivo] = useState(true);

  // Create User Form State
  const [userUsername, setUserUsername] = useState("");
  const [userNombre, setUserNombre] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRol, setUserRol] = useState("cliente");
  const [userNegocioId, setUserNegocioId] = useState("");
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  // Edit User Overlay State
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [editUserUsername, setEditUserUsername] = useState("");
  const [editUserNombre, setEditUserNombre] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserRol, setEditUserRol] = useState("cliente");
  const [editUserNegocioId, setEditUserNegocioId] = useState("");

  // Create Lead Olivia Form State
  const [leadNombre, setLeadNombre] = useState("");
  const [leadTelefono, setLeadTelefono] = useState("");
  const [leadCanal, setLeadCanal] = useState("Llamada en frío");
  const [leadSuccess, setLeadSuccess] = useState<string | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);

  // Create Cobro Form State
  const [cobroNegId, setCobroNegId] = useState("");
  const [cobroPlan, setCobroPlan] = useState("Plan Premium OlivIA CRM + Evolution API");
  const [cobroMonto, setCobroMonto] = useState("150");
  const [cobroEstado, setCobroEstado] = useState<"cobrado" | "pendiente" | "vencido">("cobrado");
  const [cobroSuccess, setCobroSuccess] = useState<string | null>(null);
  const [cobroError, setCobroError] = useState<string | null>(null);

  // Create Oferta Form State
  const [ofertaNombre, setOfertaNombre] = useState("");
  const [ofertaDesc, setOfertaDesc] = useState("");
  const [ofertaPrecio, setOfertaPrecio] = useState("120");
  const [ofertaSuccess, setOfertaSuccess] = useState<string | null>(null);
  const [ofertaError, setOfertaError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch businesses
      const respNeg = await fetch("/api/admin/negocios");
      if (respNeg.ok) {
        const data = await respNeg.json();
        setNegocios(data);
      }
      
      // 2. Fetch users
      const respUser = await fetch("/api/admin/usuarios");
      if (respUser.ok) {
        const data = await respUser.json();
        setUsuarios(data);
      }

      // 3. Fetch custom subscriptions
      const respCobros = await fetch("/api/admin/cobros");
      if (respCobros.ok) {
        const data = await respCobros.json();
        setCobros(data);
      }

      // 4. Fetch OlivIA Corporate Leads from the system database
      const respLeads = await fetch("/api/leads", {
        headers: { "x-negocio-id": "olivia-system" }
      });
      if (respLeads.ok) {
        const data = await respLeads.json();
        setLeadsOlivia(data);
      }

      // 5. Fetch OlivIA Packages/Offers from system database
      const respOfertas = await fetch("/api/promociones", {
        headers: { "x-negocio-id": "olivia-system" }
      });
      if (respOfertas.ok) {
        const data = await respOfertas.json();
        setOfertasOlivia(data);
      }

    } catch (e) {
      console.error("Error cargando consola administrativa:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // ── NEGOCIOS HANDLERS ──
  const handleCreateNegocio = async (e: React.FormEvent) => {
    e.preventDefault();
    setNegSuccess(null);
    setNegError(null);
    if (!negNombre) {
      setNegError("El nombre del negocio es obligatorio.");
      return;
    }

    try {
      const res = await fetch("/api/admin/negocios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: negNombre,
          whatsapp_instancia: negInstancia || undefined,
          whatsapp_numero: negNumero || undefined,
          zona_reparto: negZona || undefined,
          activo: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setNegError(data.message || "No se pudo registrar el negocio.");
      } else {
        setNegSuccess(`¡Negocio "${data.negocio.nombre}" registrado exitosamente!`);
        setNegNombre("");
        setNegInstancia("");
        setNegNumero("");
        setNegZona("");
        await fetchAdminData();
      }
    } catch (err) {
      setNegError("Error de comunicación de red.");
    }
  };

  const handleUpdateNegocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNeg) return;
    setNegSuccess(null);
    setNegError(null);

    try {
      const res = await fetch(`/api/admin/negocios/${editingNeg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editNegNombre,
          whatsapp_instancia: editNegInstancia.trim().toLowerCase().replace(/\s+/g, "-"),
          whatsapp_numero: editNegNumero || null,
          zona_reparto: editNegZona || null,
          activo: editNegActivo
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setNegError(data.message || "No se pudo actualizar el negocio.");
      } else {
        setNegSuccess(`¡Negocio "${data.negocio.nombre}" actualizado correctamente!`);
        setEditingNeg(null);
        await fetchAdminData();
      }
    } catch (err) {
      setNegError("Error al actualizar comercio.");
    }
  };

  const handleDeleteNegocio = async (id: string, nombre: string) => {
    const confirm = window.confirm(`¿Seguro de eliminar el negocio "${nombre}" de forma permanente? Se desligarán todos sus procesos.`);
    if (!confirm) return;

    setNegSuccess(null);
    setNegError(null);
    try {
      const res = await fetch(`/api/admin/negocios/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setNegSuccess(`Negocio "${nombre}" removido de la red.`);
        await fetchAdminData();
      } else {
        const data = await res.json();
        setNegError(data.message || "Error al eliminar.");
      }
    } catch (err) {
      setNegError("Error al conectar de red.");
    }
  };

  // ── USUARIOS HANDLERS ──
  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSuccess(null);
    setUserError(null);

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userUsername.trim().toLowerCase(),
          nombre: userNombre,
          password: userPassword,
          rol: userRol,
          negocio_id: userNegocioId || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setUserError(data.message || "Error al crear cuenta.");
      } else {
        setUserSuccess(`¡Usuario "${data.usuario.nombre}" generado con éxito!`);
        setUserUsername("");
        setUserNombre("");
        setUserPassword("");
        setUserRol("cliente");
        setUserNegocioId("");
        await fetchAdminData();
      }
    } catch (err) {
      setUserError("Error de comunicación de red.");
    }
  };

  const handleUpdateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUserSuccess(null);
    setUserError(null);

    try {
      const res = await fetch(`/api/admin/usuarios/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUserUsername.trim().toLowerCase(),
          nombre: editUserNombre,
          password: editUserPassword || undefined,
          rol: editUserRol,
          negocio_id: editUserNegocioId || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setUserError(data.message || "No se pudo actualizar.");
      } else {
        setUserSuccess(`¡Acceso del usuario "${data.usuario.nombre}" guardado fiscalmente!`);
        setEditingUser(null);
        await fetchAdminData();
      }
    } catch (err) {
      setUserError("Error en actualización.");
    }
  };

  const handleDeleteUsuario = async (id: string, nombre: string) => {
    const confirm = window.confirm(`¿Estás seguro de revocar para siempre la cuenta de "${nombre}"?`);
    if (!confirm) return;

    setUserSuccess(null);
    setUserError(null);
    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setUserSuccess(`Se eliminó la cuenta de acceso.`);
        await fetchAdminData();
      }
    } catch (err) {
      setUserError("Error al inhabilitar acceso.");
    }
  };

  // ── LEADS DE OLIVIA HANDLERS ──
  const handleCreateLeadOlivia = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadSuccess(null);
    setLeadError(null);

    if (!leadNombre || !leadTelefono) {
      setLeadError("Por favor completa nombre y teléfono.");
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-negocio-id": "olivia-system"
        },
        body: JSON.stringify({
          nombre: leadNombre,
          telefono: leadTelefono,
          red_social: leadCanal
        })
      });

      if (res.ok) {
        setLeadSuccess(`¡Lead corporativo "${leadNombre}" registrado en el funnel de OlivIA!`);
        setLeadNombre("");
        setLeadTelefono("");
        setLeadCanal("Llamada en frío");
        await fetchAdminData();
      } else {
        const data = await res.json();
        setLeadError(data.message || "Error al crear listado.");
      }
    } catch (err) {
      setLeadError("Error al comunicar con la base de datos.");
    }
  };

  const handleDeleteLeadOlivia = async (leadId: string) => {
    const confirm = window.confirm("¿Seguro que deseas eliminar este lead corporativo?");
    if (!confirm) return;

    try {
      const res = await fetch(`/api/leads/${leadId}?negocio_id=olivia-system`, {
        method: "DELETE",
        headers: { "x-negocio-id": "olivia-system" }
      });
      // Fallback fallback simulated locally or standard deletes
      await fetchAdminData();
      setLeadSuccess("Registro de lead corporativo actualizado.");
    } catch (e) {
      console.error(e);
    }
  };

  // ── COBROS DE OLIVIA HANDLERS ──
  const handleCreateCobro = async (e: React.FormEvent) => {
    e.preventDefault();
    setCobroSuccess(null);
    setCobroError(null);

    if (!cobroNegId) {
      setCobroError("Debes seleccionar una empresa para asignarle el cobro.");
      return;
    }

    try {
      const res = await fetch("/api/admin/cobros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          negocio_id: cobroNegId,
          plan_nombre: cobroPlan,
          monto: Number(cobroMonto),
          estado: cobroEstado
        })
      });

      if (res.ok) {
        setCobroSuccess("¡Plan y recibo de cobro registrado con éxito en nuestro sistema!");
        setCobroNegId("");
        setCobroPlan("Plan Premium OlivIA CRM + Evolution API");
        setCobroMonto("150");
        setCobroEstado("cobrado");
        await fetchAdminData();
      } else {
        const data = await res.json();
        setCobroError(data.message || "Ocurrió un error al registrar.");
      }
    } catch (err) {
      setCobroError("Error de conectividad de red.");
    }
  };

  const handleDeleteCobro = async (id: string) => {
    const confirm = window.confirm("¿Estás seguro de archivar este registro de suscripción?");
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/cobros/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setCobroSuccess("Recibo archivado exitosamente.");
        await fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleCobroEstado = async (cob: CobroDistribuidor) => {
    const nuevoEstado = cob.estado === "cobrado" ? "pendiente" : "cobrado";
    try {
      await fetch(`/api/admin/cobros/${cob.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cob,
          estado: nuevoEstado
        })
      });
      await fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  // ── OFERTAS DE OLIVIA HANDLERS ──
  const handleCreateOferta = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfertaSuccess(null);
    setOfertaError(null);

    if (!ofertaNombre) {
      setOfertaError("El nombre de la promoción del servicio de OlivIA es requerido.");
      return;
    }

    try {
      const res = await fetch("/api/promociones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-negocio-id": "olivia-system"
        },
        body: JSON.stringify({
          nombre: ofertaNombre,
          descripcion: ofertaDesc,
          precio: Number(ofertaPrecio),
          igv_incluido: true,
          activa: true
        })
      });

      if (res.ok) {
        setOfertaSuccess(`¡Servicio corporativo "${ofertaNombre}" registrado en nuestra cartera!`);
        setOfertaNombre("");
        setOfertaDesc("");
        setOfertaPrecio("120");
        await fetchAdminData();
      } else {
        setOfertaError("No se pudo crear la promoción comercial.");
      }
    } catch (err) {
      setOfertaError("Error.");
    }
  };

  const handleDeleteOferta = async (id: string) => {
    const confirm = window.confirm("¿Archivar este paquete de servicio?");
    if (!confirm) return;
    try {
      await fetch(`/api/promociones/${id}?negocio_id=olivia-system`, {
        method: "DELETE",
        headers: { "x-negocio-id": "olivia-system" }
      });
      await fetchAdminData();
      setOfertaSuccess("Servicio comercial actualizado.");
    } catch (e) {
      console.error(e);
    }
  };

  const openEditNegocio = (neg: Negocio) => {
    setEditingNeg(neg);
    setEditNegNombre(neg.nombre);
    setEditNegInstancia(neg.whatsapp_instancia || "");
    setEditNegNumero(neg.whatsapp_numero || "");
    setEditNegZona(neg.zona_reparto || "");
    setEditNegActivo(neg.activo !== false);
  };

  const openEditUser = (usr: Usuario) => {
    setEditingUser(usr);
    setEditUserNombre(usr.nombre);
    setEditUserUsername(usr.username);
    setEditUserPassword("");
    setEditUserRol(usr.rol);
    setEditUserNegocioId(usr.negocio_id || "");
  };

  // Total summary calculation
  const totalCobrado = cobros
    .filter(c => c.estado === "cobrado")
    .reduce((sum, c) => sum + c.monto, 0);

  return (
    <div className="space-y-6">
      {/* EXPLANATORY HERO CALLOUT WITH METRICS COMPASS */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 mt-1 shadow-inner">
              <ShieldCheck size={24} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-extrabold text-slate-100 flex items-center gap-2">
                Consola Central de Distribución de OlivIA
                <span className="p-1 px-2.5 bg-emerald-500/25 border border-emerald-500/40 rounded-full text-[9px] text-emerald-300 uppercase tracking-widest font-bold font-mono">
                  SÚPER ADMINISTRADOR
                </span>
              </h3>
              <p className="text-[12.5px] text-slate-300 leading-relaxed mt-1.5 max-w-2xl">
                Administra tus <strong>clientes comerciales</strong>, gestiona tus 
                propios <strong>leads de afiliación corporativos</strong>, rastrea cobros de planes activos 
                y promociona tus servicios de software desde un solo panel consolidado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700 font-mono">
            <div className="text-right">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Facturación Consolidada</p>
              <p className="text-lg font-extrabold text-emerald-400 leading-none mt-1">S/. {totalCobrado.toFixed(2)}</p>
              <p className="text-[9px] text-emerald-500/80 mt-1">Cobros Recibidos</p>
            </div>
            <div className="text-slate-700 text-xl font-bold">|</div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Metas</p>
              <p className="text-xs text-white font-bold mt-1">
                💼 {negocios.length} Empresas
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                🎯 {leadsOlivia.length} Prospectos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* REVOLUTIONARY MULTI TAB CATEGORY SELECTOR */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 gap-y-2 pb-px">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("negocios")}
            className={`pb-3 px-3 md:px-4 text-[12.5px] font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === "negocios"
                ? "border-emerald-600 text-emerald-700 bg-slate-100/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Building2 size={14} />
              1. Compañías de tu Red ({negocios.length})
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab("usuarios")}
            className={`pb-3 px-3 md:px-4 text-[12.5px] font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === "usuarios"
                ? "border-emerald-600 text-emerald-700 bg-slate-100/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              2. Usuarios ({usuarios.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("leads")}
            className={`pb-3 px-3 md:px-4 text-[12.5px] font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === "leads"
                ? "border-emerald-600 text-emerald-700 bg-slate-100/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Target size={14} />
              3. Mis Leads Corporativos ({leadsOlivia.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("cobros")}
            className={`pb-3 px-3 md:px-4 text-[12.5px] font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === "cobros"
                ? "border-emerald-600 text-emerald-700 bg-slate-100/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Wallet size={14} />
              4. Mis Cobros / Pagos ({cobros.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ofertas")}
            className={`pb-3 px-3 md:px-4 text-[12.5px] font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === "ofertas"
                ? "border-emerald-600 text-emerald-700 bg-slate-100/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Megaphone size={14} />
              5. Mis Ofertas OlivIA ({ofertasOlivia.length})
            </span>
          </button>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="p-1 px-3 bg-white hover:bg-slate-150 border border-slate-200 text-[11px] font-extrabold rounded-lg text-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all font-mono mb-2"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          <span>Sincronizar Panel</span>
        </button>
      </div>

      {/* DYNAMIC SUBSECTION PANEL CONTENT */}
      
      {/* ── SUB TAB 1: EMPRESAS CLIENTES COMPAÑIAS ── */}
      {activeTab === "negocios" && (
        <div className="space-y-6 animate-fade-in">
          {/* Branded welcome SaaS banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-850 p-5 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-indigo-500/20 border border-indigo-400/30 rounded-xl flex items-center justify-center text-indigo-300 shrink-0">
                <Brain size={22} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-[14px] font-extrabold text-white">Consola de Control Multi-Tenant · OlivIA Network</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-normal max-w-2xl">
                  Estás operando la distribución de OlivIA CRM. Tu empresa principal es <strong>OlivIA CRM Solutions</strong>, donde gestionas tus propias campañas, leads y planes comerciales. Usa esta consola para dar de alta clientes o auditar sus canales.
                </p>
              </div>
            </div>
            <button
              onClick={() => onImpersonate && onImpersonate("negocio-olivia-hq")}
              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11.5px] font-extrabold shadow-sm flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border border-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              🏠 Ir a Mi Espacio Corporativo
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Create form */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-[12.5px] font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus size={16} className="text-emerald-600" />
              Crear Nuevo Negocio
            </h4>

            {negSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-600" />
                <span>{negSuccess}</span>
              </div>
            )}
            {negError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                <XCircle size={14} className="text-rose-600" />
                <span>{negError}</span>
              </div>
            )}

            <form onSubmit={handleCreateNegocio} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Nombre Comercial / Empresa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Centro Odontológico Surco"
                  value={negNombre}
                  onChange={(e) => setNegNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12.5px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Instancia WhatsApp (Evolut. ID)
                </label>
                <input
                  type="text"
                  placeholder="odontosurg-inst (Se auto-genera si queda en blanco)"
                  value={negInstancia}
                  onChange={(e) => setNegInstancia(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-800 font-mono tracking-wide focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Celular WhatsApp Asociado
                </label>
                <input
                  type="text"
                  placeholder="ej. +51 912 345 678"
                  value={negNumero}
                  onChange={(e) => setNegNumero(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Zonas De Reparto / Cobertura
                </label>
                <input
                  type="text"
                  placeholder="Santiago de Surco, San Borja, Miraflores"
                  value={negZona}
                  onChange={(e) => setNegZona(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-extrabold rounded-lg tracking-wide transition-all select-none cursor-pointer"
              >
                Insertar Nueva Empresa
              </button>
            </form>
          </div>

          {/* Directory company listing */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h4 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={15} className="text-emerald-600" />
                Negocios Vinculados & Clientes Activos
              </h4>
              <span className="p-1 px-2.5 bg-emerald-100 text-emerald-800 text-[10px] uppercase font-mono font-extrabold rounded-lg">
                Consola General CRM Intel
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {negocios.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-[12px]">
                  No hay empresas dadas de alta en el sistema.
                </div>
              ) : (
                negocios.map(neg => {
                  const isCurrent = activeTenantId === neg.id;
                  const isAdminHq = neg.id === "negocio-olivia-hq";
                  return (
                    <div
                      key={neg.id}
                      className={`p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 gap-4 transition-all border-l-4 ${
                        isAdminHq
                          ? "bg-indigo-50/30 border-indigo-600 hover:bg-indigo-50/50"
                          : "border-transparent hover:border-emerald-500"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-sans">
                          <p className={`text-[13.5px] font-extrabold ${isAdminHq ? "text-indigo-950" : "text-slate-900"}`}>{neg.nombre}</p>
                          {isAdminHq ? (
                            <span className="px-2 py-0.5 text-[8.5px] font-black uppercase tracking-widest bg-indigo-600 text-white rounded shadow-sm">
                              ✨ Tu Negocio Principal
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 text-[8.5px] font-extrabold uppercase rounded border ${
                              neg.activo 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}>
                              {neg.activo ? "Activo" : "Inactivo"}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-[8.5px] font-mono font-bold bg-purple-100 border border-purple-200 text-purple-800 rounded uppercase">
                              Conectado
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-mono">
                          <span className={`px-1 py-0.5 rounded font-bold text-[9px] ${isAdminHq ? "bg-indigo-100/60 text-indigo-800" : "bg-slate-100 text-slate-600"}`}>
                            ID: {neg.id}
                          </span>
                          <span>Celular: <strong className="text-slate-700">{neg.whatsapp_numero || "No especificado"}</strong></span>
                          <span>Instancia: <code className="text-purple-600 font-bold">{neg.whatsapp_instancia}</code></span>
                        </div>

                        {neg.zona_reparto && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 font-sans">
                            <MapPin size={11} className="text-slate-400" />
                            <span>Cobertura: {neg.zona_reparto}</span>
                          </p>
                        )}
                        {isAdminHq && (
                          <p className="text-[10px] text-indigo-700 font-medium italic flex items-center gap-1 font-sans">
                            💡 Usa este espacio corporativo para registrar los prospectos de tu SaaS y tus planes comerciales.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 flex-shrink-0">
                        {onImpersonate && (
                          <button
                            onClick={() => onImpersonate(neg.id)}
                            className={`p-1.5 px-3 rounded-lg text-[11px] font-extrabold cursor-pointer flex items-center justify-center gap-1 shadow-sm hover:shadow transition-all ${
                              isAdminHq
                                ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border border-indigo-600 animate-pulse whitespace-nowrap"
                                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border border-emerald-600 whitespace-nowrap"
                            }`}
                          >
                            <ArrowRightLeft size={13} />
                            {isAdminHq ? "🏠 Ver Mi Tablero" : "🔑 Entrar & Administrar"}
                          </button>
                        )}
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              setSelectedProfileNeg(neg);
                              setActiveProfileTab("funcionalidades");
                            }}
                            className="p-1 px-[10px] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[11px] font-extrabold cursor-pointer flex items-center gap-1 transition-all whitespace-nowrap"
                            title="Ver Perfil de Negocio y Configuración de OlivIA"
                          >
                            👁️ Ver Perfil & Funcionalidades
                          </button>
                          <button
                            onClick={() => openEditNegocio(neg)}
                            className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteNegocio(neg.id, neg.nombre)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ── SUB TAB 2: USUARIOS DE ACCESO ── */}
      {activeTab === "usuarios" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-[12.5px] font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserPlus size={16} className="text-emerald-600" />
              Proveer Acceso de Usuario
            </h4>

            {userSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[11px] font-extrabold rounded-lg flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" />
                <span>{userSuccess}</span>
              </div>
            )}
            {userError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-extrabold rounded-lg flex items-center gap-2">
                <XCircle size={14} className="text-rose-600" />
                <span>{userError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUsuario} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Nombre Del Titular *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Dr. Katherine Silva"
                  value={userNombre}
                  onChange={(e) => setUserNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-[12px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Mail size={12} className="text-slate-400" />
                  Nombre de Usuario (Login) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="katherinedental"
                  value={userUsername}
                  onChange={(e) => setUserUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-[12px] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Key size={11} className="text-slate-400" />
                  Contraseña de Acceso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="clave-segura-123"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-[12px] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Vincular a Empresa / Comercio *
                </label>
                <select
                  required
                  value={userNegocioId}
                  onChange={(e) => setUserNegocioId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-[12px] text-slate-700 outline-none"
                >
                  <option value="">Seleccione empresa de enlace...</option>
                  {negocios.map(neg => (
                    <option key={neg.id} value={neg.id}>{neg.nombre} ({neg.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Rol / Permiso
                </label>
                <select
                  value={userRol}
                  onChange={(e) => setUserRol(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-[12.5px] text-slate-700 outline-none"
                >
                  <option value="cliente">Administrador de Comercio (Cliente)</option>
                  <option value="super_admin">Productor / Super Administrador Global</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-extrabold rounded-lg tracking-wide transition-all select-none cursor-pointer"
              >
                Generar Perfil de Acceso
              </button>
            </form>
          </div>

          {/* Directory users listing */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
              <h4 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Users size={15} className="text-emerald-700" />
                Cuentas de Acceso de Socios y Colaboradores
              </h4>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {usuarios.map(u => {
                const linkedNeg = negocios.find(n => n.id === u.negocio_id);
                return (
                  <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13.5px] font-extrabold text-slate-900">{u.nombre}</p>
                        <span className={`px-2 py-0.5 text-[8.5px] font-extrabold uppercase rounded border ${
                          u.rol === "super_admin"
                            ? "bg-purple-50 text-purple-700 border-purple-200 animate-pulse"
                            : "bg-teal-50 text-teal-700 border-teal-200"
                        }`}>
                          {u.rol === "super_admin" ? "Súper Admin / Distribuidor" : "Cliente"}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span className="bg-slate-100 font-mono text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                          Usuario: {u.username}
                        </span>
                        {linkedNeg ? (
                          <span className="flex items-center gap-1">
                            Empresa: <strong className="text-emerald-600 font-extrabold">{linkedNeg.nombre}</strong>
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Sin comercio asignado (Control Global)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => openEditUser(u)}
                        className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-[11px] font-extrabold cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteUsuario(u.id, u.nombre)}
                        disabled={u.username === "admin"}
                        className={`p-1.5 rounded-lg border flex items-center justify-center transition-all ${
                          u.username === "admin"
                            ? "opacity-35 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                            : "bg-slate-50 hover:bg-rose-50 border-slate-200 text-slate-400 hover:text-rose-600 cursor-pointer"
                        }`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SUB TAB 3: MIS PROPIOS LEADS DE DISTRIBUIDORA DE OLIVIA ── */}
      {activeTab === "leads" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-[12.5px] font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus size={16} className="text-emerald-600 animate-bounce" />
              Nuevo Interesado en OlivIA
            </h4>

            {leadSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[11px] font-bold rounded-lg">
                <span>{leadSuccess}</span>
              </div>
            )}
            {leadError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold rounded-lg">
                <span>{leadError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLeadOlivia} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Nombre Del Prospecto / Médico / Dueño *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Dra. Lucía Valdivia"
                  value={leadNombre}
                  onChange={(e) => setLeadNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Smartphone size={12} className="text-slate-400" />
                  Celular De Contacto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. +51 917 555 444"
                  value={leadTelefono}
                  onChange={(e) => setLeadTelefono(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12.5px] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Canal de Origen / Adquisición
                </label>
                <select
                  value={leadCanal}
                  onChange={(e) => setLeadCanal(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12.5px] text-slate-700 outline-none"
                >
                  <option value="Llamada en frío">Llamada telefónica directa</option>
                  <option value="Recomendado">Recomendado por otro socio</option>
                  <option value="Anuncio Facebook">Campaña de Marketing Digital</option>
                  <option value="WhatsApp directo">Contacto orgánico por WhatsApp</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-extrabold rounded-lg tracking-wide transition-all select-none cursor-pointer shadow-sm"
              >
                Inscribir Prospecto Comercial
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h4 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Target size={15} className="text-emerald-700" />
                Prospectos y Leads de Ventas: Software Asistencias OlivIA
              </h4>
              <span className="p-1 px-2.5 bg-purple-100 border border-purple-200 text-purple-800 text-[9px] uppercase font-mono font-bold rounded-lg animate-pulse">
                Súper_Admin Funnel
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {leadsOlivia.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-[12px]">
                  No has registrado Leads corporativos para OlivIA. Inserta uno a la izquierda.
                </div>
              ) : (
                leadsOlivia.map(l => (
                  <div key={l.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 gap-4 transition-all">
                    <div>
                      <p className="text-[13px] font-extrabold text-slate-900">{l.nombre}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[9px]">
                          📱 {l.telefono}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[9px]">
                          Canal: {l.red_social || "Llamada directa"}
                        </span>
                        <span>|</span>
                        <span>Registrado: {new Date(l.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteLeadOlivia(l.id)}
                      className="p-1.5 hover:p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-lg cursor-pointer transition-all duration-150"
                      title="Archivar lead corporativo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUB TAB 4: COBROS / SUSCRIPCIONES BILILING RECEIVING ── */}
      {activeTab === "cobros" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-[12.5px] font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus size={16} className="text-emerald-600" />
              Registrar Recibo / Cobro Plan
            </h4>

            {cobroSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[11px] font-bold rounded-lg">
                <span>{cobroSuccess}</span>
              </div>
            )}
            {cobroError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold rounded-lg">
                <span>{cobroError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCobro} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Cliente / Empresa Facturada *
                </label>
                <select
                  required
                  value={cobroNegId}
                  onChange={(e) => setCobroNegId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 focus:outline-none"
                >
                  <option value="">Selecciona compañía...</option>
                  {negocios.map(neg => (
                    <option key={neg.id} value={neg.id}>{neg.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Descripción Del Plan de Software *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Setup de Evolution de WhatsApp + Servidor n8n"
                  value={cobroPlan}
                  onChange={(e) => setCobroPlan(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12.5px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <DollarSign size={12} className="text-emerald-600 font-extrabold" />
                  Monto Recibido o Facturado (S/ Soles) *
                </label>
                <input
                  type="number"
                  required
                  value={cobroMonto}
                  onChange={(e) => setCobroMonto(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12.5px] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Estado Del Cobro
                </label>
                <select
                  value={cobroEstado}
                  onChange={(e) => setCobroEstado(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12.5px] text-slate-700 outline-none"
                >
                  <option value="cobrado">✅ Cobrado / Pagado por Cliente</option>
                  <option value="pendiente">⏳ Pendiente de Pago Solicitado</option>
                  <option value="vencido">⚠️ Factura Vencida (Impago)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-100 text-[12.5px] font-extrabold rounded-lg tracking-wide transition-all cursor-pointer"
              >
                Generar Recibo de Cobro
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h4 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Wallet size={15} className="text-emerald-700 font-bold" />
                Historial de Recibos, Cobranzas & Membresías de la Red CRM
              </h4>
              <span className="p-1 px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] uppercase font-mono font-bold rounded-lg">
                Auditoría Global
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
              {cobros.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-[12.5px]">
                  Buscando cobros registrados...
                </div>
              ) : (
                cobros.map(cob => {
                  const company = negocios.find(n => n.id === cob.negocio_id);
                  return (
                    <div key={cob.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-extrabold text-slate-900">{cob.plan_nombre}</p>
                          <button
                            onClick={() => toggleCobroEstado(cob)}
                            className={`px-2 py-0.5 text-[8.5px] font-black uppercase rounded border transition-all cursor-pointer ${
                              cob.estado === "cobrado"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : cob.estado === "pendiente"
                                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            }`}
                            title="Haz clic para alternar el estado"
                          >
                            {cob.estado}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          Empresa: <strong className="text-emerald-700 font-extrabold">{company ? company.nombre : `ID: ${cob.negocio_id}`}</strong>
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Fecha transacción: {new Date(cob.fecha_pago).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[13.5px] font-mono font-black text-slate-900">S/. {cob.monto.toFixed(2)}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-black uppercase">soles peruanos</p>
                        </div>

                        <button
                          onClick={() => handleDeleteCobro(cob.id)}
                          className="p-1 px-[7px] text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg cursor-pointer"
                          title="Archivar"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUB TAB 5: OFERTAS & PROMOCIONES COR POR ATIVAS DE OLIVIA ── */}
      {activeTab === "ofertas" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-[12.5px] font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus size={16} className="text-emerald-600" />
              Nueva Promo de Servicios
            </h4>

            {ofertaSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-205 text-[11px] font-bold rounded-lg">
                <span>{ofertaSuccess}</span>
              </div>
            )}
            {ofertaError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-800 border border-rose-205 text-[11px] font-bold rounded-lg">
                <span>{ofertaError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOferta} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Nombre Del Plan / Promoción / Feature de OlivIA *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Plan Clínicas Médicas Automáticas"
                  value={ofertaNombre}
                  onChange={(e) => setOfertaNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Descripción Del Servicio / Paquete *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="ej. Bot con agendamiento ilimitado y CRM con tableros de citas médicas por WhatsApp..."
                  value={ofertaDesc}
                  onChange={(e) => setOfertaDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Precio Sugerido Mensual (S/ Soles)
                </label>
                <input
                  type="number"
                  required
                  value={ofertaPrecio}
                  onChange={(e) => setOfertaPrecio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-extrabold rounded-lg tracking-wide transition-all select-none cursor-pointer shadow-sm"
              >
                Inscribir Plan Comercial
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h4 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Megaphone size={15} className="text-emerald-700" />
                Mis Promociones & Planes de Venta (Nuestros Servicios de OlivIA)
              </h4>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {ofertasOlivia.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-[12.5px]">
                  No has registrado paquetes de servicios comerciales para OlivIA.
                </div>
              ) : (
                ofertasOlivia.map(of => (
                  <div key={of.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 gap-4 transition-all">
                    <div className="space-y-1">
                      <p className="text-[13px] font-extrabold text-slate-900">{of.nombre}</p>
                      <p className="text-[11.5px] text-slate-600 leading-normal">{of.descripcion}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {of.id}</p>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[13.5px] font-bold text-slate-800 font-mono">S/. {of.precio}</p>
                        <span className="text-[9.5px] text-slate-400 uppercase tracking-wide font-black">mensual</span>
                      </div>

                      <button
                        onClick={() => handleDeleteOferta(of.id)}
                        className="p-1 px-[7px] text-slate-400 hover:text-rose-600 border border-slate-200 rounded-lg cursor-pointer"
                        title="Archivar"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}


      {/* ── MODAL OVERLAY: EDIT NEGOCIO ── */}
      {editingNeg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h4 className="text-[13.5px] font-extrabold flex items-center gap-2">
                <Building2 size={16} className="text-emerald-400" />
                Editar Parámetros de la Empresa
              </h4>
              <button 
                onClick={() => setEditingNeg(null)} 
                className="text-slate-400 hover:text-white transition-all text-[15px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateNegocio} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nombre Comercial / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={editNegNombre}
                  onChange={(e) => setEditNegNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-lg text-[13px] text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Instancia WhatsApp (Evolution ID)
                </label>
                <input
                  type="text"
                  required
                  value={editNegInstancia}
                  onChange={(e) => setEditNegInstancia(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-lg text-[12.5px] text-purple-700 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Número de WhatsApp Vinculado
                </label>
                <input
                  type="text"
                  value={editNegNumero || ""}
                  onChange={(e) => setEditNegNumero(e.target.value)}
                  placeholder="ej. +51 911 222 333"
                  className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-lg text-[13px] text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin size={11} className="text-slate-400" />
                  Zonas de Cobertura de Pedidos
                </label>
                <input
                  type="text"
                  value={editNegZona || ""}
                  onChange={(e) => setEditNegZona(e.target.value)}
                  placeholder="ej. San Isidro, Surco, Lince"
                  className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-lg text-[12px] text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="edit_neg_activo"
                  checked={editNegActivo}
                  onChange={(e) => setEditNegActivo(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="edit_neg_activo" className="text-[12.5px] font-bold text-slate-700 cursor-pointer select-none">
                  Empresa Activa / Operando en la Red Olivia
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingNeg(null)}
                  className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-[12px] font-bold rounded-lg text-slate-700 cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-extrabold rounded-lg cursor-pointer transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL OVERLAY: EDIT USER ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h4 className="text-[13.5px] font-extrabold flex items-center gap-2">
                <UserCheck size={16} className="text-emerald-400" />
                Modificar Credenciales de Acceso
              </h4>
              <button 
                onClick={() => setEditingUser(null)} 
                className="text-slate-400 hover:text-white transition-all text-[15px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUsuario} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nombre Completo / Titular *
                </label>
                <input
                  type="text"
                  required
                  value={editUserNombre}
                  onChange={(e) => setEditUserNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-lg text-[13px] text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nombre de Usuario (Login) *
                </label>
                <input
                  type="text"
                  required
                  value={editUserUsername}
                  onChange={(e) => setEditUserUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-lg text-[13px] text-emerald-700 outline-none font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña (Dejar vacío para no cambiar)
                </label>
                <input
                  type="text"
                  placeholder="Escribe una nueva clave si deseas cambiarla"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-lg text-[12.5px] text-slate-900 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-sans">
                  Cambiar Negocio Vinculado
                </label>
                <select
                  value={editUserNegocioId}
                  onChange={(e) => setEditUserNegocioId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-lg text-[13px] text-slate-700 outline-none"
                >
                  <option value="">Acceso Global / Distribuidor (Sin Negocio)</option>
                  {negocios.map(neg => (
                    <option key={neg.id} value={neg.id}>
                      {neg.nombre} ({neg.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nivel de Autorización (Rol)
                </label>
                <select
                  value={editUserRol}
                  onChange={(e) => setEditUserRol(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-lg text-[13.5px] text-slate-700 outline-none"
                >
                  <option value="cliente">Administrador de Comercio (Cliente regular)</option>
                  <option value="super_admin">Distribuidor / Super Administrador del Sistema</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-[12px] font-bold rounded-lg text-slate-700 cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-extrabold rounded-lg cursor-pointer transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL OVERLAY: BUSINESS PROFILE (PERFIL DE NEGOCIO Y FUNCIONALIDADES DE OLIVIA) ── */}
      {selectedProfileNeg && (() => {
        const negId = selectedProfileNeg.id;
        const currentFuncs = negocioFuncs[negId] || {
          "ia_generativa": false,
          "pedidos_realtime": false,
          "agendamiento": false,
          "recordatorios": false,
          "fidelizacion": false
        };
        const currentPrompt = botPrompts[negId] || `Eres OlivIA, asistente virtual de ${selectedProfileNeg.nombre}. Ayuda a tus clientes amablemente y responde sus consultas de manera profesional.`;

        // Filter cobros for this business only
        const businessCobros = cobros.filter(c => c.negocio_id === negId);
        const businessTotalPaid = businessCobros.filter(c => c.estado === "cobrado").reduce((sum, c) => sum + c.monto, 0);
        const businessTotalPending = businessCobros.filter(c => c.estado === "pendiente").reduce((sum, c) => sum + c.monto, 0);

        const handleToggleFunc = (key: string) => {
          const updated = {
            ...negocioFuncs,
            [negId]: {
              ...currentFuncs,
              [key]: !currentFuncs[key]
            }
          };
          saveNegocioFuncs(updated);
        };

        const handleSavePrompt = (txt: string) => {
          const updated = {
            ...botPrompts,
            [negId]: txt
          };
          saveBotPrompts(updated);
          alert("¡Personalidad de OlivIA IA guardada para esta compañía con éxito!");
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in my-8 flex flex-col max-h-[90vh]">
              {/* BRANDED GRADIENT HERO BANNER */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 relative shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl flex items-center justify-center shadow-lg text-indigo-300 shrink-0">
                      <Building2 size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-2.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-[9px] text-blue-300 font-extrabold tracking-widest uppercase font-mono">
                          Perfil de Negocio
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border ${
                          selectedProfileNeg.activo 
                            ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                            : "bg-slate-500/20 border-slate-400/30 text-slate-300"
                        }`}>
                          {selectedProfileNeg.activo ? "Canal Operable" : "Inactivo"}
                        </span>
                      </div>
                      <h4 className="text-xl font-extrabold text-white mt-1.5 flex items-center gap-2">
                        {selectedProfileNeg.nombre}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-slate-300 text-[11px] font-mono">
                        <span>ID Empresa: <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">{negId}</code></span>
                        <span>Instancia de Whatsapp: <code className="text-purple-300 font-bold">{selectedProfileNeg.whatsapp_instancia}</code></span>
                        <span>Celular: <strong>{selectedProfileNeg.whatsapp_numero || "No especificado"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* IMPERSONATION QUICK PORTAL */}
                  <div className="flex items-center gap-2">
                    {onImpersonate && (
                      <button
                        onClick={() => {
                          setSelectedProfileNeg(null);
                          onImpersonate(negId);
                        }}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
                      >
                        <ArrowRightLeft size={14} />
                        🔑 Administrar Entorno
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedProfileNeg(null)}
                      className="w-9 h-9 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all rounded-xl flex items-center justify-center text-[15px] font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION SUB NAVIGATION */}
              <div className="bg-slate-50 border-b border-slate-100 flex items-center justify-between px-6 py-2 shrink-0">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveProfileTab("funcionalidades")}
                    className={`py-2 px-4 text-[12px] font-bold border-b-2 transition-all cursor-pointer ${
                      activeProfileTab === "funcionalidades"
                        ? "border-indigo-600 text-indigo-700 font-extrabold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Brain size={14} />
                      1. Funcionalidades OlivIA
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveProfileTab("pagos")}
                    className={`py-2 px-4 text-[12px] font-bold border-b-2 transition-all cursor-pointer ${
                      activeProfileTab === "pagos"
                        ? "border-indigo-600 text-indigo-700 font-extrabold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <CreditCard size={14} />
                      2. Membresías & Pagos ({businessCobros.length})
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveProfileTab("credenciales")}
                    className={`py-2 px-4 text-[12px] font-bold border-b-2 transition-all cursor-pointer ${
                      activeProfileTab === "credenciales"
                        ? "border-indigo-600 text-indigo-700 font-extrabold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings size={14} />
                      3. Datos Técnicos & Métricas
                    </span>
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>Regulado por OlivIA Red</span>
                </div>
              </div>

              {/* SCROLLABLE MODAL CORE BODY */}
              <div className="flex-grow p-6 overflow-y-auto bg-slate-50/50">
                
                {/* ─ TAB 1: FUNCIONALIDADES OLIVIA ─ */}
                {activeProfileTab === "funcionalidades" && (
                  <div className="space-y-6">
                    {/* Explication header */}
                    <div className="p-4 bg-indigo-50/80 border border-indigo-100/60 rounded-xl">
                      <p className="text-[12.5px] text-indigo-950 font-medium leading-relaxed">
                        Estas son las capacidades de Inteligencia Artificial que OlivIA opera autónomamente para <strong>{selectedProfileNeg.nombre}</strong>. Aquí puedes activar/desactivar módulos clave de servicio de acuerdo con el plan comercial acordado.
                      </p>
                    </div>

                    {/* Features checklist grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* IA Generativa */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-4 hover:border-indigo-300 transition-all shadow-sm">
                        <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600 shrink-0">
                          <Brain size={20} />
                        </div>
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[13px] font-extrabold text-slate-900">IA Generativa (Gemini PRO)</h5>
                            <button
                              onClick={() => handleToggleFunc("ia_generativa")}
                              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                                currentFuncs.ia_generativa ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                              }`}
                            >
                              <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal">
                            Asistencia conversacional inteligente con personalidad única. Responde dudas, preguntas frecuentes y mantiene el diálogo activo.
                          </p>
                          <span className="inline-block mt-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                            {currentFuncs.ia_generativa ? "Habilitado" : "Apagado"}
                          </span>
                        </div>
                      </div>

                      {/* Pedidos */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-4 hover:border-indigo-300 transition-all shadow-sm">
                        <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                          <DollarSign size={20} />
                        </div>
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[13px] font-extrabold text-slate-900">Recepción de Pedidos y Delivery</h5>
                            <button
                              onClick={() => handleToggleFunc("pedidos_realtime")}
                              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                                currentFuncs.pedidos_realtime ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                              }`}
                            >
                              <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal">
                            Analiza frases y texto libre del cliente de manera autónoma para generar carritos integrales de compra y despachar a cocina.
                          </p>
                          <span className="inline-block mt-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                            {currentFuncs.pedidos_realtime ? "Habilitado" : "Apagado"}
                          </span>
                        </div>
                      </div>

                      {/* Agendamientos */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-4 hover:border-indigo-300 transition-all shadow-sm">
                        <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                          <Users size={20} />
                        </div>
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[13px] font-extrabold text-slate-900">Agendamiento de Citas Automatizado</h5>
                            <button
                              onClick={() => handleToggleFunc("agendamiento")}
                              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                                currentFuncs.agendamiento ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                              }`}
                            >
                              <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal">
                            Consultor de disponibilidad horaria que reserva turnos (ej. citas dentales), agendando a la base de datos sin fricciones.
                          </p>
                          <span className="inline-block mt-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                            {currentFuncs.agendamiento ? "Habilitado" : "Apagado"}
                          </span>
                        </div>
                      </div>

                      {/* Recordatorios */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-4 hover:border-indigo-300 transition-all shadow-sm">
                        <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 shrink-0">
                          <Smartphone size={20} />
                        </div>
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[13px] font-extrabold text-slate-900">Recordatorios de WhatsApp IA</h5>
                            <button
                              onClick={() => handleToggleFunc("recordatorios")}
                              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                                currentFuncs.recordatorios ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                              }`}
                            >
                              <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal">
                            Dispara mensajes automáticos preventivos con 24h de antelación para confirmar asistencia o avisar el vencimiento de pagos.
                          </p>
                          <span className="inline-block mt-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">
                            {currentFuncs.recordatorios ? "Habilitado" : "Apagado"}
                          </span>
                        </div>
                      </div>

                      {/* Fidelización */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-4 hover:border-indigo-300 transition-all shadow-sm col-span-1 md:col-span-2">
                        <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600 shrink-0">
                          <Megaphone size={20} />
                        </div>
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[13px] font-extrabold text-slate-900">Fidelización & Difusión Masiva de Promociones</h5>
                            <button
                              onClick={() => handleToggleFunc("fidelizacion")}
                              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                                currentFuncs.fidelizacion ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                              }`}
                            >
                              <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                            </button>
                          </div>
                          <p className="text-[11.5px] text-slate-500 leading-normal">
                            Permite estructurar campañas de marketing dirigidas de OlivIA para enviar ofertas de reactivación a prospectos inactivos directo al WhatsApp.
                          </p>
                          <span className="inline-block mt-1 text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase">
                            {currentFuncs.fidelizacion ? "Habilitado" : "Apagado"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC SYSTEM PROMPT SECTION (PERSONALIDAD) */}
                    <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 mt-4 space-y-4">
                      <div>
                        <h5 className="text-[14px] font-extrabold text-slate-100 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                          Personalidad del Chatbot OlivIA & Prompt del Sistema
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Este prompt direcciona las respuestas automatizadas de la Inteligencia Artificial cuando opera el canal de este negocio. Define el tono, las respuestas, y los límites del bot.
                        </p>
                      </div>

                      <div>
                        <textarea
                          id="bot-personality"
                          rows={4}
                          defaultValue={currentPrompt}
                          className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl text-[12px] p-4.5 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Introduce las directivas generales de OlivIA para con este cliente..."
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById("bot-personality") as HTMLTextAreaElement;
                            if (el) {
                              handleSavePrompt(el.value);
                            }
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11.5px] font-extrabold rounded-lg transition-all cursor-pointer shadow-md"
                        >
                          💾 Guardar Prompts de OlivIA
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─ TAB 2: MEMBRESÍAS & HISTORIAL DE PAGOS DE LA COMPAÑÍA ─ */}
                {activeProfileTab === "pagos" && (
                  <div className="space-y-6">
                    {/* Metrics card indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Total Cobrado</p>
                          <p className="text-lg font-mono font-black text-slate-800 font-bold">S/. {businessTotalPaid.toFixed(2)}</p>
                        </div>
                        <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                          <CheckCircle size={18} />
                        </span>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-slate-400 animate-pulse">Pendiente Recibir</p>
                          <p className="text-lg font-mono font-black text-amber-700 font-bold">S/. {businessTotalPending.toFixed(2)}</p>
                        </div>
                        <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                          <RefreshCw size={18} />
                        </span>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-slate-400 font-sans">Cobros Totales</p>
                          <p className="text-lg font-bold text-slate-800">{businessCobros.length} Transacciones</p>
                        </div>
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <CreditCard size={18} />
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Register cobro form prefilled for this business */}
                      <div className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
                        <h5 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Plus size={15} />
                          Cobrar Nueva Mensualidad
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Genera un recibo de cobro financiero por renovación de licencia, soporte de servidores o servicios de software de OlivIA.
                        </p>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                              Plan / Servicio De Pago
                            </label>
                            <input
                              type="text"
                              id="quick_cob_plan"
                              defaultValue="Plan Renovación OlivIA Software + Evolution Instancia"
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-800 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                              Monto del Recibo (S/)
                            </label>
                            <input
                              type="number"
                              id="quick_cob_monto"
                              defaultValue="150"
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                              Estado de Pago
                            </label>
                            <select
                              id="quick_cob_estado"
                              defaultValue="cobrado"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12.5px] text-slate-700 focus:outline-none"
                            >
                              <option value="cobrado">✅ Cobrado / Recibido</option>
                              <option value="pendiente">⏳ Pendiente</option>
                              <option value="vencido">⚠️ Factura Vencida (Impago)</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              const planEl = document.getElementById("quick_cob_plan") as HTMLInputElement;
                              const montoEl = document.getElementById("quick_cob_monto") as HTMLInputElement;
                              const estadoEl = document.getElementById("quick_cob_estado") as HTMLSelectElement;

                              if (planEl && montoEl && estadoEl) {
                                try {
                                  const res = await fetch("/api/admin/cobros", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      negocio_id: negId,
                                      plan_nombre: planEl.value,
                                      monto: Number(montoEl.value),
                                      estado: estadoEl.value
                                    })
                                  });
                                  if (res.ok) {
                                    alert("¡Recibo y cobro financiero emitido correctamente!");
                                    await fetchAdminData();
                                  } else {
                                    alert("Error al emitir el recibo de cobco.");
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold rounded-lg tracking-wide transition-all cursor-pointer"
                          >
                            Registrar Cobro para este Comercio
                          </button>
                        </div>
                      </div>

                      {/* Filtered payment history */}
                      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[350px]">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                          <h6 className="text-[11.5px] font-extrabold text-slate-800 uppercase tracking-wider">
                            Pólizas & Cobros Registrados
                          </h6>
                        </div>

                        <div className="divide-y divide-slate-100 overflow-y-auto flex-grow">
                          {businessCobros.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-[12px] italic">
                              No hay cobros registrados aún para esta compañía cliente.
                            </div>
                          ) : (
                            businessCobros.map(cob => (
                              <div key={cob.id} className="p-3 px-4 flex items-center justify-between hover:bg-slate-50/50 gap-4">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-[12.5px] font-extrabold text-slate-900 leading-normal">{cob.plan_nombre}</p>
                                    <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded border ${
                                      cob.estado === "cobrado"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : "bg-amber-50 text-amber-700 border-amber-100"
                                    }`}>
                                      {cob.estado}
                                    </span>
                                  </div>
                                  <p className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                                    Transacción ID: {cob.id} • {new Date(cob.fecha_pago).toLocaleDateString()}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-[13px] font-mono font-extrabold text-slate-800">S/. {cob.monto.toFixed(2)}</p>
                                  <p className="text-[8.5px] text-slate-400 font-bold uppercase">Soles</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─ TAB 3: CREDENCIALES & MÉTRICAS DETALLADAS DEL BOT ─ */}
                {activeProfileTab === "credenciales" && (
                  <div className="space-y-6">
                    {/* Metrics simulation widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Active conversations count */}
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conversaciones</p>
                        <p className="text-2xl font-black text-indigo-700 mt-1 font-mono">
                          {negId === "negocio-pe-1234" ? "42" : negId === "negocio-dent-5678" ? "28" : "15"}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">● Conexión Activa</p>
                      </div>

                      {/* Orders mapped automatically */}
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pedidos / Leads Mapeados</p>
                        <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                          {negId === "negocio-pe-1234" ? "18" : negId === "negocio-dent-5678" ? "11" : "6"}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Conversión: 33%</p>
                      </div>

                      {/* AI Accuracy */}
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asistencia de IA</p>
                        <p className="text-2xl font-black text-purple-700 mt-1 font-mono">98.4%</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Precisión Gemini</p>
                      </div>

                      {/* Latency */}
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latencia de Respuesta</p>
                        <p className="text-2xl font-black text-slate-800 mt-1 font-mono">1.2s</p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">Servidor óptimo</p>
                      </div>
                    </div>

                    {/* Webhook credentials structure info */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                      <div>
                        <h6 className="text-[13px] font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Settings size={16} className="text-slate-550" />
                          Seguridad e Integración Técnica (Servidores & Webhooks)
                        </h6>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Esta configuración asocia la instancia de Evolution API de WhatsApp del negocio y el webhook de n8n para despachar las respuestas automáticas de OlivIA.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11.5px] font-mono">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                          <p className="font-sans font-bold text-slate-400 text-[10px] uppercase">WhatsApp QR Instancia</p>
                          <p className="font-extrabold text-slate-900 break-all">{selectedProfileNeg.whatsapp_instancia || "instancia-id-pendiente"}</p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                          <p className="font-sans font-bold text-slate-400 text-[10px] uppercase">Webhook Receptor n8n</p>
                          <p className="font-extrabold text-purple-700 break-all">https://n8n.tuservidor.com/webhook/olivia-wa?tenant={negId}</p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                          <p className="font-sans font-bold text-slate-400 text-[10px] uppercase">Client Token de Seguridad</p>
                          <p className="text-slate-800 break-all">tok_olivia_sec_{negId.slice(-6)}</p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 flex items-center justify-between">
                          <div>
                            <p className="font-sans font-bold text-slate-400 text-[10px] uppercase">Estado de Sincronización</p>
                            <p className="font-bold text-emerald-650">Conectado con Evolution API</p>
                          </div>
                          <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-pulse border-2 border-white shadow-md"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS */}
              <div className="p-4 px-6 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
                <p className="text-[11px] text-slate-500 font-medium font-sans">
                  Sincronizado con base de datos en tiempo real.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedProfileNeg(null)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-[12px] font-bold rounded-lg text-slate-700 cursor-pointer transition-all"
                  >
                    Cerrar Detalle de Perfil
                  </button>
                  {onImpersonate && (
                    <button
                      onClick={() => {
                        setSelectedProfileNeg(null);
                        onImpersonate(negId);
                      }}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-extrabold rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                    >
                      🔑 Iniciar Sesión en esta Cuenta
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
