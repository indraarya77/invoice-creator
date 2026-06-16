import React, { useState } from 'react';
import { FileText, Trash2, Edit, PlusCircle, Calendar, Sparkles, FolderOpen, ArrowRight, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Invoice, SenderInfo, Customer } from '../types';
import { formatIDR, formatDate } from '../utils';
import InvoicePreview from './InvoicePreview';

interface InvoicesViewProps {
  invoices: Invoice[];
  sender: SenderInfo;
  customers: Customer[];
  onSelectInvoice: (invoiceId: string) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onCreateNewInvoice: () => void;
  onSetInvoiceStatus: (invoiceId: string, status: 'draft' | 'sent' | 'paid') => void;
}

type FilterType = 'all' | 'draft' | 'sent' | 'paid';

export default function InvoicesView({
  invoices,
  sender,
  customers,
  onSelectInvoice,
  onDeleteInvoice,
  onCreateNewInvoice,
  onSetInvoiceStatus,
}: InvoicesViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Filter invoices based on status tab
  const filteredInvoices = invoices.filter((inv) => {
    if (activeFilter === 'all') return true;
    return inv.status === activeFilter;
  });

  // Track currently selected invoice in list
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(() => {
    return filteredInvoices.length > 0 ? filteredInvoices[0].id : null;
  });

  // Find the invoice object for the selected ID
  const activeInvoice = filteredInvoices.find((inv) => inv.id === selectedInvoiceId) || (filteredInvoices.length > 0 ? filteredInvoices[0] : null);

  // If the active invoice was deleted or no longer matches the filter, update the selection
  if (activeInvoice && activeInvoice.id !== selectedInvoiceId) {
    setSelectedInvoiceId(activeInvoice.id);
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus dokumen ini secara permanen?')) {
      onDeleteInvoice(id);
      // Select next invoice if any
      const remaining = filteredInvoices.filter((inv) => inv.id !== id);
      if (remaining.length > 0) {
        setSelectedInvoiceId(remaining[0].id);
      } else {
        setSelectedInvoiceId(null);
      }
    }
  };

  const handleStatusToggle = (id: string, currentStatus: 'draft' | 'sent' | 'paid') => {
    let nextStatus: 'draft' | 'sent' | 'paid' = 'sent';
    if (currentStatus === 'draft') nextStatus = 'sent';
    else if (currentStatus === 'sent') nextStatus = 'paid';
    else if (currentStatus === 'paid') nextStatus = 'draft';
    onSetInvoiceStatus(id, nextStatus);
  };

  const filters: { id: FilterType; label: string; count: number; colorClass: string }[] = [
    { id: 'all', label: 'Semua', count: invoices.length, colorClass: 'bg-slate-100 text-slate-700' },
    { id: 'draft', label: 'Draft', count: invoices.filter(i => i.status === 'draft').length, colorClass: 'bg-amber-50 text-amber-700 border border-amber-100' },
    { id: 'sent', label: 'Terkirim', count: invoices.filter(i => i.status === 'sent').length, colorClass: 'bg-blue-50 text-blue-700 border border-blue-100' },
    { id: 'paid', label: 'Lunas', count: invoices.filter(i => i.status === 'paid').length, colorClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  ];

  return (
    <div className="w-full flex flex-col gap-6" id="invoices-view-container">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="invoices-header">
        <div className="flex flex-col gap-1 text-left">
          <h1 className="text-3xl font-bold tracking-tight text-[#121212]">
            Documents Manager
          </h1>
          <p className="text-xs text-[#5d6b82]">
            Kelola seluruh invoice, penawaran, uang muka (DP), dan nota pelunasan Anda secara terpadu
          </p>
        </div>

        <button
          onClick={onCreateNewInvoice}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#121212] hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle size={14} />
          <span>Buat Dokumen Baru</span>
        </button>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" id="invoices-filter-tabs">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => {
                setActiveFilter(filter.id);
                // Auto-select first item matching filter
                const matching = invoices.filter(i => filter.id === 'all' ? true : i.status === filter.id);
                if (matching.length > 0) {
                  setSelectedInvoiceId(matching[0].id);
                } else {
                  setSelectedInvoiceId(null);
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap outline-none ${
                isActive
                  ? 'bg-[#121212] text-white shadow-sm'
                  : 'bg-white text-[#5d6b82] border border-[#eff1f4] hover:bg-slate-50'
              }`}
            >
              <span>{filter.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredInvoices.length === 0 ? (
        /* Empty State */
        <div className="w-full bg-white rounded-2xl border border-[#eff1f4]/60 soft-shadow p-12 text-center flex flex-col items-center justify-center gap-4 min-h-[400px]">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center mb-2">
            <FileSpreadsheet size={28} />
          </div>
          <div className="max-w-md flex flex-col gap-1.5">
            <h3 className="text-lg font-extrabold text-[#121212]">Tidak Ada Dokumen</h3>
            <p className="text-xs text-[#5d6b82] leading-relaxed">
              Tidak ditemukan dokumen untuk status "{filters.find(f => f.id === activeFilter)?.label}". Silakan buat dokumen baru untuk memulai.
            </p>
          </div>
          <button
            onClick={onCreateNewInvoice}
            className="mt-3 px-5 py-2.5 bg-[#121212] hover:bg-black text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>Buat Dokumen Sekarang</span>
          </button>
        </div>
      ) : (
        /* Layout Grid: Left List, Right Premium Preview Drawer */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left column: Invoice list cards (1/3 width) */}
          <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-1" id="invoices-sidebar">
            <div className="text-[10px] font-extrabold text-[#8695ac] uppercase tracking-wider px-1 mb-1 text-left">
              Daftar Dokumen ({filteredInvoices.length})
            </div>
            
            {filteredInvoices.map((inv) => {
              const isSelected = activeInvoice && activeInvoice.id === inv.id;
              
              // Status Badge Styling
              let statusLabel = 'Draft';
              let statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
              if (inv.status === 'sent') {
                statusLabel = 'Terkirim';
                statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-100';
              } else if (inv.status === 'paid') {
                statusLabel = 'Lunas';
                statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
              }

              // Document Type Label
              let typeLabel = 'Invoice';
              if (inv.documentType === 'quotation') typeLabel = 'Quotation';
              else if (inv.documentType === 'dp') typeLabel = 'DP';
              else if (inv.documentType === 'pelunasan') typeLabel = 'Pelunasan';
              else if (inv.documentType === 'receipt') typeLabel = 'Nota';

              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoiceId(inv.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 group text-left relative overflow-hidden ${
                    isSelected
                      ? 'bg-white border-black shadow-md'
                      : 'bg-white/80 border-[#eff1f4] hover:bg-white hover:border-slate-300 shadow-sm'
                  }`}
                  id={`invoice-card-${inv.id}`}
                >
                  {/* Selected indicator stripe */}
                  {isSelected && (
                    <div className="absolute left-0 inset-y-0 w-1 bg-black" />
                  )}

                  {/* Card Header: Number & Trash & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#121212] font-mono">
                        {inv.invoiceNumber}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                        {typeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${statusBadgeClass}`}>
                        {statusLabel}
                      </span>
                      <button
                        onClick={(e) => handleDelete(inv.id, e)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50/50 transition-colors"
                        title="Hapus Dokumen"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Card Body: Customer name & Amount */}
                  <div className="flex flex-col gap-1">
                    <span className="font-extrabold text-sm text-[#121212] line-clamp-1 group-hover:text-black">
                      {inv.customerName || 'Pelanggan Baru'}
                    </span>
                    <span className="text-[11px] text-[#8695ac] font-mono font-semibold">
                      {formatIDR(inv.total)}
                    </span>
                  </div>

                  {/* Card Footer: Date & Edit Button shortcut */}
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-0.5 text-[10px] text-[#5d6b82]">
                    <div className="flex items-center gap-1 font-semibold">
                      <Calendar size={11} className="text-[#8695ac]" />
                      <span>{formatDate(inv.issueDate)}</span>
                    </div>
                    
                    <button
                      onClick={() => onSelectInvoice(inv.id)}
                      className="flex items-center gap-1 font-bold text-black group-hover:underline"
                    >
                      <span>Edit</span>
                      <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right column: Viewer and Full Interactive Preview (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-4" id="invoices-preview-drawer">
            {activeInvoice ? (
              <>
                {/* Selection Details & Main Actions banner */}
                <div className="bg-white rounded-xl border border-[#eff1f4] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-left">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 border border-slate-100 flex items-center justify-center shrink-0">
                      <FolderOpen size={18} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-[#8695ac] uppercase tracking-wider leading-none text-left">Dokumen Terpilih</span>
                      <h3 className="text-sm font-extrabold text-[#121212] mt-0.5 text-left">
                        {activeInvoice.invoiceNumber} — {activeInvoice.customerName || 'Dokumen Baru'}
                      </h3>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Status Toggle Action */}
                    <button
                      onClick={() => handleStatusToggle(activeInvoice.id, activeInvoice.status)}
                      className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-[#dddfdf] text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                      title="Ubah Status (Draft -> Terkirim -> Lunas -> Draft)"
                    >
                      {activeInvoice.status === 'draft' && <AlertCircle size={13} className="text-amber-500" />}
                      {activeInvoice.status === 'sent' && <CheckCircle2 size={13} className="text-blue-500" />}
                      {activeInvoice.status === 'paid' && <CheckCircle2 size={13} className="text-emerald-500" />}
                      <span>Ubah Status</span>
                    </button>

                    {/* Edit Action */}
                    <button
                      onClick={() => onSelectInvoice(activeInvoice.id)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#121212] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Edit size={13} />
                      <span>Edit Dokumen</span>
                    </button>
                  </div>
                </div>

                {/* The main high-fidelity interactive PDF/Print Preview component */}
                <InvoicePreview
                  invoice={activeInvoice}
                  sender={sender}
                  customers={customers}
                />
              </>
            ) : (
              <div className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2 min-h-[400px]">
                <FileText size={24} className="text-slate-300" />
                <span>Pilih dokumen dari daftar di sebelah kiri untuk melihat pratonton lengkap.</span>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
