'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mfeName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MFEErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log ke monitoring service (Sentry, DataDog, etc.)
    console.error(`MFE "${this.props.mfeName}" gagal load:`, error, errorInfo);

    // Kirim ke error tracking
    if (typeof window !== 'undefined' && (window as any).__errorTracker) {
      (window as any).__errorTracker.captureException(error, {
        tags: { mfe: this.props.mfeName },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div role="alert" className="mfe-error p-6 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-semibold mb-2">Fitur Tidak Tersedia</h3>
            <p className="text-red-600 text-sm">
              Maaf, fitur ini sedang tidak tersedia. Silakan refresh halaman atau coba lagi nanti.
            </p>
            {this.props.mfeName && (
              <p className="text-red-400 text-xs mt-2">
                Module: {this.props.mfeName}
              </p>
            )}
          </div>
        )
      );
    }
    return this.props.children;
  }
}
