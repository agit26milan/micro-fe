import dynamic from 'next/dynamic';
import Head from 'next/head';
import type { NextPage } from 'next';

const MFELoader = dynamic(
  () => import('@/components/MFELoader').then((mod) => mod.MFELoader),
  { ssr: false }
);

const CatalogPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Catalog | MFE Store</title>
        <meta name="description" content="Jelajahi katalog produk kami" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <MFELoader
          modulePath="mfe_react/CatalogApp"
          ssr={false}
          mfeName="catalog"
        />
      </div>
    </>
  );
};

export default CatalogPage;
