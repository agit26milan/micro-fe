'use client';

import React, { useState } from 'react';
import ProductCard from '../ProductCard';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

const SAMPLE_PRODUCTS: Product[] = [
  { id: '1', name: 'Wireless Headphones', description: 'Premium noise-cancelling wireless headphones with 30h battery', price: 1250000, image: 'https://placehold.co/400x300/0066FF/FFFFFF?text=Headphones', category: 'Electronics' },
  { id: '2', name: 'Ergonomic Keyboard', description: 'Mechanical keyboard with ergonomic split design', price: 890000, image: 'https://placehold.co/400x300/FF6B35/FFFFFF?text=Keyboard', category: 'Electronics' },
  { id: '3', name: 'Running Shoes', description: 'Lightweight running shoes with responsive cushioning', price: 750000, image: 'https://placehold.co/400x300/10B981/FFFFFF?text=Shoes', category: 'Sports' },
  { id: '4', name: 'Coffee Maker', description: 'Programmable drip coffee maker with thermal carafe', price: 450000, image: 'https://placehold.co/400x300/8B5CF6/FFFFFF?text=Coffee', category: 'Home' },
  { id: '5', name: 'Backpack', description: 'Water-resistant laptop backpack with USB charging port', price: 325000, image: 'https://placehold.co/400x300/EC4899/FFFFFF?text=Backpack', category: 'Accessories' },
  { id: '6', name: 'Smart Watch', description: 'Fitness tracker with heart rate monitor and GPS', price: 2100000, image: 'https://placehold.co/400x300/0066FF/FFFFFF?text=Watch', category: 'Electronics' },
];

const CATEGORIES = ['All', 'Electronics', 'Sports', 'Home', 'Accessories'];

export default function CatalogApp() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = SAMPLE_PRODUCTS.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="catalog-app">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Catalog</h1>
        <p className="text-gray-600">React MFE — Powered by Next.js + Module Federation</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No products found matching your criteria.
        </div>
      )}
    </div>
  );
}
