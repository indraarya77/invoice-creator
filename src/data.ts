import { Invoice, SenderInfo, Customer, Service } from './types';

export const defaultSenderInfo: SenderInfo = {
  companyName: 'TransactFlow',
  address: 'Jl. Jambu No 5, Semanding, Sumbersekar, Kec. Dau, Kabupaten Malang, Jawa Timur 65151',
  email: 'hello@transactflow.com',
  phone: '+62 812 3456 7890',
  bankName: 'Bank Central Asia (BCA)',
  bankAccountName: 'TransactFlow',
  bankAccountNumber: '123 456 7890'
};

export const initialCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'PT Nusantara Digital Solusi',
    billingAddress: 'Jl. Jendral Sudirman No. 45 Jakarta Selatan, DKI Jakarta 12190 Indonesia',
    email: 'finance@nusantaradigital.com',
    phone: '+62 21 555 1234'
  },
  {
    id: 'c2',
    name: 'PT Arutala Studio Nusantara',
    billingAddress: 'Gedung Cyber 2 Lt. 17, Jl. HR Rasuna Said, Kuningan, Jakarta Selatan 12950',
    email: 'billing@arutala.io',
    phone: '+62 21 888 777'
  },
  {
    id: 'c3',
    name: 'CV Media Creative Solusindo',
    billingAddress: 'Jl. Ahmad Yani No. 128, Wonokromo, Surabaya, Jawa Timur 60244',
    email: 'contact@mediacreative.co.id',
    phone: '+62 31 555 9876'
  },
  {
    id: 'c4',
    name: 'PT Global Inovasi Digital',
    billingAddress: 'Pacific Place Mall Level 5, Jl. Jend. Sudirman No.52-53, Senayan, Jakarta 12190',
    email: 'vendor@globalinovasi.id',
    phone: '+62 21 999 1111'
  }
];

export const initialServices: Service[] = [
  {
    id: 's1',
    name: 'Dashboard UI Design',
    defaultQty: 10,
    defaultUnit: 'page',
    defaultCost: 750000
  },
  {
    id: 's2',
    name: 'Mobile App',
    defaultQty: 100,
    defaultUnit: 'page',
    defaultCost: 50000
  },
  {
    id: 's3',
    name: 'Brand Identity Suite',
    defaultQty: 1,
    defaultUnit: 'package',
    defaultCost: 15000000
  },
  {
    id: 's4',
    name: 'Full-stack Web Dev',
    defaultQty: 80,
    defaultUnit: 'hours',
    defaultCost: 350000
  },
  {
    id: 's5',
    name: 'SaaS Consultation',
    defaultQty: 5,
    defaultUnit: 'hours',
    defaultCost: 1200000
  }
];

export const defaultInvoice: Invoice = {
  id: 'v1',
  invoiceNumber: 'INV-2026-001',
  customerName: 'PT Nusantara Digital Solusi',
  billingAddress: 'Jl. Jendral Sudirman No. 45 Jakarta Selatan, DKI Jakarta 12190 Indonesia',
  issueDate: '2026-01-29',
  dueDate: '2026-02-12',
  paymentTerms: 'Net 14',
  items: [
    {
      id: 'i1',
      name: 'Dashboard UI Design',
      qty: 10,
      unit: 'page',
      cost: 750000,
      amount: 7500000
    },
    {
      id: 'i2',
      name: 'Mobile App',
      qty: 100,
      unit: 'page',
      cost: 50000,
      amount: 5000000
    }
  ],
  discount: 500000,
  taxRate: 11, // PPN 11%
  notes: 'Thank you for your trust. Please complete the payment before the due date. For any questions, feel free to contact us.',
  status: 'draft',
  createdAt: '2026-05-27T04:08:45Z',
  subtotal: 12500000,
  taxAmount: 1375000,
  total: 13375000
};
