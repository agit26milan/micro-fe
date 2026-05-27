import type { GetServerSideProps } from 'next';

/**
 * Dynamic Sitemap Generator
 * Menghasilkan sitemap.xml secara dinamis dengan static + dynamic routes
 *
 * Pages Router pattern: pages/sitemap.xml.ts
 * URL: /sitemap.xml
 */

interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Static routes dengan prioritas SEO
const STATIC_ROUTES: SitemapEntry[] = [
  {
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  },
  {
    url: `${SITE_URL}/catalog`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/checkout`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/dashboard`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.4,
  },
];

/**
 * Generate XML sitemap
 */
function generateSitemapXml(entries: SitemapEntry[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    ${entry.lastModified ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>` : ''}
    ${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ''}
    ${entry.priority !== undefined ? `<priority>${entry.priority.toFixed(1)}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;');
}

/**
 * Fetch dynamic routes dari API (products, categories, etc.)
 */
async function fetchDynamicRoutes(): Promise<SitemapEntry[]> {
  try {
    // Contoh: fetch produk dari API
    // const products = await fetch(`${API_URL}/products?fields=slug,updatedAt`).then(r => r.json());
    // return products.map((p: any) => ({
    //   url: `${SITE_URL}/catalog/${p.slug}`,
    //   lastModified: new Date(p.updatedAt),
    //   changeFrequency: 'weekly' as const,
    //   priority: 0.7,
    // }));

    // Sementara: return empty array (API belum tersedia)
    return [];
  } catch {
    console.warn('Failed to fetch dynamic routes for sitemap');
    return [];
  }
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const dynamicRoutes = await fetchDynamicRoutes();
  const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];
  const sitemap = generateSitemapXml(allRoutes);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  // Tidak di-render sebagai komponen—hanya sebagai API endpoint XML
  return null;
}
