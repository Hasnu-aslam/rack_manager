"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { apiClient, API_URL } from "@/lib/api";
import { withAuth } from "@/components/withAuth";

const getImageUrl = (url?: string) => url ? (url.startsWith("/") ? `${API_URL}${url}` : url) : undefined;

interface ProductSize {
  id?: number;
  product_id?: number;
  size: string;
  quantity: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  brand?: string;
  category?: string;
  price: number;
  cost: number;
  stock_quantity: number;
  image_url?: string;
  attributes?: Record<string, any>;
  sizes?: ProductSize[];
}

// Inline SVGs for aesthetics
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;

function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");

  // Modals & States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: "", brand: "", category: "", price: "", cost: "",
  });
  
  // Track size quantities in state (6 to 12)
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, string>>({
    "6": "0", "7": "0", "8": "0", "9": "0", "10": "0", "11": "0", "12": "0"
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setProducts: setStoreProducts } = useStore();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProducts();
      setProducts(data);
      setStoreProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = editingProduct?.image_url || null;

      // Image upload logic
      if (selectedFile) {
        const formDataPayload = new FormData();
        formDataPayload.append("file", selectedFile);
        const uploadRes = await fetch("http://localhost:8000/api/v1/products/upload-image", {
          method: "POST",
          headers: {
             Authorization: `Bearer ${localStorage.getItem("access_token")}`
          },
          body: formDataPayload
        });
        
        if (uploadRes.ok) {
           const uploadData = await uploadRes.json();
           imageUrl = uploadData.url;
        } else {
           console.error("Image upload failed");
        }
      }

      // Build sizes payload
      const sizesArray = Object.entries(sizeQuantities).map(([sz, qty]) => ({
        size: sz,
        quantity: parseInt(qty) || 0
      }));

      const productData = {
        name: formData.name,
        sku: editingProduct ? editingProduct.sku : `SKU-${Date.now()}`,
        brand: formData.brand || null,
        category: formData.category || null,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock_quantity: sizesArray.reduce((acc, curr) => acc + curr.quantity, 0),
        image_url: imageUrl,
        sizes: sizesArray
      };

      if (editingProduct) {
        await apiClient.updateProduct(editingProduct.id, productData);
      } else {
        await apiClient.createProduct(productData);
      }

      closeFormModal();
      loadProducts();
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    }
  };

  const handleEdit = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setFormData({
      name: product.name, brand: product.brand || "", category: product.category || "",
      price: product.price.toString(), cost: product.cost.toString()
    });
    
    // Load existing sizes or default to all zeros
    const initialSizes: Record<string, string> = { "6": "0", "7": "0", "8": "0", "9": "0", "10": "0", "11": "0", "12": "0" };
    if (product.sizes) {
      product.sizes.forEach(s => {
        initialSizes[s.size] = s.quantity.toString();
      });
    }
    setSizeQuantities(initialSizes);

    setImagePreview(product.image_url || null);
    setSelectedFile(null);
    setShowAddModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await apiClient.deleteProduct(productToDelete.id);
      setProductToDelete(null);
      loadProducts();
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
    }
  };

  const closeFormModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setSelectedFile(null);
    setImagePreview(null);
    setFormData({ name: "", brand: "", category: "", price: "", cost: "" });
    setSizeQuantities({ "6": "0", "7": "0", "8": "0", "9": "0", "10": "0", "11": "0", "12": "0" });
  };

  const filteredProducts = searchTerm
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E63946]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] py-8 text-gray-200 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Inventory</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your product catalog</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-[#222] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-white outline-none transition-all placeholder-gray-600 shadow-sm"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto flex justify-center items-center gap-2 bg-[#E63946] hover:bg-[#A4161A] text-white px-5 py-2.5 rounded-xl font-medium shadow-[0_0_15px_rgba(230,57,70,0.2)] transition-all active:scale-95 whitespace-nowrap"
            >
              <PlusIcon /> Add Product
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-[#1a0f0f] border-l-4 border-[#E63946] text-[#E63946] p-4 rounded-xl mb-6 shadow-sm">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Grid Layout */}
        {filteredProducts.length === 0 ? (
           <div className="bg-[#121212] rounded-2xl shadow-lg border border-[#1A1A1A] text-center py-20 px-4">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1A1A1A] mb-4">
               <ImageIcon />
             </div>
             <h3 className="text-lg font-medium text-white mb-1">No products found</h3>
             <p className="text-gray-500 max-w-sm mx-auto">Get started by adding a product or change your search term.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-[#121212] border border-[#1A1A1A] rounded-2xl overflow-hidden hover:border-[#333] transition-all group flex flex-col shadow-lg hover:shadow-2xl">
                 <div className="aspect-square bg-[#0D0D0D] border-b border-[#1A1A1A] relative flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={getImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <ImageIcon />
                    )}
                    
                    {/* Action Overlay */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleEdit(product, e)} className="p-2 bg-black/60 backdrop-blur text-white rounded-lg hover:bg-black transition-colors">
                          <PencilIcon />
                      </button>
                      <button onClick={() => setProductToDelete(product)} className="p-2 bg-black/60 backdrop-blur text-[#E63946] rounded-lg hover:bg-[#E63946] hover:text-white transition-colors">
                          <TrashIcon />
                      </button>
                    </div>

                    {/* Stock Badge */}
                    <div className="absolute bottom-2 left-2">
                       {product.stock_quantity === 0 ? (
                         <span className="bg-red-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">OUT OF STOCK</span>
                       ) : product.stock_quantity < 10 ? (
                         <span className="bg-yellow-500/90 backdrop-blur text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm">LOW STOCK ({product.stock_quantity})</span>
                       ) : (
                         <span className="bg-green-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">IN STOCK ({product.stock_quantity})</span>
                       )}
                    </div>
                 </div>
                 
                 <div className="p-4 flex flex-col flex-1">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-base mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-gray-500 text-xs font-mono mb-2">{product.sku}</p>
                      {/* Available Sizes stock tracker */}
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.sizes.map((s) => (
                            <span key={s.id || s.size} className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${s.quantity > 0 ? 'bg-[#1A1A1A] text-gray-400 border border-[#222]' : 'bg-red-500/5 text-red-500/30 border border-red-500/10'}`}>
                              {s.size}:{s.quantity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#1A1A1A] flex justify-between items-end">
                       <div>
                         <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Price</p>
                         <p className="text-white font-bold">₹{product.price.toFixed(2)}</p>
                       </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Dark Form Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-[#222] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#222] flex justify-between items-center bg-[#1A1A1A] sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={closeFormModal} className="text-gray-500 hover:text-white transition-colors bg-[#0D0D0D] p-2 rounded-lg border border-[#333]">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
               {/* Image Upload Area */}
               <div className="mb-6">
                 <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Product Image</label>
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all h-40 overflow-hidden relative group
                     ${imagePreview ? 'border-[#333]' : 'border-[#333] hover:border-[#E63946] bg-[#0D0D0D]'}`}
                 >
                   {imagePreview ? (
                     <>
                       <img src={getImageUrl(imagePreview)} alt="Preview" className="w-full h-full object-contain" />
                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-white font-medium flex items-center gap-2"><UploadIcon /> Change Image</span>
                       </div>
                     </>
                   ) : (
                     <div className="text-center">
                       <div className="mx-auto w-10 h-10 bg-[#1A1A1A] rounded-full flex items-center justify-center text-gray-400 mb-2">
                         <UploadIcon />
                       </div>
                       <p className="text-sm text-gray-300 font-medium">Click to upload image</p>
                       <p className="text-xs text-gray-500 mt-1">Any format (converted to JPEG)</p>
                     </div>
                   )}
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={handleFileChange} 
                     accept="image/*" 
                     className="hidden" 
                   />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                  <div className="col-span-full">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#E63946] mb-2">Product Name *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0D0D0D] text-white border border-[#E63946]/50 rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] outline-none transition-all placeholder-gray-800" placeholder="e.g. Nike Air Max 90" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Brand</label>
                    <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-4 py-3 bg-[#1A1A1A] text-white border border-[#222] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] outline-none transition-all placeholder-gray-600" placeholder="Nike" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Category</label>
                    <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-[#1A1A1A] text-white border border-[#222] rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] outline-none transition-all placeholder-gray-600" placeholder="Sneakers" />
                  </div>

                  {/* Stock Quantities by Size */}
                  <div className="col-span-full">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#E63946] mb-2">Stock By Size *</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 bg-[#0D0D0D] p-4 rounded-xl border border-[#222]">
                      {["6", "7", "8", "9", "10", "11", "12"].map((sz) => (
                        <div key={sz} className="text-center">
                          <label className="block text-[10px] text-gray-500 font-bold mb-1">US {sz}</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={sizeQuantities[sz] || "0"}
                            onChange={(e) => setSizeQuantities({ ...sizeQuantities, [sz]: e.target.value })}
                            className="w-full px-2 py-1.5 bg-[#1A1A1A] text-white border border-[#333] rounded text-center focus:border-[#E63946] outline-none text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#E63946] mb-2">Price (INR) *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 pointer-events-none font-bold">₹</span>
                      <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full pl-8 pr-4 py-3 bg-[#0D0D0D] text-white border border-[#E63946]/50 rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] outline-none transition-all placeholder-gray-800" placeholder="0.00" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#E63946] mb-2">Cost Basis (INR) *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 pointer-events-none font-bold">₹</span>
                      <input type="number" step="0.01" required value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        className="w-full pl-8 pr-4 py-3 bg-[#0D0D0D] text-white border border-[#E63946]/50 rounded-xl focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] outline-none transition-all placeholder-gray-800" placeholder="0.00" />
                    </div>
                  </div>
               </div>

              <div className="mt-8 pt-4 border-t border-[#222]">
                <button type="submit" className="w-full bg-[#E63946] text-white font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-[#A4161A] shadow-[0_0_20px_rgba(230,57,70,0.2)] transition-all active:scale-[0.98]">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Dark Delete Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-[#222] rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-[#1a0f0f] border border-[#E63946]/30 rounded-full flex items-center justify-center mx-auto mb-6 text-[#E63946]">
               <TrashIcon />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Delete Product</h3>
            <p className="text-gray-400 mb-8 text-sm">Are you sure you want to delete <span className="font-semibold text-gray-200">{productToDelete.name}</span>? This action cannot be undone.</p>
            <div className="flex flex-col gap-3">
               <button onClick={confirmDelete} className="w-full bg-[#E63946] hover:bg-[#A4161A] text-white font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(230,57,70,0.2)]">
                  Yes, Delete Instantly
               </button>
               <button onClick={() => setProductToDelete(null)} className="w-full bg-[#1A1A1A] hover:bg-[#222] border border-[#333] text-gray-300 font-bold uppercase tracking-wider py-3.5 rounded-xl transition-colors">
                  Cancel
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(InventoryPage);
