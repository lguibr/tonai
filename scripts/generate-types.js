import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TONE_DIR = path.resolve(__dirname, '../node_modules/tone/build/esm');
const OUTPUT_FILE = path.resolve(__dirname, '../src/tone-types.json');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      if (file.endsWith('.d.ts')) {
        arrayOfFiles.push(path.join(dirPath, '/', file));
      }
    }
  });

  return arrayOfFiles;
}

console.log('Scanning for .d.ts files in ' + TONE_DIR);
const allFiles = getAllFiles(TONE_DIR, []);
console.log('Found ' + allFiles.length + ' files.');

const typeMap = {};

allFiles.forEach((filePath) => {
  const relativePath = path.relative(TONE_DIR, filePath);
  // Normalize path separators for consistency
  const normalizedPath = relativePath.split(path.sep).join('/');
  let content = fs.readFileSync(filePath, 'utf8');

  // Strip .js extension from imports to ensure Monaco resolves them to .d.ts files
  // Handles: import ... from 'path.js', export ... from 'path.js', import('path.js')
  content = content.replace(/(from|import\s+)\s*['"]([^'"]+)\.js['"]/g, '$1 "$2"');
  content = content.replace(/import\(['"]([^'"]+)\.js['"]\)/g, 'import("$1")');

  typeMap[normalizedPath] = content;
});

// Ensure src directory exists
const srcDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(typeMap, null, 2));
console.log('Wrote types to ' + OUTPUT_FILE);
