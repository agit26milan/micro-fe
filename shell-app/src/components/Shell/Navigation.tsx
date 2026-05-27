'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/checkout', label: 'Checkout' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function Navigation() {
  const router = useRouter();
  const pathname = router.pathname;

  return (
    <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
      {NAV_LINKS.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition-colors ${
              isActive
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
