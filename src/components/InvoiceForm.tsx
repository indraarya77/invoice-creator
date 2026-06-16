import React, { useState } from 'react';
import { Plus, Trash2, Calendar, ChevronDown } from 'lucide-react';
import { Invoice, InvoiceItem, Customer } from '../types';
import { formatIDR, uuid, formatDate } from '../utils';

interface InvoiceFormProps {
  invoice: Invoice;
  setInvoice: React.Dispatch<React.SetStateAction<Invoice>>;
  customers: Customer[];
  invoices?: Invoice[];
  onSelectInvoice?: (invoiceId: string) => void;
  onSelectDocumentType?: (type: 'invoice' | 'quotation' | 'dp' | 'pelunasan' | 'receipt') => void;
}

export default function InvoiceForm({ 
  invoice, 
  setInvoice, 
  customers,
  invoices,
  onSelectInvoice,
  onSelectDocumentType,
}: InvoiceFormProps) {
  const [showCustomersDropdown, setShowCustomersDropdown] = useState(false);

  // Handle high-level fields
  const handleFieldChange = (field: keyof Invoice, value: any) => {
    setInvoice((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Auto calculate due date if payment terms change
      if (field === 'paymentTerms' && updated.issueDate) {
        const date = new Date(updated.issueDate);
        if (!isNaN(date.getTime())) {
          let daysToAdd = 0;
          if (value === 'Net 7') daysToAdd = 7;
          else if (value === 'Net 14') daysToAdd = 14;
          else if (value === 'Net 30') daysToAdd = 30;
          else if (value === 'Net 45') daysToAdd = 45;
          
          if (daysToAdd > 0) {
            date.setDate(date.getDate() + daysToAdd);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            updated.dueDate = `${yyyy}-${mm}-${dd}`;
          }
        }
      }
      return updated;
    });
  };

  // Select customer from list
  const handleSelectCustomer = (customer: Customer) => {
    setInvoice((prev) => ({
      ...prev,
      customerName: customer.name,
      billingAddress: customer.billingAddress,
      customerPhone: customer.phone || '',
      customerEmail: customer.email || '',
    }));
    setShowCustomersDropdown(false);
  };

  // Add new blank row to table
  const handleAddItem = () => {
    // Find all active visible row numbers to determine the next one
    const activeNumbers: number[] = [];
    invoice.items.forEach((item, i) => {
      const val = item.rowNumber;
      const visibleNum = (val !== undefined && val !== null) ? String(val) : String(i + 1).padStart(2, '0');
      if (visibleNum.trim() !== '') {
        const parsed = parseInt(visibleNum, 10);
        if (!isNaN(parsed) && parsed > 0) {
          activeNumbers.push(parsed);
        }
      }
    });
    const maxNum = activeNumbers.length > 0 ? Math.max(...activeNumbers) : 0;
    const nextIndex = maxNum + 1;
    
    const newItem: InvoiceItem = {
      id: uuid(),
      name: '',
      qty: 1,
      unit: 'page',
      cost: 0,
      amount: 0,
      rowNumber: String(nextIndex).padStart(2, '0'),
    };
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  // Remove row from table
  const handleRemoveItem = (id: string) => {
    // Keep at least one item
    if (invoice.items.length <= 1) {
      // Just clear out the item instead of deleting
      setInvoice((prev) => ({
        ...prev,
        items: [{ id: uuid(), name: '', qty: 1, unit: 'page', cost: 0, amount: 0 }],
      }));
      return;
    }
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  // Handle single item field changes
  const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setInvoice((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          // Keep amount updated
          if (field === 'qty' || field === 'cost') {
            updatedItem.qty = Math.max(0, Number(updatedItem.qty) || 0);
            updatedItem.cost = Math.max(0, Number(updatedItem.cost) || 0);
            updatedItem.amount = updatedItem.qty * updatedItem.cost;
          }
          return updatedItem;
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-[#eff1f4]/60 soft-shadow flex flex-col gap-6" id="invoice-form-panel">
      <div className="flex items-center justify-between border-b border-[#f7f8fa] pb-4">
        <h2 className="text-xl font-bold text-[#121212] tracking-tight">Invoice Details</h2>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100 uppercase tracking-wider">
          {invoice.invoiceNumber}
        </span>
      </div>

      {/* Inline Document Type Switcher */}
      {onSelectDocumentType && (
        <div className="flex flex-col gap-2 border-b border-[#f7f8fa] pb-4" id="document-type-selector">
          <label className="text-xs font-bold text-[#5d6b82] uppercase tracking-wider">
            Document Type
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 bg-[#f7f8fa] p-1 rounded-xl border border-[#eff1f4]">
            {(
              [
                { id: 'invoice', label: 'Invoice' },
                { id: 'quotation', label: 'Quotation' },
                { id: 'dp', label: 'DP' },
                { id: 'pelunasan', label: 'Pelunasan' },
                { id: 'receipt', label: 'Receipt' },
              ] as const
            ).map((type) => {
              const isActive = invoice.documentType === type.id || (!invoice.documentType && type.id === 'invoice');
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => onSelectDocumentType(type.id)}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all duration-200 outline-none select-none cursor-pointer truncate ${
                    isActive
                      ? 'bg-white text-[#121212] shadow-sm border border-[#eff1f4]'
                      : 'text-[#5d6b82] hover:text-[#121212] hover:bg-white/50'
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Field */}
      <div className="flex flex-col gap-2 relative" id="customer-select-group">
        <label className="text-sm font-semibold text-[#303846] flex items-center justify-between">
          <span>Customer <span className="text-red-500">*</span></span>
          <span className="text-xs font-normal text-[#5d6b82]">Select template or type custom</span>
        </label>
        
        <div className="relative">
          <input
            type="text"
            id="customer-name-input"
            value={invoice.customerName}
            onChange={(e) => handleFieldChange('customerName', e.target.value)}
            placeholder="PT Nusantara Digital Solusi"
            className="w-full px-4 py-3 rounded-xl border border-[#dddfdf] text-sm text-[#121212] focus:border-[#121212] focus:ring-1 focus:ring-[#121212] outline-none transition-all pr-10 bg-white"
          />
          <button
            type="button"
            id="toggle-customers-dropdown"
            onClick={() => setShowCustomersDropdown(!showCustomersDropdown)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5d6b82] hover:text-[#121212] transition-colors p-1 cursor-pointer"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        {/* Floating Customers Dropdown */}
        {showCustomersDropdown && (
          <div className="absolute top-[82px] left-0 right-0 max-h-56 bg-white border border-[#dddfdf] rounded-xl soft-shadow overflow-y-auto z-40 p-1 flex flex-col" id="customers-list-dropdown">
            <div className="px-3 py-1.5 text-xs font-semibold text-[#5d6b82] uppercase tracking-wider border-b border-[#f7f8fa]">
              Select Saved Customer
            </div>
            {customers.map((c) => (
              <button
                key={c.id}
                id={`customer-option-${c.id}`}
                type="button"
                onClick={() => handleSelectCustomer(c)}
                className="w-full text-left px-3 py-2.5 text-xs font-medium text-[#303846] hover:bg-[#f7f8fa] rounded-lg transition-colors flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="font-semibold text-sm text-[#121212]">{c.name}</span>
                <span className="text-[#5d6b82] truncate text-xs">{c.billingAddress}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Billing Address Field */}
      <div className="flex flex-col gap-2" id="billing-address-group">
        <label className="text-sm font-semibold text-[#303846]">
          Billing Address <span className="text-red-500">*</span>
        </label>
        <textarea
          id="billing-address-input"
          value={invoice.billingAddress}
          onChange={(e) => handleFieldChange('billingAddress', e.target.value)}
          placeholder="Jl. Jendral Sudirman No. 45 Jakarta Selatan, DKI Jakarta 12190 Indonesia"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-[#dddfdf] text-sm text-[#121212] focus:border-[#121212] focus:ring-1 focus:ring-[#121212] outline-none transition-all resize-none bg-white"
        />
      </div>

      {/* Contact Person Phone & Email inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="customer-contact-group">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#303846]">
            Customer Phone (Optional)
          </label>
          <input
            type="text"
            id="customer-phone-input"
            value={invoice.customerPhone || ''}
            onChange={(e) => handleFieldChange('customerPhone', e.target.value)}
            placeholder="(+62) 812 3456 7890"
            className="w-full px-4 py-3 rounded-xl border border-[#dddfdf] text-sm text-[#121212] focus:border-[#121212] focus:ring-1 focus:ring-[#121212] outline-none transition-all bg-white"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#303846]">
            Customer Email (Optional)
          </label>
          <input
            type="email"
            id="customer-email-input"
            value={invoice.customerEmail || ''}
            onChange={(e) => handleFieldChange('customerEmail', e.target.value)}
            placeholder="client@mail.com"
            className="w-full px-4 py-3 rounded-xl border border-[#dddfdf] text-sm text-[#121212] focus:border-[#121212] focus:ring-1 focus:ring-[#121212] outline-none transition-all bg-white"
          />
        </div>
      </div>

      {/* Dates & Net Terms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="invoice-dates-terms-row">
        {/* Issue Date */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-sm font-semibold text-[#303846]">
            Issue Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              id="issue-date-input"
              value={invoice.issueDate}
              onChange={(e) => handleFieldChange('issueDate', e.target.value)}
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-[#dddfdf] text-sm text-[#121212] focus:border-[#121212] focus:ring-1 focus:ring-[#121212] outline-none transition-all bg-white"
            />
            <Calendar size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5d6b82] pointer-events-none" />
          </div>
        </div>

        {/* Due Date */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-sm font-semibold text-[#303846]">
            Due Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              id="due-date-input"
              value={invoice.dueDate}
              onChange={(e) => handleFieldChange('dueDate', e.target.value)}
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-[#dddfdf] text-sm text-[#121212] focus:border-[#121212] focus:ring-1 focus:ring-[#121212] outline-none transition-all bg-white"
            />
            <Calendar size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5d6b82] pointer-events-none" />
          </div>
        </div>

        {/* Payment Terms / Validity Period */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#303846]">
            {invoice.documentType === 'quotation' ? 'Validity Period' : 'Payment Terms'} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="payment-terms-input"
              value={invoice.paymentTerms}
              onChange={(e) => handleFieldChange('paymentTerms', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#dddfdf] text-sm text-[#121212] focus:border-[#121212] focus:ring-1 focus:ring-[#121212] outline-none transition-all bg-white appearance-none cursor-pointer pr-10"
            >
              {invoice.documentType === 'quotation' ? (
                <>
                  <option value="7 Days">7 Days</option>
                  <option value="14 Days">14 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="60 Days">60 Days</option>
                </>
              ) : (
                <>
                  <option value="Net 7">Net 7</option>
                  <option value="Net 14">Net 14</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                </>
              )}
            </select>
            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5d6b82] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Item Details */}
      <div className="flex flex-col gap-3 mt-2" id="items-details-section">
        <label className="text-sm font-semibold text-[#303846]">
          Items Details <span className="text-red-500">*</span>
        </label>
        
        {/* Table Layout */}
        <div className="w-full overflow-x-auto" id="items-table-container">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="bg-[#f7f8fa] text-[#5d6b82] text-xs font-semibold rounded-lg uppercase tracking-wider">
                <th className="text-center px-2 py-2.5 rounded-l-lg w-[8%]">No</th>
                <th className="text-left px-3 py-2.5 w-[37%]">Item</th>
                <th className="text-center px-2 py-2.5 w-[15%]">QTY</th>
                <th className="text-left px-2 py-2.5 w-[20%]">Cost</th>
                <th className="text-right px-2 py-2.5 w-[15%]">Amount</th>
                <th className="px-2 py-2.5 rounded-r-lg w-[5%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f8fa]">
              {invoice.items.map((item, index) => (
                <tr key={item.id} className="group" id={`item-row-${item.id}`}>
                  {/* Row Number Column */}
                  <td className="px-1 py-3 text-center">
                    <input
                      type="text"
                      id={`item-rownum-${item.id}`}
                      value={item.rowNumber !== undefined ? item.rowNumber : String(index + 1).padStart(2, '0')}
                      onChange={(e) => handleItemChange(item.id, 'rowNumber', e.target.value)}
                      className="w-10 text-center py-2 rounded-lg border border-[#dddfdf] text-xs font-bold text-[#5d6b82] focus:border-[#121212] outline-none transition-all bg-white"
                    />
                  </td>

                  {/* Item Description */}
                  <td className="px-1 py-3">
                    <input
                      type="text"
                      placeholder="Dashboard UI Design"
                      id={`item-name-${item.id}`}
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-[#dddfdf] text-xs font-medium text-[#121212] focus:border-[#121212] focus:ring-1 focus:ring-[#121212] outline-none transition-all bg-white"
                    />
                  </td>
                  
                  {/* QTY & Unit */}
                  <td className="px-1 py-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="1"
                        id={`item-qty-${item.id}`}
                        value={item.qty === 0 ? '' : item.qty}
                        onChange={(e) => handleItemChange(item.id, 'qty', Number(e.target.value))}
                        className="w-12 text-center py-2 rounded-lg border border-[#dddfdf] text-xs font-medium text-[#121212] focus:border-[#121212] outline-none transition-all bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <input
                        type="text"
                        placeholder="page"
                        id={`item-unit-${item.id}`}
                        value={item.unit}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                        className="w-14 text-center py-2 rounded-lg border border-[#dddfdf] text-xs text-[#5d6b82] hover:text-[#121212] focus:border-[#121212] outline-none transition-all bg-white"
                      />
                    </div>
                  </td>

                  {/* QTY Unit cost */}
                  <td className="px-1 py-3">
                    <div className="flex items-center relative">
                      <span className="absolute left-2 text-[10px] font-semibold text-[#5d6b82] pointer-events-none">IDR</span>
                      <input
                        type="number"
                        placeholder="750.000"
                        id={`item-cost-${item.id}`}
                        value={item.cost === 0 ? '' : item.cost}
                        onChange={(e) => handleItemChange(item.id, 'cost', Number(e.target.value))}
                        className="w-full pl-9 pr-2 py-2 rounded-lg border border-[#dddfdf] text-xs font-medium text-[#121212] focus:border-[#121212] outline-none transition-all bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </td>

                  {/* Calculated Amount */}
                  <td className="px-2 py-3 text-right text-xs font-semibold text-[#121212] font-mono">
                    {formatIDR(item.amount, false)}
                  </td>

                  {/* Remove Button */}
                  <td className="px-1 py-3 text-center">
                    <button
                      type="button"
                      id={`remove-item-${item.id}`}
                      onClick={() => handleRemoveItem(item.id)}
                      className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-[#eff1f4] text-[#5d6b82] hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Item Button */}
        <button
          type="button"
          id="add-item-btn"
          onClick={handleAddItem}
          className="w-full mt-1.5 py-3 border border-dashed border-[#dddfdf] rounded-xl hover:bg-[#f7f8fa] hover:border-[#121212] transition-all flex items-center justify-center gap-1.5 text-xs font-semibold text-[#303846] cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Item</span>
        </button>
      </div>

      {/* Calculations & Summary Section */}
      {/* Calculations & Summary Section */}
      <div className="flex flex-col gap-4 border-t border-[#f7f8fa] pt-5" id="calculations-section">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Discount Input */}
          <div className="flex flex-col gap-1.5" id="discount-group">
            <label className="text-xs font-bold text-[#5d6b82] uppercase tracking-wider">Discount (Optional)</label>
            <div className="flex items-center relative">
              <span className="absolute left-3 text-xs font-semibold text-[#5d6b82] pointer-events-none">IDR</span>
              <input
                type="text"
                id="discount-input"
                value={invoice.discount === 0 ? '' : formatIDR(invoice.discount, false)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  handleFieldChange('discount', parseInt(raw, 10) || 0);
                }}
                placeholder="500.000"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#dddfdf] text-xs font-semibold text-[#121212] focus:border-[#121212] outline-none transition-all"
              />
            </div>
          </div>

          {/* Tax Input */}
          <div className="flex flex-col gap-1.5" id="tax-group">
            <label className="text-xs font-bold text-[#5d6b82] uppercase tracking-wider">Tax (Optional)</label>
            <div className="relative">
              <select
                id="tax-rate-input"
                value={invoice.taxRate || 0}
                onChange={(e) => handleFieldChange('taxRate', Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#dddfdf] text-xs font-semibold text-[#121212] focus:border-[#121212] focus:ring-1 focus:ring-[#121212] outline-none bg-white appearance-none cursor-pointer pr-10 h-[38px]"
              >
                <option value="0">No Tax (0%)</option>
                <option value="11">PPN (11%)</option>
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5d6b82] pointer-events-none" />
            </div>
            {invoice.taxRate > 0 && (
              <span className="text-[10px] text-slate-500 font-semibold font-mono pl-1">
                Amount: {formatIDR(invoice.taxAmount)}
              </span>
            )}
          </div>

          {/* Conditional Input based on Document Type (DP or Pelunasan) */}
          {invoice.documentType === 'dp' && (
            <div className="flex flex-col gap-1.5" id="dp-percentage-group">
              <label className="text-xs font-bold text-[#5d6b82] uppercase tracking-wider">DP Percentage (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="30"
                id="dp-percentage-input"
                value={invoice.dpPercentage || ''}
                onChange={(e) => {
                  let val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                  handleFieldChange('dpPercentage', val);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-[#dddfdf] text-xs font-semibold text-[#121212] focus:border-[#121212] outline-none transition-all h-[38px]"
              />
            </div>
          )}

          {invoice.documentType === 'pelunasan' && (
            <div className="flex flex-col gap-1.5" id="dp-paid-group">
              <label className="text-xs font-bold text-[#5d6b82] uppercase tracking-wider">DP Paid Amount</label>
              <div className="flex items-center relative">
                <span className="absolute left-3 text-xs font-semibold text-[#5d6b82] pointer-events-none">IDR</span>
                <input
                  type="text"
                  id="dp-paid-input"
                  value={invoice.dpPaidAmount === 0 ? '' : formatIDR(invoice.dpPaidAmount, false)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    handleFieldChange('dpPaidAmount', parseInt(raw, 10) || 0);
                  }}
                  placeholder="3.000.000"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#dddfdf] text-xs font-semibold text-[#121212] focus:border-[#121212] outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Placeholder for standard documents to maintain 3-column layout */}
          {invoice.documentType !== 'dp' && invoice.documentType !== 'pelunasan' && (
            <div></div>
          )}
        </div>

        {/* Display row for Total / Total Contract */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-1">
          {/* Base Contract Total for DP and Pelunasan */}
          {(invoice.documentType === 'dp' || invoice.documentType === 'pelunasan') ? (
            <div className="flex flex-col gap-1.5" id="contract-total-group">
              <label className="text-xs font-bold text-[#5d6b82] uppercase tracking-wider">Total Kontrak</label>
              <div className="flex items-center relative">
                <span className="absolute left-3 text-xs font-semibold text-slate-500 pointer-events-none font-mono">IDR</span>
                <input
                  type="text"
                  readOnly
                  value={formatIDR(invoice.subtotal - invoice.discount + invoice.taxAmount, false)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#dddfdf] bg-slate-50 text-xs font-semibold text-slate-600 outline-none font-mono"
                />
              </div>
            </div>
          ) : (
            <div></div>
          )}

          <div></div>

          {/* Actual Total Due */}
          <div className="flex flex-col gap-1.5" id="total-group">
            <label className="text-xs font-bold text-[#5d6b82] uppercase tracking-wider">
              {invoice.documentType === 'dp' ? 'Total Tagihan DP' : invoice.documentType === 'pelunasan' ? 'Sisa Pelunasan' : 'Total'} *
            </label>
            <div className="flex items-center relative">
              <span className="absolute left-3 text-xs font-semibold text-white pointer-events-none font-mono">IDR</span>
              <input
                type="text"
                id="total-display"
                readOnly
                value={formatIDR(invoice.total, false)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-transparent bg-[#121212] text-xs font-bold text-white outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes to Customer Section */}
      <div className="flex flex-col gap-2 border-t border-[#f7f8fa] pt-4 pb-1" id="notes-group">
        <label className="text-sm font-semibold text-[#303846]">
          Notes to Customer <span className="text-red-500">*</span>
        </label>
        <textarea
          id="notes-input"
          value={invoice.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          placeholder="Thank you for your trust. Please complete the payment before the due date."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-[#dddfdf] text-xs text-[#5d6b82] hover:text-[#121212] focus:border-[#121212] focus:ring-1 focus:ring-[#121212] outline-none transition-all resize-none bg-white font-medium"
        />
      </div>

      {/* Signature Name Input */}
      <div className="flex flex-col gap-2 border-t border-[#f7f8fa] pt-4 pb-1" id="signature-name-group">
        <label className="text-sm font-semibold text-[#303846]">
          Nama Tanda Tangan (Signature Name)
        </label>
        <input
          type="text"
          id="signature-name-input"
          value={invoice.signatureName || ''}
          onChange={(e) => handleFieldChange('signatureName', e.target.value)}
          placeholder="E.g. TransactFlow Widjaya"
          className="w-full px-4 py-3 rounded-xl border border-[#dddfdf] text-sm text-[#121212] focus:border-[#121212] focus:ring-1 focus:ring-[#121212] outline-none transition-all bg-white font-semibold"
        />
      </div>


    </div>
  );
}
