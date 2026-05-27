'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { MFEErrorBoundary } from './ErrorBoundary';
import Skeleton from './Skeleton';
import { loadMFE, loadReactMFE, MFE_REGISTRY } from '@/lib/mfe-loader';

interface MFELoaderProps {
  // Untuk React MFE (Module Federation)
  modulePath?: string;
  // Untuk Vue/Angular MFE (Web Components)
  webComponentTag?: string;
  // Props yang diteruskan ke MFE
  props?: Record<string, unknown>;
  // Fallback saat loading
  skeleton?: React.ReactNode;
  // Error fallback
  errorFallback?: React.ReactNode;
  // Nama MFE untuk error tracking (wajib untuk React MFE via Module Federation)
  mfeName?: string;
  // SSR: apakah perlu di-render server-side
  ssr?: boolean;
}

// Loader untuk React-based MFE via Module Federation runtime API
const ReactMFELoader = ({ mfeName, props = {} }: { mfeName: string; props: Record<string, unknown> }) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadReactMFE<{ default: React.ComponentType<any> }>(mfeName)
      .then((mod: { default: React.ComponentType<any> }) => {
        if (cancelled) return;
        setComponent(() => mod.default || mod);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [mfeName]);

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-medium">Failed to load {mfeName}</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (loading) {
    return <Skeleton />;
  }

  if (!Component) return null;

  return <Component {...props} />;
};

// Loader untuk Web Component (Vue/Angular)
const WebComponentLoader = ({ tag, mfeName, props = {} }: { tag: string; mfeName?: string; props: Record<string, unknown> }) => {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mfeName) {
      // If no mfeName provided, assume custom element is already registered
      setReady(true);
      return;
    }

    loadMFE(mfeName)
      .then(() => setReady(true))
      .catch((err) => setError(err.message));
  }, [mfeName]);

  useEffect(() => {
    if (!ref.current || !ready) return;
    // Teruskan props sebagai attributes/properties
    Object.entries(props).forEach(([key, value]) => {
      if (typeof value === 'object') {
        (ref.current as any)[key] = value;
      } else {
        ref.current!.setAttribute(key, String(value));
      }
    });
  }, [props, ready]);

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-medium">Failed to load {mfeName ?? tag}</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!ready) return null;

  return React.createElement(tag, { ref });
};

export const MFELoader: React.FC<MFELoaderProps> = ({
  modulePath,
  webComponentTag,
  props = {},
  skeleton = <Skeleton />,
  errorFallback,
  mfeName,
  ssr = false,
}) => {
  const content = modulePath && mfeName ? (
    <ReactMFELoader mfeName={mfeName} props={props} />
  ) : webComponentTag ? (
    <WebComponentLoader tag={webComponentTag} mfeName={mfeName} props={props} />
  ) : null;

  // Skip SSR untuk non-critical MFEs
  if (!ssr && typeof window === 'undefined') {
    return <>{skeleton}</>;
  }

  return (
    <MFEErrorBoundary fallback={errorFallback} mfeName={mfeName}>
      <Suspense fallback={skeleton}>{content}</Suspense>
    </MFEErrorBoundary>
  );
};
