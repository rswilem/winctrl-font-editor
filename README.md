# WINCTRL Font Editor

A modern, web-based font editor for creating and customizing fonts for the [WINCTRL X-Plane plugin](https://github.com/rswilem/wintrl-xplane-plugin). Designed to work seamlessly with the MCDU (Multi-Control Display Unit) and PFP (Panel Function Panel) management computers.

## Features

- **Intuitive Pixel Editor**: Click to toggle pixels on/off for precise font design
- **Character Variants**: Edit both large (0-109) and small (110+) character variants
- **Multiple Import Formats**: Load `.ttf`, `.otf`, or previously exported `.xpwwf` font files
- **Live Preview**: See changes in real-time with adjustable zoom levels
- **Copy/Paste**: Quickly duplicate character designs using Ctrl+C / Ctrl+V
- **Easy Export**: Download your custom fonts as `.xpwwf` files ready for the X-Plane plugin

## Quick Start

1. Visit the [WINCTRL Font Editor](https://github.com/rswilem/winctrl-font-editor)
2. Click "Load font file" and select your font (TTF, OTF, or existing XPWWF)
3. Edit characters by clicking pixels in the editor
4. Click "Save font file" to download your custom `.xpwwf` file
5. Place the file in `X-Plane/Resources/plugins/winctrl/fonts/`
6. Open X-Plane and select your font via `Plugins > WINCTRL > FMC > Display font`

## Installation in X-Plane

### Step 1: Prepare Your Font File

1. Use this editor to create or modify your custom font
2. Export the font as `.xpwwf`

### Step 2: Install the Font File

1. Locate your X-Plane root directory
2. Navigate to `Resources/plugins/winctrl/fonts/`
3. Place your `.xpwwf` file in this directory

### Step 3: Select in X-Plane

1. Open X-Plane and load an aircraft with the WINCTRL FMC
2. Go to `Plugins > WINCTRL > FMC > Display font`
3. Select your custom font from the list
4. The font loads immediately and persists across sessions

## Usage Tips

- **Zoom**: Use the preview scale slider for better visibility while editing fine details
- **Copy Characters**: Duplicate well-designed characters as a starting point for similar glyphs
- **Test In-Game**: Always verify your font looks good in X-Plane before finalizing
- **Consistency**: Keep large and small character variants visually consistent
- **Backup**: Save your work frequently as edits are only stored locally until downloaded

## Related Projects

- [WINCTRL X-Plane Plugin](https://github.com/rswilem/wintrl-xplane-plugin) - The FMC plugin that uses these custom fonts

## License

Use of this editor is subject to the terms of the WINCTRL X-Plane plugin. All trademarks, logos, and brand names are the property of their respective owners.
