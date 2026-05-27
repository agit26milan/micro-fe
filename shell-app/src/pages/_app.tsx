import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import '../styles/globals.css';
import Header from '@/components/Shell/Header';
import Footer from '@/components/Shell/Footer';
import Head from 'next/head';
import { prefetchCriticalMFEs } from '@/lib/mfe-loader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function App({ Component, pageProps }: AppProps) {
  // Prefetch critical MFE assets saat browser idle
  useEffect(() => {
    prefetchCriticalMFEs();
  }, []);

  return (
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <main className="flex-1">
        <Component {...pageProps} />
      </main>
      <Footer />
    </div>
  );
}
