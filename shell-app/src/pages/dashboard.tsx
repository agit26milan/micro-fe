import dynamic from 'next/dynamic';
import Head from 'next/head';
import type { NextPage } from 'next';

const MFELoader = dynamic(
  () => import('@/components/MFELoader').then((mod) => mod.MFELoader),
  { ssr: false }
);

const DashboardPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Dashboard | MFE Store</title>
        <meta name="description" content="Admin dashboard" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <MFELoader
          webComponentTag="mfe-dashboard"
          mfeName="dashboard"
          props={{
            userId: 'admin-001',
            theme: 'light',
          }}
        />
      </div>
    </>
  );
};

export default DashboardPage;
