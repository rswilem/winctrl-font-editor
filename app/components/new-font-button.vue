<script setup lang="ts">
import opentype, { Font } from 'opentype.js';

defineProps<{
  primary?: boolean;
}>();

const fontStore = useFontStore();

async function handleFontFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) {
    return;
  }

  const file = input.files[0];
  if (!file) {
    return;
  }

  const font: Font = opentype.parse(await file.arrayBuffer());

  if (!font) {
    alert('Failed to load font');
    return;
  }

  const data = await fetch('/default_font.hex');
  const text = await data.text();
  const lines = text.split(/\r?\n/);

  await fontStore.processFontFile(lines, 'default_font.hex');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = CharacterGlyph.CHARACTER_WIDTH;
  canvas.height = CharacterGlyph.DATA_LENGTH / CharacterGlyph.BYTES_PER_ROW;

  const fontSizePixels = canvas.height;
  for (const char of fontStore.characters) {
    char.modified = true;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';

    const glyph = font.charToGlyph(char.character);
    //glyph.getBoundingBox
    let path = glyph.getPath(0, canvas.height, fontSizePixels);

    const bbox = path.getBoundingBox();
    const glyphWidth = bbox.x2 - bbox.x1;
    const glyphHeight = bbox.y2 - bbox.y1;
    const xOffset = (canvas.width - glyphWidth) / 2 - bbox.x1;
    const yOffset = (canvas.height - glyphHeight) / 2 - bbox.y1;
    path = glyph.getPath(xOffset, yOffset + glyphHeight, fontSizePixels);
    path.draw(ctx);

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const pixelIndex = (y * canvas.width + x) * 4;
        const alpha = pixels.data[pixelIndex + 3] ?? 0;
        char.setPixel(x, y, alpha > 128);
      }
    }
  }

  fontStore.dataVersion++;
  fontStore.filename = 'New Font';

  // we have the ttf,otf here
  // const font: Font = await opentype.load('/fonts/your-font.ttf');
  // const path = font.getPath(text, 0, 72, 72);

  // const canvas = document.createElement('canvas');
  // const ctx = canvas.getContext('2d')!;
  // canvas.width = 400;
  // canvas.height = 100;

  // ctx.fillStyle = 'black';
  // path.draw(ctx);

  // const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // return pixels;
}

// async function render(text: string) {

// }

// render('Hello').then((pixels) => console.log(pixels));
</script>

<template>
  <div class="relative">
    <input
      id="font-upload"
      type="file"
      @change="handleFontFileUpload"
      class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
    />
    <Button as="label" for="font-upload" :primary="primary">Create new font</Button>
  </div>
</template>
