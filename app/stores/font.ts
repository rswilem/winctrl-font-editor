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

export class CharacterInfo {
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

    const expectedHeight = Math.floor(CharacterInfo.DATA_LENGTH / CharacterInfo.BYTES_PER_ROW);

    for (let i = 0, row = 0; i < this.data.length && row < expectedHeight; i += CharacterInfo.BYTES_PER_ROW, row++) {
      if (i + CharacterInfo.BYTES_PER_ROW > this.data.length) {
        break;
      }

      const data = charBuffer.subarray(i, i + CharacterInfo.BYTES_PER_ROW);

      const byteHex = Array.from(data)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const byteValue = parseInt(byteHex, 16);
      const bits = byteValue.toString(2).padStart(CharacterInfo.BYTES_PER_ROW * 8, '0');

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
      if (skippedBytes < CharacterInfo.SKIP_CHARACTER_BYTES && lineOrigin.startCharacterIndex >= 0) {
        const remainingBytesToSkip = CharacterInfo.SKIP_CHARACTER_BYTES - skippedBytes;
        const availableBytesInLine = lineOrigin.endCharacterIndex - lineOrigin.startCharacterIndex + 1;
        const delta = Math.min(remainingBytesToSkip, availableBytesInLine);

        startPos += delta;
        skippedBytes += delta;
        if (delta < remainingBytesToSkip) {
          console.warn(
            `For character ${this.character}, could not skip all ${remainingBytesToSkip} remaining bytes, only skipped ${delta} = ${skippedBytes} total`
          );
        }
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
    const rowStart = y * CharacterInfo.BYTES_PER_ROW;
    const bitIndex = x;
    const byteOffset = Math.floor(bitIndex / 8);
    const bitInByte = 7 - (bitIndex % 8);
    const byteIndex = rowStart + byteOffset;

    // Add bounds checking to ensure we don't go beyond the character data
    if (byteIndex >= this.data.length) {
      console.warn(`Pixel out of bounds: y=${y}, byteIndex=${byteIndex}, dataLength=${this.data.length}`);
      return;
    }

    let byte = this.data[byteIndex];
    if (byte === undefined) return;
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
  const previewScale = ref(1);
  const characters = ref<CharacterInfo[]>([]);
  const selectedCharacter = ref<CharacterInfo | null>(null);
  const dataVersion = ref(0);

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

  async function processFontFile(lines: string[]): Promise<boolean> {
    if (!lines.length) {
      return false;
    }

    characters.value = [];
    selectedCharacter.value = null;
    dataVersion.value = 0;

    let currentCharacterIndex = 0;
    let currentCharacterLineOrigin: LineOrigin[] = [];
    let currentCharacterData = Buffer.alloc(0);
    let didReadHeader = false;
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex] ?? '';
      const hex = Buffer.from(line.trim().split(/\s+/).join(''), 'hex');

      if (hex[0] === 0xf0 && hex[1] === 0x00 && hex[3] === 0x2a && hex[8] === 0x06) {
        // Reset for new read, this is seen when switching from LARGE to small font
        didReadHeader = false;
        currentCharacterData = Buffer.alloc(0);
      } else if (hex[0] === 0xf0 && hex[1] === 0x00 && hex[3] === 0x12) {
        didReadHeader = false;
        currentCharacterData = Buffer.concat([currentCharacterData, hex.subarray(4, 5)]);
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
        if (!didReadHeader) {
          didReadHeader = true;

          cursor += 29;
        }

        currentCharacterData = Buffer.concat([currentCharacterData, hex.subarray(cursor)]);

        currentCharacterLineOrigin.push({
          line: Buffer.from(hex),
          lineIndex,
          startCharacterIndex: cursor,
          endCharacterIndex: hex.length - 1
        });

        const characterCodePoint = Buffer.from([
          currentCharacterData[0] ?? 0,
          currentCharacterData[1] ?? 0
        ]).readUInt16LE(0);

        const character = String.fromCodePoint(characterCodePoint);
        if (currentCharacterData.length >= CharacterInfo.DATA_LENGTH) {
          const bytesUsedInCurrentLine = Math.min(
            CharacterInfo.DATA_LENGTH - (currentCharacterData.length - hex.subarray(cursor).length),
            hex.length - cursor
          );
          currentCharacterLineOrigin[currentCharacterLineOrigin.length - 1]!.endCharacterIndex =
            cursor + bytesUsedInCurrentLine - 1;

          characters.value.push(
            new CharacterInfo(
              character,
              characterCodePoint,
              currentCharacterData.subarray(CharacterInfo.SKIP_CHARACTER_BYTES, CharacterInfo.DATA_LENGTH),
              currentCharacterLineOrigin,
              characters.value.length
            )
          );

          cursor = cursor + bytesUsedInCurrentLine;
          currentCharacterData = currentCharacterData.subarray(CharacterInfo.DATA_LENGTH);

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
        new CharacterInfo(
          String.fromCharCode(0),
          0x00,
          currentCharacterData.subarray(CharacterInfo.SKIP_CHARACTER_BYTES, CharacterInfo.DATA_LENGTH),
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
    processFontFile,
    downloadFontFile,
    selectedCharacter,
    characters,
    previewScale,
    dataVersion
  };
});
