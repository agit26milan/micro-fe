import React from 'react';

interface CartAppProps {
  title?: string;
}

const CartApp: React.FC<CartAppProps> = ({ title }) => {
  return (
    <div className="cart-app">
      <h1>{title || 'Cart MFE'}</h1>
      <p>Next.js Micro Frontend — powered by Module Federation</p>
      <style jsx>{`
        .cart-app {
          font-family: var(--font-sans, system-ui);
          color: var(--color-text, #111);
          padding: 1rem;
        }
      `}</style>
    </div>
  );
};

export default CartApp;
