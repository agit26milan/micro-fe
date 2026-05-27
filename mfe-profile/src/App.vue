<script setup lang="ts">
const props = defineProps<{
  title?: string;
}>();
</script>

<template>
  <div class="mfe-profile-app">
    <h1>{{ title || 'Mfe Profile MFE' }}</h1>
    <p>Vue 3 Micro Frontend — loaded as Web Component</p>
  </div>
</template>

<style scoped>
.mfe-profile-app {
  font-family: var(--font-sans, system-ui);
  color: var(--color-text, #111);
  padding: 1rem;
}
</style>