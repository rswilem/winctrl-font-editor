<script setup lang="ts">
const props = defineProps<{
  info: CharacterInfo;
  scale?: number;
  hideLabel?: boolean;
}>();

const fontStore = useFontStore();
const height = CharacterInfo.DATA_LENGTH / CharacterInfo.BYTES_PER_ROW;
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
  canvas.width = CharacterInfo.CHARACTER_WIDTH * scale;
  canvas.height = height * scale;

  const bitmap = props.info.bitmap;
  ctx.fillStyle = 'white';
  for (let y = 0; y < height; y++) {
    const row = bitmap[y] || [];
    for (let x = 0; x < CharacterInfo.CHARACTER_WIDTH; x++) {
      if (row[x]) {
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
}

function selectCharacter() {
  fontStore.selectedCharacter = props.info;
}

watch(
  [
    () => props.info,
    () => fontStore.previewScale,
    () => (fontStore.selectedCharacter === props.info ? fontStore.dataVersion : 0)
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
  <div
    class="relative flex h-full w-full flex-col items-center bg-black"
    :class="{
      'border border-gray-500 hover:border-blue-500': !hideLabel,
      'border !border-blue-500': fontStore.selectedCharacter === info && !hideLabel
    }"
    @click="selectCharacter()"
  >
    <span
      v-if="!hideLabel"
      class="w-full bg-gray-500 text-center text-xs"
      :class="{
        '!bg-blue-500': fontStore.selectedCharacter === info,
        '!bg-red-500': info.codepoint === 0
      }"
    >
      {{ info.character }} - 0x{{ info.character.charCodeAt(0).toString(16).toUpperCase() }} - {{ info.index }}
    </span>
    <canvas
      ref="canvasRef"
      :width="CharacterInfo.CHARACTER_WIDTH * 1"
      :height="(CharacterInfo.DATA_LENGTH / CharacterInfo.BYTES_PER_ROW) * 1"
      class="bg-black"
    />
  </div>
</template>
