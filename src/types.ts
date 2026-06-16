export interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  cost: number;
  amount: number;
  rowNumber?: string;
}

export interface SenderInfo {
  companyName: string;
  address: string;
  email: string;
  phone: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  logoUrl?: string;
  signatureUrl?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  billingAddress: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: string;
  items: InvoiceItem[];
  discount: number;
  taxRate: number; // e.g. 11 for 11%
  notes: string;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  documentType?: 'invoice' | 'quotation' | 'dp' | 'pelunasan' | 'receipt';
  dpPercentage?: number;
  dpPaidAmount?: number;
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'other';
  customerPhone?: string;
  customerEmail?: string;
  signatureName?: string;
}

export interface Customer {
  id: string;
  name: string;
  billingAddress: string;
  email: string;
  phone?: string;
}

export interface Service {
  id: string;
  name: string;
  defaultQty: number;
  defaultUnit: string;
  defaultCost: number;
}

export type ActiveTab = 'dashboard' | 'drafts' | 'customers' | 'services' | 'invoices' | 'reports' | 'profile' | 'invoice-editor';
