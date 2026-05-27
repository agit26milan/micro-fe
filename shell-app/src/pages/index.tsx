import Head from 'next/head';
import Link from 'next/link';
import type { GetStaticProps, NextPage } from 'next';
import type { SSRPageProps } from '@/lib/ssr';
import { BASE_SEO } from '@/lib/ssr';
import { OrganizationStructuredData, WebSiteStructuredData } from '@/components/SEO/StructuredData';

// ISR (Incremental Static Regeneration)
// Landing page di-render statis, revalidate tiap 1 jam
export const getStaticProps: GetStaticProps<SSRPageProps> = async () => {
  return {
    props: {
      data: null,
      seo: {
        ...BASE_SEO,
        title: 'MFE Store — Micro Frontend Demo',
        description:
          'Micro Frontend demo — Next.js Shell dengan React, Vue & Angular remotes',
      },
      timestamp: Date.now(),
    },
    revalidate: 3600, // ISR: regenerate setiap 1 jam
  };
};

const Home: NextPage<SSRPageProps> = ({ seo }) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return (
    <>
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MFE Store" />
        <link rel="canonical" href={siteUrl} />
      </Head>

      {/* Structured Data */}
      <OrganizationStructuredData
        name="MFE Store"
        url={siteUrl}
      />
      <WebSiteStructuredData
        name="MFE Store"
        url={siteUrl}
        searchUrl={`${siteUrl}/catalog?search={search_term_string}`}
      />

      <div className="flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full bg-gradient-to-b from-blue-50 to-white py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Micro Frontend
              <span className="text-blue-600"> Store</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Seamless shopping experience powered by Next.js, React, Vue & Angular
              — all working together through Module Federation.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/catalog"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Catalog
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Dashboard
              </Link>
               <Link
                href="/profile"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Profile
              </Link>
            </div>
          </div>
        </section>

        {/* Tech Stack Grid */}
        <section className="w-full py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
              Architecture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Shell (Host)',
                  tech: 'Next.js 15',
                  desc: 'SSR, routing, layout, auth — the orchestration layer',
                  color: 'bg-black text-white',
                },
                {
                  title: 'Catalog MFE',
                  tech: 'React 18',
                  desc: 'Product listing with SSR support via Module Federation',
                  color: 'bg-blue-500 text-white',
                },
                {
                  title: 'Checkout MFE',
                  tech: 'Vue 3',
                  desc: 'Checkout flow as a Web Component with Shadow DOM',
                  color: 'bg-green-500 text-white',
                },
                {
                  title: 'Dashboard MFE',
                  tech: 'Angular 17',
                  desc: 'Admin dashboard via Angular Elements (custom elements)',
                  color: 'bg-red-500 text-white',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`p-4 ${item.color} font-semibold text-sm`}>
                    {item.tech}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="w-full py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  title: 'SSR-Ready',
                  desc: 'Server-side rendering for SEO-critical pages. Streaming SSR with Suspense.',
                },
                {
                  title: 'Multi-Framework',
                  desc: 'React, Vue & Angular coexist through Module Federation and Web Components.',
                },
                {
                  title: 'Fault Isolation',
                  desc: 'Error boundaries per MFE. One failing app does not crash the entire page.',
                },
              ].map((feature) => (
                <div key={feature.title} className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
