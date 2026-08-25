"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { withAuth } from "@/components/withAuth";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#E63946", "#F4A261", "#E9C46A", "#2A9D8F", "#264653"];

const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const ShoppingBagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;

function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("daily");

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, customersData, salesData] = await Promise.all([
         apiClient.getDashboardStats(period),
         apiClient.getCustomers({ limit: 8 }),
         apiClient.getSales({ limit: 10 })
      ]);
      setStats(statsData);
      setCustomers(customersData);
      setSales(salesData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevertSale = async (saleId: number) => {
    if (!confirm("Are you sure you want to revert this sale? This will restore stock levels for all products in this bill. This action is irreversible.")) {
      return;
    }
    try {
      await apiClient.revertSale(saleId);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to revert sale");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E63946]"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="text-center text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Overview of your store's performance.</p>
          </div>
          <div className="relative">
            <select
              value={period}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPeriod(e.target.value as "daily" | "monthly" | "yearly")}
              className="appearance-none bg-[#121212] border border-[#222] text-white px-4 py-2 pr-8 rounded-xl outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] font-medium"
            >
              <option value="daily">Today</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl p-6 shadow-lg">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Total Sales</h3>
            <p className="text-4xl font-black text-white tracking-tighter">
              ₹{stats.overview.total_sales.toFixed(2)}
            </p>
          </div>
          <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl p-6 shadow-lg">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Total Transactions</h3>
            <p className="text-4xl font-black text-white tracking-tighter">{stats.overview.total_transactions}</p>
          </div>
          <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl p-6 shadow-lg">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Avg Transaction</h3>
            <p className="text-4xl font-black text-white tracking-tighter">
              ₹{stats.overview.average_transaction.toFixed(2)}
            </p>
          </div>
        </div>

        {/* CRM and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* CRM - Customer List */}
          <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl p-6 shadow-lg lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-[#1A1A1A] rounded-lg text-[#E63946]">
                 <UserIcon />
               </div>
               <h2 className="text-xl font-bold text-white">Customer CRM</h2>
            </div>
            <div className="overflow-y-auto max-h-96 custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#222]">
                    <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 8).map(c => (
                    <tr key={c.id} className="border-b border-[#222]/50 hover:bg-[#161616] transition-colors">
                      <td className="py-3 px-2 text-white font-medium">{c.name || "N/A"}</td>
                      <td className="py-3 px-2 text-gray-400 text-sm">{c.phone || "N/A"}</td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-6 text-center text-gray-500">No customers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Sales / Revert Portal */}
          <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl p-6 shadow-lg lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-[#1A1A1A] rounded-lg text-[#E63946]">
                 <ShoppingBagIcon />
               </div>
               <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#222]">
                    <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Invoice</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-[#222]/50 hover:bg-[#161616] transition-colors">
                      <td className="py-3.5 px-2 text-white font-semibold font-mono text-sm">{sale.invoice_number}</td>
                      <td className="py-3.5 px-2 text-gray-300 text-sm">{sale.customer_name || "Walk-In"}</td>
                      <td className="py-3.5 px-2 text-right text-white font-bold text-sm">₹{sale.total_amount.toFixed(2)}</td>
                      <td className="py-3.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                          ${sale.is_reverted ? 'bg-red-500/10 text-red-500 border border-red-500/10' : 'bg-green-500/10 text-green-500 border border-green-500/10'}`}>
                          {sale.is_reverted ? "Reverted" : "Completed"}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        {!sale.is_reverted ? (
                          <button
                            onClick={() => handleRevertSale(sale.id)}
                            className="bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-all"
                          >
                            Revert
                          </button>
                        ) : (
                          <span className="text-xs text-gray-600 font-medium">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">No transactions recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sales Trends & Best Sellers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-6 text-white">Sales Trends</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="sales" stroke="#E63946" strokeWidth={3} dot={{ r: 4, fill: "#E63946", strokeWidth: 0 }} name="Sales (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-6 text-white">Best Sellers</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.best_sellers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis type="number" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="product_name" type="category" stroke="#666" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="total_quantity" fill="#E63946" radius={[0, 4, 4, 0]} name="Qty Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {stats.low_stock_products && stats.low_stock_products.length > 0 && (
          <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-[#E63946]">Low Stock Alerts</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#222]">
                    <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Product</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">SKU</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.low_stock_products.map((product: { id: number; name: string; sku: string; stock_quantity: number; threshold: number }) => (
                    <tr key={product.id} className="border-b border-[#222]">
                      <td className="py-3 px-2 text-white font-medium">{product.name}</td>
                      <td className="py-3 px-2 text-gray-500 font-mono text-sm">{product.sku}</td>
                      <td className="py-3 px-2 text-right">
                         <span className="bg-red-500/10 text-red-500 font-bold px-2 py-1 rounded text-sm">
                           {product.stock_quantity} Left
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(DashboardPage);
