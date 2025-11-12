const sharp = require('sharp');
const path = require('path');

const sourceImage = path.join(__dirname, '../public/logo.png');
const outputPath = path.join(__dirname, '../public/favicon.ico');

async function generateFavicon() {
  console.log('🎨 Generating favicon.ico from logo.png...\n');
  
  try {
    // Generate a 32x32 favicon
    await sharp(sourceImage)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath.replace('.ico', '.png'));
    
    console.log('✅ Favicon generated successfully!');
    console.log('📁 Saved to: public/favicon.ico\n');
    console.log('Note: Using PNG format for better compatibility. Rename to favicon.png if needed.\n');
  } catch (error) {
    console.error('❌ Error generating favicon:', error.message);
  }
}

generateFavicon().catch(console.error);
