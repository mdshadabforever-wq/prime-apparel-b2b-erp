"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingCart } from 'lucide-react';

/**
 * Mobile‑first top navigation bar.
 * Visible on screens smaller than `md`.
 */
export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-gold/10 md:hidden h-16 flex items-center justify-between px-4">
      <Link href="/" className="text-white font-bold text-xl tracking-tight">
        LOGO
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/cart" className="text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ShoppingCart className="w-6 h-6" />
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 top-16 bg-black/50 backdrop-blur-sm transition-opacity z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-16 right-0 h-[calc(100vh-64px)] w-64 bg-slate-900 border-l border-gold/10 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-end p-2">
          <button onClick={() => setIsOpen(false)} className="text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
        <ul className="flex flex-col p-4 gap-2" role="menu">
          {['Home', 'Catalog', 'Register B2B', 'Login', 'Dashboard'].map((item) => (
            <li key={item} role="none">
              <Link 
                href={item === 'Home' ? '/' : item === 'Dashboard' ? '/admin' : `/${item.toLowerCase().replace(' ', '-')}`}
                className="block py-4 text-white text-lg font-medium hover:text-gold transition-colors"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                {item}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
