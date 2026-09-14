import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const distDir = join(root, 'dist');
const androidDir = join(root, 'android', 'app', 'src', 'main', 'assets', 'public');

if (!existsSync(distDir) || !existsSync(androidDir)) {
  console.error('Android asset verification failed: dist or Android assets directory is missing.');
  process.exit(1);
}

function filesUnder(dir, rootDir = dir) {
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...filesUnder(path, rootDir));
    else result.push(relative(rootDir, path));
  }
  return result.sort();
}

function hash(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

const distFiles = filesUnder(distDir, distDir);
const androidFiles = filesUnder(androidDir, androidDir);

const ALLOWED_ANDROID_ONLY_FILES = new Set([
  'cordova.js',
  'cordova_plugins.js',
]);
const expected = new Set(distFiles);
const actual = new Set(androidFiles);
const missing = distFiles.filter((file) => !actual.has(file));
const extra = androidFiles.filter((file) => !expected.has(file));
const unexpectedExtra = extra.filter((file) => !ALLOWED_ANDROID_ONLY_FILES.has(file));
const mismatched = distFiles.filter((file) => {
  if (!actual.has(file)) return false;
  return hash(join(distDir, file)) !== hash(join(androidDir, file));
});

if (missing.length || mismatched.length || unexpectedExtra.length) {
  console.error('Android bundled web assets are stale or incomplete.');
  if (missing.length) console.error('Missing:', missing.join(', '));
  if (mismatched.length) console.error('Mismatched:', mismatched.join(', '));
  if (unexpectedExtra.length) console.error('Unexpected Android-only files:', unexpectedExtra.join(', '));
  process.exit(1);
}

console.log(`Android asset verification passed: ${distFiles.length} dist files match Android assets.`);
if (extra.length) {
  const allowed = extra.filter((file) => ALLOWED_ANDROID_ONLY_FILES.has(file));
  if (allowed.length) console.log(`Allowed Android-only files: ${allowed.join(', ')}`);
}
