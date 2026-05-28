import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, ShieldAlert, Sparkles, X, Database, Check } from 'lucide-react';
import { supabase, isSupabaseActive } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseActive || !supabase) {
      // Offline mock authentication fallback
      setTimeout(() => {
        const mockUser = {
          id: 'demo-user-id',
          email: email || 'admin@arsa.co',
          user_metadata: { full_name: 'Studio Arsa Admin' }
        };
        onAuthSuccess(mockUser);
        setSuccessMsg('Koneksi Demo Lokal Berhasil!');
        setTimeout(() => {
          onClose();
        }, 1000);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Pendaftaran Berhasil! Silakan cek email Anda untuk verifikasi atau masuk langsung jika auto-confirm aktif.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          onAuthSuccess(data.user);
          setSuccessMsg('Berhasil Masuk!');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan sistem, silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    setLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      const demoUser = {
        id: 'mock-bypassed-user-id',
        email: 'demo.developer@arsa.co',
        user_metadata: { full_name: 'Arsa Demo Admin' }
      };
      onAuthSuccess(demoUser);
      setSuccessMsg('Sukses: Masuk sebagai Demo Admin!');
      setLoading(false);
      setTimeout(() => {
        onClose();
      }, 800);
    }, 600);
  };

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        id="auth-modal-content"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100/80 overflow-hidden flex flex-col relative animate-scale-up text-[#121212]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Modal Top Decoration */}
        <div className="bg-[#121212] px-6 py-8 text-white relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 opacity-50" />
          <div className="relative flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur mb-2 border border-white/10">
              <Sparkles size={22} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-extrabold tracking-tight">
              {isSignUp ? 'Buat Akun Studio Arsa' : 'Masuk ke Studio Arsa'}
            </h3>
            <p className="text-xs text-white/70 max-w-[280px]">
              {isSupabaseActive 
                ? 'Sinkronisasi invoice, kustomisasi data, dan manajemen pelanggan langsung di cloud' 
                : 'Koneksi lokal aktif. Gunakan akun demo untuk masuk.'}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleEmailAuth} className="p-6 flex flex-col gap-4">
          
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 animate-shake">
              <ShieldAlert size={14} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check size={14} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Email Form Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="admin@studioarsa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-[#121212] focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          </div>

          {/* Password Form Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder="Masukkan kata sandi minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-[#121212] focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-[#121212] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-white animate-spin"></div>
            ) : isSignUp ? (
              <>
                <UserPlus size={14} />
                <span>Buat Akun Baru</span>
              </>
            ) : (
              <>
                <LogIn size={14} />
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>

          {/* Secondary CTA: Alternate Auth View */}
          <div className="flex items-center justify-center text-[11px] text-[#5d6b82] mt-1 gap-1">
            <span>{isSignUp ? 'Sudah memiliki akun?' : 'Belum memiliki akun?'}</span>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-black font-bold hover:underline cursor-pointer"
            >
              {isSignUp ? 'Masuk' : 'Daftar Baru'}
            </button>
          </div>

          {/* Separator */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Atau</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Bypass Auth Option / Admin Demo Option */}
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100/80 text-xs font-bold text-slate-800 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Database size={13} className="text-emerald-500" />
            <span>Masuk Instan (Demo Mode Admin)</span>
          </button>

          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-900 leading-normal">
            {!isSupabaseActive 
              ? '💡 Token Supabase tidak aktif di Secrets. Sistem menggunakan Mode Demo untuk demonstrasi fungsionalitas awan.'
              : '💡 Supabase terhubung. Anda dapat mendaftar gratis atau masuk instan dengan tombol demo di atas.'}
          </div>
        </form>
      </div>
    </div>
  );
}
