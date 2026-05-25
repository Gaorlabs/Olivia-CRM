import React, { useState, useEffect } from "react";
import { Lock, User, ShieldAlert, ArrowRight, Eye, EyeOff, Sun, Moon, Rocket } from "lucide-react";
import { motion } from "motion/react";

interface LoginPortalProps {
  onLoginSuccess: (user: any, negocio: any) => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Por favor completa los campos.");
      return;
    }
    setLoading(true);
    setError(null);

    // Mock login for demo purposes
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser = { id: "u1", nombre: "Admin Demo", rol: username === "admin" ? "super_admin" : "usuario", negocio_id: "demo-negocio" };
    const mockNegocio = { id: "demo-negocio", name: "Demo Farmacia" };
    
    localStorage.setItem("olivia_user", JSON.stringify(mockUser));
    localStorage.setItem("olivia_tenant_id", mockNegocio.id);
    onLoginSuccess(mockUser, mockNegocio);
    setLoading(false);
  };

  const handleQuickSelect = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#020617]" : "bg-slate-50"} grid grid-cols-1 md:grid-cols-2 font-sans select-none overflow-y-auto transition-colors duration-300`}>
      {/* Marketing Side */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`flex flex-col justify-center p-8 md:p-16 ${isDark ? "bg-slate-950/20" : "bg-emerald-50/30"}`}
      >
        <div className="flex items-center gap-3 mb-8 md:mb-0">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Rocket className="text-white" size={20} />
            </div>
            <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"} tracking-tighter`}>OlivIA</span>
        </div>
        
        <div className="space-y-6 md:space-y-8">
            <h1 className={`text-3xl md:text-5xl font-extrabold ${isDark ? "text-white" : "text-slate-900"} leading-[1.1] tracking-tighter`}>
                Tu empresa, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                    en piloto automático
                </span>
            </h1>
            <p className={`${isDark ? "text-slate-400" : "text-slate-600"} max-w-sm text-sm md:text-base leading-relaxed font-light`}>
                Más que un CRM, es el motor que escala tus ventas. Automatización, IA y gestión de leads bajo un solo control centralizado.
            </p>
            
            <div className="space-y-3 md:space-y-4 pt-2">
                {[
                    {text: "Gestión inteligente de leads", desc: "Clasificación automática por IA"},
                    {text: "Automatización de pedidos", desc: "Cierre de ventas más rápido"},
                    {text: "Analítica avanzada", desc: "Decisiones basadas en datos"}
                ].map((item) => (
                    <div key={item.text} className={`flex items-start gap-4 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full ${isDark ? "bg-emerald-500/10" : "bg-emerald-500/20"} flex items-center justify-center mt-0.5`}>
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm md:text-base">{item.text}</p>
                            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className={`hidden md:block text-xs ${isDark ? "text-slate-700" : "text-slate-400"} font-medium font-mono pt-12`}>
           © 2026 OlivIA Systems • V2.0.4
        </div>
      </motion.div>

      {/* Auth Side */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`flex items-center justify-center p-6 ${isDark ? "bg-[#020617]" : "bg-slate-50"} relative`}
      >
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,${isDark ? "#064e3b20" : "#d1fae540"},transparent_70%)] pointer-events-none`} />
        
        <button 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className={`absolute top-6 right-6 p-3 rounded-full ${isDark ? "bg-slate-900 text-slate-400 hover:text-white" : "bg-white text-slate-600 hover:text-slate-900"} border ${isDark ? "border-slate-800" : "border-slate-200"} transition-all z-50 cursor-pointer`}
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-full max-w-[380px] z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={`${isDark ? "bg-slate-900/40 border-slate-800/60 shadow-emerald-950/20" : "bg-white/80 border-slate-200 shadow-emerald-200/30"} backdrop-blur-3xl border rounded-3xl shadow-2xl p-8 transition-colors duration-300`}
          >
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"} mb-1.5 tracking-tight`}>Iniciar sesión</h2>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"} mb-8`}>
              Bienvenido de vuelta, accede al panel.
            </p>

            {error && (
              <div className={`mb-6 p-4 ${isDark ? "bg-rose-950/20 border-rose-900/50 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-700"} border rounded-2xl text-[12px] flex items-start gap-3`}>
                <ShieldAlert size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`block text-[10px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"} uppercase tracking-widest mb-1.5 ml-1`}>
                  Usuario
                </label>
                <div className="relative group">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-600" : "text-slate-400"} transition-colors group-focus-within:text-emerald-500`} size={16} />
                  <input
                    type="text"
                    required
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 ${isDark ? "bg-slate-950/60 text-slate-100 border-slate-800 placeholder-slate-700" : "bg-slate-50 text-slate-900 border-slate-200 placeholder-slate-300"} border focus:border-emerald-500/50 rounded-2xl text-[14px] focus:outline-none focus:ring-4 ${isDark ? "focus:ring-emerald-500/10" : "focus:ring-emerald-500/5"} transition-all`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"} uppercase tracking-widest mb-1.5 ml-1`}>
                  Contraseña
                </label>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-600" : "text-slate-400"} transition-colors group-focus-within:text-emerald-500`} size={16} />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3.5 ${isDark ? "bg-slate-950/60 text-slate-100 border-slate-800 placeholder-slate-700" : "bg-slate-50 text-slate-900 border-slate-200 placeholder-slate-300"} border focus:border-emerald-500/50 rounded-2xl text-[14px] focus:outline-none focus:ring-4 ${isDark ? "focus:ring-emerald-500/10" : "focus:ring-emerald-500/5"} transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-600 hover:text-emerald-400" : "text-slate-400 hover:text-emerald-600"} transition-colors`}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 px-4 ${isDark ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20" : "bg-emerald-600 text-white shadow-emerald-600/20"} hover:opacity-90 disabled:opacity-60 font-bold text-[14px] rounded-2xl shadow-lg transition-all mt-8 active:scale-[0.97] flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <div className={`w-[18px] h-[18px] border-2 ${isDark ? "border-slate-950" : "border-white"} border-t-transparent rounded-full animate-spin`} />
                ) : (
                  <>
                    <span>Acceder</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Quick Access */}
          <div className="mt-8">
            <h3 className={`text-[10px] font-bold ${isDark ? "text-slate-600" : "text-slate-400"} uppercase tracking-widest mb-4 ml-1`}>
              Acceso rápido (Demo)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickSelect("admin", "oliviaadmin")}
                className={`p-3 ${isDark ? "bg-slate-900/30 hover:bg-emerald-900/20 border-slate-800" : "bg-slate-100/50 hover:bg-emerald-50 border-slate-200"} border rounded-2xl text-left transition-all group`}
              >
                <p className={`text-[12px] font-semibold ${isDark ? "text-slate-200 group-hover:text-emerald-300" : "text-slate-800 group-hover:text-emerald-700"}`}>Admin</p>
                <p className={`text-[9px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>Acceso total</p>
              </button>
              <button
                onClick={() => handleQuickSelect("pedrodental", "dental123")}
                className={`p-3 ${isDark ? "bg-slate-900/30 hover:bg-emerald-900/20 border-slate-800" : "bg-slate-100/50 hover:bg-emerald-50 border-slate-200"} border rounded-2xl text-left transition-all group`}
              >
                <p className={`text-[12px] font-semibold ${isDark ? "text-slate-200 group-hover:text-emerald-300" : "text-slate-800 group-hover:text-emerald-700"}`}>Demo Dental</p>
                <p className={`text-[9px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>Sector salud</p>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
