# BUBUB 3D — Isol & Salman Co-op Adventure

Game co-op puzzle platformer 3D untuk dimainkan berdua (1 layar maupun LDR Online + Voice Chat).

## Cara Hosting ke GitHub Pages (Gratis)
1. Ekstrak semua isi ZIP ini ke folder komputer, lalu upload semua file & folder ke repository GitHub kamu.
2. Buka **Settings -> Pages** di repository GitHub kamu.
3. Pada bagian **Build and deployment -> Source**, pilih **GitHub Actions**.
4. Workflow `.github/workflows/deploy.yml` sudah disertakan dan akan otomatis mem-build lalu men-deploy ke link GitHub Pages kamu!

> Alternatif cepat tanpa Actions: gunakan paket **Web Statis (.zip)**, ekstrak isinya, lalu upload langsung ke repo GitHub dan pilih **Deploy from a branch -> main / (root)** di Settings -> Pages.

## Cara Menjalankan Lokal / Hosting Full (LDR Online + Voice Chat)
```bash
npm install
npm run build
npx tsx server.ts
```
Atau jalankan `npm run dev` untuk mode pengembangan pada port 3000.
