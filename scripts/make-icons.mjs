/**
 * Generálja a PWA ikonokat a public/ mappába.
 *
 * Nincs képfeldolgozó függőség: a PNG-t közvetlenül írjuk meg a Node
 * beépített zlib-jével. Egy PNG mindössze egy aláírás és néhány
 * CRC-vel lezárt darab (chunk), tehát ez kevesebb kód, mint amennyi
 * egy külső könyvtár behúzásának a kockázata lenne.
 *
 * Futtatás:  node scripts/make-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const COLORS = {
  background: [15, 23, 42], // slate-900, egyezik a theme_color-ral
  road: [51, 65, 85], // slate-700
  stripe: [250, 204, 21], // yellow-400
  car1: [239, 68, 68], // red-500
  car2: [59, 130, 246], // blue-500
}

/** CRC32 a PNG chunk-ok lezárásához. */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typed))
  return Buffer.concat([length, typed, crc])
}

/** RGB pixelpuffer PNG bájtokká. */
function encodePng(width, height, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bitmélység
  ihdr[9] = 2 // színtípus: truecolour (RGB)

  // Minden képsor elé egy szűrő-bájt kell; a 0 jelenti, hogy nincs szűrés.
  const stride = width * 3
  const raw = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function draw(size) {
  const pixels = Buffer.alloc(size * size * 3)
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 3
    pixels[i] = r
    pixels[i + 1] = g
    pixels[i + 2] = b
  }
  const rect = (x0, y0, w, h, color) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, color)
  }
  const disc = (cx, cy, radius, color) => {
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) set(x, y, color)
      }
    }
  }

  const u = size / 16 // rácsegység, hogy minden méretben arányos maradjon

  rect(0, 0, size, size, COLORS.background)
  // Út a kép közepén, függőlegesen
  rect(Math.round(u * 5.5), 0, Math.round(u * 5), size, COLORS.road)
  // Szaggatott felezővonal
  for (let y = 0; y < size; y += Math.round(u * 3)) {
    rect(Math.round(u * 7.7), y + Math.round(u * 0.5), Math.round(u * 0.6), Math.round(u * 1.8), COLORS.stripe)
  }
  // A két versenyző autó, a saját sávjában. A sugár úgy van megválasztva,
  // hogy a korongok ne lógjanak túl az út szélén.
  disc(Math.round(u * 6.9), Math.round(u * 5), Math.round(u * 1.3), COLORS.car1)
  disc(Math.round(u * 9.1), Math.round(u * 11), Math.round(u * 1.3), COLORS.car2)

  return encodePng(size, size, pixels)
}

mkdirSync(PUBLIC_DIR, { recursive: true })

for (const size of [192, 512]) {
  const file = join(PUBLIC_DIR, `icon-${size}.png`)
  writeFileSync(file, draw(size))
  console.log(`wrote ${file}`)
}
