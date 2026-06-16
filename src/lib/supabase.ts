import { createClient } from '@supabase/supabase-js';
import { Invoice, Customer, Service, SenderInfo } from '../types';

// Read from import.meta.env for client-side Vite variables
const rawUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
const rawKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');

// Secure URL construction and auto-correction (such as prepending https:// if needed)
let formattedUrl = rawUrl;
if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
  formattedUrl = `https://${formattedUrl}`;
}

const isValidHttpUrl = (str: string) => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

let active = false;
let supabaseClient = null;

if (formattedUrl && rawKey && formattedUrl.includes('supabase.co') && isValidHttpUrl(formattedUrl)) {
  try {
    supabaseClient = createClient(formattedUrl, rawKey);
    active = true;
  } catch (err) {
    console.error('Failed to initialize Supabase client due to invalid configuration:', err);
    active = false;
    supabaseClient = null;
  }
}

export const supabase = supabaseClient;
export const isSupabaseActive = active;

/**
 * DB SQL Schema setup description:
 * 
 * -- Create Tables:
 * 
 * CREATE TABLE IF NOT EXISTS public.customers (
 *   id TEXT PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   billing_address TEXT,
 *   email TEXT,
 *   phone TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE IF NOT EXISTS public.services (
 *   id TEXT PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   default_qty NUMERIC DEFAULT 1,
 *   default_unit TEXT DEFAULT 'Unit',
 *   default_cost NUMERIC NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE IF NOT EXISTS public.invoices (
 *   id TEXT PRIMARY KEY,
 *   invoice_number TEXT NOT NULL,
 *   customer_name TEXT NOT NULL,
 *   billing_address TEXT,
 *   issue_date TEXT,
 *   due_date TEXT,
 *   payment_terms TEXT,
 *   discount NUMERIC DEFAULT 0,
 *   tax_rate NUMERIC DEFAULT 0,
 *   notes TEXT,
 *   status TEXT DEFAULT 'draft',
 *   subtotal NUMERIC DEFAULT 0,
 *   tax_amount NUMERIC DEFAULT 0,
 *   total NUMERIC NOT NULL,
 *   items JSONB DEFAULT '[]'::jsonb,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE IF NOT EXISTS public.sender_info (
 *   id TEXT PRIMARY KEY DEFAULT 'default',
 *   company_name TEXT NOT NULL,
 *   address TEXT NOT NULL,
 *   email TEXT,
 *   phone TEXT,
 *   bank_name TEXT,
 *   bank_account_name TEXT,
 *   bank_account_number TEXT,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- Enable Row Level Security (RLS) or allow public read/write depending on user requirements.
 * -- To disable RLS for testing: ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
 */

// Mapping helpers to match DB snake_case with JS camelCase
function mapInvoiceToDb(invoice: Invoice) {
  return {
    id: invoice.id,
    invoice_number: invoice.invoiceNumber,
    customer_name: invoice.customerName,
    billing_address: invoice.billingAddress,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    payment_terms: invoice.paymentTerms,
    discount: invoice.discount,
    tax_rate: invoice.taxRate,
    notes: invoice.notes,
    status: invoice.status,
    subtotal: invoice.subtotal,
    tax_amount: invoice.taxAmount,
    total: invoice.total,
    items: JSON.stringify(invoice.items || []),
    document_type: invoice.documentType || 'invoice',
    dp_percentage: invoice.dpPercentage || 0,
    dp_paid_amount: invoice.dpPaidAmount || 0,
    payment_method: invoice.paymentMethod || 'transfer',
    customer_phone: invoice.customerPhone || '',
    customer_email: invoice.customerEmail || '',
    signature_name: invoice.signatureName || ''
  };
}

function mapInvoiceFromDb(dbInv: any): Invoice {
  let parsedItems = [];
  try {
    parsedItems = typeof dbInv.items === 'string' 
      ? JSON.parse(dbInv.items) 
      : (Array.isArray(dbInv.items) ? dbInv.items : []);
  } catch (e) {
    console.error('Failed to parse items json:', e);
  }
  return {
    id: dbInv.id,
    invoiceNumber: dbInv.invoice_number || '',
    customerName: dbInv.customer_name || '',
    billingAddress: dbInv.billing_address || '',
    issueDate: dbInv.issue_date || '',
    dueDate: dbInv.due_date || '',
    paymentTerms: dbInv.payment_terms || '',
    discount: Number(dbInv.discount || 0),
    taxRate: Number(dbInv.tax_rate || 0),
    notes: dbInv.notes || '',
    status: (dbInv.status || 'draft') as 'draft' | 'sent' | 'paid',
    subtotal: Number(dbInv.subtotal || 0),
    taxAmount: Number(dbInv.tax_amount || 0),
    total: Number(dbInv.total || 0),
    createdAt: dbInv.created_at || new Date().toISOString(),
    items: parsedItems,
    documentType: (dbInv.document_type || 'invoice') as 'invoice' | 'quotation' | 'dp' | 'pelunasan' | 'receipt',
    dpPercentage: Number(dbInv.dp_percentage || 0),
    dpPaidAmount: Number(dbInv.dp_paid_amount || 0),
    paymentMethod: (dbInv.payment_method || 'transfer') as 'cash' | 'transfer' | 'card' | 'other',
    customerPhone: dbInv.customer_phone || '',
    customerEmail: dbInv.customer_email || '',
    signatureName: dbInv.signature_name || ''
  };
}

function mapCustomerToDb(customer: Customer) {
  return {
    id: customer.id,
    name: customer.name,
    billing_address: customer.billingAddress || '',
    email: customer.email || '',
    phone: customer.phone || ''
  };
}

function mapCustomerFromDb(dbCust: any): Customer {
  return {
    id: dbCust.id,
    name: dbCust.name,
    billingAddress: dbCust.billing_address || '',
    email: dbCust.email || '',
    phone: dbCust.phone || ''
  };
}

function mapServiceToDb(service: Service) {
  return {
    id: service.id,
    name: service.name,
    default_qty: service.defaultQty,
    default_unit: service.defaultUnit,
    default_cost: service.defaultCost
  };
}

function mapServiceFromDb(dbSvc: any): Service {
  return {
    id: dbSvc.id,
    name: dbSvc.name,
    defaultQty: Number(dbSvc.default_qty || 1),
    defaultUnit: dbSvc.default_unit || 'Unit',
    defaultCost: Number(dbSvc.default_cost || 0)
  };
}

function mapSenderToDb(sender: SenderInfo) {
  return {
    id: 'default',
    company_name: sender.companyName,
    address: sender.address,
    email: sender.email || '',
    phone: sender.phone || '',
    bank_name: sender.bankName || '',
    bank_account_name: sender.bankAccountName || '',
    bank_account_number: sender.bankAccountNumber || '',
    logo_url: sender.logoUrl || '',
    signature_url: sender.signatureUrl || ''
  };
}

function mapSenderFromDb(dbSender: any): SenderInfo {
  return {
    companyName: dbSender.company_name || '',
    address: dbSender.address || '',
    email: dbSender.email || '',
    phone: dbSender.phone || '',
    bankName: dbSender.bank_name || '',
    bankAccountName: dbSender.bank_account_name || '',
    bankAccountNumber: dbSender.bank_account_number || '',
    logoUrl: dbSender.logo_url || '',
    signatureUrl: dbSender.signature_url || ''
  };
}

// ----------------------------------------------------
// DATABASE API INTERFACES
// ----------------------------------------------------

export async function fetchInvoicesDb(): Promise<Invoice[]> {
  if (!supabase) return [];
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('invoice_number', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapInvoiceFromDb);
  } catch (err) {
    console.error('Supabase fetch invoices error:', err);
    throw err;
  }
}

export async function saveInvoiceDb(invoice: Invoice): Promise<void> {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const mapped = mapInvoiceToDb(invoice);
    const { error } = await supabase
      .from('invoices')
      .upsert({ ...mapped, user_id: user.id });
    
    if (error) throw error;
  } catch (err) {
    console.error('Supabase save invoice error:', err);
    throw err;
  }
}

export async function deleteInvoiceDb(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
  } catch (err) {
    console.error('Supabase delete invoice error:', err);
    throw err;
  }
}

// Customers Crud
export async function fetchCustomersDb(): Promise<Customer[]> {
  if (!supabase) return [];
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) throw error;
    return (data || []).map(mapCustomerFromDb);
  } catch (err) {
    console.error('Supabase fetch customers error:', err);
    throw err;
  }
}

export async function saveCustomerDb(customer: Customer): Promise<void> {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const mapped = mapCustomerToDb(customer);
    const { error } = await supabase
      .from('customers')
      .upsert({ ...mapped, user_id: user.id });
    
    if (error) throw error;
  } catch (err) {
    console.error('Supabase save customer error:', err);
    throw err;
  }
}

export async function deleteCustomerDb(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
  } catch (err) {
    console.error('Supabase delete customer error:', err);
    throw err;
  }
}

// Services Crud
export async function fetchServicesDb(): Promise<Service[]> {
  if (!supabase) return [];
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) throw error;
    return (data || []).map(mapServiceFromDb);
  } catch (err) {
    console.error('Supabase fetch services error:', err);
    throw err;
  }
}

export async function saveServiceDb(service: Service): Promise<void> {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const mapped = mapServiceToDb(service);
    const { error } = await supabase
      .from('services')
      .upsert({ ...mapped, user_id: user.id });
    
    if (error) throw error;
  } catch (err) {
    console.error('Supabase save service error:', err);
    throw err;
  }
}

export async function deleteServiceDb(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
  } catch (err) {
    console.error('Supabase delete service error:', err);
    throw err;
  }
}

// Sender Info Crud
export async function fetchSenderInfoDb(): Promise<SenderInfo | null> {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('sender_info')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (error) throw error;
    return data ? mapSenderFromDb(data) : null;
  } catch (err) {
    console.error('Supabase fetch sender info error:', err);
    return null;
  }
}

export async function saveSenderInfoDb(sender: SenderInfo): Promise<void> {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const mapped = mapSenderToDb(sender);
    const { error } = await supabase
      .from('sender_info')
      .upsert({ ...mapped, id: user.id, user_id: user.id });
    
    if (error) throw error;
  } catch (err) {
    console.error('Supabase save sender info error:', err);
    throw err;
  }
}
