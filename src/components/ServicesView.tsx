import React, { useState } from 'react';
import { Sparkles, DollarSign, Tag, Clock, Plus, Trash2 } from 'lucide-react';
import { Service } from '../types';
import { formatIDR } from '../utils';

interface ServicesViewProps {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  onAddServiceToInvoice: (service: Service) => void;
}

export default function ServicesView({
  services,
  setServices,
  onAddServiceToInvoice,
}: ServicesViewProps) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('page');
  const [cost, setCost] = useState(100000);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || cost <= 0) return;

    const newServ: Service = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      defaultQty: qty || 1,
      defaultUnit: unit || 'page',
      defaultCost: cost
    };

    setServices((prev) => [newServ, ...prev]);

    // Reset Form
    setName('');
    setQty(1);
    setUnit('page');
    setCost(100000);
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (services.length <= 1) return;
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="w-full flex flex-col gap-6" id="services-view-container">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="services-header">
        <div>
          <h2 className="text-2xl font-bold text-[#121212] tracking-tight">Services Catalog</h2>
          <p className="text-xs text-[#5d6b82]">Define standard hourly rates, items, and packages for invoices</p>
        </div>

        <button
          id="toggle-add-service-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-[#121212] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer soft-shadow self-start"
        >
          <Plus size={15} />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Expandable Add Service Form */}
      {showAddForm && (
        <form 
          onSubmit={handleSubmit}
          id="add-service-form"
          className="bg-white rounded-2xl p-6 border border-[#eff1f4]/60 soft-shadow flex flex-col gap-4 animate-fadeIn"
        >
          <h3 className="text-sm font-bold text-[#121212]">Create Catalog Service</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Service Name */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-[#5d6b82]">Service / Item Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Custom Web Development"
                className="px-3.5 py-2.5 border border-[#dddfdf] rounded-xl text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-white"
              />
            </div>
            
            {/* Default Cost (Unit Rate) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#5d6b82]">Unit Rate (IDR) *</label>
              <input
                type="number"
                required
                value={cost === 0 ? '' : cost}
                onChange={(e) => setCost(Number(e.target.value) || 0)}
                placeholder="500000"
                className="px-3.5 py-2.5 border border-[#dddfdf] rounded-xl text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-white"
              />
            </div>

            {/* Default Qty & Unit fields nested */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#5d6b82]">Default Qty</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value) || 1)}
                  placeholder="10"
                  className="px-3.5 py-2.5 border border-[#dddfdf] rounded-xl text-xs text-center font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#5d6b82]">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="page"
                  className="px-3.5 py-2.5 border border-[#dddfdf] rounded-xl text-xs text-center font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end mt-2">
            <button
              id="cancel-add-service"
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-[#dddfdf] text-[#5d6b82] hover:bg-[#f7f8fa] text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-service-btn"
              type="submit"
              className="px-5 py-2 bg-[#121212] hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer soft-shadow"
            >
              Add Item
            </button>
          </div>
        </form>
      )}

      {/* Grid of Services */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="services-grid">
        {services.map((s) => (
          <div 
            key={s.id} 
            id={`service-card-${s.id}`}
            className="bg-white rounded-2xl p-5 border border-[#eff1f4]/60 soft-shadow flex flex-col justify-between gap-5 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-[#5d6b82]">
                  <Sparkles size={18} className="text-yellow-600" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-sm text-[#121212] leading-tight line-clamp-1">{s.name}</h3>
                  <span className="text-[10px] text-[#8695ac] font-mono">Catalog: {s.id}</span>
                </div>
              </div>

              {/* Delete button (shows on hover) */}
              <button
                id={`delete-service-btn-${s.id}`}
                onClick={() => handleDelete(s.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 border border-transparent transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Delete Service"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Details Fields */}
            <div className="flex items-center  justify-between border-t border-[#f7f8fa] pt-3 text-xs" id="service-price-summary">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-[#8695ac] uppercase font-bold tracking-wider">Default Price</span>
                <span className="font-black text-sm text-[#121212] font-mono">{formatIDR(s.defaultCost)}</span>
              </div>
              
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 font-semibold text-[11px]">
                <Clock size={12} />
                <span>{s.defaultQty} {s.defaultUnit}</span>
              </div>
            </div>

            {/* Core Action: Add standard item directly onto Invoice draft */}
            <button
              id={`add-service-to-invoice-${s.id}`}
              onClick={() => onAddServiceToInvoice(s)}
              className="w-full py-2.5 bg-[#121212] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer soft-shadow"
            >
              <Plus size={14} />
              <span>Add to Active Draft</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
