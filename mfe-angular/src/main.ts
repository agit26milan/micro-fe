import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { DashboardComponent } from './app/dashboard/dashboard.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { isDevMode } from '@angular/core';

(async () => {
  const app = await createApplication({
    providers: [
      provideRouter([]),
      provideHttpClient(),
    ],
  });

  // Register Dashboard sebagai Custom Element
  const DashboardElement = createCustomElement(DashboardComponent, {
    injector: app.injector,
  });

  customElements.define('mfe-dashboard', DashboardElement);

  // Dual-mode bootstrap:
  // - Saat standalone (ng serve): index.html memiliki <app-root> → bootstrap normal
  // - Saat di-load sebagai MFE oleh shell: tidak ada <app-root> → hanya register custom element
  if (isDevMode() && document.querySelector('app-root')) {
    const { bootstrapApplication } = await import('@angular/platform-browser');
    const { App } = await import('./app/app');
    const { appConfig } = await import('./app/app.config');
    bootstrapApplication(App, appConfig).catch((err) => console.error(err));
  }
})();
