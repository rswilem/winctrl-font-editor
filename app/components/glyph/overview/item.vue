<script setup lang="ts">
import { unicodeName } from 'unicode-name';

const props = defineProps<{
  glyph: CharacterGlyph;
  scale?: number;
}>();

const fontStore = useFontStore();

const locked = computed(() => props.glyph.codepoint === 0);

function selectCharacter() {
  fontStore.selectedCharacter = props.glyph;
}
</script>

<template>
  <div
    class="relative flex h-full w-full flex-col items-center border border-gray-500 bg-black hover:border-blue-500"
    :class="{
      'border !border-blue-500': fontStore.selectedCharacter === glyph,
      'border-red-700': locked
    }"
    @click="selectCharacter()"
  >
    <span
      class="flex w-full items-center justify-between bg-gray-900 px-4 py-1 text-center text-xs text-white"
      :class="{
        '!bg-blue-500': fontStore.selectedCharacter === glyph,
        '!bg-red-700': locked
      }"
    >
      <span class="font-bold">#{{ glyph.index }}</span>
      <span v-if="!locked" class="text-[10px]">{{ unicodeName(glyph.character) }}</span>
    </span>
    <GlyphPreview :glyph="glyph" :scale="props.scale" />
  </div>
</template>
