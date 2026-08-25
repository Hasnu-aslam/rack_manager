"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { withAuth } from "@/components/withAuth";

function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);

  // Form states for creating tenant
  const [tenantName, setTenantName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getTenants();
      setTenants(data);
    } catch (err: any) {
      console.error("Failed to load tenants:", err);
      setError(err.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const newTenant = await apiClient.createTenant({
        name: tenantName,
        admin_username: adminUsername,
        admin_email: adminEmail
      });
      setTenants([...tenants, newTenant]);
      setTenantName("");
      setAdminUsername("");
      setAdminEmail("");
      setShowTenantModal(false);
      setSuccess(`Tenant "${newTenant.name}" and Admin account successfully created!`);
    } catch (err: any) {
      setError(err.message || "Failed to create tenant");
    }
  };

  const handleDeleteTenant = async (tenantId: number) => {
    if (!confirm("Are you sure you want to delete this tenant and all its associated data (users, inventory, sales)? This action is completely irreversible.")) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await apiClient.deleteTenant(tenantId);
      setTenants(tenants.filter(t => t.id !== tenantId));
      setSelectedTenant(null);
      setSuccess("Tenant deleted successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to delete tenant");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E63946]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Super Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Manage tenants and platform usage.</p>
          </div>
          <button 
            onClick={() => setShowTenantModal(true)}
            className="bg-[#E63946] text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg"
          >
            + New Tenant
          </button>
        </div>

        {error && (
          <div className="bg-[#1a0f0f] border-l-4 border-[#E63946] text-[#E63946] p-4 rounded-xl mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-[#0f1a0f] border-l-4 border-green-500 text-green-500 p-4 rounded-xl mb-6">
            <p className="text-sm">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl p-6 shadow-lg">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Total Tenants</h3>
            <p className="text-4xl font-black text-white tracking-tighter">
              {tenants.length}
            </p>
          </div>
        </div>

        <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6">Tenants List</h2>
          <p className="text-xs text-gray-500 mb-4">* Click/touch any tenant row to see details and admin status</p>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222] text-left">
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">ID</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Created At</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr 
                    key={t.id} 
                    onClick={() => setSelectedTenant(t)}
                    className="border-b border-[#222] hover:bg-[#161616] transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4 text-gray-400 font-mono text-sm">{t.id}</td>
                    <td className="py-4 px-4 text-white font-medium">{t.name}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No tenants found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* New Tenant Modal */}
      {showTenantModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[#222] flex items-center justify-between bg-[#1A1A1A]">
              <h2 className="text-xl font-bold text-white">Create New Tenant</h2>
              <button 
                onClick={() => setShowTenantModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Tenant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adidas Outlet"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#333] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-white outline-none placeholder-gray-800 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Admin Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. adidas_admin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#333] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-white outline-none placeholder-gray-800 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Admin Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@adidas.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#333] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-white outline-none placeholder-gray-800 transition-all font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#E63946] text-white font-bold uppercase tracking-wider py-3.5 rounded-xl hover:bg-red-700 transition-all"
              >
                Create Tenant & Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tenant Details Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[#222] flex items-center justify-between bg-[#1A1A1A]">
              <h2 className="text-xl font-bold text-white">Tenant Details</h2>
              <button 
                onClick={() => setSelectedTenant(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Tenant ID</label>
                <p className="text-sm font-mono text-white bg-[#0D0D0D] p-2 rounded-lg border border-[#222]">{selectedTenant.id}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Name</label>
                <p className="text-lg font-bold text-white bg-[#0D0D0D] p-2 rounded-lg border border-[#222]">{selectedTenant.name}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Status</label>
                <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold ${selectedTenant.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {selectedTenant.status.toUpperCase()}
                </span>
              </div>

              <div className="border-t border-[#222] pt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Assigned Administrator</h3>
                {selectedTenant.users && selectedTenant.users.length > 0 ? (
                  selectedTenant.users.map((user: any) => (
                    <div key={user.id} className="bg-[#0D0D0D] border border-[#222] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Username</span>
                        <span className="text-sm text-white font-medium">{user.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Email</span>
                        <span className="text-sm text-white font-medium">{user.email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Password Setup Status</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.is_password_configured ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {user.is_password_configured ? "COMPLETE" : "PENDING SETUP"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No admin assigned to this tenant.</p>
                )}
              </div>

              <div className="border-t border-[#222] pt-4 flex gap-3">
                <button
                  onClick={() => handleDeleteTenant(selectedTenant.id)}
                  className="w-full bg-red-600/10 border border-red-600/30 text-red-500 hover:bg-red-600 hover:text-white py-3 rounded-xl text-sm font-semibold transition-all"
                >
                  Delete Tenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(SuperAdminDashboard);
