import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="id" className="h-full">
      <Head>
        {/* Prefetch critical MFE assets — HARUS pakai prefetch, BUKAN modulepreload!
         * remoteEntry.js adalah regular webpack bundle, BUKAN ES module.
         * modulepreload akan menyebabkannya di-cache sebagai module dan gagal di-load
         * oleh Module Federation runtime yang menggunakan <script> tag biasa. */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <link
              rel="prefetch"
              href="http://localhost:3001/_next/static/chunks/remoteEntry.js"
              as="script"
            />
            <link
              rel="prefetch"
              href="http://localhost:3002/remoteEntry.js"
              as="script"
            />
            <link
              rel="prefetch"
              href="http://localhost:3003/remoteEntry.js"
              as="script"
            />
          </>
        )}
      </Head>
      <body className="min-h-full flex flex-col antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
