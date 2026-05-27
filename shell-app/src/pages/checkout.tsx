import dynamic from 'next/dynamic';
import Head from 'next/head';
import type { NextPage } from 'next';

const MFELoader = dynamic(
  () => import('@/components/MFELoader').then((mod) => mod.MFELoader),
  { ssr: false }
);

const CheckoutPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Checkout | MFE Store</title>
        <meta name="description" content="Selesaikan pembelian Anda" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <MFELoader
          webComponentTag="mfe-checkout"
          mfeName="checkout"
          props={{
            cartItems: JSON.stringify([
              { id: '1', name: 'Sample Item', price: 250000, quantity: 1 },
            ]),
            userId: 'guest-123',
          }}
        />
      </div>
    </>
  );
};

export default CheckoutPage;
