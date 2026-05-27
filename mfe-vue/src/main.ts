import { defineCustomElement } from 'vue';
import CheckoutApp from './components/CheckoutApp.ce.vue';

// Register sebagai Web Component
const CheckoutElement = defineCustomElement(CheckoutApp);
customElements.define('mfe-checkout', CheckoutElement);
