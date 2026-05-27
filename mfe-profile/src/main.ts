import { defineCustomElement } from 'vue';
import App from './App.vue';

// Register as Web Component for MFE shell
const element = defineCustomElement(App);
customElements.define('mfe-profile', element);

// Standalone bootstrap
const root = document.getElementById('app');
if (root) {
  const { createApp } = await import('vue');
  const app = createApp(App);
  app.mount(root);
}
