const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateIcons() {
  const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Create a simple SVG icon with a wizard hat and PDF text
  const svgIcon = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#2563eb" rx="50"/>
      <text x="256" y="220" font-family="Arial, sans-serif" font-size="120" font-weight="bold" text-anchor="middle" fill="white">PDF</text>
      <text x="256" y="340" font-family="Arial, sans-serif" font-size="80" text-anchor="middle" fill="white">&#x1FA84;</text>
      <text x="256" y="420" font-family="Arial, sans-serif" font-size="60" text-anchor="middle" fill="white">Wizard</text>
    </svg>
  `;
  
  try {
    // Generate icons for each size
    for (const size of sizes) {
      await sharp(Buffer.from(svgIcon))
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, `icon-${size}x${size}.png`));
      console.log(`Generated icon-${size}x${size}.png`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();