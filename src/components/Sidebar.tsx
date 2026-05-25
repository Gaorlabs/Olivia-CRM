import React from "react";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  MessageSquare,
  Megaphone,
  Sliders,
  QrCode,
  Smartphone,
  Shield
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  whatsappConectado: boolean;
  instanceName: string;
  user: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setTab,
  whatsappConectado,
  instanceName,
  user
}) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, category: "Principal" },
    { id: "leads", label: "Leads", icon: Users, category: "Principal" },
    { id: "pedidos", label: "Pedidos", icon: ShoppingCart, category: "Principal" },
    { id: "conversaciones", label: "Conversaciones", icon: MessageSquare, category: "Principal" },
    { id: "promociones", label: "Promociones", icon: Megaphone, category: "Automatización" },
    { id: "bot", label: "Config. Bot", icon: Sliders, category: "Automatización" },
    { id: "evolution", label: "Evolution API", icon: QrCode, category: "Automatización" }
  ];

  if (user && user.rol === "super_admin") {
    menuItems.push({ id: "admin", label: "Consola Admin", icon: Shield, category: "Automatización" });
  }

  // Group items by category
  const categories = ["Principal", "Automatización"];

  return (
    <div className="flex w-[206px] min-w-[206px] bg-[var(--bg0)] border-r border-[var(--bd)] flex-col h-full select-none">
      {/* BRANDING HEADER */}
      <div className="p-4 border-b border-[var(--bd)] flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] bg-[var(--grn)] rounded-lg flex items-center justify-center shadow-md">
          <Smartphone size={16} className="text-white" />
        </div>
        <div>
          <div className="text-[13px] font-bold tracking-tight text-[var(--t0)]">Oliv<span className="text-[var(--grn)] font-extrabold">IA</span> CRM</div>
          <div className="text-[10px] text-[var(--t2)] font-medium uppercase tracking-wider">Panel de control</div>
        </div>
      </div>

      {/* ITEMS LIST */}
      <div className="flex-1 py-3 overflow-y-auto">
        {categories.map(cat => (
          <div key={cat} className="mb-4">
            <div className="px-5 py-1 text-[10px] font-bold text-[var(--t2)] uppercase tracking-widest">
              {cat}
            </div>
            <div className="mt-1 space-y-0.5">
              {menuItems
                .filter(item => item.category === cat)
                .map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={`w-full flex items-center gap-3 px-[15px] py-2.5 text-[12.5px] border-l-2 transition-all cursor-pointer text-left ${
                        isActive
                          ? "bg-[var(--bg1)] text-[var(--grn-d)] font-semibold border-[var(--grn)]"
                          : "text-[var(--t1)] border-transparent hover:bg-[var(--bg1)] hover:text-[var(--t0)]"
                      }`}
                    >
                      <Icon size={16} className={isActive ? "text-[var(--grn)]" : "text-[var(--t2)]"} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER: EVOLUTION STATUS INDICATOR */}
      <div className="p-3 border-t border-[var(--bd)] bg-[var(--bg1)]">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${
              whatsappConectado ? "bg-[var(--grn)] pulsing-dot shadow-[0_0_8px_var(--grn)]" : "bg-[var(--t2)]"
            }`}
          />
          <div className="truncate">
            <div className="text-[11.5px] font-semibold text-[var(--t1)] truncate">
              {whatsappConectado ? instanceName : "Sin conectar"}
            </div>
            <div className="text-[9.5px] text-[var(--t2)] font-medium tracking-wide leading-none">
              Evolution Link
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
