import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useAuth } from "@clerk/clerk-react";
import { Settings, Users, Palette, Bot, Shield, ChevronRight, LogOut } from "lucide-react";

export default function CompanySettings() {
  const navigate = useNavigate();
  const { setToken, setRole } = useContext(AuthContext);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    
    setToken(null);
    setRole(null);
    
    await signOut();
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <div className="app-card p-8 bg-gradient-to-br from-[#0a0a0a] via-[#0f172a] to-blue-950/40 border border-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <Settings size={36} className="stroke-[1.5]" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Company Settings
            </h1>
            <p className="text-slate-400 text-lg">
              Manage team access, branding, and interview policies.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
           <div className="app-card p-6">
             <h2 className="text-xl font-bold text-white mb-6">Configuration <span className="text-xs text-slate-500 font-normal ml-2 tracking-wide">(Mock UI)</span></h2>
             
             <div className="space-y-3">
               <div className="app-panel p-4 flex items-center justify-between opacity-70 cursor-pointer hover:bg-white/[0.04] transition-colors group">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                     <Users size={20} className="stroke-[1.5]" />
                   </div>
                   <div>
                     <div className="text-sm text-white font-medium">Team</div>
                     <div className="text-xs text-slate-500">Add interviewers and recruiters</div>
                   </div>
                 </div>
                 <ChevronRight size={18} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
               </div>

               <div className="app-panel p-4 flex items-center justify-between opacity-70 cursor-pointer hover:bg-white/[0.04] transition-colors group">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 flex-shrink-0 mt-0.5">
                     <Palette size={20} className="stroke-[1.5]" />
                   </div>
                   <div>
                     <div className="text-sm text-white font-medium">Branding</div>
                     <div className="text-xs text-slate-500">Customize contest pages</div>
                   </div>
                 </div>
                 <ChevronRight size={18} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
               </div>

               <div className="app-panel p-4 flex items-center justify-between opacity-70 cursor-pointer hover:bg-white/[0.04] transition-colors group">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                     <Bot size={20} className="stroke-[1.5]" />
                   </div>
                   <div>
                     <div className="text-sm text-white font-medium">AI Policy</div>
                     <div className="text-xs text-slate-500">Hint-only, no code enforcement</div>
                   </div>
                 </div>
                 <ChevronRight size={18} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
               </div>

               <div className="app-panel p-4 flex items-center justify-between opacity-70 cursor-pointer hover:bg-white/[0.04] transition-colors group">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                     <Shield size={20} className="stroke-[1.5]" />
                   </div>
                   <div>
                     <div className="text-sm text-white font-medium">Security</div>
                     <div className="text-xs text-slate-500">Access control and audit logs</div>
                   </div>
                 </div>
                 <ChevronRight size={18} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
               </div>
             </div>
           </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
           <div className="app-card p-6">
             <h2 className="text-lg font-bold text-white mb-4">Account Actions</h2>
             
             <button
               onClick={handleLogout}
               className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-sm font-bold tracking-wide transition-all group"
             >
               <LogOut size={18} className="stroke-[2] group-hover:-translate-x-1 transition-transform" /> Sign Out
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
