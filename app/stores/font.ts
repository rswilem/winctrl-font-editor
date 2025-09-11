import { Buffer } from 'buffer';
import { defineStore } from 'pinia';
window.Buffer = Buffer;

interface LineOrigin {
  line: Buffer;
  lineIndex: number;
  startCharacterIndex: number;
  endCharacterIndex: number;
}

export enum FontFileType {
  Binary = 'binary',
  CHeader = 'c-header',
  CHeaderClipboard = 'c-header-clipboard'
}

export class CharacterGlyph {
  public static readonly DATA_LENGTH = 91;
  public static readonly BYTES_PER_ROW = 3;
  public static readonly CHARACTER_WIDTH = 24;
  public static readonly SKIP_CHARACTER_BYTES = 4; // Skip first two bytes (character code), and two more... not sure

  public character: string;
  public codepoint: number;
  public data: Buffer;
  public originalData: Buffer;
  public origin: LineOrigin[] = [];
  public index: number;
  public modified: boolean = false;

  constructor(character: string, codepoint: number, data: Buffer, origin: LineOrigin[], index: number = 0) {
    this.character = character;
    this.codepoint = codepoint;
    this.data = data;
    this.originalData = Buffer.from(data);
    this.origin = origin;
    this.index = index;
  }

  get bitmap(): boolean[][] {
    const charBuffer = this.data;
    let bitmap: boolean[][] = [];

    const expectedHeight = Math.floor(CharacterGlyph.DATA_LENGTH / CharacterGlyph.BYTES_PER_ROW);

    for (let i = 0, row = 0; i < this.data.length && row < expectedHeight; i += CharacterGlyph.BYTES_PER_ROW, row++) {
      if (i + CharacterGlyph.BYTES_PER_ROW > this.data.length) {
        break;
      }

      const data = charBuffer.subarray(i, i + CharacterGlyph.BYTES_PER_ROW);

      const byteHex = Array.from(data)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const byteValue = parseInt(byteHex, 16);
      const bits = byteValue.toString(2).padStart(CharacterGlyph.BYTES_PER_ROW * 8, '0');

      const rowBits = bits.split('').map((bit) => (bit === '1' ? true : false));
      bitmap.push(rowBits);
    }

    return bitmap;
  }

  get modifiedLines(): LineOrigin[] {
    if (!this.modified) {
      return this.origin;
    }

    // Create a copy of the original line origins with modified data
    const modifiedLineOrigins: LineOrigin[] = this.origin.map((lineOrigin) => ({
      line: Buffer.from(lineOrigin.line),
      lineIndex: lineOrigin.lineIndex,
      startCharacterIndex: lineOrigin.startCharacterIndex,
      endCharacterIndex: lineOrigin.endCharacterIndex
    }));

    let dataOffset = 0;

    let skippedBytes = 0;
    for (let originIndex = 0; originIndex < modifiedLineOrigins.length; originIndex++) {
      const lineOrigin = modifiedLineOrigins[originIndex];
      if (!lineOrigin) {
        continue;
      }

      // Skip lines that don't contain character data (marked with -1)
      if (lineOrigin.startCharacterIndex === -1 || lineOrigin.endCharacterIndex === -1) {
        continue;
      }

      let startPos = lineOrigin.startCharacterIndex;
      if (skippedBytes < CharacterGlyph.SKIP_CHARACTER_BYTES && lineOrigin.startCharacterIndex >= 0) {
        const remainingBytesToSkip = CharacterGlyph.SKIP_CHARACTER_BYTES - skippedBytes;
        const availableBytesInLine = lineOrigin.endCharacterIndex - lineOrigin.startCharacterIndex + 1;
        const delta = Math.min(remainingBytesToSkip, availableBytesInLine);

        startPos += delta;
        skippedBytes += delta;
      }

      // Replace bytes in this line with modified data
      for (
        let bytePos = startPos;
        bytePos <= lineOrigin.endCharacterIndex && dataOffset < this.data.length;
        bytePos++
      ) {
        const modifiedByte = this.data[dataOffset];
        if (modifiedByte !== undefined) {
          lineOrigin.line[bytePos] = modifiedByte;
        }
        dataOffset++;
      }
    }

    return modifiedLineOrigins;
  }

  resetBitmap() {
    this.data = Buffer.from(this.originalData);
    this.modified = false;

    const fontStore = useFontStore();
    fontStore.dataVersion++;
  }

  setPixel(x: number, y: number, value: boolean) {
    const fontStore = useFontStore();
    const rowStart = y * CharacterGlyph.BYTES_PER_ROW;
    const bitIndex = x;
    const byteOffset = Math.floor(bitIndex / 8);
    const bitInByte = 7 - (bitIndex % 8);
    const byteIndex = rowStart + byteOffset;

    if (byteIndex >= this.data.length) {
      return;
    }

    let byte = this.data[byteIndex];
    if (byte === undefined) {
      return;
    }

    if (value) {
      byte = byte | (1 << bitInByte);
    } else {
      byte = byte & ~(1 << bitInByte);
    }
    this.data[byteIndex] = byte;
    fontStore.dataVersion++;

    this.modified = true;
  }
}

export const useFontStore = defineStore('font', () => {
  const filename = ref<string>('');
  const previewScale = ref<number>(3);
  const characters = ref<CharacterGlyph[]>([]);
  const selectedCharacter = ref<CharacterGlyph | null>(null);
  const dataVersion = ref<number>(0);

  watch(
    () => previewScale.value,
    (newVal) => {
      localStorage.setItem('previewScale', newVal.toString());
    }
  );

  onMounted(() => {
    const stored = localStorage.getItem('previewScale');
    if (stored) {
      const scale = parseInt(stored);
      if (!isNaN(scale) && scale > 0 && scale <= 20) {
        previewScale.value = scale;
      }
    }
  });

  async function processFontFile(lines: string[], fontFilename: string): Promise<boolean> {
    if (!lines.length) {
      return false;
    }

    filename.value = fontFilename;
    characters.value = [];
    selectedCharacter.value = null;
    dataVersion.value = 0;

    let currentCharacterIndex = 0;
    let currentCharacterLineOrigin: LineOrigin[] = [];
    let currentCharacterData = Buffer.alloc(0);
    let bytesToSkip = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex] ?? '';
      const hex = Buffer.from(line.trim().split(/\s+/).join(''), 'hex');

      // if (hex[0] === 0xf0 && hex[1] === 0x00 && hex[3] === 0x2a) {
      // }
      if (hex[0] === 0xf0 && hex[1] === 0x00 && hex[3] === 0x02) {
        // Reset for new read, this is seen when switching from LARGE to small font
        currentCharacterData = Buffer.alloc(0);
        currentCharacterLineOrigin = [];
      } else if (hex[0] === 0xf0 && hex[1] === 0x00 && hex[3] === 0x12) {
        currentCharacterData = Buffer.concat([currentCharacterData, hex.subarray(4, 5)]); // Take the 5th byte as is (seems to be part of the character data)
        currentCharacterLineOrigin.push({
          line: Buffer.from(hex),
          lineIndex,
          startCharacterIndex: 4,
          endCharacterIndex: 4
        });
        continue;
      }

      if (hex[0] === 0xf0 && hex[1] === 0x00 && hex[3] === 0x3c) {
        let cursor = 4;
        let validCharacterData = Buffer.alloc(0);
        let validDataStartPos = -1;
        let validDataEndPos = -1;

        let i = cursor;
        while (i < hex.length) {
          if (bytesToSkip > 0) {
            bytesToSkip--;
            i++;
            continue;
          }

          if (
            hex.length - i >= 4 &&
            hex[i] === 0x32 &&
            hex[i + 1] === 0xbb &&
            hex[i + 2] === 0x00 &&
            hex[i + 3] === 0x00
          ) {
            const controlSequenceLength = 17;
            const skipExtraPos = i + controlSequenceLength - 4;

            if (skipExtraPos < hex.length) {
              const skipExtra = hex[skipExtraPos] ?? 0;
              const totalSkip = controlSequenceLength + skipExtra;

              if (i + totalSkip <= hex.length) {
                // Skip the entire control sequence + extra bytes within this line
                i += totalSkip;
                continue;
              } else {
                // Control sequence + extra extends beyond this line
                const remainingInLine = hex.length - i;
                bytesToSkip = totalSkip - remainingInLine;
                i = hex.length; // Skip to end of current line
                continue;
              }
            } else {
              // Control sequence spans across lines, can't read skipExtra
              const remainingInLine = hex.length - i;
              bytesToSkip = controlSequenceLength - remainingInLine;
              i = hex.length; // Skip to end of current line
              continue;
            }
          }

          // This is valid character data
          if (validDataStartPos === -1) {
            validDataStartPos = i; // Mark start of valid data in this line
          }
          validDataEndPos = i; // Update end position
          validCharacterData = Buffer.concat([validCharacterData, Buffer.from([hex[i] ?? 0])]);
          i++;
        }

        currentCharacterData = Buffer.concat([currentCharacterData, validCharacterData]);

        if (validDataStartPos < 0 && validDataEndPos < 0) {
          cursor = -1;
        }

        currentCharacterLineOrigin.push({
          line: Buffer.from(hex),
          lineIndex,
          startCharacterIndex: validDataStartPos >= 0 ? validDataStartPos : cursor,
          endCharacterIndex: validDataEndPos >= 0 ? validDataEndPos : cursor
        });

        const characterCodePoint = Buffer.from([
          currentCharacterData[0] ?? 0,
          currentCharacterData[1] ?? 0
        ]).readUInt16LE(0);

        const character = String.fromCodePoint(characterCodePoint);
        if (currentCharacterData.length >= CharacterGlyph.DATA_LENGTH) {
          const bytesUsedInCurrentLine = Math.min(
            CharacterGlyph.DATA_LENGTH - (currentCharacterData.length - hex.subarray(cursor).length),
            hex.length - cursor
          );
          currentCharacterLineOrigin[currentCharacterLineOrigin.length - 1]!.endCharacterIndex =
            cursor + bytesUsedInCurrentLine - 1;

          characters.value.push(
            new CharacterGlyph(
              character,
              characterCodePoint,
              currentCharacterData.subarray(CharacterGlyph.SKIP_CHARACTER_BYTES, CharacterGlyph.DATA_LENGTH),
              currentCharacterLineOrigin,
              characters.value.length
            )
          );

          cursor = cursor + bytesUsedInCurrentLine;
          currentCharacterData = currentCharacterData.subarray(CharacterGlyph.DATA_LENGTH);

          currentCharacterLineOrigin =
            currentCharacterData.length > 0
              ? [
                  {
                    line: currentCharacterData.length > 0 ? hex : Buffer.alloc(0),
                    lineIndex,
                    startCharacterIndex: cursor,
                    endCharacterIndex: cursor + currentCharacterData.length - 1
                  }
                ]
              : [];

          currentCharacterIndex++;
          bytesToSkip = 0; // Reset for next character
        }
      } else {
        currentCharacterLineOrigin.push({
          line: Buffer.from(hex),
          lineIndex,
          startCharacterIndex: -1,
          endCharacterIndex: -1
        });
      }
    }

    // Handle any remaining character data after the loop
    if (currentCharacterData.length > 0) {
      characters.value.push(
        new CharacterGlyph(
          String.fromCharCode(0),
          0x00,
          currentCharacterData.subarray(CharacterGlyph.SKIP_CHARACTER_BYTES, CharacterGlyph.DATA_LENGTH),
          currentCharacterLineOrigin,
          characters.value.length
        )
      );
    }

    return true;
  }

  async function downloadFontFile(type: FontFileType = FontFileType.Binary) {
    if (!characters.value.length) {
      return;
    }

    const modifiedLinesMap = new Map<number, Buffer>();
    for (const character of characters.value) {
      if (!character.modified) {
        continue;
      }

      const modifiedLines = character.modifiedLines;

      for (const lineOrigin of modifiedLines) {
        const lineIndex = lineOrigin.lineIndex;

        let modifiedLine = modifiedLinesMap.get(lineIndex);
        if (!modifiedLine) {
          const originalLineOrigin = character.origin.find((orig) => orig.lineIndex === lineIndex);
          if (originalLineOrigin) {
            modifiedLine = Buffer.from(originalLineOrigin.line);
            modifiedLinesMap.set(lineIndex, modifiedLine);
          } else {
            console.log('Could not find original line for modified line, skipping...');
            continue;
          }
        }

        if (lineOrigin.startCharacterIndex >= 0 && lineOrigin.endCharacterIndex >= 0) {
          for (let bytePos = lineOrigin.startCharacterIndex; bytePos <= lineOrigin.endCharacterIndex; bytePos++) {
            if (bytePos < lineOrigin.line.length && bytePos < modifiedLine.length) {
              const sourceByte = lineOrigin.line[bytePos];
              if (sourceByte !== undefined) {
                modifiedLine[bytePos] = sourceByte;
              }
            }
          }
        }
      }
    }

    const outputLines: string[] = [];

    if (type === FontFileType.CHeader) {
      outputLines.push(
        '#ifndef FONT_AIRBUS_VARIANT_1_H\n#define FONT_AIRBUS_VARIANT_1_H\n#include <vector>\n\nconst std::vector<std::vector<unsigned char>> fmcFontAirbusVariant1 = {'
      );
    }

    const allLineIndices = new Set<number>();
    for (const character of characters.value) {
      for (const lineOrigin of character.origin) {
        if (lineOrigin.lineIndex >= 0) {
          allLineIndices.add(lineOrigin.lineIndex);
        }
      }
    }

    const sortedLineIndices = Array.from(allLineIndices).sort((a, b) => a - b);
    for (const lineIndex of sortedLineIndices) {
      let lineBuffer = modifiedLinesMap.get(lineIndex);

      if (!lineBuffer) {
        for (const character of characters.value) {
          const originalLineOrigin = character.origin.find((orig) => orig.lineIndex === lineIndex);
          if (originalLineOrigin) {
            lineBuffer = originalLineOrigin.line;
            break;
          }
        }
      }

      if (lineBuffer) {
        let outputString = '';

        if (type === FontFileType.Binary) {
          outputString = Array.from(lineBuffer)
            .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
            .join(' ');
        } else if (type === FontFileType.CHeader || type === FontFileType.CHeaderClipboard) {
          outputString += '  {';

          outputString += Array.from(lineBuffer)
            .map((byte) => `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`)
            .join(',');

          outputString += '},';
        } else {
          outputString = 'unknown-file-type';
        }

        outputLines.push(outputString);
      }
    }

    if (type === FontFileType.CHeader) {
      outputLines.push('};\n\n#endif // FONT_AIRBUS_VARIANT_1_H');
    } else if (type === FontFileType.CHeaderClipboard) {
      await navigator.clipboard.writeText(outputLines.join('\n'));
      alert(`Copied ${outputLines.length} lines to clipboard`);
      return;
    }

    const content = outputLines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    if (type === FontFileType.Binary) {
      link.download = 'modified_font.txt';
    } else if (type === FontFileType.CHeader) {
      link.download = 'modified_font.h';
    } else {
      link.download = 'modified_font.txt';
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return {
    filename,
    processFontFile,
    downloadFontFile,
    selectedCharacter,
    characters,
    previewScale,
    dataVersion
  };
});
