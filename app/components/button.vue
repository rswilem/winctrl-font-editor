<script setup lang="ts">
defineProps<{
  as?: string;
  small?: boolean;
}>();
</script>
<template>
  <component
    :is="as || 'button'"
    class="bg-primary-500 hover:bg-primary-700 block cursor-pointer font-bold text-white select-none"
    :class="{
      'rounded-md px-1 py-0.5 text-xs': small,
      'rounded-lg px-2 py-1 text-sm': !small
    }"
  >
    <slot />
  </component>
</template>
