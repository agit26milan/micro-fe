<script setup lang="ts">
import { ref, computed } from 'vue';

// Props dari shell app (Web Component hanya terima string/primitif via attrs)
const props = defineProps<{
  cartItems?: string;
  userId?: string;
}>();

// Parse JSON props
const cart = computed(() => {
  try {
    return props.cartItems ? JSON.parse(props.cartItems) : [];
  } catch {
    return [];
  }
});

const cartItems = ref<any[]>(cart.value);
const shippingAddress = ref('');
const isProcessing = ref(false);
const orderComplete = ref(false);

const subtotal = computed(() => {
  return cartItems.value.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
});

const tax = computed(() => subtotal.value * 0.11);
const total = computed(() => subtotal.value + tax.value + 15000);

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const removeItem = (id: string) => {
  cartItems.value = cartItems.value.filter((item: any) => item.id !== id);
};

const placeOrder = () => {
  isProcessing.value = true;
  // Simulate API call
  setTimeout(() => {
    isProcessing.value = false;
    orderComplete.value = true;

    // Emit event ke shell via CustomEvent
    window.dispatchEvent(new CustomEvent('mfe:checkout:completed', {
      detail: {
        source: 'mfe_vue',
        payload: { orderId: 'ORD-' + Date.now(), total: total.value },
        timestamp: Date.now(),
      },
      bubbles: true,
    }));
  }, 1500);
};
</script>

<template>
  <div class="checkout-app">
    <div v-if="orderComplete" class="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
      <div class="text-4xl mb-4">✓</div>
      <h2 class="text-xl font-bold text-green-800 mb-2">Order Complete!</h2>
      <p class="text-green-600">Thank you for your purchase. Your order has been placed.</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Cart Items -->
      <div class="lg:col-span-2 space-y-4">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Shopping Cart</h2>

        <div v-for="item in cartItems" :key="item.id"
          class="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <div class="flex-1">
            <h3 class="font-medium text-gray-900">{{ item.name }}</h3>
            <p class="text-sm text-gray-500">Qty: {{ item.quantity }}</p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-gray-900">{{ formatPrice(item.price * item.quantity) }}</p>
            <button @click="removeItem(item.id)"
              class="text-sm text-red-500 hover:text-red-700 mt-1">
              Remove
            </button>
          </div>
        </div>

        <!-- Shipping Address -->
        <div class="mt-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
          <textarea
            v-model="shippingAddress"
            placeholder="Enter your shipping address..."
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 h-fit">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Subtotal</span>
            <span class="font-medium">{{ formatPrice(subtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Tax (11%)</span>
            <span class="font-medium">{{ formatPrice(tax) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Shipping</span>
            <span class="font-medium">{{ formatPrice(15000) }}</span>
          </div>
          <div class="border-t pt-3 flex justify-between">
            <span class="font-semibold text-gray-900">Total</span>
            <span class="font-bold text-lg text-blue-600">{{ formatPrice(total) }}</span>
          </div>
        </div>

        <button @click="placeOrder"
          :disabled="isProcessing || cartItems.length === 0"
          class="w-full mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {{ isProcessing ? 'Processing...' : 'Place Order' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Style encapsulated dalam Shadow DOM — gunakan CSS variables dari shell */
.checkout-app {
  font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  color: var(--color-text, #1A1A2E);
}
</style>
