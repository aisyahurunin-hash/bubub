import * as THREE from 'three';
import { AnimState, BoyOutfitId, GirlOutfitId } from '../game/types';

export interface CharacterRig3D {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headPivot: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  dizzyStars: THREE.Group;
  shadowMesh: THREE.Mesh;
  dispose: () => void;
}

function makeContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(62, 39, 35, 0.52)');
  grad.addColorStop(0.7, 'rgba(62, 39, 35, 0.18)');
  grad.addColorStop(1, 'rgba(62, 39, 35, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let sharedShadowTex: THREE.CanvasTexture | null = null;
function getShadowTex(): THREE.CanvasTexture {
  if (!sharedShadowTex) sharedShadowTex = makeContactShadowTexture();
  return sharedShadowTex;
}

function createMat(
  color: number | string,
  roughness = 0.65,
  metalness = 0.05,
  extra?: THREE.MeshStandardMaterialParameters
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    ...extra,
  });
}

function createBoxPart(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  castShadow = true
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = castShadow;
  m.receiveShadow = true;
  return m;
}

function createNameTagSprite(name: string, bgHex: string, borderHex: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 72;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bgHex;
  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(12, 10, 232, 52, 16);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 34px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4E342E';
  ctx.fillText(name, 128, 37);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.15, 0.34, 1);
  sprite.renderOrder = 20;
  return sprite;
}

function createDizzyStars(): THREE.Group {
  const grp = new THREE.Group();
  const mat = createMat('#FFD54F', 0.25, 0.6, {
    emissive: '#FFB300',
    emissiveIntensity: 0.45,
  });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), mat);
    star.position.set(Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34);
    grp.add(star);
  }
  grp.visible = false;
  return grp;
}

function createContactShadow(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(0.95, 0.95);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: getShadowTex(),
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.02;
  mesh.renderOrder = 2;
  return mesh;
}

/**
 * Karakter 1: Cewek Berhijab Pastel + Kacamata Bulat Bening + Almamater UNNES / Wardrobe
 * Total height ~ 1.62 units, bottom-center pivot at y = 0.
 */
export function buildGirlCharacter3D(outfit: GirlOutfitId): CharacterRig3D {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const palette = {
    unnes: {
      hijab: '#FFF3E0',
      hijabShade: '#F5DEC0',
      top: '#FBC02D', // Kuning Almamater UNNES
      inner: '#FFFDF7',
      bottom: '#37474F',
      shoe: '#4E342E',
      isSkirt: true,
      hasBadge: true,
      hasLapels: true,
    },
    blouse: {
      hijab: '#F8BBD0',
      hijabShade: '#F48FB1',
      top: '#FCE4EC',
      inner: '#FFFFFF',
      bottom: '#FFFFFF',
      shoe: '#AD1457',
      isSkirt: true,
      hasBadge: false,
      hasLapels: false,
    },
    sweater: {
      hijab: '#FFFFFF',
      hijabShade: '#E0E0E0',
      top: '#CE93D8',
      inner: '#F3E5F5',
      bottom: '#64B5F6',
      shoe: '#FFFFFF',
      isSkirt: false,
      hasBadge: false,
      hasLapels: false,
    },
    dress: {
      hijab: '#FFE0B2',
      hijabShade: '#FFCC80',
      top: '#FFAB91',
      inner: '#FFF8E1',
      bottom: '#FF8A65',
      shoe: '#6D4C41',
      isSkirt: true,
      hasBadge: false,
      hasLapels: true,
    },
  }[outfit];

  const skinMat = createMat('#FFE0C8', 0.72, 0.02);
  const blushMat = createMat('#FF9EBB', 0.8, 0);
  const eyeMat = createMat('#2D1E1A', 0.2, 0.1);
  const whiteMat = createMat('#FFFFFF', 0.3, 0);
  const hijabMat = createMat(palette.hijab, 0.85, 0.02);
  const hijabShadeMat = createMat(palette.hijabShade, 0.88, 0.02);
  const topMat = createMat(palette.top, 0.78, 0.04);
  const innerMat = createMat(palette.inner, 0.82, 0.02);
  const bottomMat = createMat(palette.bottom, 0.82, 0.03);
  const shoeMat = createMat(palette.shoe, 0.55, 0.08);
  const goldMat = createMat('#FFD54F', 0.25, 0.75);
  const glassesRimMat = createMat('#8D6E63', 0.25, 0.75);
  const glassLensMat = new THREE.MeshPhysicalMaterial({
    color: 0xe1f5fe,
    transparent: true,
    opacity: 0.22,
    roughness: 0.06,
    metalness: 0.0,
    depthWrite: false,
  });

  // --- Legs (y = 0 .. 0.44) ---
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.13, 0.44, 0);
  const legGeoL = createBoxPart(0.16, 0.34, 0.16, palette.isSkirt ? skinMat : bottomMat);
  legGeoL.position.y = -0.17;
  const shoeL = createBoxPart(0.18, 0.12, 0.24, shoeMat);
  shoeL.position.set(0, -0.38, 0.03);
  leftLeg.add(legGeoL, shoeL);
  bodyPivot.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.13, 0.44, 0);
  const legGeoR = createBoxPart(0.16, 0.34, 0.16, palette.isSkirt ? skinMat : bottomMat);
  legGeoR.position.y = -0.17;
  const shoeR = createBoxPart(0.18, 0.12, 0.24, shoeMat);
  shoeR.position.set(0, -0.38, 0.03);
  rightLeg.add(legGeoR, shoeR);
  bodyPivot.add(rightLeg);

  // --- Skirt or Pants Waist ---
  if (palette.isSkirt) {
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.34, 0.32, 14),
      bottomMat
    );
    skirt.position.y = 0.48;
    skirt.castShadow = true;
    skirt.receiveShadow = true;
    bodyPivot.add(skirt);
  } else {
    const pelvis = createBoxPart(0.46, 0.16, 0.28, bottomMat);
    pelvis.position.y = 0.48;
    bodyPivot.add(pelvis);
  }

  // --- Torso / Jacket / Sweater ---
  const torso = createBoxPart(0.48, 0.46, 0.3, topMat);
  torso.position.y = 0.78;
  bodyPivot.add(torso);

  // Inner shirt V-front & Gold buttons / Floral accent
  const frontInner = createBoxPart(0.16, 0.38, 0.04, innerMat);
  frontInner.position.set(0, 0.8, 0.145);
  bodyPivot.add(frontInner);

  if (palette.hasLapels) {
    const lapelL = createBoxPart(0.08, 0.26, 0.05, topMat);
    lapelL.position.set(-0.09, 0.84, 0.15);
    lapelL.rotation.z = 0.22;
    const lapelR = createBoxPart(0.08, 0.26, 0.05, topMat);
    lapelR.position.set(0.09, 0.84, 0.15);
    lapelR.rotation.z = -0.22;
    bodyPivot.add(lapelL, lapelR);
  }

  if (palette.hasBadge) {
    // Lambang UNNES emas di dada kiri
    const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 10), goldMat);
    badge.rotation.x = Math.PI / 2;
    badge.position.set(0.14, 0.86, 0.16);
    bodyPivot.add(badge);
    for (let b = 0; b < 2; b++) {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), goldMat);
      btn.position.set(0, 0.75 - b * 0.1, 0.165);
      bodyPivot.add(btn);
    }
  } else if (outfit === 'dress') {
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), createMat('#FF4081', 0.5, 0));
    flower.position.set(0.13, 0.78, 0.16);
    bodyPivot.add(flower);
  }

  // --- Arms ---
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.31, 0.94, 0);
  const sleeveL = createBoxPart(0.15, 0.34, 0.16, topMat);
  sleeveL.position.y = -0.15;
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), skinMat);
  handL.position.y = -0.35;
  handL.castShadow = true;
  leftArm.add(sleeveL, handL);
  bodyPivot.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.31, 0.94, 0);
  const sleeveR = createBoxPart(0.15, 0.34, 0.16, topMat);
  sleeveR.position.y = -0.15;
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), skinMat);
  handR.position.y = -0.35;
  handR.castShadow = true;
  rightArm.add(sleeveR, handR);
  bodyPivot.add(rightArm);

  // --- Head + Clean Rounded Hijab + Clear Round Glasses ---
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.04, 0);
  bodyPivot.add(headPivot);

  // Hijab drape around neck & shoulders (covers transition smoothly)
  const drape = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.34, 16),
    hijabMat
  );
  drape.position.set(0, 0.04, -0.02);
  drape.castShadow = true;
  headPivot.add(drape);

  const drapeFold = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.065, 10, 18),
    hijabShadeMat
  );
  drapeFold.rotation.x = Math.PI / 2;
  drapeFold.position.set(0, 0.02, 0.01);
  headPivot.add(drapeFold);

  // Smooth Rounded Pastel Hijab Hood (NO dark top bar!)
  const hijabHood = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 20, 18),
    hijabMat
  );
  hijabHood.position.set(0, 0.28, -0.03);
  hijabHood.scale.set(1.02, 1.04, 1.04);
  hijabHood.castShadow = true;
  hijabHood.receiveShadow = true;
  headPivot.add(hijabHood);

  // Inner soft hijab face frame
  const hijabRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.255, 0.042, 10, 20),
    hijabShadeMat
  );
  hijabRim.position.set(0, 0.26, 0.19);
  headPivot.add(hijabRim);

  // Cute Face sphere slightly forward
  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.255, 18, 16),
    skinMat
  );
  face.position.set(0, 0.26, 0.08);
  face.castShadow = true;
  headPivot.add(face);

  // Rosy Cheeks
  for (const sx of [-0.14, 0.14]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), blushMat);
    cheek.scale.set(1.2, 0.7, 0.4);
    cheek.position.set(sx, 0.21, 0.3);
    headPivot.add(cheek);
  }

  // Expressive Eyes with White Catchlights (clearly visible!)
  for (const sx of [-0.095, 0.095]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), eyeMat);
    eye.scale.set(0.95, 1.15, 0.6);
    eye.position.set(sx, 0.28, 0.315);
    headPivot.add(eye);

    const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), whiteMat);
    sparkle.position.set(sx + 0.012, 0.295, 0.336);
    headPivot.add(sparkle);
  }

  // Cute Clear Round Glasses (Kacamata Bulat Bening!)
  for (const sx of [-0.098, 0.098]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.074, 0.011, 8, 20), glassesRimMat);
    rim.position.set(sx, 0.28, 0.345);
    headPivot.add(rim);

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.068, 18), glassLensMat);
    lens.position.set(sx, 0.28, 0.343);
    lens.renderOrder = 3;
    headPivot.add(lens);
  }
  const bridge = createBoxPart(0.06, 0.012, 0.012, glassesRimMat, false);
  bridge.position.set(0, 0.29, 0.348);
  headPivot.add(bridge);

  // Dizzy stars
  const dizzyStars = createDizzyStars();
  dizzyStars.position.y = 0.7;
  headPivot.add(dizzyStars);

  // Floating Nameplate: Isol
  const nameTag = createNameTagSprite('Isol', '#FCE4EC', '#EC407A');
  nameTag.position.set(0, 2.02, 0);
  root.add(nameTag);

  // Contact Shadow
  const shadowMesh = createContactShadow();
  root.add(shadowMesh);

  return {
    root,
    bodyPivot,
    headPivot,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    dizzyStars,
    shadowMesh,
    dispose: () => {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        } else if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
    },
  };
}

/**
 * Karakter 2: Cowok Seragam Pelayaran Putih (+ Topi Pet & Pangkat Bahu) / Wardrobe
 * Total height ~ 1.66 units, bottom-center pivot at y = 0.
 */
export function buildBoyCharacter3D(outfit: BoyOutfitId): CharacterRig3D {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const palette = {
    pelayaran_putih: {
      top: '#FFFFFF',
      pants: '#ECEFF1',
      shoe: '#263238',
      hair: '#3E2723',
      hatKind: 'peaked_white' as const,
      epaulets: true,
      tieColor: '#1A237E',
    },
    pelayaran_navy: {
      top: '#1A237E',
      pants: '#1E293B',
      shoe: '#111827',
      hair: '#3E2723',
      hatKind: 'peaked_navy' as const,
      epaulets: true,
      tieColor: '#FFD54F',
    },
    kaos_beanie: {
      top: '#FAFAFA',
      pants: '#D7B98E',
      shoe: '#FFFFFF',
      hair: '#4E342E',
      hatKind: 'beanie' as const,
      epaulets: false,
      tieColor: null,
    },
    hoodie_blue: {
      top: '#81D4FA',
      pants: '#455A64',
      shoe: '#37474F',
      hair: '#3E2723',
      hatKind: 'hair' as const,
      epaulets: false,
      tieColor: null,
    },
  }[outfit];

  const skinMat = createMat('#FAD2B8', 0.72, 0.02);
  const eyeMat = createMat('#2D1E1A', 0.2, 0.1);
  const whiteMat = createMat('#FFFFFF', 0.35, 0);
  const topMat = createMat(palette.top, 0.72, 0.04);
  const pantsMat = createMat(palette.pants, 0.8, 0.04);
  const shoeMat = createMat(palette.shoe, 0.45, 0.12);
  const hairMat = createMat(palette.hair, 0.85, 0.02);
  const goldMat = createMat('#FFD54F', 0.22, 0.85);
  const navyMat = createMat('#1A237E', 0.65, 0.1);

  // --- Legs ---
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.13, 0.46, 0);
  const legL = createBoxPart(0.17, 0.36, 0.18, pantsMat);
  legL.position.y = -0.18;
  const shoeL = createBoxPart(0.19, 0.12, 0.25, shoeMat);
  shoeL.position.set(0, -0.4, 0.03);
  leftLeg.add(legL, shoeL);
  bodyPivot.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.13, 0.46, 0);
  const legR = createBoxPart(0.17, 0.36, 0.18, pantsMat);
  legR.position.y = -0.18;
  const shoeR = createBoxPart(0.19, 0.12, 0.25, shoeMat);
  shoeR.position.set(0, -0.4, 0.03);
  rightLeg.add(legR, shoeR);
  bodyPivot.add(rightLeg);

  // --- Belt & Pelvis ---
  const belt = createBoxPart(0.49, 0.07, 0.31, createMat('#263238', 0.45, 0.3));
  belt.position.y = 0.52;
  const buckle = createBoxPart(0.09, 0.06, 0.03, goldMat);
  buckle.position.set(0, 0.52, 0.16);
  bodyPivot.add(belt, buckle);

  // --- Torso ---
  const torso = createBoxPart(0.5, 0.48, 0.3, topMat);
  torso.position.y = 0.79;
  bodyPivot.add(torso);

  if (palette.tieColor) {
    const tieMat = createMat(palette.tieColor, 0.65, 0.05);
    const tie = createBoxPart(0.07, 0.32, 0.03, tieMat);
    tie.position.set(0, 0.82, 0.155);
    bodyPivot.add(tie);
  }

  if (palette.epaulets) {
    // Pangkat bahu pelayaran (navy + garis emas)
    for (const sx of [-0.21, 0.21]) {
      const ep = createBoxPart(0.14, 0.04, 0.22, navyMat);
      ep.position.set(sx, 1.045, 0);
      const stripe = createBoxPart(0.12, 0.02, 0.04, goldMat);
      stripe.position.set(sx, 1.065, 0.04);
      bodyPivot.add(ep, stripe);
    }
    // Gold buttons
    for (let b = 0; b < 3; b++) {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), goldMat);
      btn.position.set(0.07, 0.88 - b * 0.11, 0.16);
      bodyPivot.add(btn);
    }
  } else if (outfit === 'hoodie_blue') {
    const pocket = createBoxPart(0.32, 0.16, 0.04, createMat('#4FC3F7', 0.8, 0));
    pocket.position.set(0, 0.68, 0.155);
    const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.055, 8, 16), createMat('#4FC3F7', 0.8, 0));
    hoodCollar.rotation.x = Math.PI / 2;
    hoodCollar.position.set(0, 1.02, -0.02);
    bodyPivot.add(pocket, hoodCollar);
  }

  // --- Arms ---
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.33, 0.96, 0);
  const sleeveL = createBoxPart(0.16, 0.35, 0.16, topMat);
  sleeveL.position.y = -0.15;
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.078, 10, 10), skinMat);
  handL.position.y = -0.36;
  handL.castShadow = true;
  leftArm.add(sleeveL, handL);
  bodyPivot.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.33, 0.96, 0);
  const sleeveR = createBoxPart(0.16, 0.35, 0.16, topMat);
  sleeveR.position.y = -0.15;
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.078, 10, 10), skinMat);
  handR.position.y = -0.36;
  handR.castShadow = true;
  rightArm.add(sleeveR, handR);
  bodyPivot.add(rightArm);

  // --- Head + Hair + Topi Pet Pelayaran ---
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.06, 0);
  bodyPivot.add(headPivot);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 16), skinMat);
  head.position.set(0, 0.25, 0);
  head.castShadow = true;
  headPivot.add(head);

  // Back & side hair
  const hairBack = new THREE.Mesh(
    new THREE.SphereGeometry(0.268, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
    hairMat
  );
  hairBack.position.set(0, 0.26, -0.03);
  hairBack.rotation.x = -0.35;
  headPivot.add(hairBack);

  // Eyes
  for (const sx of [-0.095, 0.095]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), eyeMat);
    eye.scale.set(0.95, 1.15, 0.6);
    eye.position.set(sx, 0.26, 0.24);
    headPivot.add(eye);

    const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 8), whiteMat);
    sparkle.position.set(sx + 0.012, 0.275, 0.258);
    headPivot.add(sparkle);
  }

  // Hats!
  if (palette.hatKind === 'peaked_white' || palette.hatKind === 'peaked_navy') {
    const crownColor = palette.hatKind === 'peaked_white' ? '#FFFFFF' : '#1E3A8A';
    const crownMat = createMat(crownColor, 0.55, 0.05);
    const visorMat = createMat('#1C1917', 0.2, 0.35);

    // Navy band
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.26, 0.09, 18), navyMat);
    band.position.set(0, 0.44, 0);
    band.castShadow = true;
    headPivot.add(band);

    // Flared white officer crown
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.265, 0.13, 18), crownMat);
    crown.position.set(0, 0.54, -0.01);
    crown.castShadow = true;
    headPivot.add(crown);

    // Gold emblem anchor badge
    const emblem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.025, 10), goldMat);
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(0, 0.49, 0.285);
    headPivot.add(emblem);

    // Black glossy visor
    const visor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.29, 0.025, 16, 1, false, -Math.PI * 0.42, Math.PI * 0.84),
      visorMat
    );
    visor.position.set(0, 0.4, 0.09);
    visor.rotation.x = 0.22;
    headPivot.add(visor);
  } else if (palette.hatKind === 'beanie') {
    const beanieMat = createMat('#4FC3F7', 0.88, 0);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.275, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      beanieMat
    );
    dome.position.set(0, 0.31, -0.01);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.045, 8, 18), createMat('#29B6F6', 0.9, 0));
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(0, 0.34, 0);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), whiteMat);
    pom.position.set(0, 0.59, -0.01);
    headPivot.add(dome, cuff, pom);
  } else {
    // Casual hair bangs
    const bangs = createBoxPart(0.36, 0.09, 0.12, hairMat);
    bangs.position.set(0, 0.43, 0.17);
    headPivot.add(bangs);
  }

  const dizzyStars = createDizzyStars();
  dizzyStars.position.y = 0.72;
  headPivot.add(dizzyStars);

  // Floating Nameplate: Salman
  const nameTag = createNameTagSprite('Salman', '#E1F5FE', '#0288D1');
  nameTag.position.set(0, 2.08, 0);
  root.add(nameTag);

  const shadowMesh = createContactShadow();
  root.add(shadowMesh);

  return {
    root,
    bodyPivot,
    headPivot,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    dizzyStars,
    shadowMesh,
    dispose: () => {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        } else if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
    },
  };
}

/**
 * Animasi prosedural karakter 3D: idle, walk, jump, wallSlide (panjat/nempel), dizzy, pulled, pushing
 */
export function animateCharacter3D(
  rig: CharacterRig3D,
  anim: AnimState,
  time: number,
  isPushing = false
) {
  rig.dizzyStars.visible = anim === 'dizzy';
  if (anim === 'dizzy') {
    rig.dizzyStars.rotation.y = time * 6;
  }

  if (anim === 'walk') {
    const swing = Math.sin(time * 12) * 0.72;
    rig.leftLeg.rotation.x = swing;
    rig.rightLeg.rotation.x = -swing;
    if (isPushing) {
      rig.leftArm.rotation.x = -1.35;
      rig.rightArm.rotation.x = -1.35;
      rig.bodyPivot.rotation.x = 0.22;
    } else {
      rig.leftArm.rotation.x = -swing * 0.85;
      rig.rightArm.rotation.x = swing * 0.85;
      rig.bodyPivot.rotation.x = 0.08;
    }
    rig.bodyPivot.position.y = Math.abs(Math.sin(time * 12)) * 0.05;
    rig.headPivot.rotation.z = Math.sin(time * 6) * 0.04;
  } else if (anim === 'jump') {
    rig.leftLeg.rotation.x = 0.45;
    rig.rightLeg.rotation.x = -0.35;
    rig.leftArm.rotation.x = -2.35;
    rig.rightArm.rotation.x = -2.35;
    rig.bodyPivot.rotation.x = -0.05;
    rig.bodyPivot.position.y = 0;
  } else if (anim === 'wallSlide') {
    const climb = Math.sin(time * 10) * 0.55;
    rig.leftArm.rotation.x = -2.2 + climb;
    rig.rightArm.rotation.x = -2.2 - climb;
    rig.leftLeg.rotation.x = -climb * 0.6;
    rig.rightLeg.rotation.x = climb * 0.6;
    rig.bodyPivot.rotation.x = 0.14;
    rig.bodyPivot.position.y = 0;
  } else if (anim === 'pulled') {
    rig.leftArm.rotation.x = -2.5;
    rig.rightArm.rotation.x = -2.5;
    rig.leftLeg.rotation.x = Math.sin(time * 16) * 0.4;
    rig.rightLeg.rotation.x = -Math.sin(time * 16) * 0.4;
    rig.bodyPivot.rotation.x = -0.25;
  } else if (anim === 'dizzy') {
    rig.bodyPivot.rotation.z = Math.sin(time * 10) * 0.15;
    rig.leftArm.rotation.x = -0.4;
    rig.rightArm.rotation.x = -0.4;
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
  } else {
    // idle
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    rig.leftArm.rotation.x = isPushing ? -1.2 : Math.sin(time * 2.4) * 0.06;
    rig.rightArm.rotation.x = isPushing ? -1.2 : -Math.sin(time * 2.4) * 0.06;
    rig.bodyPivot.rotation.x = isPushing ? 0.15 : 0;
    rig.bodyPivot.rotation.z = 0;
    rig.bodyPivot.position.y = Math.sin(time * 2.5) * 0.02;
    rig.headPivot.rotation.z = Math.sin(time * 1.5) * 0.03;
  }
}
