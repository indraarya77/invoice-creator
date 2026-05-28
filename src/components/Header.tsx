import React, { useState } from 'react';
import { Bell, Menu, ArrowLeft, Send, Check, Database, CloudOff, LogIn, LogOut, Copy, CheckSquare, Info, Server, RefreshCw } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSaveDraft: () => void;
  onSendInvoice: () => void;
  isSavingDraft: boolean;
  isSendingInvoice: boolean;
  user: any; // Supabase user
  onLogin: () => void;
  onLogout: () => void;
  isSupabaseActive: boolean;
  isSyncing: boolean;
  onManualSync?: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  onSaveDraft,
  onSendInvoice,
  isSavingDraft,
  isSendingInvoice,
  user,
  onLogin,
  onLogout,
  isSupabaseActive,
  isSyncing,
  onManualSync,
}: HeaderProps) {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const sqlQuery = `-- Salin dan jalankan query ini di SQL Editor Supabase Anda:

CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  billing_address TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  default_qty NUMERIC DEFAULT 1,
  default_unit TEXT DEFAULT 'Unit',
  default_cost NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  billing_address TEXT,
  issue_date TEXT,
  due_date TEXT,
  payment_terms TEXT,
  discount NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sender_info (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'customers', label: 'Customers' },
    { id: 'services', label: 'Services' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <div className="w-full flex flex-col gap-6" id="app-header-container">
      {/* Top Navbar */}
      <div className="w-full bg-white rounded-2xl px-6 py-4 flex items-center justify-between border border-[#eff1f4]/60 soft-shadow" id="top-navbar">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-3 select-none" id="brand-logo-container">
          <div className="w-10 h-10 rounded-xl bg-[#121212] flex items-center justify-center text-white" id="brand-icon">
            {/* Custom vector lines mimicking the Arsa wave logo */}
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M12 3a9 9 0 0 0-9 9c0 1.25.25 2.5.75 3.5M12 3a9 9 0 0 1 9 9c0 1.25-.25 2.5-.75 3.5" />
              <path d="M7 12c0-2.5 2-4.5 5-4.5s5 2 5 4.5" />
              <path d="M5 16s2.5-3 7-3 7 3 7 3" />
            </svg>
          </div>
          <span className="font-bold text-lg text-[#121212] tracking-tight hidden md:inline-block">
            Arsa Corp
          </span>
        </div>

        {/* Middle Side: Nav Items */}
        <div className="flex items-center gap-1 bg-[#f7f8fa] p-1.5 rounded-xl border border-[#eff1f4]" id="nav-tabs-container">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 outline-none ${
                  isActive
                    ? 'bg-[#121212] text-white soft-shadow'
                    : 'text-[#5d6b82] hover:text-[#121212] hover:bg-white/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Notification, Database Sync, Auth Connection */}
        <div className="flex items-center gap-3.5" id="header-actions">
          {/* Database Connection & Sync Pillar */}
          <button 
            onClick={() => setIsSetupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f8fafc] border border-[#eff1f4] cursor-pointer hover:bg-slate-100/70 transition-colors" 
            id="connection-status-badge"
            title="Klik untuk melihat petunjuk setup Supabase SQL"
          >
            {isSupabaseActive ? (
              <>
                <Database size={13} className={`${isSyncing ? 'text-amber-500 animate-spin' : 'text-emerald-500'}`} />
                <span className="text-[10px] font-bold text-slate-700">
                  {isSyncing ? 'Syncing...' : 'Supabase Active'}
                </span>
              </>
            ) : (
              <>
                <Database size={13} className="text-amber-550 animate-pulse" />
                <span className="text-[10px] font-bold text-[#b45309]">Local Mode (Setup Supabase)</span>
              </>
            )}
          </button>

          {onManualSync && (
            <button 
              id="sync-now-button"
              onClick={onManualSync}
              disabled={isSyncing}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border border-[#eff1f4]/60 transition-all cursor-pointer relative ${
                isSyncing 
                  ? 'bg-[#121212] text-white' 
                  : 'text-[#5d6b82] hover:text-[#121212] hover:bg-[#f7f8fa]'
              }`}
              title="Cek Sinkronisasi Data / Sinkron Sekarang"
            >
              <RefreshCw size={17} className={`${isSyncing ? 'animate-spin' : ''}`} />
              {!isSyncing && isSupabaseActive && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500 border border-white"></span>
              )}
            </button>
          )}
          
          <button 
            id="hamburger-menu"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5d6b82] hover:text-[#121212] hover:bg-[#f7f8fa] border border-[#eff1f4]/60 transition-all cursor-pointer md:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Authentication Panel */}
          {user ? (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
              <div 
                className="w-9 h-9 rounded-xl overflow-hidden border border-[#eff1f4] cursor-pointer bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold uppercase" 
                id="user-profile"
                title={`Logged in as ${user.email}`}
              >
                {user.email ? user.email.slice(0, 2) : 'US'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[10px] font-bold text-slate-800 line-clamp-1 max-w-[80px]">
                  {user.email ? user.email.split('@')[0] : 'User'}
                </span>
                <span className="text-[8px] font-semibold text-emerald-600 uppercase tracking-wider">
                  {isSupabaseActive ? 'Cloud Active' : 'Demo Active'}
                </span>
              </div>
              <button
                onClick={onLogout}
                id="logout-btn"
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50/50 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              id="login-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#121212] hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm active:scale-95 transition-all"
              title="Sign In / Hubungkan Basis Data"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Subheader - only visible or customized for invoices view */}
      {activeTab === 'invoices' && (
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4" id="invoice-subheader">
          <div className="flex flex-col gap-1">
            <button 
              id="back-btn"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-1.5 text-sm font-medium text-[#5d6b82] hover:text-[#121212] transition-colors self-start cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to home</span>
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-[#121212] mt-1" id="page-title">
              Create New Invoice
            </h1>
          </div>

          <div className="flex items-center gap-3" id="invoice-action-buttons">
            <button
              id="save-draft-btn"
              onClick={onSaveDraft}
              disabled={isSavingDraft}
              className="px-5 py-2.5 text-sm font-semibold text-[#303846] bg-white border border-[#dddfdf] rounded-xl hover:bg-[#fcfdfd] transition-all hover:border-[#b9baba] active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingDraft ? (
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin"></div>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-600">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              )}
              <span>Save as Draft</span>
            </button>

            <button
              id="send-invoice-btn"
              onClick={onSendInvoice}
              disabled={isSendingInvoice}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#121212] rounded-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2 cursor-pointer soft-shadow disabled:opacity-50"
            >
              {isSendingInvoice ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              ) : (
                <Send size={16} />
              )}
              <span>Send Invoice</span>
            </button>
          </div>
        </div>
      )}

      {/* Supabase Database Setup & SQL Editor Assistant Modal */}
      {isSetupModalOpen && (
        <div 
          id="supabase-setup-modal-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in text-[#121212]"
          onClick={() => setIsSetupModalOpen(false)}
        >
          <div 
            id="supabase-setup-content"
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Server size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#121212]">
                    Setup Database Supabase Studio Arsa
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    {isSupabaseActive ? 'Status: Koneksi Supabase Aktif' : 'Status: Local Storage Mode'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs text-slate-600 leading-relaxed">
              <div className="flex gap-3 p-3.5 bg-sky-50 border border-sky-100/50 rounded-xl text-sky-950 font-medium">
                <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sky-950">Cara Menghubungkan Supabase Cloud</span>
                  <p>
                    1. Masuk ke dashboard <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-sky-800">Supabase</a> dan buat Proyek Baru.<br />
                    2. Pergi ke bagian **Project Settings &rarr; API**.<br />
                    3. Salin **Project URL** dan **Anon API Key**.<br />
                    4. Simpan ke dalam Secrets di Google AI Studio atau file `.env` sebagai:<br />
                    <code className="bg-sky-100 px-1 py-0.5 rounded text-[11px] font-mono select-all font-bold">VITE_SUPABASE_URL</code> dan <code className="bg-sky-100 px-1 py-0.5 rounded text-[11px] font-mono select-all font-bold">VITE_SUPABASE_ANON_KEY</code>.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">
                  <span>Jalankan Query SQL (Supabase SQL Editor):</span>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors font-semibold"
                  >
                    {copied ? <CheckSquare size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    <span>{copied ? 'Tersalin' : 'Salin SQL'}</span>
                  </button>
                </div>

                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 font-mono text-[10px] text-zinc-300 overflow-x-auto whitespace-pre max-h-[220px]">
                  {sqlQuery}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex items-center justify-between gap-3 text-[10px] text-slate-400 font-bold font-mono">
              <span>Studio Arsa Digital • Supabase Engine</span>
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="px-4 py-2 bg-[#121212] hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
