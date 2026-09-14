import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const androidAssetsDir = join(root, 'android', 'app', 'src', 'main', 'assets', 'public');

if (existsSync(androidAssetsDir)) {
  rmSync(androidAssetsDir, { recursive: true, force: true });
  console.log('Removed previous Android web assets before Capacitor sync.');
}
