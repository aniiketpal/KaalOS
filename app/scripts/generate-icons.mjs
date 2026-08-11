import sharp from 'sharp'
import { existsSync } from 'fs'

const inputPath = 'src-tauri/icons/icon.png'
const iconsDir = 'src-tauri/icons'

async function generateIcons() {
  if (!existsSync(inputPath)) {
    console.error('Source icon not found at', inputPath)
    process.exit(1)
  }

  // 32x32
  await sharp(inputPath).resize(32, 32).png().toFile(`${iconsDir}/32x32.png`)
  console.log('Generated 32x32.png')

  // 128x128
  await sharp(inputPath).resize(128, 128).png().toFile(`${iconsDir}/128x128.png`)
  console.log('Generated 128x128.png')

  // 128x128@2x (256x256)
  await sharp(inputPath).resize(256, 256).png().toFile(`${iconsDir}/128x128@2x.png`)
  console.log('Generated 128x128@2x.png')

  // ICO (Windows) - multiple sizes
  await sharp(inputPath).resize(256, 256).toFile(`${iconsDir}/icon.ico`)
  console.log('Generated icon.ico')

  // ICNS (macOS) - using png as base, user can convert with iconutil if needed
  await sharp(inputPath).resize(1024, 1024).png().toFile(`${iconsDir}/icon_1024.png`)
  console.log('Generated icon_1024.png (for icns conversion)')

  console.log('\nDone! For macOS .icns, run:')
  console.log('  mkdir icons.iconset')
  console.log('  cp src-tauri/icons/icon_1024.png icons.iconset/icon_512x512@2x.png')
  console.log('  iconutil -c icns icons.iconset -o src-tauri/icons/icon.icns')
}

generateIcons().catch(console.error)