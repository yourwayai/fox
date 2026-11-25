import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const APP_NAME = 'Fox';
const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
const VERSION = pkg.version || '0.1.0';
const ARCH = process.arch === 'arm64' ? 'aarch64' : 'x64';

// Check possible locations for Fox.app
const possibleAppPaths = [
  path.join(os.homedir(), '.cache', 'fox-target', 'release', 'bundle', 'macos', `${APP_NAME}.app`),
  path.join(process.cwd(), 'src-tauri', 'target', 'release', 'bundle', 'macos', `${APP_NAME}.app`),
];

const appPath = possibleAppPaths.find((p) => fs.existsSync(p));

if (!appPath) {
  console.error('❌ Fox.app not found. Please build the app bundle first.');
  process.exit(1);
}

console.log(`📦 Found application bundle at: ${appPath}`);

// Target output DMG path
const outDir = path.join(os.homedir(), '.cache', 'fox-target', 'release', 'bundle', 'dmg');
fs.mkdirSync(outDir, { recursive: true });
const dmgPath = path.join(outDir, `${APP_NAME}_${VERSION}_${ARCH}.dmg`);

// Create temporary staging folder
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fox-dmg-'));
const stageAppPath = path.join(tmpDir, `${APP_NAME}.app`);
const stageAppsLink = path.join(tmpDir, 'Applications');

console.log(`📁 Preparing DMG staging area at: ${tmpDir}`);

try {
  // Copy Fox.app into staging preserving permissions
  execSync(`cp -R "${appPath}" "${stageAppPath}"`, { stdio: 'inherit' });

  // Create Applications symlink for drag-and-drop install
  fs.symlinkSync('/Applications', stageAppsLink);

  // Run hdiutil create to generate UDZO compressed DMG
  console.log(`💿 Packaging ${APP_NAME}_${VERSION}_${ARCH}.dmg via hdiutil...`);
  if (fs.existsSync(dmgPath)) {
    fs.unlinkSync(dmgPath);
  }

  execSync(
    `hdiutil create -volname "${APP_NAME}" -srcfolder "${tmpDir}" -ov -format UDZO "${dmgPath}"`,
    { stdio: 'inherit' }
  );

  const stats = fs.statSync(dmgPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n🎉 DMG created successfully!`);
  console.log(`📍 Path: ${dmgPath}`);
  console.log(`📊 Size: ${sizeMb} MB`);
} finally {
  // Clean up staging directory
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (err) {
    // ignore cleanup errors
  }
}
