import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useAuth } from "@clerk/clerk-react";
import { User, Mail, Shield, CheckCircle2, Bell, Eye, LogOut } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { setToken, setRole } = useContext(AuthContext);
  const { signOut } = useAuth();
  
  const name = localStorage.getItem("userName") || "Learner";
  const email = localStorage.getItem("userEmail") || "Not set";
  const role = localStorage.getItem("userRole") || "candidate";

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

  const getInitial = (name) => {
     return name.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="app-card p-8 bg-gradient-to-br from-[#0a0a0a] via-[#0f172a] to-cyan-950/40 border border-cyan-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center text-4xl font-bold text-cyan-400 flex-shrink-0 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            {getInitial(name)}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              {name}
            </h1>
            <p className="text-slate-400 text-lg">
              Manage your account details and preferences.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
           <div className="app-card p-6">
             <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="app-panel p-4 flex items-start gap-4">
                 <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 flex-shrink-0 mt-0.5">
                   <User size={20} className="stroke-[1.5]" />
                 </div>
                 <div>
                   <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Full Name</div>
                   <div className="text-base text-white font-medium">{name}</div>
                 </div>
               </div>

               <div className="app-panel p-4 flex items-start gap-4">
                 <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 flex-shrink-0 mt-0.5">
                   <Mail size={20} className="stroke-[1.5]" />
                 </div>
                 <div>
                   <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Email Address</div>
                   <div className="text-base text-white font-medium">{email}</div>
                 </div>
               </div>

               <div className="app-panel p-4 flex items-start gap-4">
                 <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                   <Shield size={20} className="stroke-[1.5]" />
                 </div>
                 <div>
                   <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Account Role</div>
                   <div className="text-base text-white font-medium capitalize">{role === "company" ? "Company" : "Candidate"}</div>
                 </div>
               </div>

               <div className="app-panel p-4 flex items-start gap-4">
                 <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                   <CheckCircle2 size={20} className="stroke-[1.5]" />
                 </div>
                 <div>
                   <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Account Status</div>
                   <div className="text-base text-white font-medium">Active</div>
                 </div>
               </div>
             </div>
           </div>

           {/* Settings Mock Block */}
           <div className="app-card p-6">
             <h2 className="text-xl font-bold text-white mb-6">Preferences <span className="text-xs text-slate-500 font-normal ml-2 tracking-wide">(Mock UI)</span></h2>
             <div className="space-y-3">
               <div className="app-panel p-4 flex items-center justify-between opacity-70">
                 <div className="flex items-center gap-3">
                   <Bell size={18} className="text-slate-400" />
                   <div>
                     <div className="text-sm text-white font-medium">Email Notifications</div>
                     <div className="text-xs text-slate-500">Receive alerts for new contests and interview invites</div>
                   </div>
                 </div>
                 <div className="w-10 h-5 rounded-full bg-cyan-500 relative cursor-pointer">
                   <div className="absolute right-1 top-1 w-3 h-3 rounded-full bg-white shadow-sm" />
                 </div>
               </div>

               <div className="app-panel p-4 flex items-center justify-between opacity-70">
                 <div className="flex items-center gap-3">
                   <Eye size={18} className="text-slate-400" />
                   <div>
                     <div className="text-sm text-white font-medium">Profile Visibility</div>
                     <div className="text-xs text-slate-500">Allow companies to find your profile during talent search</div>
                   </div>
                 </div>
                 <div className="w-10 h-5 rounded-full bg-white/10 relative cursor-pointer border border-white/10">
                   <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-slate-400 shadow-sm" />
                 </div>
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
