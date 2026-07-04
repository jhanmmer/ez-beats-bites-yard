const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcDir = path.join(__dirname, 'src');

async function compressImage(filename, quality = 80) {
    const inputPath = path.join(srcDir, filename);
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);
    const outputPath = path.join(srcDir, `${basename}.webp`);
    
    if (!fs.existsSync(inputPath)) {
        console.log(`File not found: ${inputPath}`);
        return;
    }
    
    console.log(`Compressing ${filename}...`);
    try {
        await sharp(inputPath)
            .webp({ quality: quality })
            .toFile(outputPath);
        
        const originalSize = fs.statSync(inputPath).size;
        const compressedSize = fs.statSync(outputPath).size;
        console.log(`Successfully compressed ${filename} to webp!`);
        console.log(`Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Compressed size: ${(compressedSize / 1024).toFixed(2)} KB`);
        console.log(`Saved to: ${outputPath}\n`);
    } catch (err) {
        console.error(`Error compressing ${filename}:`, err);
    }
}

async function run() {
    await compressImage('yard_dining.png', 75);
    await compressImage('image.png', 80);
    await compressImage('banner.png', 75);
}

run();
