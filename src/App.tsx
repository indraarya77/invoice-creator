import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Send, Download, Sliders, X, Sparkles, FolderUp, RefreshCw, Star } from 'lucide-react';

import Header from './components/Header';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import DashboardView from './components/DashboardView';
import CustomersView from './components/CustomersView';
import ServicesView from './components/ServicesView';
import ReportsView from './components/ReportsView';
import AuthModal from './components/AuthModal';

import { Invoice, Customer, Service, ActiveTab, SenderInfo } from './types';
import { 
  defaultInvoice, 
  defaultSenderInfo, 
  initialCustomers, 
  initialServices 
} from './data';
import { calculateInvoiceTotals, uuid, formatIDR } from './utils';
import {
  isSupabaseActive,
  supabase,
  fetchInvoicesDb,
  saveInvoiceDb,
  deleteInvoiceDb,
  fetchCustomersDb,
  saveCustomerDb,
  deleteCustomerDb,
  fetchServicesDb,
  saveServiceDb,
  deleteServiceDb,
  fetchSenderInfoDb,
  saveSenderInfoDb
} from './lib/supabase';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('invoices');

  // Firebase auth user
  const [user, setUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Core Persistence States
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('arsa-invoices');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [defaultInvoice];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('arsa-customers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialCustomers;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('arsa-services');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialServices;
  });

  const [senderInfo, setSenderInfo] = useState<SenderInfo>(() => {
    const saved = localStorage.getItem('arsa-sender-info');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return defaultSenderInfo;
  });

  // Current Active Form State
  const [activeInvoice, setActiveInvoice] = useState<Invoice>(() => {
    const savedForm = localStorage.getItem('arsa-current-form');
    if (savedForm) {
      try { return JSON.parse(savedForm); } catch (e) { console.error(e); }
    }
    // Deep copy defaultInvoice to prevent mutating global constant
    return JSON.parse(JSON.stringify(defaultInvoice));
  });

  // Temporary UI Feedback States
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showDraftToast, setShowDraftToast] = useState(false);
  const [showSentOverlay, setShowSentOverlay] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasLoadedCloudData, setHasLoadedCloudData] = useState(false);

  // Custom Cloud/Demo Auth & Synchronization States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showSyncSuccessToast, setShowSyncSuccessToast] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('');
  const [isDbError, setIsDbError] = useState(false);

  // Authenticate & Fetch Cloud Data on startup or login
  useEffect(() => {
    if (!isSupabaseActive || !supabase) {
      setHasLoadedCloudData(true);
      return;
    }

    // Live auth state listener for Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
    });

    // In Supabase, if keys are set, we synchronize all documents silently
    const loadSupabaseData = async () => {
      setIsSyncing(true);
      try {
        const cloudInvoices = await fetchInvoicesDb();
        if (cloudInvoices && cloudInvoices.length > 0) {
          setInvoices(cloudInvoices);
        }
        const cloudCustomers = await fetchCustomersDb();
        if (cloudCustomers && cloudCustomers.length > 0) {
          setCustomers(cloudCustomers);
        }
        const cloudServices = await fetchServicesDb();
        if (cloudServices && cloudServices.length > 0) {
          setServices(cloudServices);
        }
        const cloudSender = await fetchSenderInfoDb();
        if (cloudSender) {
          setSenderInfo(cloudSender);
        }
      } catch (error) {
        console.error('Failed to sync Supabase documents: ', error);
      } finally {
        setIsSyncing(false);
        setHasLoadedCloudData(true);
      }
    };

    loadSupabaseData();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sync state mutation handlers
  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    if (isSupabaseActive && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setUser(null);
    // Fallback local storage state
    const savedInvoices = localStorage.getItem('arsa-invoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    } else {
      setInvoices([defaultInvoice]);
    }
  };

  const handleAuthSuccess = async (authenticatedUser: any) => {
    setUser(authenticatedUser);
    
    // When logged in, fetch cloud data if active
    if (isSupabaseActive && supabase) {
      setIsSyncing(true);
      try {
        const cloudInvoices = await fetchInvoicesDb();
        if (cloudInvoices && cloudInvoices.length > 0) {
          setInvoices(cloudInvoices);
        }
        const cloudCustomers = await fetchCustomersDb();
        if (cloudCustomers && cloudCustomers.length > 0) {
          setCustomers(cloudCustomers);
        }
        const cloudServices = await fetchServicesDb();
        if (cloudServices && cloudServices.length > 0) {
          setServices(cloudServices);
        }
        const cloudSender = await fetchSenderInfoDb();
        if (cloudSender) {
          setSenderInfo(cloudSender);
        }
      } catch (error) {
        console.error('Failed to load cloud user credentials:', error);
      } finally {
        setIsSyncing(false);
        setHasLoadedCloudData(true);
      }
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setIsDbError(false);
    try {
      if (!isSupabaseActive || !supabase) {
        // Mock success in local mode with delay
        await new Promise((res) => setTimeout(res, 1000));
        setSyncStatusText("Mode Demo Lokal: Sinkronisasi tersimpan di local storage browser.");
        setShowSyncSuccessToast(true);
        setTimeout(() => setShowSyncSuccessToast(false), 3000);
        return;
      }

      // Fetch cloud records
      const cloudInvoices = await fetchInvoicesDb();
      const cloudCustomers = await fetchCustomersDb();
      const cloudServices = await fetchServicesDb();
      const cloudSender = await fetchSenderInfoDb();

      // Bidirectional Merge: Invoices
      const mergedInvoices = [...cloudInvoices];
      
      // Upload local invoices that don't exist on the cloud yet
      for (const localInv of invoices) {
        if (!cloudInvoices.some(c => c.id === localInv.id)) {
          await saveInvoiceDb(localInv);
        }
      }
      
      // Merge unique local records to local state if missing on cloud
      invoices.forEach(l => {
        if (!mergedInvoices.some(c => c.id === l.id)) {
          mergedInvoices.push(l);
        }
      });
      setInvoices(mergedInvoices);

      // Bidirectional Merge: Customers
      for (const localCust of customers) {
        if (!cloudCustomers.some(c => c.id === localCust.id)) {
          await saveCustomerDb(localCust);
        }
      }
      const mergedCustomers = [...cloudCustomers];
      customers.forEach(l => {
        if (!mergedCustomers.some(c => c.id === l.id)) {
          mergedCustomers.push(l);
        }
      });
      setCustomers(mergedCustomers);

      // Bidirectional Merge: Services
      for (const localSvc of services) {
        if (!cloudServices.some(c => c.id === localSvc.id)) {
          await saveServiceDb(localSvc);
        }
      }
      const mergedServices = [...cloudServices];
      services.forEach(l => {
        if (!mergedServices.some(c => c.id === l.id)) {
          mergedServices.push(l);
        }
      });
      setServices(mergedServices);

      // Merge Sender credentials
      if (cloudSender) {
        setSenderInfo(cloudSender);
      } else {
        await saveSenderInfoDb(senderInfo);
      }

      setSyncStatusText(`Sinkronisasi Berhasil! ${mergedInvoices.length} invoice & kontak sinkron.`);
      setShowSyncSuccessToast(true);
      setTimeout(() => setShowSyncSuccessToast(false), 4000);
    } catch (err: any) {
      console.error('Bidirectional sync error:', err);
      setIsDbError(true);
      setSyncStatusText(`Gagal Sinkron: ${err?.message || 'Hubungkan jaringan atau jalankan query SQL'}`);
      setShowSyncSuccessToast(true);
      setTimeout(() => setShowSyncSuccessToast(false), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncSetInvoices = (updater: React.SetStateAction<Invoice[]>) => {
    setInvoices((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (isSupabaseActive && hasLoadedCloudData) {
        // Capture deletions
        const deleted = prev.filter((p) => !next.some((n) => n.id === p.id));
        deleted.forEach((d) => deleteInvoiceDb(d.id).catch(e => console.error('Delete err:', e)));

        // Capture additions/updates
        const addedOrUpdated = next.filter((n) => {
          const matching = prev.find((p) => p.id === n.id);
          return !matching || JSON.stringify(matching) !== JSON.stringify(n);
        });
        addedOrUpdated.forEach((a) => saveInvoiceDb(a).catch(e => console.error('Save err:', e)));
      }
      return next;
    });
  };

  const syncSetCustomers = (updater: React.SetStateAction<Customer[]>) => {
    setCustomers((prev) => {
      const next = typeof updater === 'function' ? (updater as Function)(prev) : updater;
      if (isSupabaseActive && hasLoadedCloudData) {
        // Capture deletions
        const deleted = prev.filter((p) => !next.some((n: any) => n.id === p.id));
        deleted.forEach((d) => deleteCustomerDb(d.id).catch(e => console.error('Delete err:', e)));

        // Capture additions/updates
        const addedOrUpdated = next.filter((n: any) => {
          const matching = prev.find((p) => p.id === n.id);
          return !matching || JSON.stringify(matching) !== JSON.stringify(n);
        });
        addedOrUpdated.forEach((a: any) => saveCustomerDb(a).catch(e => console.error('Save err:', e)));
      }
      return next;
    });
  };

  const syncSetServices = (updater: React.SetStateAction<Service[]>) => {
    setServices((prev) => {
      const next = typeof updater === 'function' ? (updater as Function)(prev) : updater;
      if (isSupabaseActive && hasLoadedCloudData) {
        // Capture deletions
        const deleted = prev.filter((p) => !next.some((n: any) => n.id === p.id));
        deleted.forEach((d) => deleteServiceDb(d.id).catch(e => console.error('Delete err:', e)));

        // Capture additions/updates
        const addedOrUpdated = next.filter((n: any) => {
          const matching = prev.find((p) => p.id === n.id);
          return !matching || JSON.stringify(matching) !== JSON.stringify(n);
        });
        addedOrUpdated.forEach((a: any) => saveServiceDb(a).catch(e => console.error('Save err:', e)));
      }
      return next;
    });
  };

  // Sync state back to local storage (so offline editing always persists)
  useEffect(() => {
    localStorage.setItem('arsa-invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('arsa-customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('arsa-services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('arsa-sender-info', JSON.stringify(senderInfo));
    if (isSupabaseActive && hasLoadedCloudData) {
      saveSenderInfoDb(senderInfo).catch(e => console.error('Save sender err:', e));
    }
  }, [senderInfo]);

  useEffect(() => {
    localStorage.setItem('arsa-current-form', JSON.stringify(activeInvoice));
  }, [activeInvoice]);

  // Derived Values calculation on active invoice state changes
  const computedTotals = calculateInvoiceTotals(
    activeInvoice.items,
    activeInvoice.discount,
    activeInvoice.taxRate
  );

  const invoiceWithTotals: Invoice = {
    ...activeInvoice,
    subtotal: computedTotals.subtotal,
    taxAmount: computedTotals.taxAmount,
    total: computedTotals.total,
  };

  // Pre-fill fields with default mockup values in 1 single-click
  const handleLoadMockupData = () => {
    setActiveInvoice(JSON.parse(JSON.stringify(defaultInvoice)));
    setHasUnsavedChanges(true);
  };

  // Save Current Form as Draft in the Global ledger
  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => {
      syncSetInvoices((prev) => {
        // If invoice already exists, update it. Otherwise add new.
        const idx = prev.findIndex((inv) => inv.id === invoiceWithTotals.id);
        const savedInvoice: Invoice = { ...invoiceWithTotals, status: 'draft' };
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = savedInvoice;
          return updated;
        } else {
          return [savedInvoice, ...prev];
        }
      });
      setIsSaving(false);
      setShowDraftToast(true);
      setHasUnsavedChanges(false);
      // Auto dismiss toast after 3s
      setTimeout(() => setShowDraftToast(false), 3000);
    }, 600);
  };

  // Finalize & Send Invoice
  const handleSendInvoice = () => {
    setIsSending(true);
    setTimeout(() => {
      syncSetInvoices((prev) => {
        const idx = prev.findIndex((inv) => inv.id === invoiceWithTotals.id);
        const sentInvoice: Invoice = { ...invoiceWithTotals, status: 'sent' };
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = sentInvoice;
          return updated;
        } else {
          return [sentInvoice, ...prev];
        }
      });
      setIsSending(false);
      setShowSentOverlay(true);
      setHasUnsavedChanges(false);
    }, 900);
  };

  // Select an existing invoice from the Dashboard to continue editing
  const handleSelectInvoice = (invoiceId: string) => {
    const found = invoices.find((inv) => inv.id === invoiceId);
    if (found) {
      setActiveInvoice(JSON.parse(JSON.stringify(found)));
      setActiveTab('invoices');
      setHasUnsavedChanges(false);
    }
  };

  // Delete an invoice record entirely
  const handleDeleteInvoice = (invoiceId: string) => {
    syncSetInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
  };

  // Fast-flip status (Paid/Sent/Draft) directly from rows
  const handleSetInvoiceStatus = (invoiceId: string, status: 'draft' | 'sent' | 'paid') => {
    syncSetInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status } : inv))
    );
  };

  // Initialize a fresh new empty invoice document
  const handleCreateNewInvoice = () => {
    const nextIndex = invoices.length + 1;
    const padding = String(nextIndex).padStart(3, '0');
    
    // Default empty invoice frame
    const newDoc: Invoice = {
      id: uuid(),
      invoiceNumber: `INV-2026-${padding}`,
      customerName: '',
      billingAddress: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: 'Net 14',
      items: [
        {
          id: uuid(),
          name: '',
          qty: 1,
          unit: 'page',
          cost: 0,
          amount: 0,
        },
      ],
      discount: 0,
      taxRate: 11,
      notes: 'Thank you for your trust. Please complete the payment before the due date. For any questions, feel free to contact us.',
      status: 'draft',
      createdAt: new Date().toISOString(),
      subtotal: 0,
      taxAmount: 0,
      total: 0,
    };

    setActiveInvoice(newDoc);
    setActiveTab('invoices');
    setHasUnsavedChanges(true);
  };

  // Tab workflow: Invoice Customer directly from directory
  const handleInvoiceCustomer = (customer: Customer) => {
    setActiveInvoice((prev) => ({
      ...prev,
      customerName: customer.name,
      billingAddress: customer.billingAddress,
    }));
    setActiveTab('invoices');
  };

  // Tab workflow: Add standard item from catalog service directly to form
  const handleAddServiceToInvoice = (service: Service) => {
    const newItem = {
      id: uuid(),
      name: service.name,
      qty: service.defaultQty,
      unit: service.defaultUnit,
      cost: service.defaultCost,
      amount: service.defaultQty * service.defaultCost,
    };

    setActiveInvoice((prev) => {
      // If first item is empty, replace it
      const hasOnlyOneEmptyItem =
        prev.items.length === 1 && !prev.items[0].name && prev.items[0].cost === 0;

      return {
        ...prev,
        items: hasOnlyOneEmptyItem ? [newItem] : [...prev.items, newItem],
      };
    });
    setActiveTab('invoices');
  };

  return (
    <div className="min-h-screen bg-[#eaecf0] py-6 px-4 sm:px-8 flex items-center justify-center font-sans relative antialiased" id="main-scaffold">
      {/* Absolute floating toast for Save feedback */}
      <AnimatePresence>
        {showDraftToast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            id="draft-toast"
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#121212] border border-white/10 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Invoice saved to Drafts!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Demo Data Inject Button */}
      {activeTab === 'invoices' && (
        <div className="fixed bottom-6 right-6 z-40 hidden md:block" id="mockup-helper-anchor">
          <button
            onClick={handleLoadMockupData}
            id="fill-mock-btn"
            className="flex items-center gap-1.5 px-4 py-3 bg-white text-[#121212] hover:bg-slate-50 border border-slate-200 shadow-xl rounded-full text-xs font-semibold select-none transition-all active:scale-95 cursor-pointer hover:border-black"
            title="Load the exact demo values from the screenshots"
          >
            <Sparkles size={14} className="text-yellow-600 animate-pulse" />
            <span>Load Reference Data</span>
          </button>
        </div>
      )}

      {/* App Canvas Card */}
      <div className="w-full max-w-7xl flex flex-col gap-6" id="app-window flex-1">
        {/* Top unified Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSaveDraft={handleSaveDraft}
          onSendInvoice={handleSendInvoice}
          isSavingDraft={isSaving}
          isSendingInvoice={isSending}
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          isSupabaseActive={isSupabaseActive}
          isSyncing={isSyncing}
          onManualSync={handleManualSync}
        />

        {/* View Grid Switcher */}
        <main className="w-full" id="view-layer">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DashboardView
                  invoices={invoices}
                  onSelectInvoice={handleSelectInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                  onSetInvoiceStatus={handleSetInvoiceStatus}
                  onCreateNewInvoice={handleCreateNewInvoice}
                />
              </motion.div>
            )}

            {activeTab === 'customers' && (
              <motion.div
                key="customers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CustomersView
                  customers={customers}
                  setCustomers={syncSetCustomers}
                  onInvoiceCustomer={handleInvoiceCustomer}
                />
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ServicesView
                  services={services}
                  setServices={syncSetServices}
                  onAddServiceToInvoice={handleAddServiceToInvoice}
                />
              </motion.div>
            )}

            {activeTab === 'invoices' && (
              <motion.div
                key="invoices"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
              >
                {/* Left side Form Inputs */}
                <InvoiceForm
                  invoice={invoiceWithTotals}
                  setInvoice={setActiveInvoice}
                  customers={customers}
                  invoices={invoices}
                  onSelectInvoice={handleSelectInvoice}
                />

                {/* Right side Dynamic PDF Preview */}
                <InvoicePreview
                  invoice={invoiceWithTotals}
                  sender={senderInfo}
                />
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ReportsView
                  invoices={invoices}
                  customers={customers}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Majestic Sent Success Modal Overlay */}
      <AnimatePresence>
        {showSentOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="sent-overlay-container"
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              id="sent-success-card"
              className="bg-white rounded-2xl max-w-md w-full p-6 text-center soft-shadow relative flex flex-col items-center gap-5 border border-slate-100"
            >
              <button
                id="close-success-btn"
                onClick={() => setShowSentOverlay(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-[#121212] p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mt-3 animate-bounce">
                <Send size={26} className="translate-x-0.5 -translate-y-0.5" />
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl font-extrabold text-[#121212]">Invoice Sent in Full!</h3>
                <p className="text-xs text-[#5d6b82] leading-relaxed px-2">
                  The invoice document has been successfully compiled into a PDF attachment and emailed to <strong>{invoiceWithTotals.customerName || 'your customer'}</strong>.
                </p>
              </div>

              {/* Invoice brief review badge */}
              <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-1 text-left text-xs text-[#5d6b82]" id="success-invoice-badge">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#121212]">Reference:</span>
                  <span className="font-mono">{invoiceWithTotals.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#121212]">Client Partner:</span>
                  <span>{invoiceWithTotals.customerName || 'PT Customer'}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100/80 pt-1.5 mt-1 font-extrabold">
                  <span className="text-[#121212]">Settlement:</span>
                  <span className="text-[#121212] font-mono">{formatIDR(invoiceWithTotals.total)}</span>
                </div>
              </div>

              {/* Redirect triggers */}
              <div className="w-full flex flex-col sm:flex-row gap-2.5 mt-2" id="success-modal-actions">
                <button
                  id="print-success-btn"
                  onClick={() => {
                    setShowSentOverlay(false);
                    setTimeout(() => window.print(), 300);
                  }}
                  className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-[#dddfdf] rounded-xl text-xs font-bold text-[#303846] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download size={13} />
                  <span>Download Copy</span>
                </button>
                <button
                  id="success-dashboard-btn"
                  onClick={() => {
                    setShowSentOverlay(false);
                    setActiveTab('dashboard');
                  }}
                  className="flex-1 py-2.5 bg-[#121212] hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer soft-shadow transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Synchronize Success / Fail Toast Alert */}
      <AnimatePresence>
        {showSyncSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            id="sync-toast-alert"
            className={`fixed bottom-6 left-6 z-[60] text-white text-xs font-bold px-4 py-3.5 rounded-xl shadow-2xl flex items-center gap-2 border ${
              isDbError 
                ? 'bg-rose-950 border-rose-800 text-rose-100' 
                : 'bg-slate-900 border-white/10 text-emerald-100'
            }`}
          >
            {isDbError ? (
              <X size={15} className="text-rose-400 shrink-0" />
            ) : (
              <Sparkles size={15} className="text-emerald-400 shrink-0 animate-spin" />
            )}
            <span>{syncStatusText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Authentic Supabase + Demo Authentication Portal Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
