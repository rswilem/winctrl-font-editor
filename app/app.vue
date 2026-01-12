<script setup lang="ts">
const fontStore = useFontStore();

window.onbeforeunload = function () {
  if (!fontStore.filename?.length) {
    return undefined;
  }

  return 'All unsaved data will be lost if you leave the page, are you sure?';
};
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col bg-black">
    <Topbar />
    <GlyphOverview v-if="fontStore.filename" />
    <WelcomeView v-else />
  </div>
</template>
