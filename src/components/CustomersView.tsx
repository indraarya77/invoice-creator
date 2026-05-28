import React, { useState } from 'react';
import { Users, Mail, MapPin, Phone, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Customer } from '../types';

interface CustomersViewProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  onInvoiceCustomer: (customer: Customer) => void;
}

export default function CustomersView({
  customers,
  setCustomers,
  onInvoiceCustomer,
}: CustomersViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;

    const newCust: Customer = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      email: email || 'finance@company.com',
      phone: phone || '+62 21 0000 000',
      billingAddress: address,
    };

    setCustomers((prev) => [newCust, ...prev]);

    // Reset Form
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    // Keep at least the default customer
    if (customers.length <= 1) return;
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="w-full flex flex-col gap-6" id="customers-view-container">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="customers-header">
        <div>
          <h2 className="text-2xl font-bold text-[#121212] tracking-tight">Customers Directory</h2>
          <p className="text-xs text-[#5d6b82]">Manage client records and initiate invoices quickly</p>
        </div>

        <button
          id="toggle-add-customer-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-[#121212] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer soft-shadow self-start"
        >
          <Plus size={15} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Slide / Expand Add Form */}
      {showAddForm && (
        <form 
          onSubmit={handleSubmit}
          id="add-customer-form"
          className="bg-white rounded-2xl p-6 border border-[#eff1f4]/60 soft-shadow flex flex-col gap-4 animate-fadeIn"
        >
          <h3 className="text-sm font-bold text-[#121212]">Create Client Profile</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#5d6b82]">Company Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="PT Nusa Nusantara"
                className="px-3.5 py-2.5 border border-[#dddfdf] rounded-xl text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-white"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#5d6b82]">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="finance@nusantara.com"
                className="px-3.5 py-2.5 border border-[#dddfdf] rounded-xl text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#5d6b82]">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 21 555 123"
                className="px-3.5 py-2.5 border border-[#dddfdf] rounded-xl text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#5d6b82]">Billing Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jl. Kuningan No 24, Jakarta Selatan, DKI Jakarta 12950"
              className="px-3.5 py-2.5 border border-[#dddfdf] rounded-xl text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-white"
            />
          </div>

          <div className="flex items-center gap-3 justify-end mt-2">
            <button
              id="cancel-add-customer-btn"
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-[#dddfdf] text-[#5d6b82] hover:bg-[#f7f8fa] text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-customer-btn"
              type="submit"
              className="px-5 py-2 bg-[#121212] hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer soft-shadow"
            >
              Add Profile
            </button>
          </div>
        </form>
      )}

      {/* Grid of Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="customers-grid">
        {customers.map((c) => (
          <div 
            key={c.id} 
            id={`customer-card-${c.id}`}
            className="bg-white rounded-2xl p-5 border border-[#eff1f4]/60 soft-shadow flex flex-col justify-between gap-5 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-[#5d6b82]">
                  <Users size={18} />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-base text-[#121212]">{c.name}</h3>
                  <span className="text-[10px] text-[#8695ac] font-mono tracking-widest uppercase">ID: {c.id}</span>
                </div>
              </div>

              {/* Delete button (hidden by default, shows on hover) */}
              <button
                id={`delete-customer-btn-${c.id}`}
                onClick={() => handleDelete(c.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 border border-transparent transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Delete customer record"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Profile fields */}
            <div className="flex flex-col gap-2.5 border-t border-[#f7f8fa] pt-3 text-xs text-[#5d6b82]" id="customer-profile-details">
              <div className="flex items-center gap-2.5">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{c.email}</span>
              </div>
              
              {c.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span>{c.phone}</span>
                </div>
              )}
              
              <div className="flex items-start gap-2.5">
                <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed line-clamp-2">{c.billingAddress}</span>
              </div>
            </div>

            {/* Core Action: Invoice customer */}
            <button
              id={`invoice-customer-btn-${c.id}`}
              onClick={() => onInvoiceCustomer(c)}
              className="w-full py-2.5 border border-[#eff1f4] hover:border-[#121212] hover:bg-slate-50 transition-all rounded-xl text-xs font-bold text-[#303846] hover:text-[#121212] flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              <span>Invoice Client</span>
              <ArrowRight size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
