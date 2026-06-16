import React, { useState } from 'react';
import { Building2, Landmark, Mail, Phone, MapPin, CheckCircle2, User, Key } from 'lucide-react';
import { SenderInfo } from '../types';

interface ProfileViewProps {
  sender: SenderInfo;
  setSender: React.Dispatch<React.SetStateAction<SenderInfo>>;
  isSupabaseActive: boolean;
}

export default function ProfileView({
  sender,
  setSender,
  isSupabaseActive,
}: ProfileViewProps) {
  const [companyName, setCompanyName] = useState(sender.companyName);
  const [address, setAddress] = useState(sender.address);
  const [email, setEmail] = useState(sender.email);
  const [phone, setPhone] = useState(sender.phone);
  const [bankName, setBankName] = useState(sender.bankName);
  const [bankAccountName, setBankAccountName] = useState(sender.bankAccountName);
  const [bankAccountNumber, setBankAccountNumber] = useState(sender.bankAccountNumber);
  const [logoUrl, setLogoUrl] = useState(sender.logoUrl || '');
  const [signatureUrl, setSignatureUrl] = useState(sender.signatureUrl || '');
  const [signatureType, setSignatureType] = useState<'upload' | 'draw'>('upload');

  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Canvas drawing ref & states
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#121212';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const coords = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleApplyCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureUrl(dataUrl);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSignatureUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedProfile: SenderInfo = {
      companyName,
      address,
      email,
      phone,
      bankName,
      bankAccountName,
      bankAccountNumber,
      logoUrl,
      signatureUrl,
    };

    setTimeout(() => {
      setSender(updatedProfile);
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 600);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6" id="profile-view-container">
      {/* Toast Notification */}
      {showToast && (
        <div 
          id="profile-save-toast"
          className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#121212] border border-white/10 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-fade-in"
        >
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>Profil Perusahaan Berhasil Diperbarui!</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="text-left">
        <h1 className="text-3xl font-bold tracking-tight text-[#121212]">
          Profil Perusahaan
        </h1>
        <p className="text-xs text-[#5d6b82]">
          Kelola detail identitas pengirim dan rekening bank untuk lampiran faktur invoice Anda
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Section: Visual Preview Card */}
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-extrabold text-[#8695ac] uppercase tracking-wider text-left">
            Kartu Identitas Bisnis
          </span>
          
          <div className="bg-[#121212] text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[220px] relative overflow-hidden text-left select-none">
            {/* Visual gradient backdrop */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/10 via-blue-600/5 to-transparent opacity-60" />
            
            <div className="relative flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 size={18} className="text-emerald-400" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-base font-extrabold tracking-tight leading-snug line-clamp-1">
                  {companyName || 'Nama Perusahaan'}
                </h3>
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
                  Faktur Pengirim
                </span>
              </div>
            </div>

            <div className="relative flex flex-col gap-1.5 border-t border-white/10 pt-4 mt-6">
              <div className="flex items-center gap-2 text-[10px] text-white/70">
                <Landmark size={12} className="text-emerald-400 shrink-0" />
                <span className="font-mono font-semibold truncate">
                  {bankName || 'BCA'} • {bankAccountNumber || 'No Rekening'}
                </span>
              </div>
              <div className="text-[9px] text-white/50 leading-relaxed font-semibold italic truncate">
                a.n. {bankAccountName || 'Nama Rekening'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#eff1f4] shadow-sm text-left flex flex-col gap-2.5 text-xs text-[#5d6b82]">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-emerald-500 shrink-0" />
              <span className="font-bold text-slate-800">Sinkronisasi Cloud</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              {isSupabaseActive
                ? '💡 Profil ini disinkronkan secara aman dan real-time ke database cloud Supabase Anda.'
                : '💡 Mode Lokal aktif. Perubahan profil ini disimpan di penyimpanan lokal browser Anda.'}
            </p>
          </div>
        </div>

        {/* Right Section: Form Inputs (2/3 width) */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-[#eff1f4] shadow-sm flex flex-col gap-6 text-left">
          
          {/* A. Detail Perusahaan */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-[#121212] border-b border-slate-50 pb-2">
              Informasi Perusahaan
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Bisnis / Perusahaan</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="TransactFlow"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#121212] focus:border-black outline-none bg-slate-50/50 focus:bg-white"
                  />
                  <Building2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor Telepon Kontak</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="+62 812 3456 7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#121212] focus:border-black outline-none bg-slate-50/50 focus:bg-white"
                  />
                  <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat Surel / Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="hello@transactflow.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#121212] focus:border-black outline-none bg-slate-50/50 focus:bg-white"
                  />
                  <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat Lengkap Perusahaan</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Jl. Jambu No 5, Dau, Malang"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#121212] focus:border-black outline-none bg-slate-50/50 focus:bg-white"
                  />
                  <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* B. Detail Rekening Bank */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-[#121212] border-b border-slate-50 pb-2">
              Informasi Rekening Bank Pembayaran
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Bank</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Bank Central Asia (BCA)"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#121212] focus:border-black outline-none bg-slate-50/50 focus:bg-white"
                  />
                  <Landmark size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Pemilik Rekening</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="TransactFlow"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#121212] focus:border-black outline-none bg-slate-50/50 focus:bg-white"
                  />
                  <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor Rekening</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="123 456 7890"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-mono text-[#121212] focus:border-black outline-none bg-slate-50/50 focus:bg-white"
                  />
                  <Landmark size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* C. Identitas Visual (Logo & Tanda Tangan) */}
          <div className="flex flex-col gap-4 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-extrabold text-[#121212] border-b border-slate-50 pb-2">
              Identitas Visual (Logo & Tanda Tangan)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Left Column: Company Logo */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logo Perusahaan</label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2 group overflow-hidden">
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50 text-[10px] font-semibold">
                      No Logo
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="file"
                      id="logo-upload-input"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo-upload-input"
                      className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer inline-block text-center select-none"
                    >
                      Pilih Gambar Logo
                    </label>
                    <span className="text-[9px] text-slate-400 font-semibold">Maks. 2MB, format PNG/JPG</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Digital Signature */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanda Tangan Digital</label>
                
                {/* Mode Toggles */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-fit gap-1 border border-slate-200 mb-1">
                  <button
                    type="button"
                    onClick={() => setSignatureType('upload')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      signatureType === 'upload' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-black'
                    }`}
                  >
                    Unggah Gambar
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureType('draw')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      signatureType === 'draw' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-black'
                    }`}
                  >
                    Gambar Langsung
                  </button>
                </div>

                {signatureType === 'upload' ? (
                  <div className="flex items-center gap-4">
                    {signatureUrl ? (
                      <div className="relative w-32 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2 group overflow-hidden">
                        <img src={signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setSignatureUrl('')}
                          className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50 text-[10px] font-semibold">
                        Belum Ada
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="file"
                        id="signature-upload-input"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="signature-upload-input"
                        className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer inline-block text-center select-none"
                      >
                        Unggah TTD
                      </label>
                      <span className="text-[9px] text-slate-400 font-semibold">Format transparan (PNG) direkomendasikan</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-4">
                      {/* Canvas Pad */}
                      <div className="flex flex-col gap-1.5">
                        <canvas
                          ref={canvasRef}
                          width={240}
                          height={110}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="border border-slate-300 rounded-xl bg-slate-50 cursor-crosshair touch-none"
                          style={{ display: 'block' }}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleClearCanvas}
                            className="px-2.5 py-1.5 border border-slate-200 text-[10px] font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Bersihkan Pad
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyCanvasSignature}
                            className="px-2.5 py-1.5 bg-[#121212] hover:bg-black text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Terapkan Coretan
                          </button>
                        </div>
                      </div>

                      {/* Canvas Preview */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hasil Gambar Aktif:</span>
                        {signatureUrl ? (
                          <div className="relative w-32 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2 group overflow-hidden">
                            <img src={signatureUrl} alt="Signature Preview" className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => setSignatureUrl('')}
                              className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Hapus
                            </button>
                          </div>
                        ) : (
                          <div className="w-32 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50 text-[10px] font-semibold">
                            Coret dan Klik Terapkan
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* C. Save Action */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-[#121212] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-white animate-spin"></div>
            ) : (
              <span>Simpan Pembaruan Profil</span>
            )}
          </button>

        </div>
      </form>
    </div>
  );
}
