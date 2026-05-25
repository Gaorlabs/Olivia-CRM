import React, { useState, useEffect } from "react";
import { Bell, ShieldCheck, LogOut, Building, ShieldAlert, Menu } from "lucide-react";
import { Badge } from "./ui/Badge.tsx";

interface TopbarProps {
  title: string;
  user: any;
  tenantId: string;
  setTenantId: (id: string) => void;
  onLogout: () => void;
  onMenuToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ title, user, tenantId, setTenantId, onLogout, onMenuToggle }) => {
  const [negociosList, setNegociosList] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.rol === "super_admin") {
      // Fetch dynamic businesses on load
      const loadNegocios = async () => {
        try {
          const res = await fetch("/api/admin/negocios");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setNegociosList(data);
            }
          }
        } catch (e) {
          console.error("Error cargando negocios en Topbar selector:", e);
        }
      };
      
      loadNegocios();
      // Polling or simple periodic check to keep list hot
      const interval = setInterval(loadNegocios, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Fallback default list if database is reading
  const defaultMapping = [
    { id: "negocio-pe-1234", nombre: "🍗 Broastería Lima S.A." },
    { id: "negocio-dent-555", nombre: "🦷 Clínica Dental Olivia" },
    { id: "negocio-prod-777", nombre: "🌿 Productos Orgánicos Olivia" }
  ];

  const getBusinessDecoratedName = (neg: any) => {
    const name = neg.nombre || neg.name || "";
    if (neg.id === "negocio-pe-1234" || name.toLowerCase().includes("broaster")) {
      return `🍗 ${name}`;
    }
    if (neg.id === "negocio-dent-555" || name.toLowerCase().includes("dental") || name.toLowerCase().includes("clínica") || name.toLowerCase().includes("dent")) {
      return `🦷 ${name}`;
    }
    if (neg.id === "negocio-prod-777" || name.toLowerCase().includes("orgán") || name.toLowerCase().includes("natural") || name.toLowerCase().includes("bio") || name.toLowerCase().includes("hoja")) {
      return `🌿 ${name}`;
    }
    return `💼 ${name}`;
  };

  const currentList = negociosList.length > 0 ? negociosList : defaultMapping;
  const match = currentList.find(b => b.id === tenantId);
  const currentBusinessName = match ? getBusinessDecoratedName(match) : "💼 Comercio Vinculado";

  const handleSelectTenant = (id: string) => {
    localStorage.setItem("olivia_tenant_id", id);
    setTenantId(id);
  };

  return (
    <div className="h-[54px] bg-[var(--bg0)] border-b border-[var(--bd)] flex items-center justify-between px-6 flex-shrink-0 select-none">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="md:hidden p-1.5 rounded-lg hover:bg-[var(--bg1)]">
            <Menu size={20} className="text-[var(--t1)]" />
          </button>
        )}
        <div className="text-[13.5px] font-bold text-[var(--t0)]">
          {title}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* MULTI TENANT SELECTOR */}
        {user && user.rol === "super_admin" ? (
          <div className="flex items-center gap-2 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 px-2.5 py-1.5 rounded-lg transition-all shadow-sm">
            <Building size={13.5} className="text-emerald-700 font-extrabold" />
            <select
              value={tenantId}
              onChange={(e) => handleSelectTenant(e.target.value)}
              className="bg-transparent text-[11.5px] font-extrabold text-slate-800 focus:outline-none cursor-pointer pr-1 leading-tight"
            >
              {currentList.map((b) => (
                <option key={b.id} value={b.id} className="font-sans font-semibold text-[12px] bg-white text-slate-900">
                  {getBusinessDecoratedName(b)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <Badge variant="green" className="flex items-center gap-1.5 py-1.5 px-3">
            <Building size={12} className="text-emerald-600" />
            <span className="font-extrabold text-[11px] text-emerald-800 leading-none">{currentBusinessName}</span>
          </Badge>
        )}

        <Badge variant="green" className="flex items-center gap-1.5 py-1.5">
          <ShieldCheck size={12} className="text-[var(--grn)] pulsing-dot" />
          <span className="font-extrabold">Bot OlivIA Activo</span>
        </Badge>

        {/* LOGGED USER PROFILE PANEL */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-[var(--bd)]">
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-bold text-[var(--t0)] leading-tight">{user.nombre}</p>
              <p className="text-[9.5px] text-[var(--t2)] font-semibold uppercase tracking-wider leading-none">
                {user.rol === "super_admin" ? "Súper Admin" : "Socio / Cliente"}
              </p>
            </div>
            
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="p-1.5 bg-slate-100 hover:bg-rose-50 border border-slate-200 rounded-lg text-slate-600 hover:text-rose-600 transition-all cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
