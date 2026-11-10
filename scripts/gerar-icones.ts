/**
 * Rasterizes src/app/icon.svg into src/app/favicon.ico (32px) and
 * src/app/apple-icon.png (180px). Both use the dark variant: the script
 * strips the prefers-color-scheme media block so the default (dark) fills apply.
 * Run: corepack pnpm exec tsx scripts/gerar-icones.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const dir = path.join(process.cwd(), 'src', 'app')
const svg = readFileSync(path.join(dir, 'icon.svg'), 'utf8').replace(
  /@media[^{]*\{[\s\S]*?\}\s*\}/,
  '',
)
const input = Buffer.from(svg)

async function png(size: number): Promise<Buffer> {
  return sharp(input, { density: (72 * size) / 64 * 4 })
    .resize(size, size)
    .png()
    .toBuffer()
}

/** Single-image ICO wrapping a PNG payload (supported by all modern browsers). */
function ico(pngBuf: Buffer, size: number): Buffer {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // image count
  header.writeUInt8(size, 6) // width
  header.writeUInt8(size, 7) // height
  header.writeUInt16LE(1, 10) // planes
  header.writeUInt16LE(32, 12) // bpp
  header.writeUInt32LE(pngBuf.length, 14) // size
  header.writeUInt32LE(22, 18) // offset
  return Buffer.concat([header, pngBuf])
}

async function main() {
  writeFileSync(path.join(dir, 'favicon.ico'), ico(await png(32), 32))
  writeFileSync(path.join(dir, 'apple-icon.png'), await png(180))
  console.log('favicon.ico (32px) and apple-icon.png (180px) written')
}

void main()
