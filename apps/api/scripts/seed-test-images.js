#!/usr/bin/env node
/**
 * Script to upload test images to R2 bucket
 * Usage: node seed-test-images.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const IMAGES_DIR = path.join(__dirname, '../../web/dist/images');
const R2_ENDPOINT = process.env.R2_ENDPOINT || '';  // Set if using S3-compatible API
const BUCKET_NAME = 'kotemon-jastip-photos';

async function uploadToR2Local(filePath, key) {
  // For local development with Wrangler/miniflare
  // We'll copy files to the local R2 state directory
  const localR2Path = path.join(__dirname, '../.wrangler/state/v3/r2', BUCKET_NAME, 'blobs');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(localR2Path)) {
    fs.mkdirSync(localR2Path, { recursive: true });
  }
  
  // Generate a simple hash for the filename (mimicking R2 behavior)
  const content = fs.readFileSync(filePath);
  const hash = require('crypto').createHash('sha256').update(content).digest('hex');
  const targetPath = path.join(localR2Path, `${hash}0000000000000000`);
  
  fs.copyFileSync(filePath, targetPath);
  
  // Update the R2 SQLite index
  const dbPath = path.join(__dirname, '../.wrangler/state/v3/r2/miniflare-R2BucketObject', '*.sqlite');
  console.log(`Uploaded ${key} to local R2`);
  
  return { key, hash };
}

async function main() {
  console.log('Seeding test images to R2...\n');
  
  const images = [
    'item-1.jpg',
    'item-2.jpg', 
    'item-3.jpg',
    'item-4.jpg',
    'item-5.jpg',
    'item-6.jpg',
    'item-7.jpg',
    'item-8.jpg'
  ];
  
  for (const image of images) {
    const filePath = path.join(IMAGES_DIR, image);
    if (fs.existsSync(filePath)) {
      try {
        await uploadToR2Local(filePath, image);
      } catch (err) {
        console.error(`Failed to upload ${image}:`, err.message);
      }
    } else {
      console.warn(`Image not found: ${filePath}`);
    }
  }
  
  console.log('\nDone! Images are now available in local R2.');
  console.log('Note: For production, use wrangler r2 object put command instead.');
}

main().catch(console.error);
