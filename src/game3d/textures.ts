import * as THREE from 'three';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return [c, ctx];
}

function finalizeColorTex(
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1,
  maxAniso = 4
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

export interface ProceduralTextures {
  terracotta: THREE.CanvasTexture;
  stone: THREE.CanvasTexture;
  grass: THREE.CanvasTexture;
  wood: THREE.CanvasTexture;
  crate: THREE.CanvasTexture;
  water: THREE.CanvasTexture;
  stucco: THREE.CanvasTexture;
  conveyor: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAniso = 4): ProceduralTextures {
  // 1. Terracotta roof tiles
  const [rc, rctx] = makeCanvas(128, 128);
  rctx.fillStyle = '#D96B27';
  rctx.fillRect(0, 0, 128, 128);
  for (let row = 0; row < 4; row++) {
    const y = row * 32;
    for (let col = 0; col < 4; col++) {
      const x = col * 32 + (row % 2 === 1 ? 16 : 0);
      rctx.fillStyle = (row + col) % 2 === 0 ? '#E07A38' : '#C95E1E';
      rctx.fillRect(x % 128, y + 2, 30, 28);
      rctx.fillStyle = 'rgba(255, 224, 178, 0.28)';
      rctx.fillRect(x % 128, y + 2, 30, 4);
      rctx.fillStyle = 'rgba(78, 34, 12, 0.32)';
      rctx.fillRect(x % 128, y + 28, 30, 4);
    }
  }
  const terracotta = finalizeColorTex(rc, 2, 2, maxAniso);

  // 2. Cobblestone / Courtyard Stone
  const [sc, sctx] = makeCanvas(128, 128);
  sctx.fillStyle = '#D7CCC8';
  sctx.fillRect(0, 0, 128, 128);
  const stonePalette = ['#EFEBE9', '#E0D6D1', '#D7CCC8', '#ECE5E1'];
  for (let row = 0; row < 4; row++) {
    const y = row * 32;
    const offset = row % 2 === 1 ? 16 : 0;
    for (let col = -1; col < 4; col++) {
      const x = col * 32 + offset;
      sctx.fillStyle = stonePalette[(row * 3 + col + 4) % stonePalette.length];
      sctx.fillRect(x + 2, y + 2, 28, 28);
      sctx.fillStyle = 'rgba(93, 64, 55, 0.16)';
      sctx.strokeStyle = '#A1887F';
      sctx.lineWidth = 2;
      sctx.strokeRect(x + 2, y + 2, 28, 28);
    }
  }
  const stone = finalizeColorTex(sc, 2, 2, maxAniso);

  // 3. Soft Pastel Grass Top
  const [gc, gctx] = makeCanvas(128, 128);
  gctx.fillStyle = '#9CCC65';
  gctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 120; i++) {
    const x = (i * 47) % 124;
    const y = (i * 83) % 124;
    gctx.fillStyle = i % 3 === 0 ? '#AED581' : i % 3 === 1 ? '#8BC34A' : '#DCEDC8';
    gctx.fillRect(x, y, 4, 6);
  }
  const grass = finalizeColorTex(gc, 2, 2, maxAniso);

  // 4. Warm Timber Planks (for docks, boats, bridges)
  const [wc, wctx] = makeCanvas(128, 128);
  wctx.fillStyle = '#B87B4B';
  wctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 4; i++) {
    const y = i * 32;
    wctx.fillStyle = i % 2 === 0 ? '#C98A56' : '#A96D3E';
    wctx.fillRect(0, y + 1, 128, 29);
    wctx.fillStyle = '#6D4C41';
    wctx.fillRect(0, y + 30, 128, 2);
    wctx.fillStyle = 'rgba(255, 243, 224, 0.14)';
    wctx.fillRect(0, y + 4, 128, 2);
  }
  const wood = finalizeColorTex(wc, 1, 1, maxAniso);

  // 5. Wooden Crate (with diagonal brace & frame)
  const [cc, cctx] = makeCanvas(128, 128);
  cctx.fillStyle = '#D99B52';
  cctx.fillRect(0, 0, 128, 128);
  // Inner planks
  cctx.fillStyle = '#C68642';
  cctx.fillRect(14, 14, 100, 100);
  cctx.strokeStyle = '#7A4924';
  cctx.lineWidth = 4;
  for (let i = 1; i <= 3; i++) {
    cctx.beginPath();
    cctx.moveTo(14, 14 + i * 25);
    cctx.lineTo(114, 14 + i * 25);
    cctx.stroke();
  }
  // Diagonal brace
  cctx.fillStyle = '#E8B168';
  cctx.save();
  cctx.translate(64, 64);
  cctx.rotate(Math.PI / 4);
  cctx.fillRect(-60, -10, 120, 20);
  cctx.strokeRect(-60, -10, 120, 20);
  cctx.restore();
  // Outer wooden border
  cctx.strokeStyle = '#6D4C41';
  cctx.lineWidth = 14;
  cctx.strokeRect(7, 7, 114, 114);
  // Corner nails
  cctx.fillStyle = '#4E342E';
  for (const [nx, ny] of [
    [10, 10],
    [118, 10],
    [10, 118],
    [118, 118],
  ]) {
    cctx.beginPath();
    cctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
    cctx.fill();
  }
  const crate = finalizeColorTex(cc, 1, 1, maxAniso);

  // 6. Sparkling Ocean / Water Foam Pattern
  const [wtc, wtctx] = makeCanvas(256, 256);
  wtctx.fillStyle = '#1976D2';
  wtctx.fillRect(0, 0, 256, 256);
  const wg = wtctx.createLinearGradient(0, 0, 256, 256);
  wg.addColorStop(0, '#29B6F6');
  wg.addColorStop(0.5, '#0288D1');
  wg.addColorStop(1, '#29B6F6');
  wtctx.fillStyle = wg;
  wtctx.fillRect(0, 0, 256, 256);
  wtctx.strokeStyle = 'rgba(225, 245, 254, 0.35)';
  wtctx.lineWidth = 3;
  for (let y = 16; y < 256; y += 32) {
    wtctx.beginPath();
    for (let x = 0; x <= 256; x += 16) {
      const wy = y + Math.sin((x / 256) * Math.PI * 4 + y) * 5;
      if (x === 0) wtctx.moveTo(x, wy);
      else wtctx.lineTo(x, wy);
    }
    wtctx.stroke();
  }
  const water = finalizeColorTex(wtc, 10, 10, maxAniso);

  // 7. Cream Pastel Stucco Wall
  const [stc, stctx] = makeCanvas(128, 128);
  stctx.fillStyle = '#FFF3E0';
  stctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 160; i++) {
    stctx.fillStyle = i % 2 === 0 ? 'rgba(215, 204, 200, 0.25)' : 'rgba(255, 255, 255, 0.3)';
    stctx.fillRect((i * 31) % 124, (i * 53) % 124, 6, 4);
  }
  const stucco = finalizeColorTex(stc, 2, 2, maxAniso);

  // 8. Conveyor Belt Chevron Texture
  const [cvc, cvctx] = makeCanvas(128, 128);
  cvctx.fillStyle = '#37474F';
  cvctx.fillRect(0, 0, 128, 128);
  cvctx.strokeStyle = '#FFD54F';
  cvctx.lineWidth = 10;
  for (let x = -32; x <= 160; x += 32) {
    cvctx.beginPath();
    cvctx.moveTo(x, 12);
    cvctx.lineTo(x + 24, 64);
    cvctx.lineTo(x, 116);
    cvctx.stroke();
  }
  cvctx.fillStyle = '#263238';
  cvctx.fillRect(0, 0, 128, 8);
  cvctx.fillRect(0, 120, 128, 8);
  const conveyor = finalizeColorTex(cvc, 2, 1, maxAniso);

  return {
    terracotta,
    stone,
    grass,
    wood,
    crate,
    water,
    stucco,
    conveyor,
    dispose: () => {
      terracotta.dispose();
      stone.dispose();
      grass.dispose();
      wood.dispose();
      crate.dispose();
      water.dispose();
      stucco.dispose();
      conveyor.dispose();
    },
  };
}
