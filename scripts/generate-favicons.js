const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Make sure the scripts directory exists
fs.mkdirSync(path.join(__dirname), { recursive: true });

// Path to the SVG file
const svgPath = path.join(__dirname, '../public/me-logo.svg');

// Function to generate favicons
async function generateFavicons() {
  const sizes = [16, 32, 48, 64, 128, 180, 192, 512];
  
  // Create the favicon directory if it doesn't exist
  fs.mkdirSync(path.join(__dirname, '../public/favico'), { recursive: true });
  
  // Read the SVG file
  const svgBuffer = fs.readFileSync(svgPath);
  
  // Generate favicons of different sizes
  for (const size of sizes) {
    const outputPath = path.join(__dirname, `../public/favico/favicon-${size}x${size}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`Generated ${outputPath}`);
  }
  
  // Create special named files
  await sharp(path.join(__dirname, '../public/favico/favicon-16x16.png'))
    .toFile(path.join(__dirname, '../public/favico/favicon.ico'));
  console.log('Generated favicon.ico');
  
  await sharp(path.join(__dirname, '../public/favico/favicon-180x180.png'))
    .toFile(path.join(__dirname, '../public/favico/apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');
}

// Run the function
generateFavicons()
  .then(() => console.log('Favicon generation complete!'))
  .catch(err => console.error('Error generating favicons:', err)); 