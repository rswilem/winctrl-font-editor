<script setup lang="ts">
const fontStore = useFontStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const previewText = ref('INIT REF');
const previewSpacing = ref(1);
const showGrid = ref(true);
const height = computed(() => {
  const bitmapHeight = fontStore.selectedCharacter?.bitmap?.length ?? 0;
  return bitmapHeight;
});
const hoverPixel = ref<{ x: number; y: number } | null>(null);
const isDrawing = ref(false);
const isDragging = ref(false);
const drawMode = ref<boolean>(true); // true = drawing on, false = drawing off
const hasDrawnDuringDrag = ref(false);

let lastDrawnPixel: { x: number; y: number } | null = null;

function getGlyphScaleAndOffset(canvas: HTMLCanvasElement) {
  const glyphWidth = CharacterInfo.CHARACTER_WIDTH;
  const glyphHeight = height.value;
  const scale = Math.min(canvas.width / glyphWidth, canvas.height / glyphHeight);
  const offsetX = (canvas.width - glyphWidth * scale) / 2;
  const offsetY = (canvas.height - glyphHeight * scale) / 2;
  return { scale, offsetX, offsetY };
}

function togglePixelAtEvent(e: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const { scale, offsetX, offsetY } = getGlyphScaleAndOffset(canvas);
  const glyphX = Math.floor((x - offsetX) / scale);
  const glyphY = Math.floor((y - offsetY) / scale);
  if (glyphX >= 0 && glyphX < CharacterInfo.CHARACTER_WIDTH && glyphY >= 0 && glyphY < height.value) {
    const char = fontStore.selectedCharacter;
    if (char) {
      const currentValue = char.bitmap[glyphY]?.[glyphX] ?? false;
      char.setPixel(glyphX, glyphY, !currentValue);
      drawCharacter();
    }
  }
}

function toggleAllPixels() {
  const char = fontStore.selectedCharacter;
  if (!char) {
    return;
  }

  // Check if any pixel is currently on to determine toggle direction
  const bitmap = char.bitmap;
  let hasOnPixel = false;

  for (let y = 0; y < height.value; y++) {
    const row = bitmap[y] || [];
    for (let x = 0; x < CharacterInfo.CHARACTER_WIDTH; x++) {
      if (row[x]) {
        hasOnPixel = true;
        break;
      }
    }
    if (hasOnPixel) break;
  }

  // If any pixel is on, turn all off (00). If all are off, turn all on (FF)
  const newValue = !hasOnPixel;

  for (let y = 0; y < height.value; y++) {
    for (let x = 0; x < CharacterInfo.CHARACTER_WIDTH; x++) {
      char.setPixel(x, y, newValue);
    }
  }

  drawCharacter();
}

function handleCanvasClick(e: MouseEvent) {
  if (!hasDrawnDuringDrag.value) {
    togglePixelAtEvent(e);
  }
}

function handleCanvasMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;

  isDrawing.value = true;
  isDragging.value = false;
  hasDrawnDuringDrag.value = false;

  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const { scale, offsetX, offsetY } = getGlyphScaleAndOffset(canvas);
  const glyphX = Math.floor((x - offsetX) / scale);
  const glyphY = Math.floor((y - offsetY) / scale);

  if (glyphX >= 0 && glyphX < CharacterInfo.CHARACTER_WIDTH && glyphY >= 0 && glyphY < height.value) {
    const char = fontStore.selectedCharacter;
    if (char) {
      // Determine draw mode based on current pixel state
      const currentValue = char.bitmap[glyphY]?.[glyphX] ?? false;
      drawMode.value = !currentValue; // If pixel is off, we'll draw on; if on, we'll draw off
    }
    lastDrawnPixel = { x: glyphX, y: glyphY };
  }
}
function handleCanvasMouseUp(e: MouseEvent) {
  if (e.button !== 0) return;

  isDrawing.value = false;
  lastDrawnPixel = null;

  setTimeout(() => {
    isDragging.value = false;
  }, 0);
}

function drawAtEvent(e: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const { scale, offsetX, offsetY } = getGlyphScaleAndOffset(canvas);
  const glyphX = Math.floor((x - offsetX) / scale);
  const glyphY = Math.floor((y - offsetY) / scale);

  if (glyphX >= 0 && glyphX < CharacterInfo.CHARACTER_WIDTH && glyphY >= 0 && glyphY < height.value) {
    const char = fontStore.selectedCharacter;
    if (char) {
      if (lastDrawnPixel && (lastDrawnPixel.x !== glyphX || lastDrawnPixel.y !== glyphY)) {
        isDragging.value = true;
        hasDrawnDuringDrag.value = true;
        drawLine(lastDrawnPixel.x, lastDrawnPixel.y, glyphX, glyphY, (x, y) => {
          char.setPixel(x, y, drawMode.value);
        });
        lastDrawnPixel = { x: glyphX, y: glyphY };
        drawCharacter();
      }
    }
  }
}
function handleCanvasMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const { scale, offsetX, offsetY } = getGlyphScaleAndOffset(canvas);
  const glyphX = Math.floor((x - offsetX) / scale);
  const glyphY = Math.floor((y - offsetY) / scale);

  // Only set hover pixel if within valid glyph bounds
  if (glyphX >= 0 && glyphX < CharacterInfo.CHARACTER_WIDTH && glyphY >= 0 && glyphY < height.value) {
    hoverPixel.value = { x: glyphX, y: glyphY };
    if (isDrawing.value) {
      drawAtEvent(e);
    }
  } else {
    hoverPixel.value = null;
  }
  drawCharacter();
}

function handleCanvasMouseLeave() {
  hoverPixel.value = null;
  isDrawing.value = false;
  isDragging.value = false;
  hasDrawnDuringDrag.value = false;
  lastDrawnPixel = null;
  drawCharacter();
}

function drawLine(x0: number, y0: number, x1: number, y1: number, set: (x: number, y: number) => void) {
  let dx = Math.abs(x1 - x0),
    sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0),
    sy = y0 < y1 ? 1 : -1;
  let err = dx + dy,
    e2;

  while (true) {
    set(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function drawCharacter() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.parentElement?.getBoundingClientRect();
  const displayWidth = rect ? Math.floor(rect.width) : 1;
  const displayHeight = rect ? Math.floor(rect.height) : 1;
  canvas.width = displayWidth;
  canvas.height = displayHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { scale, offsetX, offsetY } = getGlyphScaleAndOffset(canvas);

  ctx.strokeStyle = 'gray';
  ctx.lineWidth = 1;
  ctx.strokeRect(offsetX, offsetY, CharacterInfo.CHARACTER_WIDTH * scale, height.value * scale);

  if (showGrid.value) {
    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    ctx.lineWidth = 0.5;
    for (let y = 1; y < height.value; y++) {
      const lineY = offsetY + y * scale;
      ctx.beginPath();
      ctx.moveTo(offsetX, lineY);
      ctx.lineTo(offsetX + CharacterInfo.CHARACTER_WIDTH * scale, lineY);
      ctx.stroke();
    }

    // Draw vertical grid lines
    for (let x = 1; x < CharacterInfo.CHARACTER_WIDTH; x++) {
      const lineX = offsetX + x * scale;
      ctx.beginPath();
      ctx.moveTo(lineX, offsetY);
      ctx.lineTo(lineX, offsetY + height.value * scale);
      ctx.stroke();
    }
  }

  const bitmap = fontStore.selectedCharacter?.bitmap ?? [[]];
  ctx.fillStyle = 'white';

  for (let y = 0; y < height.value; y++) {
    const row = bitmap[y] || [];
    for (let x = 0; x < CharacterInfo.CHARACTER_WIDTH; x++) {
      if (row[x]) {
        ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
      }
    }
  }

  if (
    hoverPixel.value &&
    hoverPixel.value.x >= 0 &&
    hoverPixel.value.x < CharacterInfo.CHARACTER_WIDTH &&
    hoverPixel.value.y >= 0 &&
    hoverPixel.value.y < height.value
  ) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'gray';
    const hoverY = offsetY + hoverPixel.value.y * scale;
    ctx.fillRect(offsetX + hoverPixel.value.x * scale, hoverY, scale, scale);
    ctx.restore();
  }
}

function undoAllChanges() {
  fontStore.selectedCharacter?.resetBitmap();
  drawCharacter();
}

watch(
  [() => fontStore.selectedCharacter, () => fontStore.dataVersion],
  () => {
    drawCharacter();
  },
  { immediate: true }
);

watch([() => showGrid.value, () => previewText.value], () => {
  localStorage.setItem('glyphEditorShowGrid', showGrid.value ? '1' : '0');
  localStorage.setItem('glyphEditorPreviewText', previewText.value);
  localStorage.setItem('glyphEditorPreviewSpacing', previewSpacing.value.toString());
});

onMounted(() => {
  const storedShowGrid = localStorage.getItem('glyphEditorShowGrid');
  if (storedShowGrid !== null) {
    showGrid.value = storedShowGrid === '1';
  }

  const storedPreviewText = localStorage.getItem('glyphEditorPreviewText');
  if (storedPreviewText !== null) {
    previewText.value = storedPreviewText;
  }

  const storedPreviewSpacing = localStorage.getItem('glyphEditorPreviewSpacing');
  if (storedPreviewSpacing !== null) {
    const spacing = parseInt(storedPreviewSpacing, 10);
    if (!isNaN(spacing)) {
      previewSpacing.value = spacing;
    }
  }

  drawCharacter();
});
</script>

<template>
  <div class="flex h-full grow flex-col bg-black">
    <div v-if="fontStore.selectedCharacter" class="flex">
      <div class="h-[70vh] w-full">
        <canvas
          ref="canvasRef"
          class="block h-full w-full"
          @click="handleCanvasClick"
          @mousedown="handleCanvasMouseDown"
          @mouseup="handleCanvasMouseUp"
          @mouseleave="handleCanvasMouseLeave"
          @mousemove="handleCanvasMouseMove"
          @contextmenu.prevent
        />
      </div>
      <div class="flex h-full grow flex-col">
        <GlyphOverviewItem hide-label :info="fontStore.selectedCharacter" :scale="6" />
        <GlyphOverviewItem hide-label :info="fontStore.selectedCharacter" :scale="5" />
        <GlyphOverviewItem hide-label :info="fontStore.selectedCharacter" :scale="4" />
        <GlyphOverviewItem hide-label :info="fontStore.selectedCharacter" :scale="3" />
        <GlyphOverviewItem hide-label :info="fontStore.selectedCharacter" :scale="2" />
      </div>
    </div>

    <div v-if="fontStore.selectedCharacter" class="flex gap-8 p-4 text-white">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <input v-model="showGrid" type="checkbox" name="showGrid" id="showGrid" @change="drawCharacter()" />
          <label for="showGrid">Show grid</label>
        </div>

        <input
          type="text"
          v-model="previewText"
          placeholder="Preview text"
          class="rounded-lg border border-gray-500 bg-black px-2 py-1 text-white"
        />

        <div class="rounded-lg border border-gray-500 bg-white">
          <input type="range" v-model.number="previewSpacing" min="-20" max="20" class="w-full" placeholder="Spacing" />
        </div>

        <Button @click="toggleAllPixels()">Toggle all pixels</Button>
        <Button @click="undoAllChanges()">Undo all changes</Button>
      </div>

      <div class="flex flex-col gap-4">
        <GlyphOverviewSentence :text="previewText" :scale="2" :spacing="previewSpacing" />
        <GlyphOverviewSentence :text="previewText" :scale="1" :spacing="previewSpacing" />
      </div>
    </div>
  </div>
</template>
