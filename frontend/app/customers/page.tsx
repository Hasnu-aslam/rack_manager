"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { withAuth } from "@/components/withAuth";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;
  const [hasMore, setHasMore] = useState(true);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });

  useEffect(() => {
    loadCustomers();
  }, [page, searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * limit;
      const data = await apiClient.getCustomers({
        skip,
        limit: limit + 1, // Fetch 1 extra to check if there is a next page
        search: searchTerm || undefined
      });

      if (data.length > limit) {
        setHasMore(true);
        setCustomers(data.slice(0, limit));
      } else {
        setHasMore(false);
        setCustomers(data);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || null,
      address: formData.address || null,
      notes: formData.notes || null
    };

    try {
      if (editingCustomer) {
        await apiClient.updateCustomer(editingCustomer.id, payload);
        setSuccess("Customer updated successfully!");
      } else {
        await apiClient.createCustomer(payload);
        setSuccess("Customer created successfully!");
      }
      closeModal();
      loadCustomers();
    } catch (err: any) {
      setError(err.message || "Failed to save customer");
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await apiClient.deleteCustomer(id);
      setSuccess("Customer deleted successfully!");
      loadCustomers();
    } catch (err: any) {
      setError(err.message || "Failed to delete customer");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", email: "", address: "", notes: "" });
  };

  return (
    <div className="min-h-screen bg-[#09090b] py-8 text-gray-200 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Customers</h1>
            <p className="mt-1 text-sm text-gray-500">Manage and search your client directory</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search name, phone, email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-[#222] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-white outline-none transition-all placeholder-gray-600 shadow-sm"
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto flex justify-center items-center gap-2 bg-[#E63946] hover:bg-[#A4161A] text-white px-5 py-2.5 rounded-xl font-medium shadow-[0_0_15px_rgba(230,57,70,0.2)] transition-all active:scale-95 whitespace-nowrap"
            >
              <PlusIcon /> Add Customer
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-[#1a0f0f] border border-red-500/20 text-[#E63946] p-4 rounded-xl mb-6 shadow-sm">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl mb-6 shadow-sm">
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* Table View */}
        <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Address</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]/50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#161616] transition-colors">
                    <td className="py-4 px-6 text-white font-medium">{c.name}</td>
                    <td className="py-4 px-6 text-gray-300 font-mono text-sm">{c.phone}</td>
                    <td className="py-4 px-6 text-gray-400 text-sm">{c.email || "—"}</td>
                    <td className="py-4 px-6 text-gray-400 text-sm max-w-xs truncate">{c.address || "—"}</td>
                    <td className="py-4 px-6 text-center flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-2 bg-[#1A1A1A] hover:bg-[#262626] border border-[#333] text-gray-300 rounded-lg transition-colors"
                        title="Edit Customer"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-2 bg-[#1A1A1A] hover:bg-red-950/30 border border-red-500/10 text-red-500 rounded-lg transition-colors"
                        title="Delete Customer"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-500">
                      No customer records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center bg-[#121212] border border-[#1A1A1A] rounded-xl p-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#262626] transition-colors"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-gray-500">
            Page <span className="text-white font-bold">{page}</span>
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            className="px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#262626] transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#222] flex justify-between items-center bg-[#1A1A1A] sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white">
                {editingCustomer ? "Edit Customer Details" : "Add New Customer"}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors bg-[#0D0D0D] p-2 rounded-lg border border-[#333]">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#E63946] mb-2">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0D0D0D] text-white border border-[#E63946]/50 rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] outline-none transition-all placeholder-gray-800 text-sm"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#E63946] mb-2">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0D0D0D] text-white border border-[#E63946]/50 rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] outline-none transition-all placeholder-gray-800 text-sm"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1A1A1A] text-white border border-[#222] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] outline-none transition-all placeholder-gray-600 text-sm"
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1A1A1A] text-white border border-[#222] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] outline-none transition-all placeholder-gray-600 text-sm"
                  placeholder="e.g. Sector 12, Chandigarh"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1A1A1A] text-white border border-[#222] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] outline-none transition-all placeholder-gray-600 text-sm h-20 resize-none"
                  placeholder="Customer preference details..."
                />
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-[#E63946] text-white font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-[#A4161A] shadow-[0_0_20px_rgba(230,57,70,0.2)] transition-all active:scale-[0.98]">
                  {editingCustomer ? "Save Changes" : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(CustomersPage);
