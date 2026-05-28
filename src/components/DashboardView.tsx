import { DollarSign, FileText, CheckCircle2, AlertCircle, PlusCircle, ArrowUpRight, TrendingUp, Calendar, Trash2, Edit } from 'lucide-react';
import { Invoice } from '../types';
import { formatIDR, formatDate } from '../utils';

interface DashboardViewProps {
  invoices: Invoice[];
  onSelectInvoice: (invoiceId: string) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onSetInvoiceStatus: (invoiceId: string, status: 'draft' | 'sent' | 'paid') => void;
  onCreateNewInvoice: () => void;
}

export default function DashboardView({
  invoices,
  onSelectInvoice,
  onDeleteInvoice,
  onSetInvoiceStatus,
  onCreateNewInvoice,
}: DashboardViewProps) {
  // Aggregate stats
  const totalRevenue = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingAmount = invoices
    .filter((inv) => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0);

  const draftAmount = invoices
    .filter((inv) => inv.status === 'draft')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalCount = invoices.length;
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length;
  const pendingCount = invoices.filter((inv) => inv.status === 'sent').length;
  const draftCount = invoices.filter((inv) => inv.status === 'draft').length;

  // Monthly breakdown for dynamic CSS bar graph
  const monthlyData = [
    { name: 'Jan', amount: 8000000 },
    { name: 'Feb', amount: 15400000 },
    { name: 'Mar', amount: 12500000 },
    { name: 'Apr', amount: 19800000 },
    { name: 'May', amount: totalRevenue || 13375000 }, // Dynamically inject paid total into current month!
    { name: 'Jun', amount: 0 },
  ];

  const maxAmount = Math.max(...monthlyData.map((d) => d.amount), 1000000);

  return (
    <div className="w-full flex flex-col gap-6" id="dashboard-view-container">
      {/* Upper Widgets Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="dashboard-stats-grid">
        {/* Total Earnings Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#eff1f4]/60 soft-shadow flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#8695ac] uppercase tracking-wider">Total Received</span>
            <span className="text-2xl font-black text-[#121212] font-mono leading-none">{formatIDR(totalRevenue)}</span>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-2">
              <TrendingUp size={14} />
              <span>+18.4% from last month</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#eff1f4]/60 soft-shadow flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#8695ac] uppercase tracking-wider">Pending (Sent)</span>
            <span className="text-2xl font-black text-[#121212] font-mono leading-none">{formatIDR(pendingAmount)}</span>
            <span className="text-xs font-medium text-[#5d6b82] mt-3 block">
              {pendingCount} invoice{pendingCount !== 1 ? 's' : ''} awaiting payment
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
            <AlertCircle size={18} />
          </div>
        </div>

        {/* Drafts Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#eff1f4]/60 soft-shadow flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#8695ac] uppercase tracking-wider">Active Drafts</span>
            <span className="text-2xl font-black text-[#121212] font-mono leading-none">{formatIDR(draftAmount)}</span>
            <span className="text-xs font-medium text-[#5d6b82] mt-3 block">
              {draftCount} draft{draftCount !== 1 ? 's' : ''} being edited
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50">
            <FileText size={18} />
          </div>
        </div>

        {/* Total Invoices count card */}
        <div className="bg-white rounded-2xl p-5 border border-[#eff1f4]/60 soft-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8695ac] uppercase tracking-wider">Invoice Output</span>
            <button
              id="dashboard-new-invoice-btn"
              onClick={onCreateNewInvoice}
              className="text-xs font-bold text-[#121212] hover:text-[#5d6b82] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>Create</span>
            </button>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-3xl font-black text-[#121212] leading-none">{totalCount}</span>
              <span className="text-[10px] font-bold text-[#8695ac] uppercase tracking-wider">Total invoices</span>
            </div>
            
            {/* Visual tiny progress bar stack */}
            <div className="flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-[#303846]">
              <span>{paidCount} Paid</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Chart on left, shortcut drawer or welcome hero on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-middle-section">
        {/* Dynamic Monthly Invoicing Chart (SVG approach) */}
        <div className="bg-white rounded-2xl p-6 border border-[#eff1f4]/60 soft-shadow lg:col-span-2 flex flex-col gap-4" id="invoicing-chart-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#121212]">Sales Performance</h3>
              <p className="text-xs text-[#5d6b82]">Monthly invoice performance breakdown</p>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono">2026</span>
          </div>

          {/* Graphical Bars and Coordinates */}
          <div className="w-full flex items-end justify-between h-48 pt-6 px-2 border-b border-dashed border-slate-100 relative" id="chart-bars-container">
            {monthlyData.map((data, idx) => {
              const pct = (data.amount / maxAmount) * 100;
              const isCurrent = data.name === 'May';
              return (
                <div key={idx} className="flex flex-col items-center gap-2 group flex-1" id={`chart-bar-col-${data.name}`}>
                  {/* Tooltip on hover */}
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-[#121212] text-white text-[10px] font-bold py-1 px-2 rounded-lg -translate-y-12 shadow-lg z-20 pointer-events-none font-mono">
                    {formatIDR(data.amount)}
                  </div>
                  
                  {/* The bar element */}
                  <div 
                    style={{ height: `${Math.max(4, pct)}%` }}
                    className={`w-10 sm:w-14 rounded-t-lg transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-[#121212] hover:bg-black shadow-sm' 
                        : data.amount === 0 
                          ? 'bg-slate-100 border border-dashed border-slate-200'
                          : 'bg-[#8695ac]/20 hover:bg-[#8695ac]/40'
                    }`}
                  ></div>
                  <span className="text-xs font-bold text-[#5d6b82] tracking-wider">{data.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launch Panel */}
        <div className="bg-[#121212] text-white rounded-2xl p-6 soft-shadow flex flex-col justify-between" id="quick-launch-card">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-extrabold text-white/60 uppercase tracking-widest">SaaS Suite</span>
            <h3 className="text-xl font-extrabold tracking-tight mt-1 leading-snug">Generate and manage beautiful brand invoices instantly</h3>
            <p className="text-xs text-white/70 leading-relaxed mt-2.5">
              Draft fully customizable documents, set billing rates, auto calculate regional taxes, and generate ready-to-print beautiful PDFs in minutes.
            </p>
          </div>

          <button
            id="dashboard-create-hero-btn"
            onClick={onCreateNewInvoice}
            className="w-full mt-6 py-3 px-4 bg-white hover:bg-slate-100 transition-colors rounded-xl text-xs font-bold text-[#121212] shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Create New Invoice</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Invoices List / Record Table */}
      <div className="bg-white rounded-2xl p-6 border border-[#eff1f4]/60 soft-shadow flex flex-col gap-4" id="recent-invoices-section">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#121212]">Recent Invoices</h3>
            <p className="text-xs text-[#5d6b82]">Select to view/edit, delete, or mark status</p>
          </div>
          <span className="text-xs font-bold text-[#5d6b82] bg-[#f7f8fa] border border-[#eff1f4] px-2.5 py-1 rounded-lg">
            {invoices.length} Active Records
          </span>
        </div>

        <div className="w-full overflow-x-auto" id="recent-invoices-table-container">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="bg-[#f7f8fa] text-[#5d6b82] text-xs font-bold uppercase tracking-wider border-b border-[#eff1f4]/40">
                <th className="px-4 py-3 rounded-l-lg">Invoice #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f8fa]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group text-xs text-[#303846]" id={`invoice-row-${inv.id}`}>
                  {/* Number */}
                  <td className="px-4 py-3.5 font-bold text-[#121212]">
                    {inv.invoiceNumber}
                  </td>
                  
                  {/* Customer */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm text-[#121212]">{inv.customerName}</span>
                      <span className="text-[10px] text-[#8695ac] truncate max-w-sm">{inv.billingAddress}</span>
                    </div>
                  </td>
                  
                  {/* Date */}
                  <td className="px-4 py-3.5 font-medium text-[#5d6b82]">
                    {formatDate(inv.issueDate)}
                  </td>
                  
                  {/* Total amount */}
                  <td className="px-4 py-3.5 text-right font-bold text-[#121212] font-mono">
                    {formatIDR(inv.total)}
                  </td>

                  {/* Status Indicator */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-1.5 shrink-0" id={`status-dropdown-${inv.id}`}>
                      {inv.status === 'paid' && (
                        <button
                          onClick={() => onSetInvoiceStatus(inv.id, 'draft')}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full cursor-pointer hover:bg-emerald-100 transition-colors"
                          title="Click to revert to Draft"
                        >
                          Paid
                        </button>
                      )}
                      {inv.status === 'sent' && (
                        <button
                          onClick={() => onSetInvoiceStatus(inv.id, 'paid')}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100 rounded-full cursor-pointer hover:bg-emerald-500 hover:text-white hover:border-transparent transition-all"
                          title="Click to mark as PAID"
                        >
                          Sent
                        </button>
                      )}
                      {inv.status === 'draft' && (
                        <button
                          onClick={() => onSetInvoiceStatus(inv.id, 'sent')}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100 rounded-full cursor-pointer hover:bg-blue-500 hover:text-white hover:border-transparent transition-all"
                          title="Click to mark as SENT"
                        >
                          Draft
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Action buttons */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2 text-[#5d6b82]">
                      <button
                        onClick={() => onSelectInvoice(inv.id)}
                        className="w-8 h-8 rounded-lg hover:bg-[#f7f8fa] hover:text-[#121212] border border-[#eff1f4]/60 transition-colors flex items-center justify-center cursor-pointer"
                        title="Edit Invoice"
                        id={`edit-inv-${inv.id}`}
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => onDeleteInvoice(inv.id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-500 border border-[#eff1f4]/60 hover:border-red-100 transition-colors flex items-center justify-center cursor-pointer text-slate-400"
                        title="Delete Invoice"
                        id={`delete-inv-${inv.id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
