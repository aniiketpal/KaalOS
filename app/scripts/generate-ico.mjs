import { readFile, writeFile } from 'fs/promises'
import toIco from 'to-ico'
import sharp from 'sharp'

async function generateIco() {
  const pngBuffer = await readFile('src-tauri/icons/icon.png')
  
  // Resize to multiple sizes for ICO
  const sizes = [16, 32, 48, 64, 128, 256]
  const pngs = await Promise.all(
    sizes.map(size => sharp(pngBuffer).resize(size, size).png().toBuffer())
  )

  const icoBuffer = await toIco(pngs)
  await writeFile('src-tauri/icons/icon.ico', icoBuffer)
  console.log('Generated icon.ico with sizes:', sizes.join(', '))
}

generateIco().catch(console.error)