<script setup lang="ts">
const characterWidth = CharacterGlyph.CHARACTER_WIDTH;
const characterHeight = Math.floor(CharacterGlyph.DATA_LENGTH / CharacterGlyph.BYTES_PER_ROW);

const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>
<template>
  <div
    class="absolute top-0 left-0 z-10 flex h-screen w-screen items-center justify-center bg-black/70 p-8"
    @click.self="emit('close')"
  >
    <div class="h-5/6 w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-8 text-sm">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-3xl font-bold text-red-500">Font Editor</h1>
        <button @click="emit('close')" class="text-2xl font-bold text-gray-500 hover:text-gray-700">&times;</button>
      </div>

      <!-- Getting Started -->
      <section class="mb-8">
        <h2 class="mb-4 text-xl font-bold text-red-700">Getting Started</h2>
        <div class="space-y-3 text-gray-700">
          <p><strong>1. Load a Font:</strong> Click the "Load font file" button to upload a font. You can use:</p>
          <ul class="ml-4 list-inside list-disc space-y-1">
            <li>Previously exported <code class="rounded bg-gray-100 px-2 py-1">.xpwwf</code> files</li>
            <li>TTF or OTF font files</li>
            <li>Already exported font files from the plugin</li>
          </ul>
          <p class="mt-3">
            <strong>2. Start Editing:</strong> Once loaded, you'll see all available characters on the left side panel
            and the character details on the right.
          </p>
        </div>
      </section>

      <!-- Interface Overview -->
      <section class="mb-8">
        <h2 class="mb-4 text-xl font-bold text-red-700">Interface Overview</h2>
        <div class="space-y-4 text-gray-700">
          <div>
            <h3 class="font-semibold">Left Panel - Character Selection</h3>
            <p>
              Browse all characters in your font. Each character is displayed as a preview. Click any character to
              select it for editing.
            </p>
          </div>
          <div>
            <h3 class="font-semibold">Right Panel - Pixel Editor</h3>
            <p>
              The main editing area showing the selected character as a grid of pixels. Use the preview below to see how
              your changes look.
            </p>
          </div>
          <div>
            <h3 class="font-semibold">Preview Section</h3>
            <p>
              Displays a live preview of the character you're editing. Use the "Preview scale" slider in the toolbar to
              zoom in/out for better visibility.
            </p>
          </div>
        </div>
      </section>

      <!-- Editing Characters -->
      <section class="mb-8">
        <h2 class="mb-4 text-xl font-bold text-red-700">Editing Characters</h2>
        <div class="space-y-3 text-gray-700">
          <p>
            <strong>Pixel Editing:</strong> Click on individual pixels in the grid to toggle them on (filled) or off
            (empty). This directly modifies the character bitmap.
          </p>
          <p>
            <strong>Copy/Paste:</strong> Use Ctrl+C (Cmd+C on Mac) to copy the current character's bitmap data. Use
            Ctrl+V (Cmd+V on Mac) to paste it to another character.
          </p>
          <p>
            <strong>Reset Character:</strong> If you make mistakes, you can reset the character to its original state
            using the reset function.
          </p>
        </div>
      </section>

      <!-- Font Variants -->
      <section class="mb-8">
        <h2 class="mb-4 text-xl font-bold text-red-700">Font Variants</h2>
        <div class="space-y-3 text-gray-700">
          <p>Your font contains <strong>two variants</strong> of each character:</p>
          <ul class="ml-2 list-inside list-disc space-y-2">
            <li>
              <strong>Large Characters (0-{{ CharacterGlyph.SMALL_FONT_START_INDEX - 1 }}):</strong> Standard size
              characters used for normal display.
            </li>
            <li>
              <strong>Small Characters ({{ CharacterGlyph.SMALL_FONT_START_INDEX }}+):</strong> Smaller variants of
              characters used in certain display modes.
            </li>
          </ul>
          <p class="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-amber-700">
            <strong>⚠ Control Characters (Red):</strong> Some characters are marked in red and cannot be edited. These
            are control sequences used internally by the FMC. Do not modify these.
          </p>
        </div>
      </section>

      <!-- Exporting Your Font -->
      <section class="mb-8">
        <h2 class="mb-4 text-xl font-bold text-red-700">Exporting Your Font</h2>
        <div class="space-y-3 text-gray-700">
          <p>
            When you're satisfied with your edits, click <strong>"Save font file"</strong> to download your custom font
            as an <code class="rounded bg-gray-100 px-2 py-1">.xpwwf</code> file.
          </p>
        </div>
      </section>

      <!-- Installation -->
      <section class="mb-8">
        <h2 class="mb-4 text-xl font-bold text-red-700">Installation in X-Plane</h2>
        <div class="space-y-3 text-gray-700">
          <p><strong>1. Locate the Fonts Folder:</strong></p>
          <p class="ml-4 rounded bg-gray-100 p-3 font-mono">X-Plane root directory/Resources/plugins/winwing/fonts/</p>
          <p>
            <strong>2. Place Your Font:</strong> Copy your downloaded
            <code class="rounded bg-gray-100 px-2 py-1">.xpwwf</code> file into the fonts folder above.
          </p>
          <p><strong>3. Select in X-Plane:</strong></p>
          <ol class="ml-4 list-inside list-decimal space-y-1">
            <li>Open X-Plane and load an aircraft with Winwing FMC</li>
            <li>Navigate to: <strong>Plugins > Winwing > FMC > Display font</strong></li>
            <li>Select your custom font from the list</li>
            <li>The font will load immediately and persist across sessions</li>
          </ol>
        </div>
      </section>

      <!-- Font Options -->
      <section class="mb-8">
        <h2 class="mb-4 text-xl font-bold text-red-700">Font Options in X-Plane</h2>
        <div class="space-y-3 text-gray-700">
          <div class="border-l-4 border-blue-500 pl-4">
            <p>
              <strong>Managed by plugin (default):</strong> Uses the plugin's built-in fonts, automatically adjusted to
              match the currently selected aircraft.
            </p>
          </div>
          <div class="border-l-4 border-blue-500 pl-4">
            <p>
              <strong>No custom font:</strong> Reverts to the default font included with the WinWing FMC hardware. Note:
              Requires device reconnect to take effect.
            </p>
          </div>
          <div class="border-l-4 border-blue-500 pl-4">
            <p>
              <strong>Custom Fonts:</strong> Any <code class="rounded bg-gray-100 px-2 py-1">.xpwwf</code> file you
              place in the fonts directory will appear here.
            </p>
          </div>
        </div>
      </section>

      <!-- Tips & Tricks -->
      <section class="mb-8">
        <h2 class="mb-4 text-xl font-bold text-red-700">Tips & Tricks</h2>
        <div class="space-y-3 text-gray-700">
          <ul class="list-inside list-disc space-y-2">
            <li>Use the preview scale to get a better view while editing fine details</li>
            <li>Copy a well-designed character and paste it as a starting point for similar characters</li>
            <li>Remember to save frequently - your edits are only stored locally until you download the file</li>
            <li>Test your font in-game to ensure it looks good at various zoom levels</li>
            <li>Large and small character variants should maintain visual consistency</li>
          </ul>
        </div>
      </section>

      <!-- Technical Info -->
      <section class="mb-8">
        <h2 class="mb-4 text-xl font-bold text-red-700">Technical Information</h2>
        <div class="space-y-3 text-gray-700">
          <p>
            Each character is stored as a bitmap of
            <strong>{{ characterWidth }} pixels wide × {{ characterHeight }} pixels tall</strong>. The pixel data is
            stored in binary format and converted to the
            <code class="rounded bg-gray-100 px-2 py-1">.xpwwf</code> format recognized by the plugin.
          </p>
        </div>
      </section>

      <!-- Support -->
      <section>
        <h2 class="mb-4 text-xl font-bold text-red-700">Need Help?</h2>
        <div class="space-y-3 text-gray-700">
          <p>If you encounter issues or have questions:</p>
          <ul class="list-inside list-disc space-y-1">
            <li>Check that your fonts folder exists and is in the correct location</li>
            <li>Ensure the <code class="rounded bg-gray-100 px-2 py-1">.xpwwf</code> file is properly saved</li>
            <li>Try using "Managed by plugin" setting first to verify the FMC is working correctly</li>
            <li>If switching from a custom font to "No custom font", remember to reconnect the FMC device</li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>
