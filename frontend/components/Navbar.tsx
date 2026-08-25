"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/inventory", label: "Inventory" },
    { href: "/billing", label: "Billing" },
    { href: "/customers", label: "Customers" },
  ];

  // Completely hide top menu bar on Landing Page, Login variants, and Super Admin routes
  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname?.startsWith("/super-admin")) {
     return null;
  }

  return (
    <nav className="bg-[#121212] border-b border-[#1A1A1A] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex w-full items-center justify-between">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-lg font-black text-white tracking-widest uppercase">Rack Manager</h1>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden sm:flex sm:ml-10 sm:space-x-8 items-center">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-2 pt-1 border-b-2 text-[11px] font-bold tracking-widest uppercase transition-colors duration-200 ${
                    pathname === item.href
                      ? "border-[#E63946] text-white"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="hidden sm:flex ml-auto items-center">
               <button 
                  onClick={() => {
                     localStorage.removeItem('access_token');
                     window.location.href = '/';
                  }}
                  className="text-[10px] font-bold tracking-widest text-[#E63946] hover:text-[#A4161A] uppercase transition-colors"
               >
                 Logout
               </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex sm:hidden items-center">
               <button 
                 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                 className="text-gray-400 hover:text-white focus:outline-none"
               >
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   {mobileMenuOpen ? (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   ) : (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                   )}
                 </svg>
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#1A1A1A] border-b border-[#222]">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-bold transition-colors ${
                  pathname === item.href
                    ? "border-[#E63946] text-white bg-[#0D0D0D]"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#121212]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button 
              onClick={() => {
                  setMobileMenuOpen(false);
                  localStorage.removeItem('access_token');
                  window.location.href = '/';
              }}
              className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-bold text-[#E63946] hover:bg-[#121212] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
