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

  // Triggers window Excel download using styled HTML sheet with inline CSS that Microsoft Excel interprets as a beautifully designed table
  const handleExportExcel = () => {
    let htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<style>
  /* Reset and typography style matching website UI */
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    margin: 24px;
    background-color: #ffffff;
    color: #303846;
  }
  
  /* Laporan Header */
  .report-header {
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eff1f4;
  }
  .report-title {
    font-size: 16pt;
    font-weight: bold;
    color: #121212;
    margin: 0 0 4px 0;
  }
  .report-subtitle {
    font-size: 9.5pt;
    color: #5d6b82;
    margin: 0;
  }
  
  /* Table styling matching premium UI */
  table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 10px;
    border: 1px solid #eff1f4;
  }
  
  /* Table Headers styling */
  th {
    background-color: #f7f8fa;
    color: #5d6b82;
    font-size: 9.5pt;
    font-weight: bold;
    border-bottom: 2px solid #eff1f4;
    padding: 12px 14px;
    text-align: left;
  }
  th.center { text-align: center; }
  th.right { text-align: right; }
  
  /* Table Data styling */
  td {
    padding: 12px 14px;
    border-bottom: 1px solid #eff1f4;
    font-size: 9.5pt;
    color: #303846;
    vertical-align: middle;
  }
  
  /* Column and Text modifiers */
  .client-name {
    font-weight: bold;
    color: #121212;
  }
  .doc-count {
    text-align: center;
    color: #5d6b82;
    font-weight: 600;
  }
  .paid-cell {
    text-align: right;
    color: #10b981; /* emerald-600 */
    font-weight: bold;
    mso-number-format: "\\\"IDR\\\"\\ \\#\\,\\#\\#0";
  }
  .pending-cell {
    text-align: right;
    color: #3b82f6; /* blue-600 */
    font-weight: bold;
    mso-number-format: "\\\"IDR\\\"\\ \\#\\,\\#\\#0";
  }
  .gross-cell {
    text-align: right;
    color: #121212;
    font-weight: bold;
    mso-number-format: "\\\"IDR\\\"\\ \\#\\,\\#\\#0";
  }
</style>
</head>
<body>
  <div class="report-header">
    <h1 class="report-title">Financial Reports</h1>
    <p class="report-subtitle">Client Billed Summary - Corporate statistics ranked by gross billings</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 250px;">Client Partner</th>
        <th class="center" style="width: 120px;">Invoices Issued</th>
        <th class="right" style="width: 160px;">Settled (Paid)</th>
        <th class="right" style="width: 160px;">Outstanding (Sent)</th>
        <th class="right" style="width: 160px;">Gross Volume</th>
      </tr>
    </thead>
    <tbody>`;

    parsedReportRows.forEach((row) => {
      // Escape HTML entities to prevent invalid markup in client name
      const escapedClientName = (row.clientName || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      
      const invoicesIssued = row.count;
      const settledPaid = row.paid;
      const outstandingSent = row.pending;
      const grossVolume = row.total;

      htmlContent += `
      <tr>
        <td class="client-name">${escapedClientName}</td>
        <td class="doc-count">${invoicesIssued} document${invoicesIssued !== 1 ? 's' : ''}</td>
        <td class="paid-cell">${settledPaid}</td>
        <td class="pending-cell">${outstandingSent}</td>
        <td class="gross-cell">${grossVolume}</td>
      </tr>`;
    });

    htmlContent += `
    </tbody>
  </table>
</body>
</html>`;

    // Download formatted HTML table as an .xls file
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Invoice_Report_2026.xls');
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Triggers window CSV download using robust Blob and UTF-8 BOM, formatting numbers as IDR strings exactly like the website's table
  const handleExportCSV = () => {
    // Add UTF-8 BOM to ensure Excel opens special characters and layout correctly
    let csvContent = '\uFEFF';
    
    // Add delimiter override so Excel splits columns correctly regardless of computer regional settings (e.g. Indonesian regional setting)
    csvContent += 'sep=,\n';
    
    // Align CSV Headers exactly with the premium UI Table Headers
    csvContent += 'Client Partner,Invoices Issued,Settled (Paid),Outstanding (Sent),Gross Volume\n';
    
    parsedReportRows.forEach((row) => {
      // Escape double quotes inside client name by doubling them
      const escapedClientName = (row.clientName || '').replace(/"/g, '""');
      
      // Format all data columns exactly as rendered in the premium UI table
      const invoicesIssued = `${row.count} document${row.count !== 1 ? 's' : ''}`;
      const settledPaid = formatIDR(row.paid);
      const outstandingSent = formatIDR(row.pending);
      const grossVolume = formatIDR(row.total);
      
      csvContent += `"${escapedClientName}","${invoicesIssued}","${settledPaid}","${outstandingSent}","${grossVolume}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Invoice_Report_2026.csv');
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col gap-6" id="reports-view-container">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="reports-header">
        <div>
          <h2 className="text-2xl font-bold text-[#121212] tracking-tight">Financial Reports</h2>
          <p className="text-xs text-[#5d6b82]">Analyze billings, corporate taxes, discounts, and client ledgers</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-[#121212] border border-[#eff1f4] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer soft-shadow"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            id="export-excel-btn"
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-[#121212] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer soft-shadow"
          >
            <FileSpreadsheet size={14} />
            <span>Export Excel (Styled)</span>
          </button>
        </div>
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
