import dynamic from 'next/dynamic';
import Head from 'next/head';
import type { NextPage } from 'next';

const MFELoader = dynamic(
  () => import('@/components/MFELoader').then((mod) => mod.MFELoader),
  { ssr: false }
);

const CartPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Catalog | MFE Store</title>
        <meta name="description" content="Jelajahi katalog produk kami" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <MFELoader
          modulePath="cart/CartApp"
          ssr={false}
          mfeName="cart"
        />
      </div>
    </>
  );
};

export default CartPage;
