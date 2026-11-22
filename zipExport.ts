import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

export interface ZipBuildResult {
  buffer: Buffer;
  fileCount: number;
}

const GITHUB_PAGES_WORKFLOW = `name: Deploy BUBUB 3D to GitHub Pages

on:
  push:
    branches: ["main", "master"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Install dependencies
        run: npm install
      - name: Build static site
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

const PROJECT_README = `# BUBUB 3D — Isol & Salman Co-op Adventure

Game co-op puzzle platformer 3D untuk dimainkan berdua (1 layar maupun LDR Online + Voice Chat).

## Cara Hosting ke GitHub Pages (Gratis)
1. Ekstrak semua isi ZIP ini ke folder komputer, lalu upload semua file & folder ke repository GitHub kamu.
2. Buka **Settings -> Pages** di repository GitHub kamu.
3. Pada bagian **Build and deployment -> Source**, pilih **GitHub Actions**.
4. Workflow \`.github/workflows/deploy.yml\` sudah disertakan dan akan otomatis mem-build lalu men-deploy ke link GitHub Pages kamu!

> Alternatif cepat tanpa Actions: gunakan paket **Web Statis (.zip)**, ekstrak isinya, lalu upload langsung ke repo GitHub dan pilih **Deploy from a branch -> main / (root)** di Settings -> Pages.

## Cara Menjalankan Lokal / Hosting Full (LDR Online + Voice Chat)
\`\`\`bash
npm install
npm run build
npx tsx server.ts
\`\`\`
Atau jalankan \`npm run dev\` untuk mode pengembangan pada port 3000.
`;

function addDirectoryToZip(
  zip: JSZip,
  baseDir: string,
  zipPrefix: string,
  allowedRoot: string,
  counter: { count: number }
) {
  const resolvedDir = path.resolve(baseDir);
  if (!resolvedDir.startsWith(allowedRoot) || !fs.existsSync(resolvedDir)) return;

  const items = fs.readdirSync(resolvedDir, { withFileTypes: true });
  for (const item of items) {
    if (
      item.name === 'node_modules' ||
      item.name === '.git' ||
      item.name === '.aistudio' ||
      item.name.endsWith('.zip')
    ) {
      continue;
    }
    const fullPath = path.resolve(resolvedDir, item.name);
    if (!fullPath.startsWith(allowedRoot)) continue;

    const relZipPath = zipPrefix ? `${zipPrefix}/${item.name}` : item.name;
    if (item.isDirectory()) {
      addDirectoryToZip(zip, fullPath, relZipPath, allowedRoot, counter);
    } else if (item.isFile()) {
      zip.file(relZipPath, fs.readFileSync(fullPath), { binary: true });
      counter.count += 1;
    }
  }
}

export async function createStaticSiteZip(projectRoot: string): Promise<ZipBuildResult | null> {
  const root = path.resolve(projectRoot);
  const distDir = path.resolve(root, 'dist');
  const indexHtml = path.resolve(distDir, 'index.html');
  if (!fs.existsSync(indexHtml)) return null;

  const zip = new JSZip();
  const counter = { count: 0 };
  addDirectoryToZip(zip, distDir, '', distDir, counter);
  if (counter.count === 0) return null;

  // Add .nojekyll so GitHub Pages serves all assets cleanly
  zip.file('.nojekyll', '');
  counter.count += 1;

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    platform: 'UNIX',
  });

  return { buffer, fileCount: counter.count };
}

export async function createFullProjectZip(projectRoot: string): Promise<ZipBuildResult> {
  const root = path.resolve(projectRoot);
  const zip = new JSZip();
  const counter = { count: 0 };

  const rootFiles = [
    'index.html',
    'package.json',
    'package-lock.json',
    'server.ts',
    'zipExport.ts',
    'tsconfig.json',
    'vite.config.ts',
    'metadata.json',
    '.env.example',
    '.gitignore',
  ];

  for (const fname of rootFiles) {
    const fpath = path.resolve(root, fname);
    if (fpath.startsWith(root) && fs.existsSync(fpath) && fs.statSync(fpath).isFile()) {
      zip.file(fname, fs.readFileSync(fpath), { binary: true });
      counter.count += 1;
    }
  }

  for (const dirName of ['src', 'public', 'dist']) {
    const dpath = path.resolve(root, dirName);
    addDirectoryToZip(zip, dpath, dirName, root, counter);
  }

  // Include ready-to-use GitHub Pages workflow & README
  zip.file('.github/workflows/deploy.yml', GITHUB_PAGES_WORKFLOW);
  counter.count += 1;
  if (!fs.existsSync(path.resolve(root, 'README.md'))) {
    zip.file('README.md', PROJECT_README);
    counter.count += 1;
  }

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    platform: 'UNIX',
  });

  return { buffer, fileCount: counter.count };
}
