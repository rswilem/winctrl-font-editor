<script setup lang="ts">
const fontStore = useFontStore();

const locked = computed(() => (fontStore.selectedCharacter?.codepoint ?? 0) === 0);
</script>

<template>
  <div class="flex h-full w-full grow">
    <div class="grid h-full max-h-[calc(100vh-48px)] w-[30%] shrink-0 grid-cols-3 gap-1 overflow-y-scroll">
      <GlyphOverviewItem v-for="(character, index) in fontStore.characters" :key="index" :glyph="character" />
    </div>

    <div class="flex h-full w-full grow flex-col items-center justify-center bg-black">
      <div
        v-if="fontStore.selectedCharacter && locked"
        class="m-16 flex w-full max-w-2xl flex-col gap-4 rounded-lg bg-gray-300 p-8 text-black"
      >
        <span class="text-lg font-bold">Character locked</span>
        <span
          >This character is locked and cannot be edited. These characters occur at the end of the font chain and
          contain data.</span
        >
        <span class="font-mono text-sm">Character index: {{ fontStore.selectedCharacter?.index }}</span>
        <span class="font-mono text-sm">Codepoint: 0x{{ fontStore.selectedCharacter?.codepoint }}</span>
      </div>
      <GlyphEditor v-if="fontStore.selectedCharacter && !locked" />
    </div>
  </div>
</template>
