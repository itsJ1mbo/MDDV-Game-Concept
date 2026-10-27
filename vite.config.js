import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];

function copyFolderRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    if (item.isDirectory()) {
      copyFolderRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyAssetPlugin() {
  let outDir = 'docs';
  return {
    name: 'copy-asset-plugin',
    configResolved(config) {
      outDir = config.build.outDir || 'docs';
    },
    closeBundle() {
      const srcDir = path.resolve(process.cwd(), 'asset');
      const targetDir = path.resolve(process.cwd(), outDir, 'asset');
      copyFolderRecursive(srcDir, targetDir);
    },
  };
}

export default defineConfig({
  build: { chunkSizeWarningLimit: 5000 },
  base: repositoryName ? `/${repositoryName}/` : './',
  plugins: [copyAssetPlugin()],
});
