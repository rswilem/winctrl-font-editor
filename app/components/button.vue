<script setup lang="ts">
defineProps<{
  as?: string;
  primary?: boolean;
  small?: boolean;
}>();
</script>
<template>
  <component
    :is="as || 'button'"
    class="block cursor-pointer font-bold text-white select-none"
    :class="{
      'bg-primary-500 hover:bg-primary-700': primary,
      'bg-gray-700 hover:bg-gray-700': !primary,
      'rounded-md px-1 py-0.5 text-xs': small,
      'rounded-lg px-2 py-1 text-sm': !small
    }"
  >
    <slot />
  </component>
</template>
