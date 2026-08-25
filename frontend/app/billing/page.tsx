"use client";

import { useState, useEffect } from "react";
import { apiClient, API_URL } from "@/lib/api";
import { useStore } from "@/lib/store";
import { withAuth } from "@/components/withAuth";

const getImageUrl = (url?: string) => url ? (url.startsWith("/") ? `${API_URL}${url}` : url) : undefined;


const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>;
const ShoppingBagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

function BillingPage() {
  const { carts, activeCartId, createCart, switchCart, closeCart, addToCart, removeFromCart, updateCartItem, clearActiveCart, selectedCustomer, setSelectedCustomer } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerSearchFocused, setIsCustomerSearchFocused] = useState(false);
  const [isProductSearchFocused, setIsProductSearchFocused] = useState(false);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("cash");
  const [orderType, setOrderType] = useState<"walkin" | "online">("walkin");
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const activeCart = carts[activeCartId] || [];

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await apiClient.getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await apiClient.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: customerForm.name,
        phone: customerForm.phone || null,
      };
      if (customerForm.email && customerForm.email.trim() !== "") {
        payload.email = customerForm.email;
      }
      if (customerForm.address && customerForm.address.trim() !== "") {
        payload.address = customerForm.address;
      }
      const customer = await apiClient.createCustomer(payload);
      setCustomers([...customers, customer]);
      setSelectedCustomer(customer);
      setShowCustomerModal(false);
      setCustomerSearch(customer.phone || "");
      setCustomerForm({ name: "", phone: "", email: "", address: "" });
    } catch (err) {
      console.error("Failed to create customer:", err);
    }
  };

  const handleCheckout = async () => {
    if (activeCart.length === 0) {
      alert("Cart is empty");
      return;
    }

    if (!selectedCustomer || !selectedCustomer.phone) {
      alert("A customer profile with a valid mobile number is required.");
      setShowCustomerModal(true);
      return;
    }

    try {
      const saleData = {
        customer_id: selectedCustomer?.id || null,
        employee_id: null,
        payment_method: paymentMethod === "upi" ? "digital" : paymentMethod,
        items: activeCart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          discount: item.discount,
          size: item.size,
        })),
      };

      const sale = await apiClient.createSale(saleData);
      
      const rawMessage = `*Order Invoice: ${sale.invoice_number}*\n` +
          `Thank you for shopping at Rack Manager!\n` +
          `*Total paid:* ₹${cartTotal.toFixed(2)}\n` +
          `*Payment Mode:* ${paymentMethod.toUpperCase()}\n` +
          `*Fulfillment:* ${orderType.toUpperCase()}\n\n` + 
          `We appreciate your business.`;

      const encodedMessage = encodeURIComponent(rawMessage);
      const safePhone = selectedCustomer.phone.replace(/\D/g, ''); 
      const whatsappUrl = `https://wa.me/91${safePhone}?text=${encodedMessage}`;

      const wantsToDistribute = window.confirm(`Sale created! Invoice: ${sale.invoice_number}\n\nWould you like to send the WhatsApp digital invoice to ${selectedCustomer.name}?`);
      
      if (wantsToDistribute) {
        window.open(whatsappUrl, "_blank");
      }
      
      clearActiveCart();
      setSelectedCustomer(null);
      setCustomerSearch("");
      loadProducts();
    } catch (err: any) {
      alert(err.message || "Failed to complete sale");
    }
  };

  const filteredProducts = searchTerm
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const matchedCustomers = customerSearch
    ? customers.filter(c => c.phone && c.phone.includes(customerSearch))
    : [];

  const cartTotal = activeCart.reduce(
    (sum, item) => sum + (item.product.price * item.quantity - item.discount),
    0
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E63946]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans flex flex-col">
      {/* Top Navigation / Tabs */}
      <div className="bg-[#09090b] border-b border-[#1A1A1A] px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-1 mr-4">
          {Object.keys(carts).map((cartId, index) => (
            <div 
              key={cartId}
              onClick={() => switchCart(cartId)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all border whitespace-nowrap
                ${activeCartId === cartId ? 'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]' : 'bg-[#121212] border-[#222] text-gray-400 hover:text-gray-200'}`}
            >
              <span>Cart {index + 1}</span>
              <div className="flex items-center justify-center bg-[#1A1A1A] rounded-full w-5 h-5 text-xs">
                {carts[cartId].length}
              </div>
              {Object.keys(carts).length > 1 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); closeCart(cartId); }}
                  className="ml-2 hover:bg-black/20 p-1 rounded-md"
                >
                  <XIcon />
                </button>
              )}
            </div>
          ))}
          <button 
            onClick={createCart}
            className="flex items-center justify-center px-4 py-2 bg-[#121212] border border-[#222] hover:border-[#333] text-gray-400 hover:text-gray-200 rounded-lg transition-all"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col h-[calc(100vh-80px)]">
        
        {/* Main Interface */}
        <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col flex-1 relative overflow-hidden">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Customer Section */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Customer Profile</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter phone number..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    const match = customers.find(c => c.phone === e.target.value);
                    if (match) setSelectedCustomer(match);
                    else setSelectedCustomer(null);
                  }}
                  onFocus={() => setIsCustomerSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsCustomerSearchFocused(false), 200)}
                  className="w-full px-4 py-3.5 bg-[#1A1A1A] text-white border border-[#222] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] outline-none font-medium placeholder-gray-600 transition-all"
                />
                
                {selectedCustomer && (
                  <div className="absolute right-3 top-3.5 flex items-center gap-2">
                    <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded font-medium">{selectedCustomer.name}</span>
                  </div>
                )}
                
                {!selectedCustomer && customerSearch.length > 5 && (
                  <button
                    onClick={() => {
                      setCustomerForm({...customerForm, phone: customerSearch});
                      setShowCustomerModal(true);
                    }}
                    className="absolute right-2 top-2 bg-[#E63946] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#A4161A] transition-colors"
                  >
                    New Profile
                  </button>
                )}
              </div>
              
              {isCustomerSearchFocused && matchedCustomers.length > 0 && !selectedCustomer && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-[#222] rounded-xl shadow-xl overflow-hidden z-20">
                  {matchedCustomers.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => { setCustomerSearch(c.phone); setSelectedCustomer(c); }}
                      className="p-3 hover:bg-[#222] cursor-pointer flex justify-between items-center transition-colors border-b border-[#222] last:border-0"
                    >
                      <span className="text-white font-medium">{c.phone}</span>
                      <span className="text-gray-400 text-sm">{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Search */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Add Product</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search catalog by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsProductSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsProductSearchFocused(false), 200)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#1A1A1A] border border-[#222] rounded-xl focus:ring-1 focus:ring-[#E63946] focus:border-[#E63946] text-white outline-none transition-all placeholder-gray-600 shadow-sm"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {isProductSearchFocused && searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-[#222] rounded-xl shadow-xl overflow-hidden z-20 max-h-64 overflow-y-auto custom-scrollbar">
                  {filteredProducts.length === 0 ? (
                     <div className="p-4 text-center text-gray-500 text-sm">No products found</div>
                  ) : (
                    filteredProducts.map(product => {
                      const inStockSizes = product.sizes ? product.sizes.filter(s => s.quantity > 0) : [];
                      return (
                        <div
                          key={product.id}
                          className="p-3 border-b border-[#222] last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#0D0D0D] rounded border border-[#333] flex items-center justify-center overflow-hidden">
                                {product.image_url ? <img src={getImageUrl(product.image_url)} className="w-full h-full object-cover" /> : <ImageIcon />}
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">{product.name}</p>
                                <p className="text-gray-500 text-xs font-mono">{product.sku}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-bold text-sm">₹{product.price.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          {/* Choose size to add */}
                          <div className="mt-2 flex flex-wrap gap-1.5 pl-13">
                            {inStockSizes.length === 0 ? (
                              <span className="text-[10px] text-red-500 font-bold uppercase">OUT OF STOCK</span>
                            ) : (
                              inStockSizes.map(s => (
                                <button
                                  key={s.size}
                                  onClick={() => {
                                    addToCart(product, 1, s.size);
                                    setSearchTerm("");
                                    setIsProductSearchFocused(false);
                                  }}
                                  className="px-2.5 py-1 bg-[#262626] hover:bg-[#E63946] hover:text-white border border-[#333] rounded-lg text-xs font-bold font-mono transition-colors text-gray-300"
                                >
                                  US {s.size} ({s.quantity})
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar space-y-3">
            {activeCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                <div className="p-4 bg-[#1A1A1A] rounded-full text-[#333]">
                  <ShoppingBagIcon />
                </div>
                <p className="text-sm font-medium text-gray-500">Cart is empty. Search above to add items.</p>
              </div>
            ) : (
              activeCart.map((item) => {
                const maxStock = item.product.sizes?.find(s => s.size === item.size)?.quantity || item.product.stock_quantity || 999;
                return (
                  <div key={`${item.product.id}-${item.size}`} className="group relative bg-[#0D0D0D] border border-[#1A1A1A] p-4 rounded-xl flex gap-4 transition-all hover:border-[#333]">
                     <div className="w-16 h-16 rounded-lg bg-[#121212] flex-shrink-0 overflow-hidden border border-[#222]">
                        {item.product.image_url ? <img src={getImageUrl(item.product.image_url)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon /></div> }
                     </div>
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-white text-base truncate pr-6">{item.product.name}</p>
                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-[#1A1A1A] border border-[#333] rounded text-[10px] font-bold font-mono text-gray-400">SIZE: US {item.size}</span>
                          </div>
                          <button
                           onClick={() => removeFromCart(item.product.id, item.size)}
                           className="text-gray-600 hover:text-[#E63946] transition-colors"
                          >
                           <XIcon />
                          </button>
                        </div>
                        <p className="text-gray-500 text-sm mt-1.5">₹{item.product.price.toFixed(2)}</p>
                        
                        <div className="flex items-center justify-between mt-3">
                           <div className="flex items-center bg-[#1A1A1A] rounded-lg border border-[#333] overflow-hidden">
                             <button onClick={() => updateCartItem(item.product.id, item.size, Math.max(1, item.quantity - 1))} className="px-3 py-1 text-gray-400 hover:text-white hover:bg-[#222] transition-colors">-</button>
                             <input
                               type="number" min="1" max={maxStock}
                               value={item.quantity}
                               onChange={(e) => {
                                 const qty = Math.min(maxStock, parseInt(e.target.value) || 1);
                                 updateCartItem(item.product.id, item.size, qty);
                               }}
                               className="w-12 bg-transparent text-white text-sm text-center outline-none border-x border-[#333] py-1 font-mono"
                             />
                             <button onClick={() => updateCartItem(item.product.id, item.size, Math.min(maxStock, item.quantity + 1))} className="px-3 py-1 text-gray-400 hover:text-white hover:bg-[#222] transition-colors">+</button>
                           </div>
                           <p className="font-bold text-white text-lg font-mono">
                             ₹{(item.product.price * item.quantity - item.discount).toFixed(2)}
                           </p>
                        </div>
                     </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Checkout Section Bottom */}
          <div className="shrink-0 bg-[#09090b] -mx-6 -mb-6 md:-mx-8 md:-mb-8 p-6 md:p-8 border-t border-[#1A1A1A]">
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Order Type UI */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Fulfillment</label>
                <div className="grid grid-cols-2 gap-2">
                   {["walkin", "online"].map(type => (
                     <div 
                       key={type} 
                       onClick={() => setOrderType(type as any)}
                       className={`cursor-pointer border py-3 text-center text-sm font-semibold rounded-xl uppercase tracking-wider transition-all
                         ${orderType === type ? "bg-white border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "bg-[#161616] border-[#222] text-gray-400 hover:bg-[#222] hover:text-gray-300"}
                       `}
                     >
                       {type === "walkin" ? "Walk-In" : "Online"}
                     </div>
                   ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                   {["cash", "card", "upi"].map(mode => (
                     <div 
                       key={mode} 
                       onClick={() => setPaymentMethod(mode as any)}
                       className={`cursor-pointer border py-3 text-center text-sm font-semibold rounded-xl uppercase tracking-wider transition-all
                         ${paymentMethod === mode ? "bg-[#E63946] border-[#E63946] text-white shadow-[0_0_15px_rgba(230,57,70,0.2)]" : "bg-[#161616] border-[#222] text-gray-400 hover:bg-[#222] hover:text-gray-300"}
                       `}
                     >
                       {mode}
                     </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end mb-6 pt-2 border-t border-[#1A1A1A] border-dashed">
              <span className="text-gray-400 font-medium uppercase tracking-wider text-sm">Total Due</span>
              <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">₹{cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={activeCart.length === 0}
              className="w-full bg-white text-black font-extrabold uppercase tracking-widest py-4 rounded-xl hover:bg-gray-200 disabled:bg-[#1A1A1A] disabled:text-gray-600 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98] text-lg"
            >
              Complete Checkout
            </button>
          </div>
        </div>

      </div>

      {/* Customer Registration Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-[#222] flex items-center justify-between bg-[#1A1A1A]">
              <div>
                <h2 className="text-xl font-bold text-white">New Customer</h2>
                <p className="text-xs text-gray-500 mt-1">Profile needed for WhatsApp invoice dispatch.</p>
              </div>
              <button 
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-500 hover:text-white transition-colors bg-[#0D0D0D] p-2 rounded-lg border border-[#333]"
               >
                 <XIcon />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#E63946] mb-2">Mobile Number *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 pointer-events-none font-bold">+91</span>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#0D0D0D] border border-[#E63946]/50 rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-white outline-none font-bold tracking-widest placeholder-gray-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#333] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-white outline-none placeholder-gray-800 transition-all"
                />
              </div>

              <div>
                 <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email (Optional)</label>
                 <input
                   type="email"
                   placeholder="jane@example.com"
                   value={customerForm.email}
                   onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                   className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#333] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-white outline-none placeholder-gray-800 transition-all"
                 />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#E63946] text-white font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-[#A4161A] shadow-[0_0_20px_rgba(230,57,70,0.2)] transition-all active:scale-[0.98]"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(BillingPage);

