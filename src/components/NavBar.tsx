import { motion } from 'framer-motion';
import Link from 'next/link';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';

/**
 * Mobile‑first sticky navigation bar.
 * Visible on screens smaller than `md`. On larger screens the regular header
 * (defined in `src/app/layout.tsx`) remains.
 */
export default function NavBar() {
  const navItems = [
    { href: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { href: '/catalog', label: 'Catalog', icon: <ShoppingBag className="w-5 h-5" /> },
    { href: '/cart', label: 'Cart', icon: <ShoppingCart className="w-5 h-5" /> },
    { href: '/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 inset-x-0 z-50 bg-slate-900/90 backdrop-blur-md border-t border-gold/10 md:hidden"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <ul className="flex justify-between items-center px-4 py-2 text-slate-300">
        {navItems.map((item) => (
          <li key={item.href} className="flex-1 text-center">
            <Link href={item.href} className="flex flex-col items-center gap-1 hover:text-gold transition-colors">
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}
