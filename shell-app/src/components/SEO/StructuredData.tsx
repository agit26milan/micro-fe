import React from 'react';

interface StructuredDataProps {
  data: Record<string, unknown>;
}

/**
 * JSON-LD Structured Data component
 * Inject schema.org structured data ke halaman untuk SEO
 *
 * @example
 * ```tsx
 * <StructuredData
 *   data={{
 *     '@context': 'https://schema.org',
 *     '@type': 'Product',
 *     name: 'Product Name',
 *   }}
 * />
 * ```
 */
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Product structured data (schema.org/Product)
 */
export function ProductStructuredData({
  name,
  description,
  image,
  sku,
  price,
  currency = 'IDR',
  availability = 'InStock',
}: {
  name: string;
  description: string;
  image: string;
  sku: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
}) {
  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        description,
        image,
        sku,
        offers: {
          '@type': 'Offer',
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          price,
          priceCurrency: currency,
          availability: `https://schema.org/${availability}`,
        },
      }}
    />
  );
}

/**
 * BreadcrumbList structured data (schema.org/BreadcrumbList)
 */
export function BreadcrumbStructuredData({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

/**
 * Organization structured data (schema.org/Organization)
 */
export function OrganizationStructuredData({
  name,
  url,
  logo,
}: {
  name: string;
  url: string;
  logo?: string;
}) {
  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
        ...(logo ? { logo } : {}),
      }}
    />
  );
}

/**
 * WebSite structured data (schema.org/WebSite)
 * Untuk search action (Sitelinks Search Box)
 */
export function WebSiteStructuredData({
  name,
  url,
  searchUrl,
}: {
  name: string;
  url: string;
  searchUrl?: string;
}) {
  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name,
        url,
        ...(searchUrl
          ? {
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: searchUrl,
                },
                'query-input': 'required name=search_term_string',
              },
            }
          : {}),
      }}
    />
  );
}
