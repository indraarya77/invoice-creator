import { InvoiceItem } from './types';

/**
 * Formats a number with dot as thousands separator (Indonesian style)
 * e.g., 750000 -> "IDR 750.000" or "750.000"
 */
export function formatIDR(num: number, includePrefix = true): string {
  const rounded = Math.round(num || 0);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return includePrefix ? `IDR ${formatted}` : formatted;
}

/**
 * Parses numeric string back from user input, stripping dots/decimals 
 */
export function parseNumeric(val: string): number {
  if (!val) return 0;
  // Remove non-alphanumeric except maybe digits
  const raw = val.replace(/[^0-9]/g, '');
  return parseInt(raw, 10) || 0;
}

/**
 * Formats date string "YYYY-MM-DD" into "D Month YYYY"
 * e.g., "2026-01-29" -> "29 January 2026"
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // avoid timezone shifting by parsing manually
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${months[monthIdx]} ${year}`;
    }
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Generates a unique ID
 */
export function uuid(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Calculates subtotals, tax amount, and total
 */
export function calculateInvoiceTotals(
  items: InvoiceItem[],
  discount: number,
  taxRate: number,
  documentType?: 'invoice' | 'quotation' | 'dp' | 'pelunasan' | 'receipt',
  dpPercentage?: number,
  dpPaidAmount?: number
) {
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
  const discountVal = discount || 0;
  const taxableAmount = Math.max(0, subtotal - discountVal);
  const taxAmount = Math.round(taxableAmount * ((taxRate || 0) / 100));
  const baseTotal = taxableAmount + taxAmount;
  
  let total = baseTotal;
  if (documentType === 'dp') {
    const pct = dpPercentage || 0;
    total = Math.round(baseTotal * (pct / 100));
  } else if (documentType === 'pelunasan') {
    const paid = dpPaidAmount || 0;
    total = Math.max(0, baseTotal - paid);
  }
  
  return {
    subtotal,
    taxAmount,
    total
  };
}
