<script setup lang="ts">
defineProps<{
  primary?: boolean;
  large?: boolean;
}>();

const fontStore = useFontStore();

function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) {
    return;
  }

  const file = input.files[0];
  if (!file) {
    return;
  }

  const fontFileTypes = ['.ttf', '.otf'];
  const allowedFileTypes = ['.xpwwf', '.txt', ...fontFileTypes];
  const fileExtension = file.name.match(/\.[^.]*$/)?.[0]?.toLowerCase() ?? '';

  if (!allowedFileTypes.includes(fileExtension)) {
    alert('Unsupported file type');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target?.result ?? null;
    if (!data) {
      return;
    }

    if (fontFileTypes.includes(fileExtension)) {
      fontStore.drawGlyphsFromFile(file);
    } else {
      fontStore.processFontFile(data, file.name);
    }
  };

  if (file.name.toLowerCase().endsWith('.txt')) {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}
</script>

<template>
  <div class="relative">
    <input
      id="hex-upload"
      type="file"
      @change="handleUpload"
      accept=".xpwwf,.txt,.ttf,.otf"
      class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
    />
    <Button as="label" for="hex-upload" :primary="primary" :large="large">Load file</Button>
  </div>
</template>
