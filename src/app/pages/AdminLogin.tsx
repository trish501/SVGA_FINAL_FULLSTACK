import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { BookOpen, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api";

export function AdminLogin() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      toast.error('Username and password are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        const msg = data?.message || 'Invalid admin credentials';
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      const token = data.token || null;
      const user = data.user || { name: username, username };
      loginAdmin({ name: user.name || username, email: user.email || `${username}@svga.local`, username: user.username || username }, token);
      toast.success('Signed in as admin');
      navigate('/admin', { replace: true });
    } catch (err: any) {
      console.error('[AdminLogin] error', err);
      setError(err?.message || 'Login failed');
      toast.error(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans"
    >
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-teal-50/50 blur-3xl opacity-60 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center mb-8 relative z-10"
      >
        <Link to="/" className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white shadow-md shadow-blue-200 mb-4 hover:scale-105 transition-transform">
          <BookOpen size={28} strokeWidth={2.5} />
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          SVGA Book Bank
        </h1>
        <p className="text-slate-500 font-medium mt-1">Admin Portal</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-blue-50/50">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Sign In</h2>
            <p className="text-slate-500 text-sm">Enter your administrator credentials to continue.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 block">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-300 text-slate-700"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700 block">Password</label>
                <a href="#" className="text-xs font-medium text-blue-500 hover:text-blue-600">Forgot password?</a>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-300 text-slate-700"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-700 hover:brightness-110 text-white font-semibold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] mt-4 hover:-translate-y-0.5"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2 p-3 bg-red-50/50 rounded-lg border border-red-100">
            <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600/80 leading-relaxed">
              Restricted Access: This portal is strictly for authorized administrative personnel only.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/student-login" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            Student? Go to Student Login
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
