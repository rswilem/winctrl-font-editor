<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const fontStore = useFontStore();
const editedDate = ref<Date | null>(null);
const unicode = computed(() => {
  if (!fontStore.selectedCharacter) {
    return '';
  }

  return `U+${fontStore.selectedCharacter.codepoint.toString(16).toUpperCase().padStart(4, '0')}`;
});

const affectedStart = computed(() => {
  if (!fontStore.selectedCharacter) {
    return 0;
  }

  return fontStore.selectedCharacter.origin?.[0]?.lineIndex ?? 0;
});

const affectedCount = computed(() => {
  if (!fontStore.selectedCharacter) {
    return 0;
  }

  return fontStore.selectedCharacter.origin?.length ?? 0;
});

watch(
  [() => fontStore.selectedCharacter, () => fontStore.dataVersion, () => fontStore.filename],
  () => {
    if (!fontStore.selectedCharacter) {
      editedDate.value = null;
      return;
    }

    editedDate.value = new Date();
  },
  { immediate: true }
);

function isPartOfCharacter(lineIndex: number, characterIndex: number) {
  if (!fontStore.selectedCharacter) {
    return false;
  }

  // Find the corresponding LineOrigin for this lineIndex
  const lineOrigin = fontStore.selectedCharacter.origin[lineIndex];
  if (!lineOrigin) {
    return false;
  }

  return characterIndex >= lineOrigin.startCharacterIndex && characterIndex <= lineOrigin.endCharacterIndex;
}

function isModified(lineIndex: number, characterIndex: number): boolean {
  if (!fontStore.selectedCharacter) {
    return false;
  }

  if (!isPartOfCharacter(lineIndex, characterIndex)) {
    return false;
  }

  const original = fontStore.selectedCharacter.origin[lineIndex]?.line?.[characterIndex] ?? 0;
  const modified = fontStore.selectedCharacter.modifiedLines[lineIndex]?.line?.[characterIndex] ?? 0;
  return original !== modified;
}

function copyToClipboard(lines: Buffer[]) {
  if (!fontStore.selectedCharacter) {
    return;
  }

  const data = lines
    .map((line) =>
      Array.from(line)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join(' ')
    )
    .join('\n');
  navigator.clipboard.writeText(data);
  alert('Copied to clipboard');
}
</script>
<template>
  <div
    class="absolute top-0 left-0 z-10 flex h-screen w-screen items-center justify-center bg-black/70 p-8"
    @click.self="emit('close')"
  >
    <div class="h-1/2 min-w-2xl overflow-y-scroll rounded-2xl bg-white p-4 text-xs">
      <div v-if="fontStore.selectedCharacter" class="flex flex-col gap-4">
        <div class="flex w-full items-center justify-between rounded-lg bg-gray-200 p-2">
          <div class="flex shrink-0 items-center gap-4 text-lg">
            <span class="shrink-0">Character #{{ fontStore.selectedCharacter.index }}</span>
            <span class="block w-full min-w-6 rounded-full bg-black px-1 text-center text-base text-white">{{
              fontStore.selectedCharacter.character
            }}</span>

            <a
              :href="`https://www.compart.com/en/unicode/${unicode}`"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-primary-500 rounded-full bg-black px-1 text-xs font-bold text-white underline"
              >{{ unicode }}</a
            >
          </div>
          <div>Affected lines: #{{ affectedStart + 1 }} - #{{ affectedStart + affectedCount }}</div>
          <div v-if="editedDate" class="text-sm text-gray-600">Last edited: {{ editedDate.toLocaleString() }}</div>
        </div>
        <div class="flex flex-col gap-0">
          <div class="flex items-center gap-1">
            <span class="font-bold"
              >Original line #{{ (fontStore.selectedCharacter.origin?.[0]?.lineIndex ?? 0) + 1 }}</span
            >
            <Button small @click="copyToClipboard(fontStore.selectedCharacter.origin.map((o) => o.line))">Copy</Button>
          </div>
          <div
            v-for="(lineOrigin, lineIndex) in fontStore.selectedCharacter.origin"
            :key="`line-${lineIndex}`"
            class="flex gap-1 font-mono"
          >
            <div
              v-for="(byte, characterIndex) in lineOrigin.line"
              :key="`${lineIndex}-${characterIndex}`"
              class="group relative"
            >
              <div
                class="absolute -top-5 left-0 z-10 hidden gap-2 rounded-md bg-black px-1 text-nowrap text-white group-hover:flex"
              >
                <span>{{ characterIndex }}</span>
                <span v-if="characterIndex === 0"
                  >Line {{ lineOrigin.lineIndex + 1 }}: From {{ lineOrigin.startCharacterIndex }} to
                  {{ lineOrigin.endCharacterIndex }}</span
                >
              </div>
              <span
                class="text-gray-500 uppercase"
                :class="{
                  '!text-black': isPartOfCharacter(lineIndex, characterIndex)
                }"
              >
                {{ byte.toString(16).padStart(2, '0') }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-0">
          <div class="flex items-center gap-1">
            <span class="font-bold"
              >Modified line #{{ (fontStore.selectedCharacter.modifiedLines?.[0]?.lineIndex ?? 0) + 1 }}</span
            >
            <Button small @click="copyToClipboard(fontStore.selectedCharacter.modifiedLines.map((o) => o.line))"
              >Copy</Button
            >
          </div>
          <div
            v-for="(lineOrigin, lineIndex) in fontStore.selectedCharacter.modifiedLines"
            :key="`modified-line-${lineIndex}`"
            class="flex gap-1 font-mono"
          >
            <div
              v-for="(byte, characterIndex) in lineOrigin.line"
              :key="`${lineIndex}-${characterIndex}`"
              class="group relative"
            >
              <div
                class="absolute -top-5 left-0 z-10 hidden gap-2 rounded-md bg-black px-1 text-nowrap text-white group-hover:flex"
              >
                <span>{{ characterIndex }}</span>
                <span v-if="characterIndex === 0"
                  >Line {{ lineOrigin.lineIndex + 1 }}: From {{ lineOrigin.startCharacterIndex }} to
                  {{ lineOrigin.endCharacterIndex }}</span
                >
              </div>
              <span
                class="text-gray-500 uppercase"
                :class="{
                  '!text-black': isPartOfCharacter(lineIndex, characterIndex),
                  '!bg-yellow-200': isModified(lineIndex, characterIndex)
                }"
              >
                {{ byte.toString(16).padStart(2, '0') }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div v-else>No character selected</div>
    </div>
  </div>
</template>
