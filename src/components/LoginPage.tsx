import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, ShieldAlert, Sparkles, Database, Check, Building2 } from 'lucide-react';
import { supabase, isSupabaseActive } from '../lib/supabase';

interface LoginPageProps {
  onAuthSuccess: (user: any) => void;
}

export default function LoginPage({ onAuthSuccess }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseActive || !supabase) {
      // Fallback offline mock authentication
      setTimeout(() => {
        const mockUser = {
          id: 'demo-user-id',
          email: email || 'admin@transactflow.com',
          user_metadata: { full_name: 'TransactFlow Admin' }
        };
        onAuthSuccess(mockUser);
        setSuccessMsg('Koneksi Demo Lokal Berhasil!');
        setLoading(false);
      }, 800);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
            }
          }
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
        email: 'admin@transactflow.com',
        user_metadata: { full_name: 'TransactFlow Demo Admin' }
      };
      onAuthSuccess(demoUser);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#eaecf0] flex items-center justify-center font-sans relative antialiased p-4">
      {/* Visual backdrop decor */}
      <div className="absolute inset-0 bg-[radial-gradient(#8695ac_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row min-h-[560px] relative z-10 text-[#121212]">
        
        {/* Left Side: Brand Panel */}
        <div className="w-full md:w-1/2 bg-[#121212] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden text-left">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/20 via-blue-600/10 to-transparent opacity-60" />
          
          {/* Logo and Brand */}
          <div className="relative flex items-center gap-2 select-none z-10">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10 backdrop-blur">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a9 9 0 0 0-9 9c0 1.25.25 2.5.75 3.5M12 3a9 9 0 0 1 9 9c0 1.25-.25 2.5-.75 3.5" />
                <path d="M7 12c0-2.5 2-4.5 5-4.5s5 2 5 4.5" />
              </svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              TransactFlow
            </span>
          </div>

          {/* Slogan */}
          <div className="relative flex flex-col gap-3 my-auto z-10 py-12 md:py-0">
            <div className="inline-flex items-center gap-1 bg-white/10 border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-emerald-400 backdrop-blur w-fit">
              <Sparkles size={11} className="animate-pulse" />
              <span>Manajemen Finansial & Transaksi</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight leading-tight text-white max-w-xs">
              Kelola Dokumen Keuangan & Transaksi Anda dalam Satu Dasbor
            </h1>
            <p className="text-xs text-white/60 leading-relaxed max-w-sm">
              Buat invoice, penawaran, uang muka (DP), dan nota lunas dalam hitungan menit. Cocok untuk freelancer, personal, maupun bisnis dengan sinkronisasi cloud real-time.
            </p>
          </div>

          {/* Footer Info */}
          <div className="relative z-10 text-[10px] text-white/40 font-semibold font-mono">
            <span>Powered by Supabase Engine • © 2026</span>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
          <div className="flex flex-col gap-2 text-left mb-6">
            <h2 className="text-2xl font-black tracking-tight text-[#121212]">
              {isSignUp ? 'Buat Akun Baru' : 'Selamat Datang Kembali'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isSignUp 
                ? 'Daftar akun baru untuk mulai mengelola dokumen keuangan Anda' 
                : 'Silakan masuk untuk mengakses dasbor keuangan Anda'}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 text-left">
            
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

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@transactflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#121212] focus:border-black outline-none bg-slate-50/50 focus:bg-white"
                />
                <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kata Sandi</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#121212] focus:border-black outline-none bg-slate-50/50 focus:bg-white"
                />
                <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#121212] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-white animate-spin"></div>
              ) : isSignUp ? (
                <>
                  <UserPlus size={14} />
                  <span>Daftar Akun Baru</span>
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  <span>Masuk Sekarang</span>
                </>
              )}
            </button>

            {/* Switch Mode Action */}
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
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Atau</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* Instant Bypass Login (For Demo / Ready Account) */}
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100/80 text-xs font-bold text-slate-800 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Database size={13} className="text-emerald-500 animate-pulse" />
              <span>Masuk Instan (Akun Demo)</span>
            </button>

            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-900 leading-normal">
              {!isSupabaseActive
                ? '💡 Token Supabase tidak aktif. Sistem menggunakan Mode Demo untuk masuk.'
                : '💡 Supabase terhubung. Anda dapat mendaftar langsung secara gratis, atau gunakan Akun Demo untuk masuk cepat.'}
            </div>

          </form>
        </div>
        
      </div>
    </div>
  );
}
