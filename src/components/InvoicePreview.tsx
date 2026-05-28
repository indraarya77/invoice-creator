import React, { useState } from 'react';
import { Printer, Download, Image as ImageIcon, CheckCircle2, Loader2, X, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { Invoice, SenderInfo } from '../types';
import { formatIDR, formatDate } from '../utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Helper to temporarily polyfill getComputedStyle to convert OKLCH and OKLab values to RGB for html2canvas compatibility
const runWithOklchPolyfill = async <T,>(action: () => Promise<T>): Promise<T> => {
  const originalGetComputedStyle = window.getComputedStyle;

  // OKLab to RGB conversion algorithm
  const oklabToRgb = (oklabStr: string): string => {
    // Regex matches oklab(L a b) and oklab(L a b / A) or comma-separated versions
    const regex = /oklab\s*\(\s*([\d.]+%?)\s+([-+\d.]+%?)\s+([-+\d.]+%?)\s*(?:\/\s*([\d.]+%?))?\s*\)/i;
    const commaRegex = /oklab\s*\(\s*([\d.]+%?)\s*,\s*([-+\d.]+%?)\s*,\s*([-+\d.]+%?)\s*(?:,\s*([\d.]+%?))?\s*\)/i;
    
    let match = oklabStr.match(regex) || oklabStr.match(commaRegex);
    if (!match) {
      const numbers = oklabStr.match(/[-+\d.]+%?/g);
      if (numbers && numbers.length >= 3) {
        match = [oklabStr, numbers[0], numbers[1], numbers[2], numbers[3] || '1'];
      } else {
        return 'rgb(255, 255, 255)';
      }
    }

    const parsePercent = (val: string, maxVal = 1) => {
      if (val.endsWith('%')) {
        return (parseFloat(val) / 100) * maxVal;
      }
      return parseFloat(val);
    };

    let L = parsePercent(match[1]); // lightness: 0..1
    let a = parseFloat(match[2]);   // red/green coordinate
    let b = parseFloat(match[3]);   // yellow/blue coordinate
    const A = match[4] ? parsePercent(match[4]) : 1;

    // OKLab to LMS
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    // LMS to XYZ/Linear sRGB
    let rLinear = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.7076386775 * s;

    // Clip & sRGB standard gamma companding
    const compand = (ch: number) => {
      const clamped = Math.max(0, Math.min(1, ch));
      return clamped <= 0.0031308 
        ? 12.92 * clamped 
        : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    };

    const R = Math.round(compand(rLinear) * 255);
    const G = Math.round(compand(gLinear) * 255);
    const B = Math.round(compand(bLinear) * 255);

    if (A < 1) {
      return `rgba(${R}, ${G}, ${B}, ${A})`;
    }
    return `rgb(${R}, ${G}, ${B})`;
  };

  // OKLCH to RGB conversion algorithm
  const oklchToRgb = (oklchStr: string): string => {
    // Regex matches oklch(L C H) and oklch(L C H / A) or comma-separated versions
    const regex = /oklch\s*\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+(?:deg|rad|grad|turn)?)\s*(?:\/\s*([\d.]+%?))?\s*\)/i;
    const commaRegex = /oklch\s*\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+(?:deg|rad|grad|turn)?)\s*(?:,\s*([\d.]+%?))?\s*\)/i;
    
    let match = oklchStr.match(regex) || oklchStr.match(commaRegex);
    if (!match) {
      const numbers = oklchStr.match(/[\d.]+%?/g);
      if (numbers && numbers.length >= 3) {
        match = [oklchStr, numbers[0], numbers[1], numbers[2], numbers[3] || '1'];
      } else {
        return 'rgb(255, 255, 255)';
      }
    }

    const parsePercent = (val: string, maxVal = 1) => {
      if (val.endsWith('%')) {
        return (parseFloat(val) / 100) * maxVal;
      }
      return parseFloat(val);
    };

    let L = parsePercent(match[1]); // light: 0..1
    let C = parseFloat(match[2]); // chroma
    let HStr = match[3];
    let H = parseFloat(HStr);
    
    if (HStr.endsWith('rad')) {
      H = (H * 180) / Math.PI;
    } else if (HStr.endsWith('grad')) {
      H = (H * 360) / 400;
    } else if (HStr.endsWith('turn')) {
      H = H * 360;
    }

    const A = match[4] ? parsePercent(match[4]) : 1;

    // Convert cylinder OKLCH to OKLab:
    const hRad = (H * Math.PI) / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    // OKLab to LMS
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    // LMS to XYZ/Linear sRGB
    let rLinear = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.7076386775 * s;

    // Clip & sRGB standard gamma companding
    const compand = (ch: number) => {
      const clamped = Math.max(0, Math.min(1, ch));
      return clamped <= 0.0031308 
        ? 12.92 * clamped 
        : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    };

    const R = Math.round(compand(rLinear) * 255);
    const G = Math.round(compand(gLinear) * 255);
    const B = Math.round(compand(bLinear) * 255);

    if (A < 1) {
      return `rgba(${R}, ${G}, ${B}, ${A})`;
    }
    return `rgb(${R}, ${G}, ${B})`;
  };

  const replaceColorsInString = (str: string): string => {
    if (!str || typeof str !== 'string') return str;
    let result = str;
    if (result.includes('oklch')) {
      result = result.replace(/oklch\s*\([^)]+\)/gi, (match) => {
        try {
          return oklchToRgb(match);
        } catch (e) {
          return 'rgb(255, 255, 255)';
        }
      });
    }
    if (result.includes('oklab')) {
      result = result.replace(/oklab\s*\([^)]+\)/gi, (match) => {
        try {
          return oklabToRgb(match);
        } catch (e) {
          return 'rgb(255, 255, 255)';
        }
      });
    }
    return result;
  };

  // Polyfill computedStyle elements
  window.getComputedStyle = function (el, pseudoEl) {
    const style = originalGetComputedStyle(el, pseudoEl);
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return function (propertyName: string) {
            const val = target.getPropertyValue(propertyName);
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
              return replaceColorsInString(val);
            }
            return val;
          };
        }
        const val = target[prop as keyof typeof target];
        if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
          return replaceColorsInString(val);
        }
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      },
    });
  };

  try {
    return await action();
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
  }
};

interface InvoicePreviewProps {
  invoice: Invoice;
  sender: SenderInfo;
}

export default function InvoicePreview({ invoice, sender }: InvoicePreviewProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState<string | null>(null);

  // Modal tracking states for sandbox environments
  const [exportedPngUrl, setExportedPngUrl] = useState<string | null>(null);
  const [exportedPdfUrl, setExportedPdfUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'png' | 'pdf' | null>(null);

  // Triggers window native printing focusing only on the invoice document
  const handlePrint = () => {
    try {
      const printArea = document.getElementById('print-area');
      if (!printArea) return;
      
      // Temporarily clone the target print-area element
      const printClone = printArea.cloneNode(true) as HTMLElement;
      printClone.id = 'print-clone-target';
      printClone.classList.add('print-only-container');
      
      // Add printable class to body and append clone
      document.body.classList.add('is-printing-active');
      document.body.appendChild(printClone);
      
      // Execute printing
      window.print();
      
      // Cleanup cloned DOM & body state
      document.body.classList.remove('is-printing-active');
      const attachedClone = document.getElementById('print-clone-target');
      if (attachedClone) {
        document.body.removeChild(attachedClone);
      }
    } catch (e) {
      console.error('System print blocked by host browser environment:', e);
    }
  };

  // High-fidelity PNG Export
  const handleExportPng = async () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    setIsExportingPng(true);
    try {
      // Temporarily remove shadow and border styling before capturing
      const originalBoxShadow = printArea.style.boxShadow;
      printArea.style.boxShadow = 'none';

      const canvas = await runWithOklchPolyfill(async () => {
        return await html2canvas(printArea, {
          scale: 3, // Premium high-def output
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
      });

      // Restore styling
      printArea.style.boxShadow = originalBoxShadow;

      const imgData = canvas.toDataURL('image/png');
      setExportedPngUrl(imgData);
      setModalType('png');
      setIsModalOpen(true);

      // Attempt immediate fallback anchor download
      const link = document.createElement('a');
      link.download = `Invoice_${invoice.invoiceNumber || 'Draft'}.png`;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportSuccess('PNG');
      setTimeout(() => setShowExportSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to generate PNG export:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  // High-fidelity PDF Export
  const handleExportPdf = async () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    setIsExportingPdf(true);
    try {
      // Temporarily remove shadow for clean print render
      const originalBoxShadow = printArea.style.boxShadow;
      printArea.style.boxShadow = 'none';

      const canvas = await runWithOklchPolyfill(async () => {
        return await html2canvas(printArea, {
          scale: 2.5, // Crisp font rendering
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
      });

      // Restore styling
      printArea.style.boxShadow = originalBoxShadow;

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Fit or scale properly vertically if the content spills slightly
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pdfHeight));

      // Generate localized blob URL and store in state for explicit view options
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      setExportedPdfUrl(blobUrl);
      setModalType('pdf');
      setIsModalOpen(true);

      // Attempt immediate fallback anchor download
      pdf.save(`Invoice_${invoice.invoiceNumber || 'Draft'}.pdf`);

      setShowExportSuccess('PDF');
      setTimeout(() => setShowExportSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to generate PDF export:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4" id="invoice-preview-panel">
      {/* Title & Sheet Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#eff1f4] shadow-sm mb-1" id="preview-panel-header">
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-extrabold text-[#5d6b82] uppercase tracking-wider">
            Live Preview
          </h3>
          <p className="text-[10px] text-[#8695ac]">
            Export professional documents instantly
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2" id="preview-actions">
          {/* PNG Export Button */}
          <button
            type="button"
            id="export-png-btn"
            onClick={handleExportPng}
            disabled={isExportingPng || isExportingPdf}
            className="px-3 py-2 text-[#475467] hover:text-[#121212] bg-white border border-[#dddfdf] rounded-lg hover:bg-[#f8fafc] hover:border-slate-400 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer disabled:opacity-50"
            title="Download Invoice as PNG image"
          >
            {isExportingPng ? (
              <Loader2 size={13} className="animate-spin text-slate-500" />
            ) : (
              <ImageIcon size={13} />
            )}
            <span>Export PNG</span>
          </button>

          {/* PDF Export Button */}
          <button
            type="button"
            id="export-pdf-btn"
            onClick={handleExportPdf}
            disabled={isExportingPng || isExportingPdf}
            className="px-3 py-2 text-[#475467] hover:text-[#121212] bg-white border border-[#dddfdf] rounded-lg hover:bg-[#f8fafc] hover:border-slate-400 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer disabled:opacity-50"
            title="Download Invoice as PDF document"
          >
            {isExportingPdf ? (
              <Loader2 size={13} className="animate-spin text-slate-500" />
            ) : (
              <Download size={13} />
            )}
            <span>Export PDF</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            id="print-btn"
            onClick={handlePrint}
            className="px-3 py-2 text-white bg-[#121212] hover:bg-black rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-sm active:scale-95"
            title="Print or Save via Browser System"
          >
            <Printer size={13} />
            <span>Print System</span>
          </button>
        </div>
      </div>

      {/* Success alert badge */}
      {showExportSuccess && (
        <div 
          id="export-success-alert"
          className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg py-2 px-3 text-xs font-medium animate-fade-in"
        >
          <CheckCircle2 size={14} className="text-emerald-600 animate-pulse" />
          <span>Success! Your invoice has been exported and saved as a <strong>{showExportSuccess}</strong> file.</span>
        </div>
      )}

      {/* Sheet Canvas Shadow Wrapper */}
      <div className="w-full bg-[#f4f5f8] rounded-2xl p-4 md:p-8 flex items-center justify-center border border-[#eff1f4]/60 soft-shadow min-h-[750px] overflow-hidden">
        {/* Printable/Preview White Box */}
        <div 
          id="print-area" 
          className="w-full max-w-[680px] bg-white rounded-xl shadow-md p-6 sm:p-10 flex flex-col gap-8 text-[#121212] relative overflow-hidden invoice-shadow border border-white"
        >
          {/* Top Section: Header & Metadata */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-dashed border-slate-100 pb-6" id="preview-header-meta">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#121212] flex items-center justify-center text-white font-bold select-none text-base">
                {/* Visual Circle Line */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a9 9 0 0 0-9 9c0 1.25.25 2.5.75 3.5M12 3a9 9 0 0 1 9 9c0 1.25-.25 2.5-.75 3.5" />
                  <path d="M7 12c0-2.5 2-4.5 5-4.5s5 2 5 4.5" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-base text-[#121212] tracking-tight block">
                  {sender.companyName}
                </span>
                <span className="text-[10px] text-[#5d6b82] tracking-wider uppercase font-semibold">
                  Professional Design Studio
                </span>
              </div>
            </div>

            {/* Dates & Terms Grid */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-left sm:text-right" id="preview-date-meta">
              <div>
                <span className="text-[10px] text-[#8695ac] font-bold uppercase tracking-wider block">Issue Date</span>
                <span className="text-[11px] font-semibold text-[#121212] mt-0.5 block">{formatDate(invoice.issueDate) || '–'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8695ac] font-bold uppercase tracking-wider block">Due Date</span>
                <span className="text-[11px] font-semibold text-[#121212] mt-0.5 block">{formatDate(invoice.dueDate) || '–'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#8695ac] font-bold uppercase tracking-wider block">Payment Terms</span>
                <span className="text-[11px] font-semibold text-[#121212] mt-0.5 block">{invoice.paymentTerms || '–'}</span>
              </div>
            </div>
          </div>

          {/* Billed By and Billed To Column Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="preview-address-columns">
            {/* Billed By Section */}
            <div className="flex flex-col gap-1.5 bg-[#f8fafc]/40 p-3 rounded-lg border border-slate-50">
              <span className="text-[10px] text-[#8695ac] font-extrabold uppercase tracking-wider">Billed by:</span>
              <span className="text-xs font-bold text-[#121212]">{sender.companyName}</span>
              <p className="text-[11px] leading-relaxed text-[#5d6b82] font-medium whitespace-pre-line">
                {sender.address}
              </p>
            </div>

            {/* Billed To Section */}
            <div className="flex flex-col gap-1.5 bg-[#f8fafc]/40 p-3 rounded-lg border border-slate-50">
              <span className="text-[10px] text-[#8695ac] font-extrabold uppercase tracking-wider">Billed to:</span>
              <span className="text-xs font-bold text-[#121212]">{invoice.customerName || 'PT Customer Name'}</span>
              <p className="text-[11px] leading-relaxed text-[#5d6b82] font-medium whitespace-pre-line">
                {invoice.billingAddress || 'Customer Billing Address'}
              </p>
            </div>
          </div>

          {/* Items Preview Table */}
          <div className="w-full flex flex-col mt-2" id="preview-items-table">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dashed border-slate-100 text-[#8695ac] text-[10px] font-bold uppercase tracking-wider">
                  <th className="text-left pb-3 w-[55%] font-bold">Item</th>
                  <th className="text-center pb-3 w-[15%] font-bold">QTY</th>
                  <th className="text-right pb-3 w-[15%] font-bold">Cost</th>
                  <th className="text-right pb-3 w-[15%] font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dotted divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="text-xs text-[#303846]">
                    <td className="py-4 pr-3 font-semibold text-[#121212] leading-snug">
                      {item.name || 'Untitled Line Item'}
                    </td>
                    <td className="py-4 text-center text-[#5d6b82] font-medium whitespace-nowrap">
                      {item.qty} {item.unit}
                    </td>
                    <td className="py-4 text-right text-[#5d6b82] font-medium font-mono">
                      {formatIDR(item.cost, false)}
                    </td>
                    <td className="py-4 text-right font-semibold text-[#121212] font-mono">
                      {formatIDR(item.amount, false)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Grid: Left Bank Details, Right Math Formulas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-dashed border-slate-100 pt-6 mt-auto" id="preview-bottom-summaries">
            {/* Left Bank Container */}
            <div className="flex flex-col gap-3 justify-end text-left" id="preview-bank-details">
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex flex-col gap-1.5">
                <h4 className="text-[10px] font-extrabold text-[#8695ac] uppercase tracking-wider">
                  Payment Details
                </h4>
                <div className="flex flex-col gap-1 text-[11px] font-medium">
                  <div className="flex justify-between sm:justify-start sm:gap-4 text-[#5d6b82]">
                    <span className="w-24">Bank Name:</span>
                    <span className="font-bold text-[#121212]">{sender.bankName}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start sm:gap-4 text-[#5d6b82]">
                    <span className="w-24">Account Name:</span>
                    <span className="font-bold text-[#121212]">{sender.bankAccountName}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start sm:gap-4 text-[#5d6b82]">
                    <span className="w-24">Account Number:</span>
                    <span className="font-bold text-[#121212] font-mono">{sender.bankAccountNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Formula Math Container */}
            <div className="flex flex-col gap-3 text-right text-xs" id="preview-totals-math">
              <div className="flex justify-between text-[#8695ac] font-bold">
                <span>Subtotal</span>
                <span className="font-semibold text-[#121212] font-mono">{formatIDR(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#8695ac] font-bold">
                <span>Discount</span>
                <span className="font-semibold text-rose-500 font-mono">-{formatIDR(invoice.discount)}</span>
              </div>
              <div className="flex justify-between text-[#8695ac] font-bold">
                <span>Tax (11%)</span>
                <span className="font-semibold text-[#121212] font-mono">+{formatIDR(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#121212] border-t border-dashed border-slate-100 pt-3 mt-1.5">
                <span>Total</span>
                <span className="font-mono text-base">{formatIDR(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Terms Notes Block */}
          {invoice.notes && (
            <div className="border-t border-dashed border-slate-100 pt-4 flex flex-col gap-1 text-left" id="preview-terms-notes">
              <span className="text-[10px] text-[#8695ac] font-extrabold uppercase tracking-wider">Notes</span>
              <p className="text-[11px] text-[#5d6b82] leading-relaxed font-semibold italic">
                "{invoice.notes}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modern, Highly Accessible Preview & Export Dialog Modal */}
      {isModalOpen && (
        <div 
          id="export-preview-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0f1d]/75 backdrop-blur-md animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            id="export-preview-modal-content"
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100/80 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#121212] text-white flex items-center justify-center">
                  {modalType === 'png' ? <ImageIcon size={16} /> : <FileText size={16} />}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#121212]">
                    {modalType === 'png' ? 'Arsip Gambar (PNG) Siap!' : 'Arsip Dokumen (PDF) Siap!'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Invoice #{invoice.invoiceNumber || 'Draft'} • Studio Arsa Digital
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#121212] hover:bg-slate-100 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Scrollable Content Area */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5 text-slate-600">
              {/* Information Hint Banner */}
              <div className="flex gap-2.5 p-3.5 bg-sky-50/65 border border-sky-100/50 rounded-xl text-sky-900 text-[11px] leading-relaxed font-medium">
                <AlertCircle size={15} className="text-sky-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sky-950">Informasi Penting Cetak & Simpan</span>
                  <p>
                    {modalType === 'png' 
                      ? 'Jika unduhan tidak berjalan otomatis akibat pengaturan keamanan browser (iframe sandbox), Anda dapat menekan tombol "Unduh Gambar" di bawah atau klik kanan pada gambar berkas lalu pilih "Simpan gambar sebagai..." (Save image as).'
                      : 'Untuk hasil cetak terbaik dan penyimpanan PDF, gunakan tombol "Buka PDF di Tab Baru" di bawah ini. Halaman PDF yang terbuka akan menampilkan menu cetak & simpan bawaan browser Anda.'}
                  </p>
                </div>
              </div>

              {/* Real Render Preview Frame */}
              <div className="w-full flex flex-col gap-2">
                <span className="text-[10px] text-[#8695ac] uppercase font-extrabold tracking-wider block">
                  Pratonton Dokumen (Hasil):
                </span>
                
                {modalType === 'png' && exportedPngUrl && (
                  <div className="w-full max-h-[320px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-100 p-2 flex items-center justify-center group relative cursor-zoom-in">
                    <img 
                      src={exportedPngUrl} 
                      alt="Invoice PNG Preview" 
                      className="max-w-full h-auto rounded-lg shadow-sm border border-slate-200/50" 
                    />
                    <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-slate-900/90 text-white text-[10px] font-bold py-1.5 px-3 rounded-full shadow border border-slate-800 tracking-wide">
                        Klik Kanan / Tahan pada Gambar untuk Menyalin/Menyimpan
                      </span>
                    </div>
                  </div>
                )}

                {modalType === 'pdf' && exportedPdfUrl && (
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-8 text-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <FileText size={32} />
                    </div>
                    <div className="max-w-md">
                      <span className="text-xs font-bold text-[#121212] block">
                        Dokumen PDF Berhasil Dibuat
                      </span>
                      <p className="text-[11px] text-[#5d6b82] mt-1 leading-relaxed">
                        Arsip dokumen telah dikompres secara optimal dengan kualitas teks tajam (vector font scaling) untuk keperluan cetak kuitansi.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer / Action Center */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[10px] text-slate-500 font-semibold font-mono">
                System: 2026 Ready
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {modalType === 'png' && exportedPngUrl && (
                  <>
                    <a
                      href={exportedPngUrl}
                      download={`Invoice_${invoice.invoiceNumber || 'Draft'}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold border border-slate-200 transition-all"
                    >
                      <Download size={13} />
                      <span>Unduh Gambar</span>
                    </a>
                    <a
                      href={exportedPngUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-[#121212] hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      <ExternalLink size={13} />
                      <span>Buka di Tab Baru</span>
                    </a>
                  </>
                )}

                {modalType === 'pdf' && exportedPdfUrl && (
                  <>
                    <a
                      href={exportedPdfUrl}
                      download={`Invoice_${invoice.invoiceNumber || 'Draft'}.pdf`}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold border border-slate-200 transition-all"
                    >
                      <Download size={13} />
                      <span>Unduh PDF</span>
                    </a>
                    <a
                      href={exportedPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-[#121212] hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      <ExternalLink size={13} />
                      <span>Buka PDF di Tab Baru</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
