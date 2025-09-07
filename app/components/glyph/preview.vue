<script setup lang="ts">
const props = defineProps<{
  glyph: CharacterGlyph;
  scale?: number;
  noBackground?: boolean;
}>();

const fontStore = useFontStore();
const height = CharacterGlyph.DATA_LENGTH / CharacterGlyph.BYTES_PER_ROW;
const canvasRef = ref<HTMLCanvasElement | null>(null);

function drawCharacter() {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set canvas size based on scale
  const scale = props.scale ?? fontStore.previewScale;
  canvas.width = CharacterGlyph.CHARACTER_WIDTH * scale;
  canvas.height = height * scale;

  const bitmap = props.glyph.bitmap;
  ctx.fillStyle = 'white';
  for (let y = 0; y < height; y++) {
    const row = bitmap[y] || [];
    for (let x = 0; x < CharacterGlyph.CHARACTER_WIDTH; x++) {
      if (row[x]) {
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
}

watch(
  [
    () => props.glyph,
    () => fontStore.previewScale,
    () => (fontStore.selectedCharacter === props.glyph ? fontStore.dataVersion : 0)
  ],
  () => {
    drawCharacter();
  },
  { immediate: true }
);

onMounted(() => {
  drawCharacter();
});
</script>

<template>
  <canvas
    ref="canvasRef"
    :width="CharacterGlyph.CHARACTER_WIDTH * 1"
    :height="(CharacterGlyph.DATA_LENGTH / CharacterGlyph.BYTES_PER_ROW) * 1"
    :class="{
      'bg-black': !props.noBackground
    }"
  />
</template>
