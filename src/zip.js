/**
 * Pure JS ZIP Archive Generator (Store method, zero dependencies).
 * Works natively in Browser and Node.js environments.
 */

// Precomputed CRC-32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

/**
 * Calculates IEEE 802.3 CRC-32 checksum for a Uint8Array of data.
 * @param {Uint8Array} bytes 
 * @returns {number} 32-bit unsigned integer
 */
export function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Helper to write a 16-bit little-endian integer.
 */
function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
}

/**
 * Helper to write a 32-bit little-endian integer.
 */
function writeUint32(view, offset, value) {
  view.setUint32(offset, value, true);
}

/**
 * Encodes text string to UTF-8 Uint8Array.
 * Uses TextEncoder (available in both Modern Browsers and Node.js).
 */
const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
function toUtf8(str) {
  if (encoder) {
    return encoder.encode(str);
  }
  // Fallback for environment without TextEncoder
  return new Uint8Array(Buffer.from(str, 'utf-8'));
}

/**
 * Creates a ZIP archive from an array of files.
 * @param {Array<{path: string, content: string}>} files 
 * @returns {Uint8Array} Binary ZIP archive bytes
 */
export function createZip(files) {
  const fileEntries = [];
  let totalLocalHeadersSize = 0;

  // Fixed DOS Timestamp: 2026-10-10 12:00:00
  // Time: 12:00:00 -> (12 << 11) | (0 << 5) | (0 >> 1) = 24576 = 0x6000
  // Date: 2026-10-10 -> ((2026 - 1980) << 9) | (10 << 5) | 10 = 46 * 512 + 320 + 10 = 23882 = 0x5D4A
  const dosTime = 0x6000;
  const dosDate = 0x5D4A;

  // Phase 1: Prepare file entries with byte data and CRC-32
  for (const file of files) {
    const filenameBytes = toUtf8(file.path);
    const contentBytes = toUtf8(file.content);
    const crc = crc32(contentBytes);
    const localHeaderSize = 30 + filenameBytes.length + contentBytes.length;

    fileEntries.push({
      path: file.path,
      filenameBytes,
      contentBytes,
      crc,
      localHeaderSize,
      offset: 0 // Will be calculated in Phase 2
    });

    totalLocalHeadersSize += localHeaderSize;
  }

  // Calculate Central Directory size
  let centralDirectorySize = 0;
  for (const entry of fileEntries) {
    centralDirectorySize += 46 + entry.filenameBytes.length;
  }

  const totalSize = totalLocalHeadersSize + centralDirectorySize + 22;
  const buffer = new ArrayBuffer(totalSize);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  let currentOffset = 0;

  // Phase 2: Write Local File Headers & Data
  for (const entry of fileEntries) {
    entry.offset = currentOffset;

    // Local file header signature (0x04034b50)
    writeUint32(view, currentOffset, 0x04034b50);
    // Version needed to extract (1.0 = 10)
    writeUint16(view, currentOffset + 4, 10);
    // General purpose bit flag (0)
    writeUint16(view, currentOffset + 6, 0);
    // Compression method (0 = store)
    writeUint16(view, currentOffset + 8, 0);
    // Last mod file time
    writeUint16(view, currentOffset + 10, dosTime);
    // Last mod file date
    writeUint16(view, currentOffset + 12, dosDate);
    // CRC-32
    writeUint32(view, currentOffset + 14, entry.crc);
    // Compressed size
    writeUint32(view, currentOffset + 18, entry.contentBytes.length);
    // Uncompressed size
    writeUint32(view, currentOffset + 22, entry.contentBytes.length);
    // File name length
    writeUint16(view, currentOffset + 26, entry.filenameBytes.length);
    // Extra field length
    writeUint16(view, currentOffset + 28, 0);

    currentOffset += 30;

    // Write file name
    bytes.set(entry.filenameBytes, currentOffset);
    currentOffset += entry.filenameBytes.length;

    // Write file content
    bytes.set(entry.contentBytes, currentOffset);
    currentOffset += entry.contentBytes.length;
  }

  const centralDirectoryOffset = currentOffset;

  // Phase 3: Write Central Directory Headers
  for (const entry of fileEntries) {
    // Central directory header signature (0x02014b50)
    writeUint32(view, currentOffset, 0x02014b50);
    // Version made by (2.0 = 20)
    writeUint16(view, currentOffset + 4, 20);
    // Version needed to extract (1.0 = 10)
    writeUint16(view, currentOffset + 6, 10);
    // General purpose bit flag
    writeUint16(view, currentOffset + 8, 0);
    // Compression method (0 = store)
    writeUint16(view, currentOffset + 10, 0);
    // Last mod file time
    writeUint16(view, currentOffset + 12, dosTime);
    // Last mod file date
    writeUint16(view, currentOffset + 14, dosDate);
    // CRC-32
    writeUint32(view, currentOffset + 16, entry.crc);
    // Compressed size
    writeUint32(view, currentOffset + 20, entry.contentBytes.length);
    // Uncompressed size
    writeUint32(view, currentOffset + 24, entry.contentBytes.length);
    // File name length
    writeUint16(view, currentOffset + 28, entry.filenameBytes.length);
    // Extra field length
    writeUint16(view, currentOffset + 30, 0);
    // File comment length
    writeUint16(view, currentOffset + 32, 0);
    // Disk number start
    writeUint16(view, currentOffset + 34, 0);
    // Internal file attributes
    writeUint16(view, currentOffset + 36, 0);
    // External file attributes (0644 mode regular file: 0x81a40000)
    writeUint32(view, currentOffset + 38, 0x81a40000);
    // Relative offset of local header
    writeUint32(view, currentOffset + 42, entry.offset);

    currentOffset += 46;

    // Write file name
    bytes.set(entry.filenameBytes, currentOffset);
    currentOffset += entry.filenameBytes.length;
  }

  // Phase 4: Write End of Central Directory Record (EOCD)
  // EOCD signature (0x06054b50)
  writeUint32(view, currentOffset, 0x06054b50);
  // Number of this disk
  writeUint16(view, currentOffset + 4, 0);
  // Disk where central directory starts
  writeUint16(view, currentOffset + 6, 0);
  // Number of central directory records on this disk
  writeUint16(view, currentOffset + 8, fileEntries.length);
  // Total number of central directory records
  writeUint16(view, currentOffset + 10, fileEntries.length);
  // Size of central directory
  writeUint32(view, currentOffset + 12, centralDirectorySize);
  // Offset of start of central directory
  writeUint32(view, currentOffset + 16, centralDirectoryOffset);
  // ZIP comment length
  writeUint16(view, currentOffset + 20, 0);

  return bytes;
}
