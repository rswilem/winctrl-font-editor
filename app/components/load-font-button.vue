<script setup lang="ts">
defineProps<{
  primary?: boolean;
}>();

const fontStore = useFontStore();

function handleHexUpload(event: Event) {
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

    fontStore.processFontFile(lines, file.name);
  };
  reader.readAsArrayBuffer(file);
}
</script>

<template>
  <div class="relative">
    <input
      id="hex-upload"
      type="file"
      @change="handleHexUpload"
      class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
    />
    <Button as="label" for="hex-upload" :primary="primary">Load file</Button>
  </div>
</template>
