/** Width and height from a PNG or JPEG header. */
export function pictureSize(bytes: Buffer): [number, number] {
  if (bytes.readUInt32BE(0) === 0x89504e47) return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  // JPEG: walk the segments to the frame header (SOF0-SOF15, but not DHT, JPG or DAC).
  let at = 2;
  while (at < bytes.length) {
    const marker = bytes.readUInt8(at + 1);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return [bytes.readUInt16BE(at + 7), bytes.readUInt16BE(at + 5)];
    }
    at += 2 + bytes.readUInt16BE(at + 2);
  }
  throw new Error('not a PNG or JPEG');
}
