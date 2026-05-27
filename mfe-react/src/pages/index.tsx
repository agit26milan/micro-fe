import Head from 'next/head';
import dynamic from 'next/dynamic';
import type { GetServerSideProps } from 'next';

const CatalogApp = dynamic(() => import('@/components/CatalogApp'), { ssr: false });

// Gunakan SSR (getServerSideProps) agar Next.js tidak melakukan static generation.
// Static generation gagal karena Module Federation share scope belum tersedia
// di server-side build, menyebabkan:
// "TypeError: Cannot read properties of null (reading 'useContext')"
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function Home() {
  return (
    <>
      <Head>
        <title>Catalog MFE — React</title>
        <meta name="description" content="React Micro Frontend — Catalog App" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <CatalogApp />
        </div>
      </div>
    </>
  );
}
