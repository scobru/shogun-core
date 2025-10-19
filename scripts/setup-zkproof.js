#!/usr/bin/env node

/**
 * Setup script for ZK-Proof circuit files
 * Downloads Semaphore circuit files from trusted setup
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CIRCUIT_DIR = path.join(__dirname, '..', 'circuits', 'semaphore', '20');
const BASE_URL = 'https://www.trusted-setup-pse.org/semaphore/20';

const FILES = [
  { name: 'semaphore.wasm', size: '~2MB', description: 'ZK Circuit (WebAssembly)' },
  { name: 'semaphore.zkey', size: '~50MB', description: 'Proving Key' }
];

function createDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    console.log(`⬇️  Downloading: ${path.basename(dest)}...`);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        return https.get(response.headers.location, (redirectResponse) => {
          const total = parseInt(redirectResponse.headers['content-length'], 10);
          let downloaded = 0;

          redirectResponse.on('data', (chunk) => {
            downloaded += chunk.length;
            const percent = ((downloaded / total) * 100).toFixed(1);
            process.stdout.write(`\r   Progress: ${percent}% (${(downloaded / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB)`);
          });

          redirectResponse.pipe(file);

          file.on('finish', () => {
            file.close();
            console.log('\n✅ Download complete!');
            resolve();
          });
        }).on('error', reject);
      } else {
        const total = parseInt(response.headers['content-length'], 10);
        let downloaded = 0;

        response.on('data', (chunk) => {
          downloaded += chunk.length;
          const percent = ((downloaded / total) * 100).toFixed(1);
          process.stdout.write(`\r   Progress: ${percent}% (${(downloaded / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB)`);
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log('\n✅ Download complete!');
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });

    file.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('🔐 ZK-Proof Circuit Files Setup');
  console.log('================================\n');

  // Create directory
  console.log('📁 Setting up directories...');
  createDirectory(CIRCUIT_DIR);

  // Check if files already exist
  const existingFiles = FILES.filter(f => 
    fs.existsSync(path.join(CIRCUIT_DIR, f.name))
  );

  if (existingFiles.length === FILES.length) {
    console.log('\n✅ All circuit files already exist!');
    console.log('   To re-download, delete the circuits directory and run again.\n');
    return;
  }

  console.log('\n📥 Downloading circuit files from PSE trusted setup...');
  console.log('   Source: https://www.trusted-setup-pse.org\n');

  // Download each file
  for (const file of FILES) {
    const filePath = path.join(CIRCUIT_DIR, file.name);
    
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${file.name} (already exists)`);
      continue;
    }

    const url = `${BASE_URL}/${file.name}`;
    console.log(`📦 ${file.name}`);
    console.log(`   ${file.description} (${file.size})`);
    
    try {
      await downloadFile(url, filePath);
    } catch (error) {
      console.error(`\n❌ Failed to download ${file.name}:`, error.message);
      console.error('   Please check your internet connection and try again.\n');
      process.exit(1);
    }
    
    console.log('');
  }

  console.log('✨ Setup complete!');
  console.log('\n📚 You can now run ZK-Proof examples:');
  console.log('   yarn tsx src/examples/zkproof-example.ts\n');
}

main().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
});

