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
        <title>Profile</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <MFELoader
          webComponentTag="mfe-profile"
          mfeName="profile"
          props={{
            title: 'User Profile'
          }}
        />
      </div>
    </>
  );
};

export default DashboardPage;
