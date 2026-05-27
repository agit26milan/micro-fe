import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">
              <span className="text-blue-600">MFE</span> Store
            </h3>
            <p className="text-sm text-gray-600">
              Micro Frontend demo with Next.js Shell + React, Vue & Angular remotes.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3 uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-gray-600 hover:text-gray-900">Home</Link></li>
              <li><Link href="/catalog" className="text-sm text-gray-600 hover:text-gray-900">Catalog</Link></li>
              <li><Link href="/checkout" className="text-sm text-gray-600 hover:text-gray-900">Checkout</Link></li>
              <li><Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link></li>
            </ul>
          </div>

          {/* Tech */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3 uppercase tracking-wider">
              Tech Stack
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Shell: Next.js (SSR)</li>
              <li>Catalog: React MFE</li>
              <li>Checkout: Vue MFE</li>
              <li>Dashboard: Angular MFE</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} MFE Store. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
