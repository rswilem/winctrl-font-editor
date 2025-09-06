<script setup lang="ts">
import { useFontStore } from '@/stores/font';
const fontStore = useFontStore();
const characterModal = ref(false);

function handleFontUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) {
    return;
  }

  const file = input.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target?.result ?? null;
    if (!data) {
      return;
    }

    let lines: string[] = [];
    if (data instanceof ArrayBuffer) {
      try {
        const text = new TextDecoder('utf-8').decode(new Uint8Array(data));
        lines = text.split(/\r?\n/);
      } catch (e) {
        console.error('Failed to decode ArrayBuffer:', e);
        return false;
      }
    } else if (typeof data === 'string') {
      lines = data.split(/\r?\n/);
    }

    fontStore.processFontFile(lines);
  };
  reader.readAsArrayBuffer(file);
}
</script>

<template>
  <div class="flex h-12 w-full items-center gap-4 bg-gray-100 p-2 shadow">
    <div class="relative">
      <input
        id="font-upload"
        type="file"
        @change="handleFontUpload"
        class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />
      <Button as="label" for="font-upload">Choose File</Button>
    </div>

    <div>{{ fontStore.characters.length }} characters read</div>

    <div class="flex items-center gap-2">
      <label for="preview-scale" class="text-sm font-medium">Preview scale:</label>
      <input
        id="preview-scale"
        type="range"
        min="1"
        max="10"
        step="1"
        v-model.number="fontStore.previewScale"
        class="w-32"
      />
      <span class="w-6 text-right">{{ fontStore.previewScale }}</span>
    </div>

    <div>
      <Button @click="characterModal = true">Show character data</Button>
      <GlyphModal v-if="characterModal" @close="characterModal = false" />
    </div>

    <Button @click="fontStore.downloadFontFile(FontFileType.Binary)">Download binary</Button>

    <Button @click="fontStore.downloadFontFile(FontFileType.CHeader)">Download .h</Button>

    <Button @click="fontStore.downloadFontFile(FontFileType.CHeaderClipboard)">Copy .h</Button>
  </div>
</template>
