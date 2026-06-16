import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, Image as ImageIcon, CheckCircle2, Loader2, X, ExternalLink, FileText, AlertCircle, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { Invoice, SenderInfo, Customer } from '../types';
import { formatIDR, formatDate } from '../utils';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface InvoicePreviewProps {
  invoice: Invoice;
  sender: SenderInfo;
  customers?: Customer[];
}

export default function InvoicePreview({ invoice, sender, customers }: InvoicePreviewProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        // Padding space on outer canvas wrapper: p-4 is 16px*2=32px, md:p-8 is 32px*2=64px
        const isMobile = window.innerWidth < 768;
        const padding = isMobile ? 32 : 64;
        const availableWidth = containerWidth - padding;
        const newScale = Math.min(1, availableWidth / 794);
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    // Timeout as fallback for route transitions or layout updates
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Find customer details if matching customer exists in the customer list
  const matchedCustomer = customers?.find(
    (c) => c.name.toLowerCase() === invoice.customerName?.toLowerCase()
  );

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
      
      // Reset scaling and absolute positioning styles for printing
      printClone.style.transform = 'none';
      printClone.style.transformOrigin = 'initial';
      printClone.style.position = 'relative';
      printClone.style.width = '100%';
      printClone.style.height = '100%';
      printClone.style.top = 'auto';
      printClone.style.left = 'auto';
      printClone.style.borderRadius = '0';
      printClone.style.border = 'none';
      printClone.style.boxShadow = 'none';
      
      // Add printable class to body and HTML, and append clone
      document.documentElement.classList.add('is-printing-active');
      document.body.classList.add('is-printing-active');
      document.body.appendChild(printClone);
      
      // Execute printing
      window.print();
      
      // Cleanup cloned DOM & body/HTML state
      document.documentElement.classList.remove('is-printing-active');
      document.body.classList.remove('is-printing-active');
      const attachedClone = document.getElementById('print-clone-target');
      if (attachedClone) {
        document.body.removeChild(attachedClone);
      }
    } catch (e) {
      console.error('System print blocked by host browser environment:', e);
    }
  };

  // Generate a high-definition A4 PNG data URL using html-to-image (browser-native rendering)
  const generateHighResImageDataUrl = async (printArea: HTMLElement): Promise<string> => {
    // Wait for all fonts to be fully loaded before capturing
    if (document.fonts) {
      await document.fonts.ready;
    }

    // Create an off-screen container at exact A4 dimensions
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-10000px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '794px';
    tempContainer.style.height = '1123px';
    tempContainer.style.overflow = 'hidden';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.zIndex = '-9999';

    // Clone the print area into this off-screen container
    const printClone = printArea.cloneNode(true) as HTMLElement;
    printClone.style.transform = 'none';
    printClone.style.transformOrigin = 'top left';
    printClone.style.position = 'relative';
    printClone.style.top = '0';
    printClone.style.left = '0';
    printClone.style.width = '794px';
    printClone.style.height = '1123px';
    printClone.style.minHeight = '1123px';
    printClone.style.maxHeight = '1123px';
    printClone.style.padding = '0';
    printClone.style.boxShadow = 'none';
    printClone.style.borderRadius = '0';
    printClone.style.border = 'none';
    printClone.style.boxSizing = 'border-box';
    printClone.style.overflow = 'hidden';

    tempContainer.appendChild(printClone);
    document.body.appendChild(tempContainer);

    // Allow browser to fully reflow the cloned element
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    try {
      // html-to-image uses SVG foreignObject â€” the browser's OWN rendering engine
      // draws the content, so ALL CSS properties work exactly like the preview
      const dataUrl = await toPng(printClone, {
        width: 794,
        height: 1123,
        pixelRatio: 3, // High-def 3x output
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipAutoScale: true,
        includeQueryParams: true,
      });
      return dataUrl;
    } finally {
      document.body.removeChild(tempContainer);
    }
  };

  // High-fidelity PNG Export matching exact A4 paper size
  const handleExportPng = async () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    setIsExportingPng(true);
    try {
      const imgData = await generateHighResImageDataUrl(printArea);
      
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

  // High-fidelity PDF Export matching exact A4 paper size
  const handleExportPdf = async () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    setIsExportingPdf(true);
    try {
      const imgData = await generateHighResImageDataUrl(printArea);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Since image has the exact same A4 aspect ratio, it fits the PDF page perfectly
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

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

  const handleShareWhatsapp = () => {
    const typeLabel = 
      invoice.documentType === 'quotation' ? 'Penawaran Barang' :
      invoice.documentType === 'dp' ? 'Invoice DP (Down Payment)' :
      invoice.documentType === 'pelunasan' ? 'Invoice Pelunasan' :
      invoice.documentType === 'receipt' ? 'Nota Barang (Receipt)' : 'Invoice';

    const formattedTotal = formatIDR(invoice.total);
    const formattedDate = formatDate(invoice.issueDate);
    const formattedDueDate = formatDate(invoice.dueDate);
    
    let message = `Halo *${invoice.customerName || 'Klien'}*,\n\n`;
    message += `Berikut kami kirimkan rincian dokumen *${invNoLabel()} ${invoice.invoiceNumber || 'Draft'}*:\n`;
    message += `- *Tipe Dokumen*: ${typeLabel}\n`;
    message += `- *Tanggal*: ${formattedDate}\n`;
    if (invoice.documentType !== 'receipt' && invoice.documentType !== 'quotation') {
      message += `- *Jatuh Tempo*: ${formattedDueDate}\n`;
    }
    message += `- *Total Tagihan*: *${formattedTotal}*\n\n`;
    
    if (invoice.documentType === 'quotation') {
      message += `Penawaran ini berlaku selama periode validitas yang tertera. Silakan hubungi kami untuk konfirmasi lebih lanjut.\n\n`;
    } else if (invoice.documentType === 'receipt') {
      message += `Terima kasih atas pembayaran Anda. Dokumen ini adalah bukti pembayaran yang sah.\n\n`;
    } else {
      message += `Mohon untuk melakukan transfer ke rekening bank berikut:\n`;
      message += `- *Bank*: ${sender.bankName}\n`;
      message += `- *Atas Nama*: ${sender.bankAccountName}\n`;
      message += `- *No Rekening*: ${sender.bankAccountNumber}\n\n`;
      message += `Harap melakukan konfirmasi setelah pembayaran berhasil dilakukan.\n\n`;
    }
    
    message += `Terima kasih atas kerja sama Anda.\n*${sender.companyName}*`;

    let cleanPhone = invoice.customerPhone ? invoice.customerPhone.replace(/[^0-9]/g, '') : '';
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const invNoLabel = () => {
    if (invoice.documentType === 'quotation') return 'Quotation No';
    if (invoice.documentType === 'dp') return 'Invoice DP No';
    if (invoice.documentType === 'pelunasan') return 'Invoice PL No';
    if (invoice.documentType === 'receipt') return 'Receipt No';
    return 'Invoice No';
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

          {/* Share WhatsApp Button */}
          <button
            type="button"
            id="share-wa-btn"
            onClick={handleShareWhatsapp}
            className="px-3 py-2 text-[#075e54] hover:text-[#128c7e] bg-[#f0fdf4] hover:bg-[#dcfce7] border border-emerald-100 rounded-lg hover:border-emerald-300 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Bagikan rincian tagihan via WhatsApp"
          >
            <MessageCircle size={13} className="text-[#25d366]" />
            <span>Share WA</span>
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
          className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg py-2 px-3 text-xs font-medium animate-fade-in mb-3"
        >
          <CheckCircle2 size={14} className="text-emerald-600 animate-pulse" />
          <span>Success! Your invoice has been exported and saved as a <strong>{showExportSuccess}</strong> file.</span>
        </div>
      )}

      {/* Sheet Canvas Shadow Wrapper */}
      <div 
        ref={containerRef}
        className="w-full bg-[#f4f5f8] rounded-2xl p-4 md:p-8 flex items-center justify-center border border-[#eff1f4]/60 soft-shadow min-h-[500px] overflow-hidden"
      >
        {/* Proportional scaling wrapper to maintain correct heights in document flow */}
        <div 
          style={{ 
            width: `${794 * scale}px`, 
            height: `${1123 * scale}px`, 
            position: 'relative',
            transition: 'width 0.2s, height 0.2s'
          }}
          className="shrink-0"
        >
          {/* Printable/Preview White Box styled as an A4 sheet for absolute visual consistency */}
          <div 
            id="print-area" 
            style={{
              width: '794px',
              height: '1123px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            className="bg-white rounded-xl shadow-md text-[#121212] overflow-hidden invoice-shadow border border-white font-sans"
          >
          {invoice.documentType === 'receipt' && (
            <div 
              style={{
                position: 'absolute',
                top: '140px',
                right: '80px',
                transform: 'rotate(-15deg)',
                border: '4px double #10b981',
                borderRadius: '8px',
                color: '#10b981',
                fontSize: '20px',
                fontWeight: 'bold',
                padding: '6px 16px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                opacity: 0.85,
                zIndex: 30,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                pointerEvents: 'none',
                fontFamily: "'Courier New', Courier, monospace"
              }}
            >
              LUNAS / PAID
            </div>
          )}
          {/* Logo Block (Flush with Left typing margin) */}
          <div className="absolute top-0 left-6 sm:left-12 w-[110px] h-[155px] bg-[#4a4a4a] flex flex-col items-center justify-center p-4 text-center z-10" style={{ backgroundColor: '#4a4a4a' }}>
            {/* SVG white logo mark */}
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white mb-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <span className="font-extrabold text-[9px] text-white tracking-wide block leading-tight mb-1">{sender.companyName}</span>
            <span className="text-[6px] text-white/50 tracking-wider uppercase font-semibold leading-none">We solve your problems</span>
          </div>

          {/* Inner padding wrapper to isolate content from print margins and canvas scaling bugs */}
          <div className="w-full h-full p-12 flex flex-col justify-between" style={{ boxSizing: 'border-box' }}>

          {/* ===== TOP HEADER: Logo Left + INVOICE Title Right ===== */}
          <div className="flex justify-between items-start" id="preview-header-meta">
            {/* Logo Block */}
            <div className="w-[110px]" style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}>
              {sender.logoUrl ? (
                <img src={sender.logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '55px', objectFit: 'contain' }} />
              ) : (
                <div className="w-[110px] h-[10px] invisible"></div>
              )}
            </div>

            {/* Dynamic Title */}
            <h2 
              className="font-bold text-[#2d2d2d] uppercase text-right" 
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: invoice.documentType && invoice.documentType !== 'invoice' ? '0.12em' : '0.25em',
                fontSize: invoice.documentType === 'quotation' || invoice.documentType === 'dp' || invoice.documentType === 'pelunasan' || invoice.documentType === 'receipt' ? '22px' : '32px',
                lineHeight: '1.2'
              }}
            >
              {invoice.documentType === 'quotation' && 'PENAWARAN BARANG'}
              {invoice.documentType === 'dp' && 'INVOICE UANG MUKA'}
              {invoice.documentType === 'pelunasan' && 'INVOICE PELUNASAN'}
              {invoice.documentType === 'receipt' && 'NOTA BARANG'}
              {(!invoice.documentType || invoice.documentType === 'invoice') && 'INVOICE'}
            </h2>
          </div>

          {/* ===== INVOICE TO + INVOICE METADATA ===== */}
          <div className="flex justify-between items-start gap-8 mt-28 w-full" id="preview-address-columns">
            {/* Left: Invoice To */}
            <div className="flex flex-col text-left" style={{ width: '50%' }}>
              <span className="text-[9px] text-[#aaa] font-bold uppercase tracking-wider mb-1">Invoice To</span>
              <span className="text-base font-extrabold text-[#121212] leading-tight">{invoice.customerName || 'Client Name'}</span>
              <span className="text-[10px] text-slate-500 font-medium leading-snug mt-1">{invoice.billingAddress || 'Client Address'}</span>
              
              {/* Only render Contact Person if phone or email is provided */}
              {(invoice.customerPhone || invoice.customerEmail) && (
                <div className="mt-4 flex flex-col gap-1.5">
                  <span className="text-[9px] text-[#aaa] font-bold uppercase tracking-wider mb-1">Contact Person</span>
                  <table style={{ borderCollapse: 'collapse', border: 'none' }} className="text-[10px] text-slate-600 font-medium w-full">
                    <tbody>
                      {invoice.customerPhone && (
                        <tr>
                          <td className="py-0.5 text-left text-slate-500 font-medium" style={{ width: '55px', border: 'none' }}>Phone</td>
                          <td className="py-0.5 text-left text-slate-600 font-semibold" style={{ border: 'none' }}>: {invoice.customerPhone}</td>
                        </tr>
                      )}
                      {invoice.customerEmail && (
                        <tr>
                          <td className="py-0.5 text-left text-slate-500 font-medium" style={{ border: 'none' }}>E-mail</td>
                          <td className="py-0.5 text-left text-slate-600 font-semibold" style={{ border: 'none' }}>: {invoice.customerEmail}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right: Invoice Metadata */}
            <div className="flex flex-col justify-between items-end text-left pl-6" style={{ width: '50%' }}>
              <div className="ml-auto flex flex-col gap-4 items-end" style={{ marginRight: '16px' }}>
                <table style={{ borderCollapse: 'collapse', border: 'none' }} className="text-[10px] text-slate-600 font-medium">
                  <tbody>
                    <tr>
                      <td className="py-1 text-left text-slate-500 font-medium" style={{ width: '90px', border: 'none' }}>
                        {invoice.documentType === 'quotation' && 'Quotation No'}
                        {invoice.documentType === 'dp' && 'Invoice DP No'}
                        {invoice.documentType === 'pelunasan' && 'Invoice PL No'}
                        {invoice.documentType === 'receipt' && 'Receipt No'}
                        {(!invoice.documentType || invoice.documentType === 'invoice') && 'Invoice No'}
                      </td>
                      <td className="py-1 text-center" style={{ width: '12px', border: 'none' }}>:</td>
                      <td className="py-1 text-left text-[#121212] font-semibold" style={{ border: 'none' }}>{invoice.invoiceNumber || '—'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-left text-slate-500 font-medium" style={{ border: 'none' }}>
                        {invoice.documentType === 'quotation' && 'Quotation Date'}
                        {invoice.documentType === 'receipt' && 'Receipt Date'}
                        {(invoice.documentType !== 'quotation' && invoice.documentType !== 'receipt') && 'Invoice Date'}
                      </td>
                      <td className="py-1 text-center" style={{ border: 'none' }}>:</td>
                      <td className="py-1 text-left text-[#121212] font-semibold" style={{ border: 'none' }}>{formatDate(invoice.issueDate) || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Group table and totals section together to control vertical spacing and prevent justify-between from spreading them apart */}
          <div className="w-full flex flex-col gap-4 mt-6" id="table-totals-group">
            {/* ===== ITEMS TABLE with Dark Header + Zebra Rows ===== */}
            <div className="w-full flex flex-col" id="preview-items-table">
              <table className="w-full" style={{borderCollapse: 'collapse'}}>
                <thead>
                  <tr className="bg-[#4a4a4a] text-white text-[9px] font-bold uppercase tracking-wider">
                    <th className="rounded-l-lg w-[8%]" style={{ padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: '40px', padding: '0 16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1' }}>#</div>
                    </th>
                    <th className="w-[42%]" style={{ padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: '40px', padding: '0 16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1' }}>Description</div>
                    </th>
                    <th className="w-[16%]" style={{ padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minHeight: '40px', padding: '0 16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1' }}>Price</div>
                    </th>
                    <th className="w-[16%]" style={{ padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40px', padding: '0 16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1' }}>Quantity</div>
                    </th>
                    <th className="rounded-r-lg w-[18%]" style={{ padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minHeight: '40px', padding: '0 16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1' }}>Amount</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr 
                      key={item.id || idx} 
                      className={`text-[11px] text-[#444] ${idx % 2 === 1 ? 'bg-[#eaeaea]' : 'bg-white'}`}
                    >
                      <td style={{ padding: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: '44px', padding: '0 16px', color: '#999', fontWeight: 600, lineHeight: '1' }}>
                          {item.rowNumber !== undefined ? item.rowNumber : String(idx + 1).padStart(2, '0')}
                        </div>
                      </td>
                      <td style={{ padding: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: '44px', padding: '0 16px', color: '#2d2d2d', fontWeight: 600, lineHeight: '1' }}>
                          {item.name || ''}
                        </div>
                      </td>
                      <td style={{ padding: 0 }}>
                        <div className="font-mono" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minHeight: '44px', padding: '0 16px', fontWeight: 500, lineHeight: '1' }}>
                          {item.cost === 0 ? '' : formatIDR(item.cost, false)}
                        </div>
                      </td>
                      <td style={{ padding: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '44px', padding: '0 16px', fontWeight: 500, lineHeight: '1' }}>
                          {item.qty === 0 || (!item.name && item.cost === 0) ? '' : `${item.qty} ${item.unit || ''}`}
                        </div>
                      </td>
                      <td style={{ padding: 0 }}>
                        <div className="font-mono" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minHeight: '44px', padding: '0 16px', color: '#2d2d2d', fontWeight: 600, lineHeight: '1' }}>
                          {item.amount === 0 ? '' : formatIDR(item.amount, false)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ===== PAYMENT DETAILS (Left) + SUB TOTAL / TAX / TOTAL BAR (Right) ===== */}
            <div className="grid grid-cols-[50%_50%] gap-0 mt-6" id="preview-bottom-summaries">
              {/* Left: Payment Details Block */}
              <div className="flex flex-col justify-start gap-2 text-left" id="preview-bank-details" style={{ paddingTop: '3px' }}>
                <span className="text-[10px] text-[#aaa] font-bold uppercase tracking-wider mb-1">Payment Details</span>
                <div className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1.5 text-[10px] text-slate-600 font-medium">
                  <span>Bank Name</span>
                  <span className="text-[#121212] font-semibold">: {sender.bankName}</span>
                  <span>Account Name</span>
                  <span className="text-[#121212] font-semibold">: {sender.bankAccountName}</span>
                  <span>Account Number</span>
                  <span className="text-[#121212] font-semibold">: <span className="font-mono">{sender.bankAccountNumber}</span></span>
                </div>
              </div>

              {/* Right: Sub Total / Tax / TOTAL (Aligned to table columns: Price 16%, Quantity 16%, Amount 18% -> inner col width proportion is 32%, 32%, 36%) */}
              <div className="flex flex-col justify-start text-[11px]" id="preview-totals-math">
                <table className="w-full" style={{ borderCollapse: 'collapse', border: 'none' }}>
                  <tbody>
                    {/* Sub Total Row */}
                    <tr className="bg-transparent">
                      <td style={{ width: '32%' }} className="px-4 py-[3px]"></td>
                      <td style={{ width: '32%' }} className="px-4 py-[3px] text-left text-slate-500 font-medium">Sub Total</td>
                      <td style={{ width: '36%' }} className="px-4 py-[3px] text-right font-semibold text-[#2d2d2d] font-mono">{formatIDR(invoice.subtotal, false)}</td>
                    </tr>

                    {/* Discount Row */}
                    {invoice.discount > 0 && (
                      <tr className="bg-transparent">
                        <td style={{ width: '32%' }} className="px-4 py-[3px]"></td>
                        <td style={{ width: '32%' }} className="px-4 py-[3px] text-left text-slate-500 font-medium">Discount</td>
                        <td style={{ width: '36%' }} className="px-4 py-[3px] text-right font-semibold text-rose-500 font-mono">-{formatIDR(invoice.discount, false)}</td>
                      </tr>
                    )}

                    {/* Tax Row */}
                    {invoice.taxRate > 0 && (
                      <tr className="bg-transparent">
                        <td style={{ width: '32%' }} className="px-4 py-[3px]"></td>
                        <td style={{ width: '32%' }} className="px-4 py-[3px] text-left text-slate-500 font-medium">Tax ({invoice.taxRate}%)</td>
                        <td style={{ width: '36%' }} className="px-4 py-[3px] text-right font-semibold text-[#2d2d2d] font-mono">{formatIDR(invoice.taxAmount, false)}</td>
                      </tr>
                    )}

                    {/* Total Kontrak Row for DP or Pelunasan */}
                    {(invoice.documentType === 'dp' || invoice.documentType === 'pelunasan') && (
                      <tr className="bg-transparent">
                        <td style={{ width: '32%' }} className="px-4 py-[3px]"></td>
                        <td style={{ width: '32%' }} className="px-4 py-[3px] text-left text-slate-500 font-semibold text-[#2d2d2d]">Total Kontrak</td>
                        <td style={{ width: '36%' }} className="px-4 py-[3px] text-right font-bold text-[#2d2d2d] font-mono">{formatIDR(invoice.subtotal - invoice.discount + invoice.taxAmount, false)}</td>
                      </tr>
                    )}

                    {/* DP Percentage Row for DP */}
                    {invoice.documentType === 'dp' && (
                      <tr className="bg-transparent">
                        <td style={{ width: '32%' }} className="px-4 py-[3px]"></td>
                        <td style={{ width: '32%' }} className="px-4 py-[3px] text-left text-slate-500 font-medium">Uang Muka (DP {invoice.dpPercentage || 30}%)</td>
                        <td style={{ width: '36%' }} className="px-4 py-[3px] text-right font-semibold text-[#2d2d2d] font-mono">{formatIDR(invoice.total, false)}</td>
                      </tr>
                    )}

                    {/* DP Paid Amount Row for Pelunasan */}
                    {invoice.documentType === 'pelunasan' && (
                      <tr className="bg-transparent">
                        <td style={{ width: '32%' }} className="px-4 py-[3px]"></td>
                        <td style={{ width: '32%' }} className="px-4 py-[3px] text-left text-slate-500 font-medium">Uang Muka Terbayar</td>
                        <td style={{ width: '36%' }} className="px-4 py-[3px] text-right font-semibold text-[#2d2d2d] font-mono">-{formatIDR(invoice.dpPaidAmount || 0, false)}</td>
                      </tr>
                    )}

                    {/* Dark TOTAL Bar (Aligned to span across Col 2 & 3: Quantity + Amount, matches table headers height of 38px) */}
                    <tr className="bg-transparent">
                      <td style={{ width: '32%' }} className="px-4 pt-1 pb-[3px]"></td>
                      <td colSpan={2} style={{ width: '68%' }} className="px-0 pt-1 pb-[3px]">
                        <div className="bg-[#4a4a4a] text-white rounded-lg flex justify-between items-center px-4 h-[38px] w-full">
                          <span className="font-bold text-xs uppercase tracking-wider">
                            {invoice.documentType === 'quotation' && 'TOTAL PENAWARAN'}
                            {invoice.documentType === 'dp' && 'TOTAL TAGIHAN DP'}
                            {invoice.documentType === 'pelunasan' && 'SISA PELUNASAN'}
                            {invoice.documentType === 'receipt' && 'TOTAL LUNAS'}
                            {(!invoice.documentType || invoice.documentType === 'invoice') && 'TOTAL'}
                          </span>
                          <span className="font-extrabold text-sm font-mono">{formatIDR(invoice.total)}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ===== TERMS & CONDITIONS + SIGNATURE ===== */}
          <div className="grid grid-cols-2 gap-8 mt-8 pt-4" id="preview-terms-signature">
            {/* Left: Terms */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-[#2d2d2d] italic">
                {invoice.documentType === 'quotation' ? 'Validity & Terms' : invoice.documentType === 'receipt' ? 'Notes' : 'Terms & Conditions'}
              </span>
              <p className="text-[9px] text-[#999] leading-relaxed font-medium">
                {invoice.notes || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.'}
              </p>
            </div>

            {/* Right: Signature */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'flex-end', 
                gap: '4px',
                marginLeft: 'auto',
                width: '68%',
                paddingRight: '0px'
              }}
              className="text-center"
            >
              {sender.signatureUrl ? (
                <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                  <img src={sender.signatureUrl} alt="Signature" style={{ maxHeight: '40px', maxWidth: '100px', objectFit: 'contain' }} />
                </div>
              ) : (
                <svg width="100" height="40" viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 38 C15 10, 25 5, 30 25 C35 45, 40 10, 50 20 C55 28, 58 15, 65 22 C70 28, 75 18, 80 25 C85 30, 90 20, 95 22" stroke="#2d2d2d" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <path d="M60 15 L62 8 L58 12" stroke="#2d2d2d" strokeWidth="1" strokeLinecap="round" fill="none"/>
                  <line x1="10" y1="42" x2="100" y2="42" stroke="#2d2d2d" strokeWidth="0.5" strokeDasharray="2,2"/>
                </svg>
              )}
              <span className="text-[11px] font-bold text-[#2d2d2d]">{invoice.signatureName || sender.bankAccountName}</span>
              <span className="text-[9px] text-[#999] font-medium italic">Authorized Representative</span>
            </div>
          </div>

          {/* ===== CONTACT FOOTER BAR ===== */}
          <div className="mt-auto pt-4 border-t border-[#2d2d2d] text-[8px] text-[#777] font-medium" id="preview-contact-footer" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <Phone size={10} className="text-[#2d2d2d]" style={{ flexShrink: 0, width: '10px', height: '10px', marginRight: '6px' }} />
              <span style={{ fontSize: '8px', lineHeight: '10px' }}>{sender.phone || '(+62) 812 1234 1234'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <MapPin size={10} className="text-[#2d2d2d]" style={{ flexShrink: 0, width: '10px', height: '10px', marginRight: '6px' }} />
              <span style={{ fontSize: '8px', lineHeight: '10px' }}>{sender.address || 'Jakarta, Indonesia'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <Mail size={10} className="text-[#2d2d2d]" style={{ flexShrink: 0, width: '10px', height: '10px', marginRight: '6px' }} />
              <span style={{ fontSize: '8px', lineHeight: '10px' }}>{sender.email || 'admin@mail.com'}</span>
            </div>
          </div>

          </div>

          {/* ===== BOTTOM DARK STRIP ===== */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#4a4a4a] z-0" style={{ backgroundColor: '#4a4a4a' }}></div>

        </div>
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
                    Invoice #{invoice.invoiceNumber || 'Draft'} • TransactFlow
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
