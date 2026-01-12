<script setup lang="ts">
const pluginName = 'Winwing / WINCTRL X-Plane plugin';
const pluginUrl = 'https://github.com/rswilem/winwing-xplane-plugin#winwing-plugin-for-x-plane';
</script>
<template>
  <div class="flex h-full w-full grow flex-col items-center justify-between bg-black p-32 text-white">
    <div class="flex flex-col items-center gap-4">
      <h1 class="text-5xl">Font Editor</h1>
      <span class="text-xl"
        >for the <a :href="pluginUrl" target="_blank" class="underline">{{ pluginName }}</a></span
      >
    </div>

    <div class="flex flex-col items-center gap-1">
      <LoadFontButton primary large class="mb-4" />
      <span class="text-base text-neutral-400">No font loaded.</span>
      <span class="text-base text-neutral-400">Select a .ttf, .otf or existing .xpwwf font file to get started.</span>
    </div>

    <div class="max-w-2xl text-center text-xs text-neutral-600">
      All trademarks, logos, and brand names are the property of their respective owners. Use of these names does not
      imply endorsement. All rights reserved. For sole use with the {{ pluginName }}. Use at your own risk.
    </div>
  </div>
</template>
