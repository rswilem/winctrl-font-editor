<script setup lang="ts">
const props = defineProps<{
  text: string;
  scale?: number;
  spacing?: number;
  smallFont?: boolean;
}>();

const fontStore = useFontStore();

function findCharacter(char: string): CharacterGlyph | null {
  return (
    fontStore.characters.find(
      (c) =>
        String.fromCharCode(c.codepoint) === char &&
        c.index > (props.smallFont ? CharacterGlyph.SMALL_FONT_START_INDEX : 0)
    ) ?? null
  );
}
</script>

<template>
  <div v-if="fontStore.selectedCharacter" class="flex">
    <GlyphPreview
      v-for="(char, index) in text"
      :key="index"
      no-background
      :glyph="findCharacter(char) ?? fontStore.selectedCharacter"
      :scale="props.scale"
      :style="{
        marginRight: index < text.length - 1 ? (props.spacing ?? 1) + 'px' : '0'
      }"
    />
  </div>
</template>
