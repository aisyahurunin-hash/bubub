import { AnimState, BoyOutfitId, GirlOutfitId, OutfitOption } from './types';

export const GIRL_OUTFITS: OutfitOption<GirlOutfitId>[] = [
  {
    id: 'unnes',
    name: 'Almamater UNNES',
    subtitle: 'Jas kuning khas & hijab cream',
    swatchPrimary: '#FFD54F',
    swatchSecondary: '#FFF3E0',
  },
  {
    id: 'blouse',
    name: 'Blouse Ruffle Pink',
    subtitle: 'Renda putih & rok plisket',
    swatchPrimary: '#F8BBD0',
    swatchSecondary: '#FFFFFF',
  },
  {
    id: 'sweater',
    name: 'Sweater Lilac',
    subtitle: 'Motif hati, jeans & hijab putih',
    swatchPrimary: '#E1BEE7',
    swatchSecondary: '#90CAF9',
  },
  {
    id: 'dress',
    name: 'Dress Bunga & Cardigan',
    subtitle: 'Kardigan rajut peach & hijab peach',
    swatchPrimary: '#FFCCBC',
    swatchSecondary: '#FFF59D',
  },
];

export const BOY_OUTFITS: OutfitOption<BoyOutfitId>[] = [
  {
    id: 'pelayaran_putih',
    name: 'Seragam Pelayaran Putih',
    subtitle: 'PDH/PDU lengkap & topi pet',
    swatchPrimary: '#FAFAFA',
    swatchSecondary: '#FFD700',
  },
  {
    id: 'pelayaran_navy',
    name: 'Dinas Pelayaran Navy',
    subtitle: 'Setelan biru dongker & pangkat emas',
    swatchPrimary: '#1A237E',
    swatchSecondary: '#FFD700',
  },
  {
    id: 'kaos_beanie',
    name: 'Kaos Oversized & Beanie',
    subtitle: 'Kaos putih, chino krem & kupluk',
    swatchPrimary: '#FFFFFF',
    swatchSecondary: '#D7CCC8',
  },
  {
    id: 'hoodie_blue',
    name: 'Hoodie Pastel Blue',
    subtitle: 'Tali putih & celana cargo',
    swatchPrimary: '#B3E5FC',
    swatchSecondary: '#455A64',
  },
];

// Helper to draw crisp pixel blocks on a 20x26 chibi grid
function px(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  s: number,
  gx: number,
  gy: number,
  gw: number,
  gh: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.round(ox + gx * s),
    Math.round(oy + gy * s),
    Math.max(1, Math.round(gw * s)),
    Math.max(1, Math.round(gh * s))
  );
}

export interface SpriteDrawOptions {
  x: number;
  y: number;
  scale: number; // Logical 20x26 grid; scale=2 => 40x52 px
  facing: 1 | -1;
  anim: AnimState;
  time: number;
}

export function drawGirlSprite(
  ctx: CanvasRenderingContext2D,
  outfit: GirlOutfitId,
  opts: SpriteDrawOptions
) {
  const { scale: s, facing, anim, time } = opts;
  const w = 20 * s;

  ctx.save();
  if (facing === -1) {
    ctx.translate(Math.round(opts.x + w), Math.round(opts.y));
    ctx.scale(-1, 1);
  } else {
    ctx.translate(Math.round(opts.x), Math.round(opts.y));
  }

  const hijabPalettes: Record<GirlOutfitId, { main: string; shade: string; deep: string; light: string }> = {
    unnes: { main: '#FFF3E0', shade: '#EFE0CA', deep: '#D7C0A3', light: '#FFFFFF' },
    blouse: { main: '#FCE4EC', shade: '#F8BBD0', deep: '#F48FB1', light: '#FFFFFF' },
    sweater: { main: '#FFFFFF', shade: '#EDF2F7', deep: '#CBD5E1', light: '#FFFFFF' },
    dress: { main: '#FFE8D6', shade: '#FFCCBC', deep: '#F7B099', light: '#FFF8F2' },
  };
  const hj = hijabPalettes[outfit];

  const breathe = anim === 'idle' && Math.floor(time * 2) % 2 === 1 ? 1 : 0;
  const walkStep = anim === 'walk' ? Math.floor(time * 10) % 2 : 0;
  const headY = breathe;
  const bodyY = breathe;

  const skin = '#FFE3C6';
  const skinShade = '#F5C9A6';

  // --- 1. LEGS & CUTE SHOES (y = 21..25) ---
  const legColor =
    outfit === 'unnes'
      ? '#455A64'
      : outfit === 'blouse'
        ? '#F8FAFC'
        : outfit === 'sweater'
          ? '#90CAF9'
          : '#FFF59D';
  const shoeColor = outfit === 'unnes' ? '#5D4037' : '#F06292';

  if (anim === 'jump' || anim === 'pulled') {
    px(ctx, 0, 0, s, 6, 21, 3, 2, legColor);
    px(ctx, 0, 0, s, 11, 21, 3, 2, legColor);
    px(ctx, 0, 0, s, 6, 23, 3, 2, shoeColor);
    px(ctx, 0, 0, s, 11, 23, 3, 2, shoeColor);
  } else if (anim === 'wallSlide') {
    px(ctx, 0, 0, s, 6, 21, 3, 2, legColor);
    px(ctx, 0, 0, s, 11, 20, 3, 2, legColor);
    px(ctx, 0, 0, s, 6, 23, 3, 2, shoeColor);
    px(ctx, 0, 0, s, 11, 22, 3, 2, shoeColor);
  } else if (anim === 'walk') {
    if (walkStep === 0) {
      px(ctx, 0, 0, s, 5, 21, 3, 3, legColor);
      px(ctx, 0, 0, s, 4, 24, 4, 2, shoeColor);
      px(ctx, 0, 0, s, 11, 21, 3, 2, legColor);
      px(ctx, 0, 0, s, 11, 23, 4, 2, shoeColor);
    } else {
      px(ctx, 0, 0, s, 6, 21, 3, 2, legColor);
      px(ctx, 0, 0, s, 6, 23, 4, 2, shoeColor);
      px(ctx, 0, 0, s, 11, 21, 3, 3, legColor);
      px(ctx, 0, 0, s, 11, 24, 4, 2, shoeColor);
    }
  } else {
    px(ctx, 0, 0, s, 6, 21, 3, 3, legColor);
    px(ctx, 0, 0, s, 11, 21, 3, 3, legColor);
    px(ctx, 0, 0, s, 5, 24, 4, 2, shoeColor);
    px(ctx, 0, 0, s, 11, 24, 4, 2, shoeColor);
  }

  // --- 2. SKIRT / PANTS (y = 17..21) ---
  if (outfit === 'unnes') {
    px(ctx, 0, bodyY * s, s, 5, 17, 10, 5, '#37474F');
    px(ctx, 0, bodyY * s, s, 6, 17, 1, 5, '#263238');
    px(ctx, 0, bodyY * s, s, 13, 17, 1, 5, '#263238');
  } else if (outfit === 'blouse') {
    px(ctx, 0, bodyY * s, s, 4, 17, 12, 4, '#FFFFFF');
    px(ctx, 0, bodyY * s, s, 6, 17, 1, 4, '#CFD8DC');
    px(ctx, 0, bodyY * s, s, 9, 17, 1, 4, '#CFD8DC');
    px(ctx, 0, bodyY * s, s, 12, 17, 1, 4, '#CFD8DC');
  } else if (outfit === 'sweater') {
    px(ctx, 0, bodyY * s, s, 5, 17, 10, 4, '#90CAF9');
    px(ctx, 0, bodyY * s, s, 9, 18, 2, 3, '#64B5F6');
  } else {
    px(ctx, 0, bodyY * s, s, 4, 17, 12, 4, '#FFF59D');
    px(ctx, 0, bodyY * s, s, 5, 18, 1, 1, '#F48FB1');
    px(ctx, 0, bodyY * s, s, 10, 19, 1, 1, '#F06292');
    px(ctx, 0, bodyY * s, s, 13, 18, 1, 1, '#F48FB1');
  }

  // --- 3. TORSO / OUTFIT (y = 12..17) ---
  if (outfit === 'unnes') {
    // Jas Almamater Kuning Khas UNNES
    px(ctx, 0, bodyY * s, s, 5, 12, 10, 5, '#FFD54F');
    px(ctx, 0, bodyY * s, s, 5, 16, 10, 1, '#FBC02D');
    // Kerah jas & kancing tengah
    px(ctx, 0, bodyY * s, s, 7, 12, 2, 3, '#FBC02D');
    px(ctx, 0, bodyY * s, s, 11, 12, 2, 3, '#FBC02D');
    px(ctx, 0, bodyY * s, s, 10, 14, 1, 1, '#6D4C41');
    px(ctx, 0, bodyY * s, s, 10, 16, 1, 1, '#6D4C41');
    // Badge logo UNNES kecil di dada kiri
    px(ctx, 0, bodyY * s, s, 12, 13, 2, 1, '#1976D2');
    px(ctx, 0, bodyY * s, s, 12, 14, 2, 1, '#FBC02D');
  } else if (outfit === 'blouse') {
    px(ctx, 0, bodyY * s, s, 5, 12, 10, 5, '#F8BBD0');
    px(ctx, 0, bodyY * s, s, 6, 12, 8, 1, '#FFFFFF');
    px(ctx, 0, bodyY * s, s, 5, 13, 1, 1, '#FFFFFF');
    px(ctx, 0, bodyY * s, s, 14, 13, 1, 1, '#FFFFFF');
    px(ctx, 0, bodyY * s, s, 5, 16, 10, 1, '#F48FB1');
  } else if (outfit === 'sweater') {
    px(ctx, 0, bodyY * s, s, 4, 12, 12, 5, '#E1BEE7');
    px(ctx, 0, bodyY * s, s, 4, 16, 12, 1, '#CE93D8');
    // Cute heart motif
    px(ctx, 0, bodyY * s, s, 9, 13, 1, 1, '#F06292');
    px(ctx, 0, bodyY * s, s, 11, 13, 1, 1, '#F06292');
    px(ctx, 0, bodyY * s, s, 9, 14, 3, 1, '#F06292');
    px(ctx, 0, bodyY * s, s, 10, 15, 1, 1, '#F06292');
  } else {
    px(ctx, 0, bodyY * s, s, 5, 12, 10, 5, '#FFCCBC');
    px(ctx, 0, bodyY * s, s, 8, 12, 4, 5, '#FFF59D');
    px(ctx, 0, bodyY * s, s, 9, 14, 1, 1, '#F48FB1');
    px(ctx, 0, bodyY * s, s, 10, 15, 1, 1, '#FF8A65');
  }

  // --- 4. ARMS ---
  const sleeve =
    outfit === 'unnes'
      ? '#FFD54F'
      : outfit === 'blouse'
        ? '#F8BBD0'
        : outfit === 'sweater'
          ? '#E1BEE7'
          : '#FFCCBC';
  if (anim === 'jump' || anim === 'pulled') {
    px(ctx, 0, bodyY * s, s, 3, 10, 2, 4, sleeve);
    px(ctx, 0, bodyY * s, s, 3, 9, 2, 1, skin);
    px(ctx, 0, bodyY * s, s, 15, 10, 2, 4, sleeve);
    px(ctx, 0, bodyY * s, s, 15, 9, 2, 1, skin);
  } else if (anim === 'wallSlide') {
    // Front arm braced up against wall!
    px(ctx, 0, bodyY * s, s, 3, 13, 2, 4, sleeve);
    px(ctx, 0, bodyY * s, s, 3, 17, 2, 1, skin);
    px(ctx, 0, bodyY * s, s, 15, 9, 3, 3, sleeve);
    px(ctx, 0, bodyY * s, s, 17, 8, 2, 2, skin);
  } else if (anim === 'walk') {
    const sw = walkStep === 0 ? 1 : -1;
    px(ctx, 0, (bodyY + sw) * s, s, 3, 12, 2, 4, sleeve);
    px(ctx, 0, (bodyY + sw) * s, s, 3, 16, 2, 1, skin);
    px(ctx, 0, (bodyY - sw) * s, s, 15, 12, 2, 4, sleeve);
    px(ctx, 0, (bodyY - sw) * s, s, 15, 16, 2, 1, skin);
  } else {
    px(ctx, 0, bodyY * s, s, 3, 12, 2, 4, sleeve);
    px(ctx, 0, bodyY * s, s, 3, 16, 2, 1, skin);
    px(ctx, 0, bodyY * s, s, 15, 12, 2, 4, sleeve);
    px(ctx, 0, bodyY * s, s, 15, 16, 2, 1, skin);
  }

  // --- 5. HEAD & CLEAN ROUNDED HIJAB (ZERO black top bar!) ---
  // Smooth rounded hijab crown & sides
  px(ctx, 0, headY * s, s, 5, 1, 10, 1, hj.main);
  px(ctx, 0, headY * s, s, 4, 2, 12, 2, hj.main);
  px(ctx, 0, headY * s, s, 3, 4, 14, 7, hj.main);
  // Soft top highlight & gentle pastel fold
  px(ctx, 0, headY * s, s, 7, 1, 6, 1, hj.light);
  px(ctx, 0, headY * s, s, 5, 3, 10, 1, hj.shade);
  px(ctx, 0, headY * s, s, 3, 5, 1, 6, hj.shade);
  px(ctx, 0, headY * s, s, 16, 5, 1, 6, hj.shade);

  // Hijab drape covering chest cleanly (segi empat rapi)
  const flutter = anim === 'jump' || anim === 'pulled' ? 1 : 0;
  px(ctx, 0, (headY + flutter) * s, s, 4, 11, 12, 3, hj.main);
  px(ctx, 0, (headY + flutter) * s, s, 5, 13, 10, 1, hj.shade);
  px(ctx, 0, (headY + flutter) * s, s, 7, 14, 6, 1, hj.main);
  px(ctx, 0, (headY + flutter) * s, s, 8, 15, 4, 1, hj.shade);

  // Cute round face inside hijab
  px(ctx, 0, headY * s, s, 5, 4, 10, 7, skin);
  px(ctx, 0, headY * s, s, 5, 10, 1, 1, skinShade);
  px(ctx, 0, headY * s, s, 14, 10, 1, 1, skinShade);
  px(ctx, 0, headY * s, s, 6, 11, 8, 1, skin);

  // --- 6. CUTE SPARKLY EYES, BLUSH & SMILE ---
  if (anim === 'pulled') {
    // Shocked cute o_o eyes
    px(ctx, 0, headY * s, s, 6, 6, 3, 3, '#FFFFFF');
    px(ctx, 0, headY * s, s, 7, 7, 1, 1, '#2B1B17');
    px(ctx, 0, headY * s, s, 12, 6, 3, 3, '#FFFFFF');
    px(ctx, 0, headY * s, s, 13, 7, 1, 1, '#2B1B17');
    px(ctx, 0, headY * s, s, 10, 10, 1, 1, '#E07A6B');
  } else if (anim === 'dizzy') {
    px(ctx, 0, headY * s, s, 6, 7, 2, 1, '#2B1B17');
    px(ctx, 0, headY * s, s, 7, 8, 1, 1, '#2B1B17');
    px(ctx, 0, headY * s, s, 12, 7, 2, 1, '#2B1B17');
    px(ctx, 0, headY * s, s, 12, 8, 1, 1, '#2B1B17');
    px(ctx, 0, headY * s, s, 9, 10, 3, 1, '#E07A6B');
  } else {
    // Big adorable chibi eyes (2x3) with bright 1x1 white catchlight!
    px(ctx, 0, headY * s, s, 7, 6, 2, 3, '#2B1B17');
    px(ctx, 0, headY * s, s, 12, 6, 2, 3, '#2B1B17');
    // Bright eye sparkle
    px(ctx, 0, headY * s, s, 7, 6, 1, 1, '#FFFFFF');
    px(ctx, 0, headY * s, s, 12, 6, 1, 1, '#FFFFFF');
    // Soft rosy blush
    px(ctx, 0, headY * s, s, 5, 9, 2, 1, '#FFAB91');
    px(ctx, 0, headY * s, s, 14, 9, 2, 1, '#FFAB91');
    // Sweet little smile
    px(ctx, 0, headY * s, s, 9, 10, 3, 1, '#E07A6B');
  }

  // --- 7. KACAMATA BENING (CRYSTAL CLEAR TRANSPARENT LENSES + THIN GOLD/BROWN RIM) ---
  ctx.save();
  const gy = headY * s;
  // Clear crystal-blue lens tint (very transparent so eyes shine right through!)
  ctx.fillStyle = 'rgba(225, 245, 254, 0.24)';
  ctx.fillRect(Math.round(5.6 * s), Math.round(gy + 5.4 * s), Math.round(4.2 * s), Math.round(4.0 * s));
  ctx.fillRect(Math.round(11.2 * s), Math.round(gy + 5.4 * s), Math.round(4.2 * s), Math.round(4.0 * s));

  // Delicate thin round wire frame (#9E6B43 warm bronze/gold)
  ctx.strokeStyle = '#9E6B43';
  ctx.lineWidth = Math.max(1, 0.55 * s);
  // Left lens rim
  ctx.strokeRect(5.6 * s, gy + 5.4 * s, 4.2 * s, 4.0 * s);
  // Right lens rim
  ctx.strokeRect(11.2 * s, gy + 5.4 * s, 4.2 * s, 4.0 * s);
  // Thin bridge between lenses
  ctx.fillStyle = '#9E6B43';
  ctx.fillRect(Math.round(9.8 * s), Math.round(gy + 6.8 * s), Math.round(1.4 * s), Math.max(1, Math.round(0.6 * s)));

  // Tiny crisp lens glint on top-left corner of glass
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.fillRect(Math.round(6.0 * s), Math.round(gy + 5.8 * s), Math.max(1, Math.round(0.8 * s)), Math.max(1, Math.round(0.8 * s)));
  ctx.fillRect(Math.round(11.6 * s), Math.round(gy + 5.8 * s), Math.max(1, Math.round(0.8 * s)), Math.max(1, Math.round(0.8 * s)));
  ctx.restore();

  if (anim === 'dizzy') {
    const orbit = Math.sin(time * 10) * 3;
    px(ctx, orbit * s, 0, s, 9, -1, 2, 1, '#FFD54F');
    px(ctx, -orbit * s, 0, s, 9, -2, 2, 1, '#FF80AB');
  }

  ctx.restore();
}

export function drawBoySprite(
  ctx: CanvasRenderingContext2D,
  outfit: BoyOutfitId,
  opts: SpriteDrawOptions
) {
  const { scale: s, facing, anim, time } = opts;
  const w = 20 * s;

  ctx.save();
  if (facing === -1) {
    ctx.translate(Math.round(opts.x + w), Math.round(opts.y));
    ctx.scale(-1, 1);
  } else {
    ctx.translate(Math.round(opts.x), Math.round(opts.y));
  }

  const breathe = anim === 'idle' && Math.floor(time * 2 + 0.5) % 2 === 1 ? 1 : 0;
  const walkStep = anim === 'walk' ? Math.floor(time * 10) % 2 : 0;
  const headY = breathe;
  const bodyY = breathe;

  const skin = '#F7D3B0';
  const skinShade = '#E4B78F';
  const hair = '#263238';

  // --- 1. PANTS & SHOES (y = 17..25) ---
  const pantsColor =
    outfit === 'pelayaran_putih'
      ? '#FAFAFA'
      : outfit === 'pelayaran_navy'
        ? '#1A237E'
        : outfit === 'kaos_beanie'
          ? '#D7CCC8'
          : '#455A64';
  const pantsShade =
    outfit === 'pelayaran_putih'
      ? '#E0E0E0'
      : outfit === 'pelayaran_navy'
        ? '#0D134D'
        : outfit === 'kaos_beanie'
          ? '#BCAAA4'
          : '#37474F';
  const shoeColor = outfit === 'kaos_beanie' || outfit === 'hoodie_blue' ? '#5D4037' : '#212121';

  px(ctx, 0, bodyY * s, s, 5, 17, 10, 4, pantsColor);
  px(ctx, 0, bodyY * s, s, 9, 18, 2, 3, pantsShade);

  if (anim === 'jump' || anim === 'pulled') {
    px(ctx, 0, 0, s, 6, 21, 3, 2, pantsColor);
    px(ctx, 0, 0, s, 11, 21, 3, 2, pantsColor);
    px(ctx, 0, 0, s, 6, 23, 3, 2, shoeColor);
    px(ctx, 0, 0, s, 11, 23, 3, 2, shoeColor);
  } else if (anim === 'wallSlide') {
    px(ctx, 0, 0, s, 6, 21, 3, 2, pantsColor);
    px(ctx, 0, 0, s, 11, 20, 3, 2, pantsColor);
    px(ctx, 0, 0, s, 6, 23, 3, 2, shoeColor);
    px(ctx, 0, 0, s, 11, 22, 3, 2, shoeColor);
  } else if (anim === 'walk') {
    if (walkStep === 0) {
      px(ctx, 0, 0, s, 5, 21, 3, 3, pantsColor);
      px(ctx, 0, 0, s, 4, 24, 4, 2, shoeColor);
      px(ctx, 0, 0, s, 11, 21, 3, 2, pantsColor);
      px(ctx, 0, 0, s, 11, 23, 4, 2, shoeColor);
    } else {
      px(ctx, 0, 0, s, 6, 21, 3, 2, pantsColor);
      px(ctx, 0, 0, s, 6, 23, 4, 2, shoeColor);
      px(ctx, 0, 0, s, 11, 21, 3, 3, pantsColor);
      px(ctx, 0, 0, s, 11, 24, 4, 2, shoeColor);
    }
  } else {
    px(ctx, 0, 0, s, 6, 21, 3, 3, pantsColor);
    px(ctx, 0, 0, s, 11, 21, 3, 3, pantsColor);
    px(ctx, 0, 0, s, 5, 24, 4, 2, shoeColor);
    px(ctx, 0, 0, s, 11, 24, 4, 2, shoeColor);
  }

  // --- 2. TORSO / UNIFORM (y = 12..17) ---
  if (outfit === 'pelayaran_putih') {
    px(ctx, 0, bodyY * s, s, 5, 12, 10, 5, '#FAFAFA');
    px(ctx, 0, bodyY * s, s, 5, 16, 10, 1, '#E0E0E0');
    // Dasi hitam rapi
    px(ctx, 0, bodyY * s, s, 9, 12, 2, 4, '#212121');
    // Epaulet bahu hitam + garis emas
    px(ctx, 0, bodyY * s, s, 5, 12, 2, 1, '#212121');
    px(ctx, 0, bodyY * s, s, 5, 12, 1, 1, '#FFD700');
    px(ctx, 0, bodyY * s, s, 13, 12, 2, 1, '#212121');
    px(ctx, 0, bodyY * s, s, 14, 12, 1, 1, '#FFD700');
    // Saku dada
    px(ctx, 0, bodyY * s, s, 12, 14, 2, 1, '#E0E0E0');
  } else if (outfit === 'pelayaran_navy') {
    px(ctx, 0, bodyY * s, s, 5, 12, 10, 5, '#1A237E');
    px(ctx, 0, bodyY * s, s, 9, 12, 2, 3, '#FFFFFF');
    px(ctx, 0, bodyY * s, s, 9, 12, 1, 3, '#212121');
    px(ctx, 0, bodyY * s, s, 5, 12, 2, 1, '#FFD700');
    px(ctx, 0, bodyY * s, s, 13, 12, 2, 1, '#FFD700');
    px(ctx, 0, bodyY * s, s, 10, 15, 1, 1, '#FFD700');
  } else if (outfit === 'kaos_beanie') {
    px(ctx, 0, bodyY * s, s, 4, 12, 12, 5, '#FFFFFF');
    px(ctx, 0, bodyY * s, s, 4, 16, 12, 1, '#ECEFF1');
    px(ctx, 0, bodyY * s, s, 8, 12, 4, 1, '#CFD8DC');
  } else {
    px(ctx, 0, bodyY * s, s, 5, 12, 10, 5, '#B3E5FC');
    px(ctx, 0, bodyY * s, s, 5, 16, 10, 1, '#81D4FA');
    px(ctx, 0, bodyY * s, s, 8, 12, 1, 3, '#FFFFFF');
    px(ctx, 0, bodyY * s, s, 11, 12, 1, 3, '#FFFFFF');
    px(ctx, 0, bodyY * s, s, 7, 15, 6, 2, '#81D4FA');
  }

  // --- 3. ARMS ---
  const sleeve =
    outfit === 'pelayaran_putih'
      ? '#FAFAFA'
      : outfit === 'pelayaran_navy'
        ? '#1A237E'
        : outfit === 'kaos_beanie'
          ? '#FFFFFF'
          : '#B3E5FC';
  if (anim === 'jump' || anim === 'pulled') {
    px(ctx, 0, bodyY * s, s, 3, 10, 2, 4, sleeve);
    px(ctx, 0, bodyY * s, s, 3, 9, 2, 1, skin);
    px(ctx, 0, bodyY * s, s, 15, 10, 2, 4, sleeve);
    px(ctx, 0, bodyY * s, s, 15, 9, 2, 1, skin);
  } else if (anim === 'wallSlide') {
    px(ctx, 0, bodyY * s, s, 3, 13, 2, 4, sleeve);
    px(ctx, 0, bodyY * s, s, 3, 17, 2, 1, skin);
    px(ctx, 0, bodyY * s, s, 15, 9, 3, 3, sleeve);
    px(ctx, 0, bodyY * s, s, 17, 8, 2, 2, skin);
  } else if (anim === 'walk') {
    const sw = walkStep === 0 ? 1 : -1;
    px(ctx, 0, (bodyY + sw) * s, s, 3, 12, 2, 4, sleeve);
    px(ctx, 0, (bodyY + sw) * s, s, 3, 16, 2, 1, skin);
    px(ctx, 0, (bodyY - sw) * s, s, 15, 12, 2, 4, sleeve);
    px(ctx, 0, (bodyY - sw) * s, s, 15, 16, 2, 1, skin);
  } else {
    px(ctx, 0, bodyY * s, s, 3, 12, 2, 4, sleeve);
    px(ctx, 0, bodyY * s, s, 3, 16, 2, 1, skin);
    px(ctx, 0, bodyY * s, s, 15, 12, 2, 4, sleeve);
    px(ctx, 0, bodyY * s, s, 15, 16, 2, 1, skin);
  }

  // --- 4. HEAD & CUTE FACE (y = 4..12) ---
  px(ctx, 0, headY * s, s, 5, 5, 10, 6, skin);
  px(ctx, 0, headY * s, s, 6, 11, 8, 1, skinShade);
  px(ctx, 0, headY * s, s, 4, 7, 1, 2, skinShade); // ear
  px(ctx, 0, headY * s, s, 4, 5, 1, 2, hair);
  px(ctx, 0, headY * s, s, 5, 4, 10, 2, hair);

  if (anim === 'pulled') {
    px(ctx, 0, headY * s, s, 7, 7, 2, 2, '#FFFFFF');
    px(ctx, 0, headY * s, s, 8, 8, 1, 1, '#2B1B17');
    px(ctx, 0, headY * s, s, 12, 7, 2, 2, '#FFFFFF');
    px(ctx, 0, headY * s, s, 13, 8, 1, 1, '#2B1B17');
    px(ctx, 0, headY * s, s, 10, 10, 1, 1, '#C66B5B');
  } else if (anim === 'dizzy') {
    px(ctx, 0, headY * s, s, 7, 7, 2, 1, '#2B1B17');
    px(ctx, 0, headY * s, s, 8, 8, 1, 1, '#2B1B17');
    px(ctx, 0, headY * s, s, 12, 7, 2, 1, '#2B1B17');
    px(ctx, 0, headY * s, s, 12, 8, 1, 1, '#2B1B17');
    px(ctx, 0, headY * s, s, 9, 10, 3, 1, '#C66B5B');
  } else {
    px(ctx, 0, headY * s, s, 7, 7, 2, 2, '#2B1B17');
    px(ctx, 0, headY * s, s, 12, 7, 2, 2, '#2B1B17');
    px(ctx, 0, headY * s, s, 7, 7, 1, 1, '#FFFFFF');
    px(ctx, 0, headY * s, s, 12, 7, 1, 1, '#FFFFFF');
    px(ctx, 0, headY * s, s, 6, 9, 1, 1, '#FFAB91');
    px(ctx, 0, headY * s, s, 14, 9, 1, 1, '#FFAB91');
    px(ctx, 0, headY * s, s, 9, 10, 3, 1, '#C66B5B');
  }

  // --- 5. HEADWEAR (TOPI PET PELAYARAN / BEANIE / HAIR) ---
  if (outfit === 'pelayaran_putih' || outfit === 'pelayaran_navy') {
    const bandColor = outfit === 'pelayaran_putih' ? '#212121' : '#0D134D';
    // Mahkota putih bersih
    px(ctx, 0, headY * s, s, 4, 0, 12, 1, '#ECEFF1');
    px(ctx, 0, headY * s, s, 3, 1, 14, 2, '#FFFFFF');
    // Pita melingkar
    px(ctx, 0, headY * s, s, 4, 3, 12, 1, bandColor);
    // Emblem jangkar emas
    px(ctx, 0, headY * s, s, 10, 2, 2, 2, '#FFD700');
    // Lidah topi hitam mengilap
    px(ctx, 0, headY * s, s, 7, 4, 10, 1, '#212121');
    px(ctx, 0, headY * s, s, 11, 4, 3, 1, '#616161');
  } else if (outfit === 'kaos_beanie') {
    px(ctx, 0, headY * s, s, 5, 1, 10, 2, '#B0BEC5');
    px(ctx, 0, headY * s, s, 4, 3, 12, 2, '#90A4AE');
    px(ctx, 0, headY * s, s, 9, 0, 2, 1, '#CFD8DC');
  } else {
    px(ctx, 0, headY * s, s, 5, 2, 10, 3, hair);
    px(ctx, 0, headY * s, s, 6, 1, 7, 1, hair);
    px(ctx, 0, headY * s, s, 11, 5, 3, 1, hair);
  }

  if (anim === 'dizzy') {
    const orbit = Math.sin(time * 10 + 1) * 3;
    px(ctx, orbit * s, 0, s, 9, -1, 2, 1, '#FFD54F');
    px(ctx, -orbit * s, 0, s, 9, -2, 2, 1, '#81D4FA');
  }

  ctx.restore();
}

// --- PIXEL ART WORLD PROPS ---

export function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  fill: string,
  outline?: string
) {
  const ox = Math.round(cx - 4 * s);
  const oy = Math.round(cy - 3.5 * s);
  if (outline) {
    px(ctx, ox, oy, s, 1, 0, 2, 1, outline);
    px(ctx, ox, oy, s, 5, 0, 2, 1, outline);
    px(ctx, ox, oy, s, 0, 1, 8, 3, outline);
    px(ctx, ox, oy, s, 1, 4, 6, 1, outline);
    px(ctx, ox, oy, s, 2, 5, 4, 1, outline);
    px(ctx, ox, oy, s, 3, 6, 2, 1, outline);
  }
  px(ctx, ox, oy, s, 1, 1, 2, 1, fill);
  px(ctx, ox, oy, s, 5, 1, 2, 1, fill);
  px(ctx, ox, oy, s, 1, 2, 6, 2, fill);
  px(ctx, ox, oy, s, 2, 4, 4, 1, fill);
  px(ctx, ox, oy, s, 3, 5, 2, 1, fill);
  px(ctx, ox, oy, s, 1, 1, 1, 1, '#FFFFFF');
}

export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const bob = Math.round(Math.sin(time * 5 + x * 0.04) * 3);
  const spin = Math.abs(Math.cos(time * 4 + x * 0.03));
  const w = Math.max(3, Math.round(10 * spin));
  const cy = Math.round(y + bob);
  const rx = Math.round(x - w / 2);

  ctx.fillStyle = '#5D4037';
  ctx.fillRect(rx - 1, cy - 7, w + 2, 14);
  ctx.fillStyle = '#FFD54F';
  ctx.fillRect(rx, cy - 6, w, 12);
  if (w >= 6) {
    ctx.fillStyle = '#FFF8E1';
    ctx.fillRect(rx + 1, cy - 4, 2, 6);
    ctx.fillStyle = '#FF80AB';
    ctx.fillRect(rx + Math.floor(w / 2) - 1, cy - 1, 2, 3);
  }
}

export function drawCheckpointFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean,
  time: number
) {
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - 2, y - 44, 4, 44);
  const wave = active ? Math.round(Math.sin(time * 7) * 2) : 0;
  ctx.fillStyle = active ? '#FF80AB' : '#CFD8DC';
  ctx.fillRect(x + 2, y - 42 + wave, 22, 14);
  if (active) {
    drawHeart(ctx, x + 13, y - 35 + wave, 1.5, '#FFFFFF');
  }
}

export function drawCollectible(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: 'heart_star' | 'love_letter',
  time: number
) {
  const bob = Math.round(Math.sin(time * 4 + x * 0.05) * 4);
  const cy = y + bob;
  if (kind === 'heart_star') {
    const s = 2;
    const ox = x - 8 * s;
    const oy = cy - 8 * s;
    px(ctx, ox, oy, s, 7, 1, 2, 14, '#FFE082');
    px(ctx, ox, oy, s, 1, 7, 14, 2, '#FFE082');
    px(ctx, ox, oy, s, 3, 3, 10, 10, '#FFD54F');
    drawHeart(ctx, x, cy, 2, '#FF4081', '#5D4037');
  } else {
    const s = 2;
    const ox = x - 6 * s;
    const oy = cy - 5 * s;
    px(ctx, ox, oy, s, 0, 0, 12, 9, '#5D4037');
    px(ctx, ox, oy, s, 1, 1, 10, 7, '#FFF8F0');
    px(ctx, ox, oy, s, 2, 2, 8, 1, '#E6CEB2');
    px(ctx, ox, oy, s, 3, 3, 6, 1, '#E6CEB2');
    px(ctx, ox, oy, s, 5, 3, 2, 2, '#FF4081');
  }
}

export function drawCrab(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, facing: 1 | -1) {
  const s = 2;
  const ox = Math.round(x - 8 * s);
  const oy = Math.round(y - 10 * s);
  const snip = Math.floor(time * 6) % 2;
  px(ctx, ox, oy, s, 1 + snip, 8, 2, 2, '#E53935');
  px(ctx, ox, oy, s, 4, 8, 2, 2, '#E53935');
  px(ctx, ox, oy, s, 10, 8, 2, 2, '#E53935');
  px(ctx, ox, oy, s, 13 - snip, 8, 2, 2, '#E53935');
  px(ctx, ox, oy, s, 0, 2 - snip, 3, 3, '#FF7043');
  px(ctx, ox, oy, s, 13, 2 - (1 - snip), 3, 3, '#FF7043');
  px(ctx, ox, oy, s, 3, 3, 10, 6, '#FF8A65');
  px(ctx, ox, oy, s, 4, 2, 8, 1, '#FFAB91');
  const eyeShift = facing === 1 ? 1 : 0;
  px(ctx, ox, oy, s, 5 + eyeShift, 4, 2, 2, '#FFFFFF');
  px(ctx, ox, oy, s, 9 + eyeShift, 4, 2, 2, '#FFFFFF');
  px(ctx, ox, oy, s, 6 + eyeShift, 5, 1, 1, '#212121');
  px(ctx, ox, oy, s, 10 + eyeShift, 5, 1, 1, '#212121');
}

export function drawSeagull(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, facing: 1 | -1) {
  const s = 2;
  const ox = Math.round(x - 8 * s);
  const oy = Math.round(y - 6 * s);
  const flap = Math.floor(time * 8) % 2;
  ctx.save();
  if (facing === -1) {
    ctx.translate(ox + 16 * s, oy);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(ox, oy);
  }
  if (flap === 0) {
    px(ctx, 0, 0, s, 4, 0, 5, 3, '#ECEFF1');
    px(ctx, 0, 0, s, 5, 1, 4, 2, '#B0BEC5');
  } else {
    px(ctx, 0, 0, s, 4, 6, 5, 3, '#ECEFF1');
  }
  px(ctx, 0, 0, s, 2, 4, 10, 3, '#FFFFFF');
  px(ctx, 0, 0, s, 1, 4, 2, 2, '#90A4AE');
  px(ctx, 0, 0, s, 10, 2, 4, 4, '#FFFFFF');
  px(ctx, 0, 0, s, 14, 4, 3, 2, '#FFB300');
  px(ctx, 0, 0, s, 12, 3, 1, 1, '#212121');
  ctx.restore();
}

export function drawCactus(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const count = Math.max(1, Math.floor(w / 24));
  const step = w / count;
  for (let i = 0; i < count; i++) {
    const cx = Math.round(x + i * step + step / 2);
    const s = 2;
    const ox = cx - 5 * s;
    const oy = y + h - 12 * s;
    px(ctx, ox, oy, s, 3, 2, 4, 10, '#66BB6A');
    px(ctx, ox, oy, s, 4, 1, 2, 11, '#81C784');
    px(ctx, ox, oy, s, 0, 4, 2, 4, '#66BB6A');
    px(ctx, ox, oy, s, 2, 6, 1, 2, '#43A047');
    px(ctx, ox, oy, s, 8, 3, 2, 4, '#66BB6A');
    px(ctx, ox, oy, s, 7, 5, 1, 2, '#43A047');
    px(ctx, ox, oy, s, 4, 0, 2, 1, '#FF80AB');
    px(ctx, ox, oy, s, 2, 2, 1, 1, '#FFF8F0');
    px(ctx, ox, oy, s, 7, 2, 1, 1, '#FFF8F0');
  }
}

export function drawCrate(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const rx = Math.round(x);
  const ry = Math.round(y);
  // Pixel outline
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(rx - 2, ry - 2, size + 4, size + 4);
  // Pastel wood body
  ctx.fillStyle = '#FFE0B2';
  ctx.fillRect(rx, ry, size, size);
  // Inner wood trim
  ctx.fillStyle = '#E6CEB2';
  ctx.fillRect(rx + 4, ry + 4, size - 8, size - 8);
  // Cute diagonal plank + tiny heart stamp
  ctx.fillStyle = '#D7CCC8';
  ctx.fillRect(rx + 6, ry + 6, size - 12, 4);
  ctx.fillRect(rx + 6, ry + size - 10, size - 12, 4);
  drawHeart(ctx, rx + size / 2, ry + size / 2, 1.5, '#F48FB1');
}

export function drawLever(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  on: boolean,
  highlight: boolean
) {
  const rx = Math.round(x);
  const ry = Math.round(y);
  // Base pedestal
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(rx - 14, ry - 8, 28, 8);
  ctx.fillStyle = '#D7CCC8';
  ctx.fillRect(rx - 12, ry - 6, 24, 6);

  // Lever arm
  ctx.save();
  ctx.translate(rx, ry - 8);
  ctx.rotate(on ? 0.52 : -0.52);
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(-3, -24, 6, 24);
  ctx.fillStyle = on ? '#A5D6A7' : '#FFAB91';
  ctx.fillRect(-6, -30, 12, 10);
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = 2;
  ctx.strokeRect(-6, -30, 12, 10);
  ctx.restore();

  if (highlight) {
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(rx - 10, ry - 52, 20, 14);
    ctx.fillStyle = '#FFF8F0';
    ctx.fillRect(rx - 8, ry - 50, 16, 10);
    ctx.fillStyle = '#AD1457';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('S/↓', rx, ry - 42);
  }
}

export function drawElementalDoor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  element: 'pink' | 'blue',
  occupied: boolean,
  time: number
) {
  const rx = Math.round(x);
  const ry = Math.round(y);
  const main = element === 'pink' ? '#FF80AB' : '#81D4FA';
  const light = element === 'pink' ? '#FCE4EC' : '#E1F5FE';
  const dark = element === 'pink' ? '#AD1457' : '#0277BD';

  // Door frame (52x64)
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(rx - 26, ry - 64, 52, 64);
  ctx.fillStyle = light;
  ctx.fillRect(rx - 22, ry - 60, 44, 60);
  // Inner portal
  ctx.fillStyle = occupied ? main : dark;
  ctx.fillRect(rx - 16, ry - 50, 32, 50);

  // Cute element icon on top
  if (element === 'pink') {
    drawHeart(ctx, rx, ry - 70, 2.2, occupied ? '#FF4081' : '#F48FB1', '#5D4037');
  } else {
    // Anchor / Diamond star for Boy's Blue door
    const bob = occupied ? Math.round(Math.sin(time * 8) * 2) : 0;
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(rx - 7, ry - 77 + bob, 14, 14);
    ctx.fillStyle = occupied ? '#FFD54F' : '#81D4FA';
    ctx.fillRect(rx - 5, ry - 75 + bob, 10, 10);
  }
}

