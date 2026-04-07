import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const dir = 'public/images';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

async function processFiles() {
  for (const file of files) {
    const filePath = path.join(dir, file);
    const webpPath = path.join(dir, file.replace('.png', '.webp'));
    
    try {
      await sharp(filePath)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webpPath);
        
      console.log(`Converted ${file} to ${file.replace('.png', '.webp')}`);
      
      // Delete original PNG
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }
  }
}

processFiles();
