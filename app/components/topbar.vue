<script setup lang="ts">
const fontStore = useFontStore();
const characterModal = ref(false);
const helpModal = ref(false);
</script>

<template>
  <div class="flex h-12 w-full items-center gap-6 bg-gray-100 p-2">
    <LoadFontButton :primary="!fontStore.filename" />

    <div v-if="fontStore.filename" class="flex flex-col text-xs">
      <span>{{ fontStore.filename }}</span>
      <span>{{ fontStore.characters.length }} characters</span>
    </div>

    <div v-if="fontStore.filename" class="flex items-center gap-2 text-sm">
      <label for="preview-scale" class="font-medium">Preview scale</label>
      <input
        id="preview-scale"
        type="range"
        min="1"
        max="10"
        step="1"
        v-model.number="fontStore.previewScale"
        class="w-32"
      />
      <span class="w-6 text-right font-bold">{{ fontStore.previewScale }}x</span>
    </div>

    <DevOnly>
      <div v-if="fontStore.selectedCharacter">
        <Button @click="characterModal = true">Show character data</Button>
        <GlyphModal v-if="characterModal" @close="characterModal = false" />
      </div>
    </DevOnly>

    <div class="grow"></div>

    <div>
      <Button @click="helpModal = true">Help</Button>
      <HelpModal v-if="helpModal" @close="helpModal = false" />
    </div>

    <div v-if="fontStore.filename" class="flex items-center gap-1">
      <Button @click="fontStore.downloadFontFile(FontFileType.Binary)">Save font file</Button>
      <DevOnly>
        <Button @click="fontStore.downloadFontFile(FontFileType.BinaryText)">Download HEX text</Button>
        <Button @click="fontStore.downloadFontFile(FontFileType.CHeader)">Download .h</Button>
        <Button @click="fontStore.downloadFontFile(FontFileType.CHeaderClipboard)">Copy .h</Button>
      </DevOnly>
    </div>
  </div>
</template>
