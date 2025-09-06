<script setup lang="ts">
const props = defineProps<{
  text: string;
  scale?: number;
  spacing?: number;
}>();

const fontStore = useFontStore();

function findCharacter(char: string): CharacterInfo | null {
  return fontStore.characters.find((c) => String.fromCharCode(c.codepoint) === char) ?? null;
}
</script>

<template>
  <div v-if="fontStore.selectedCharacter" class="flex">
    <GlyphOverviewItem
      v-for="(char, index) in text"
      :key="index"
      :info="findCharacter(char) ?? fontStore.selectedCharacter"
      :scale="props.scale"
      :hideLabel="true"
      :style="{
        marginRight: index < text.length - 1 ? (props.spacing ?? 1) + 'px' : '0'
      }"
    />
  </div>
</template>
