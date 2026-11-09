import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  // Minimal uncompressed/deflated raw PNG generator
  const signature = Buffer.from([139, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: 2 (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with 0 filter byte
  const scanlineWidth = 1 + width * 3;
  const rawData = Buffer.alloc(height * scanlineWidth);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineWidth;
    rawData[rowOffset] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Draw a Netflix red N shape or background
      const inMargin = x > width * 0.25 && x < width * 0.75 && y > height * 0.2 && y < height * 0.8;
      if (inMargin) {
        rawData[pixelOffset] = 229;     // R
        rawData[pixelOffset + 1] = 9;   // G
        rawData[pixelOffset + 2] = 20;  // B
      } else {
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}

fs.writeFileSync('./public/icon-192.png', createPNG(192, 192, 20, 20, 20));
fs.writeFileSync('./public/icon-512.png', createPNG(512, 512, 20, 20, 20));
fs.writeFileSync('./public/icon-maskable-512.png', createPNG(512, 512, 20, 20, 20));
fs.writeFileSync('./public/apple-touch-icon.png', createPNG(180, 180, 20, 20, 20));
console.log('PWA PNG icons generated successfully!');
