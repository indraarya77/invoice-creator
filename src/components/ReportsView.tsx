import { FileSpreadsheet, Download, TrendingUp, Briefcase, Award, CheckCircle2 } from 'lucide-react';
import { Invoice, Customer } from '../types';
import { formatIDR } from '../utils';

interface ReportsViewProps {
  invoices: Invoice[];
  customers: Customer[];
}

export default function ReportsView({ invoices, customers }: ReportsViewProps) {
  // Aggregate Client Stats
  const clientBilledAmounts = invoices.reduce((acc, inv) => {
    if (!acc[inv.customerName]) {
      acc[inv.customerName] = { paid: 0, pending: 0, total: 0, count: 0 };
    }
    const amt = inv.total;
    if (inv.status === 'paid') {
      acc[inv.customerName].paid += amt;
    } else if (inv.status === 'sent') {
      acc[inv.customerName].pending += amt;
    }
    acc[inv.customerName].total += amt;
    acc[inv.customerName].count += 1;
    return acc;
  }, {} as Record<string, { paid: number; pending: number; total: number; count: number }>);

  const parsedReportRows = Object.entries(clientBilledAmounts).map(([clientName, stats]) => ({
    clientName,
    ...stats,
  })).sort((a, b) => b.total - a.total);

  // Financial statistics
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const totalTaxCollected = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.taxAmount, 0);
  const totalDiscountGiven = invoices.reduce((sum, inv) => sum + inv.discount, 0);

  // Triggers window CSV download
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Client,Invoices Count,Paid Amount,Pending Amount,Total Billed\n';
    parsedReportRows.forEach((row) => {
      csvContent += `"${row.clientName}",${row.count},${row.paid},${row.pending},${row.total}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Invoice_Report_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col gap-6" id="reports-view-container">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="reports-header">
        <div>
          <h2 className="text-2xl font-bold text-[#121212] tracking-tight">Financial Reports</h2>
          <p className="text-xs text-[#5d6b82]">Analyze billings, corporate taxes, discounts, and client ledgers</p>
        </div>

        <button
          id="export-csv-btn"
          onClick={handleExportCSV}
          className="px-5 py-2.5 bg-[#121212] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer soft-shadow self-start"
        >
          <FileSpreadsheet size={15} />
          <span>Export Billed Ledger CSV</span>
        </button>
      </div>

      {/* Numerical Stats Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="reports-numeric-stats">
        <div className="bg-white rounded-2xl p-5 border border-[#eff1f4]/60 soft-shadow flex flex-col gap-1.5">
          <span className="text-[10px] text-[#8695ac] font-bold uppercase tracking-wider">Gross Ledger Volume</span>
          <span className="text-xl font-black text-[#121212] font-mono">{formatIDR(totalBilled)}</span>
          <span className="text-[10px] text-[#5d6b82] font-semibold mt-2">All sent and active drafts</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#eff1f4]/60 soft-shadow flex flex-col gap-1.5">
          <span className="text-[10px] text-[#8695ac] font-bold uppercase tracking-wider">Net Realised Inflow</span>
          <span className="text-xl font-black text-[#121212] font-mono">{formatIDR(totalPaid)}</span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-2">Paid settlements in full</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#eff1f4]/60 soft-shadow flex flex-col gap-1.5">
          <span className="text-[10px] text-[#8695ac] font-bold uppercase tracking-wider">Estimated Tax PPN (11%)</span>
          <span className="text-xl font-black text-[#121212] font-mono">{formatIDR(totalTaxCollected)}</span>
          <span className="text-[10px] text-slate-500 font-semibold mt-2">Withholding value from Paid</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#eff1f4]/60 soft-shadow flex flex-col gap-1.5">
          <span className="text-[10px] text-[#8695ac] font-bold uppercase tracking-wider">Corporate Discounts</span>
          <span className="text-xl font-black text-[#121212] font-mono">{formatIDR(totalDiscountGiven)}</span>
          <span className="text-[10px] text-rose-500 font-semibold mt-2">Promotional invoice cuts</span>
        </div>
      </div>

      {/* Main Top Clients Ledger table */}
      <div className="bg-white rounded-2xl p-6 border border-[#eff1f4]/60 soft-shadow flex flex-col gap-4" id="client-breakdown-card">
        <div className="flex items-center justify-between border-b border-[#f7f8fa] pb-4">
          <div>
            <h3 className="font-bold text-base text-[#121212]">Client Billed Summary</h3>
            <p className="text-xs text-[#5d6b82]">Corporate statistics ranked by gross billings</p>
          </div>
          
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>Real-time values</span>
          </span>
        </div>

        {parsedReportRows.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[#5d6b82]" id="reports-empty">
            No active invoice records to compile report. Go to 'Invoices' to create one!
          </div>
        ) : (
          <div className="w-full overflow-x-auto" id="reports-table-container">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f7f8fa] text-[#5d6b82] text-xs font-bold uppercase tracking-wider border-b border-[#eff1f4]/40">
                  <th className="px-4 py-3 rounded-l-lg">Client Partner</th>
                  <th className="px-4 py-3 text-center">Invoices Issued</th>
                  <th className="px-4 py-3 text-right">Settled (Paid)</th>
                  <th className="px-4 py-3 text-right">Outstanding (Sent)</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Gross Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7f8fa]">
                {parsedReportRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors text-xs text-[#303846]" id={`client-row-${idx}`}>
                    <td className="px-4 py-4 font-bold text-[#121212]">
                      {row.clientName}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-[#5d6b82]">
                      {row.count} document{row.count !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-600 font-mono">
                      {formatIDR(row.paid)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-blue-600 font-mono">
                      {formatIDR(row.pending)}
                    </td>
                    <td className="px-4 py-4 text-right font-black text-[#121212] font-mono text-sm">
                      {formatIDR(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
