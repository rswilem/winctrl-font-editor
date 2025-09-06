<script setup lang="ts">
const fontStore = useFontStore();
</script>

<template>
  <div class="flex h-full w-full grow">
    <div class="grid h-full max-h-[calc(100vh-48px)] min-w-2xs grid-cols-3 gap-1 overflow-y-scroll">
      <GlyphOverviewItem v-for="(character, index) in fontStore.characters" :key="index" :info="character" />
    </div>

    <GlyphEditor />
  </div>
</template>
