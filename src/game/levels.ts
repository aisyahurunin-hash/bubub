import { CoinDef, LevelDef, LevelTheme } from './types';

const THEMES: Record<string, LevelTheme> = {
  campus: {
    skyTop: '#B3E5FC',
    skyBottom: '#FFF8F0',
    hillBack: '#E1F5FE',
    hillFront: '#C8E6C9',
    groundTop: '#A5D6A7',
    groundBody: '#D7CCC8',
    accent: '#FFD54F',
    backdropProp: 'campus',
  },
  harbor: {
    skyTop: '#F8BBD0',
    skyBottom: '#FFE0B2',
    hillBack: '#F3E5F5',
    hillFront: '#FFCCBC',
    groundTop: '#BCAAA4',
    groundBody: '#8D6E63',
    accent: '#FF80AB',
    backdropProp: 'harbor',
  },
  clouds: {
    skyTop: '#81D4FA',
    skyBottom: '#FCE4EC',
    hillBack: '#FFFFFF',
    hillFront: '#F8BBD0',
    groundTop: '#FFF3E0',
    groundBody: '#F8BBD0',
    accent: '#F48FB1',
    backdropProp: 'clouds',
  },
  beach: {
    skyTop: '#B3E5FC',
    skyBottom: '#FFF3E0',
    hillBack: '#E0F7FA',
    hillFront: '#FFE082',
    groundTop: '#FFE0B2',
    groundBody: '#E6CEB2',
    accent: '#FFAB91',
    backdropProp: 'beach',
  },
  night: {
    skyTop: '#5C6BC0',
    skyBottom: '#F8BBD0',
    hillBack: '#7986CB',
    hillFront: '#9FA8DA',
    groundTop: '#CE93D8',
    groundBody: '#5E35B1',
    accent: '#FFD54F',
    backdropProp: 'night',
  },
};

function coinRow(prefix: string, startX: number, y: number, count: number, step = 36): CoinDef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}_${i}`,
    x: startX + i * step,
    y,
  }));
}

export const LEVELS: LevelDef[] = [
  // =========================================================================
  // LEVEL 1: Taman Kampus Pastel — Tutorial Stacking & Dual Doors
  // =========================================================================
  {
    id: 1,
    name: 'Taman Kampus Pastel',
    subtitle: 'Tutorial Gendong Kepala & Pintu Ganda',
    width: 1750,
    height: 620,
    theme: THEMES.campus,
    spawnP1: { x: 70, y: 440 },
    spawnP2: { x: 130, y: 440 },
    goalPink: { x: 1540, y: 390 },
    goalBlue: { x: 1640, y: 390 },
    hint: 'Lompat ke atas kepala pasanganmu untuk naik ke tebing tinggi! Masuk ke pintu Pink (Cewek) & Biru (Cowok).',
    platforms: [
      { id: 'p1', x: 0, y: 500, w: 620, h: 120, kind: 'solid' },
      // High step (130px higher -> first player stacks on head to reach p2, then pulls lever for elevator!)
      { id: 'p2', x: 620, y: 370, w: 340, h: 250, kind: 'solid' },
      { id: 'el1', x: 495, y: 495, w: 115, h: 22, kind: 'elevator', endX: 495, endY: 375, speed: 105, linkId: 'lv1_lift' },
      { id: 'p3', x: 1035, y: 460, w: 320, h: 160, kind: 'solid' },
      { id: 'p4', x: 1355, y: 390, w: 395, h: 230, kind: 'solid' },
      { id: 'p_top_bonus', x: 730, y: 255, w: 120, h: 20, kind: 'solid' },
    ],
    crates: [],
    plates: [],
    levers: [
      { id: 'lv1', x: 665, y: 370, linkId: 'lv1_lift' },
    ],
    lasers: [],
    trampolines: [],
    seesaws: [],
    hazards: [
      { id: 'h1', x: 960, y: 555, w: 75, h: 65, kind: 'dark_pool' },
    ],
    enemies: [],
    collectibles: [
      { id: 'c1', x: 790, y: 215, kind: 'heart_star' },
      { id: 'c2', x: 1180, y: 410, kind: 'love_letter' },
      { id: 'c3', x: 1460, y: 330, kind: 'heart_star' },
    ],
    coins: [
      ...coinRow('l1a', 260, 460, 4),
      ...coinRow('l1b', 670, 330, 4),
      ...coinRow('l1c', 1100, 420, 4),
    ],
    checkpoints: [{ id: 'cp1', x: 1075, y: 460 }],
  },

  // =========================================================================
  // LEVEL 2: Gerbang Tombol Kampus — Hold Pressure Plates
  // =========================================================================
  {
    id: 2,
    name: 'Gerbang Tombol Kampus',
    subtitle: 'Tombol Lantai Penahan Kerja Sama',
    width: 2100,
    height: 620,
    theme: THEMES.campus,
    spawnP1: { x: 65, y: 440 },
    spawnP2: { x: 120, y: 440 },
    goalPink: { x: 1900, y: 450 },
    goalBlue: { x: 1995, y: 450 },
    hint: 'Tombol Pink diinjak Cewek, Tombol Biru diinjak Cowok, Tombol Ungu bisa siapa saja!',
    platforms: [
      { id: 'p1', x: 0, y: 500, w: 500, h: 120, kind: 'solid' },
      // Pink hold plate on p1 opens gate_bridge b1 across dark pool
      { id: 'b1', x: 515, y: 495, w: 190, h: 24, kind: 'gate_bridge', linkId: 'bridge_pink' },
      { id: 'p2', x: 720, y: 490, w: 410, h: 130, kind: 'solid' },
      // Blue hold plate on p2 opens gate_wall d1
      { id: 'd1', x: 960, y: 350, w: 28, h: 140, kind: 'door_wall', linkId: 'door_blue' },
      // Elevated return plate on other side of d1 (purple) so Cowok can cross too!
      { id: 'p3', x: 1200, y: 450, w: 340, h: 170, kind: 'solid' },
      { id: 'b2', x: 1555, y: 450, w: 185, h: 24, kind: 'gate_bridge', linkId: 'bridge_purple' },
      { id: 'p4', x: 1755, y: 450, w: 345, h: 170, kind: 'solid' },
      // Upper bridge platform so Girl can reach purple plate on p3's roof
      { id: 'p2_up', x: 1020, y: 350, w: 130, h: 20, kind: 'solid' },
    ],
    crates: [
      // Crate on p2 to hold Blue plate after crossing
      { id: 'cr1', x: 760, y: 454, size: 36 },
      // Crate on p1 to hold Pink plate
      { id: 'cr0', x: 260, y: 464, size: 36 },
      // Crate on p3 to hold Purple plate for b2
      { id: 'cr2', x: 1260, y: 414, size: 36 },
    ],
    plates: [
      { id: 'pl1', x: 420, y: 500, color: 'pink', linkId: 'bridge_pink' },
      { id: 'pl2', x: 880, y: 490, color: 'blue', linkId: 'door_blue' },
      { id: 'pl3', x: 1360, y: 450, color: 'purple', linkId: 'bridge_purple' },
    ],
    levers: [],
    lasers: [],
    trampolines: [],
    seesaws: [],
    hazards: [
      { id: 'h1', x: 500, y: 560, w: 220, h: 60, kind: 'dark_pool' },
      { id: 'h2', x: 1130, y: 560, w: 70, h: 60, kind: 'dark_pool' },
      { id: 'h3', x: 1540, y: 560, w: 215, h: 60, kind: 'dark_pool' },
    ],
    enemies: [],
    collectibles: [
      { id: 'c1', x: 610, y: 430, kind: 'heart_star' },
      { id: 'c2', x: 1085, y: 300, kind: 'love_letter' },
      { id: 'c3', x: 1645, y: 390, kind: 'heart_star' },
    ],
    coins: [
      ...coinRow('l2a', 170, 460, 3),
      ...coinRow('l2b', 550, 455, 3),
      ...coinRow('l2c', 1240, 410, 3),
      ...coinRow('l2d', 1600, 410, 3),
    ],
    checkpoints: [{ id: 'cp1', x: 1230, y: 450 }],
  },

  // =========================================================================
  // LEVEL 3: Gudang Kotak Kayu — Pushable Crates Physics
  // =========================================================================
  {
    id: 3,
    name: 'Gudang Kotak Kayu',
    subtitle: 'Dorong Kotak Berdua & Penindih Tombol',
    width: 2350,
    height: 620,
    theme: THEMES.harbor,
    spawnP1: { x: 60, y: 440 },
    spawnP2: { x: 120, y: 440 },
    goalPink: { x: 2145, y: 420 },
    goalBlue: { x: 2245, y: 420 },
    hint: 'Dorong kotak untuk jadi tangga atau menindih tombol lantai! Dorong berdua biar lebih cepat.',
    platforms: [
      { id: 'p1', x: 0, y: 500, w: 560, h: 120, kind: 'solid' },
      // High step (125px) -> need crate + jump OR stacking
      { id: 'p2', x: 560, y: 375, w: 460, h: 245, kind: 'solid' },
      { id: 'd1', x: 910, y: 240, w: 28, h: 135, kind: 'door_wall', linkId: 'warehouse_door1' },
      { id: 'p3', x: 1090, y: 440, w: 480, h: 180, kind: 'solid' },
      { id: 'b1', x: 1585, y: 440, w: 200, h: 24, kind: 'gate_bridge', linkId: 'warehouse_bridge' },
      { id: 'p4', x: 1800, y: 420, w: 550, h: 200, kind: 'solid' },
      // Extra upper shelf for star
      { id: 'p3_shelf', x: 1270, y: 315, w: 130, h: 20, kind: 'solid' },
    ],
    crates: [
      { id: 'cr1', x: 350, y: 464, size: 36 },
      { id: 'cr2', x: 650, y: 339, size: 36 },
      { id: 'cr3', x: 1180, y: 404, size: 36 },
      { id: 'cr4', x: 1240, y: 404, size: 36 },
    ],
    plates: [
      { id: 'pl1', x: 820, y: 375, color: 'purple', linkId: 'warehouse_door1' },
      { id: 'pl2', x: 1475, y: 440, color: 'pink', linkId: 'warehouse_bridge' },
    ],
    levers: [],
    lasers: [],
    trampolines: [],
    seesaws: [],
    hazards: [
      { id: 'h1', x: 1020, y: 560, w: 70, h: 60, kind: 'dark_pool' },
      { id: 'h2', x: 1570, y: 560, w: 230, h: 60, kind: 'dark_pool' },
      { id: 'k1', x: 1930, y: 396, w: 48, h: 24, kind: 'cactus' },
    ],
    enemies: [
      { id: 'e1', x: 1980, y: 420, kind: 'crab', patrolMin: 1850, patrolMax: 2090, speed: 65 },
    ],
    collectibles: [
      { id: 'c1', x: 520, y: 325, kind: 'heart_star' },
      { id: 'c2', x: 1335, y: 270, kind: 'love_letter' },
      { id: 'c3', x: 1685, y: 380, kind: 'heart_star' },
    ],
    coins: [
      ...coinRow('l3a', 190, 460, 4),
      ...coinRow('l3b', 600, 335, 3),
      ...coinRow('l3c', 1130, 400, 3),
      ...coinRow('l3d', 1620, 400, 4),
    ],
    checkpoints: [{ id: 'cp1', x: 1120, y: 440 }],
  },

  // =========================================================================
  // LEVEL 4: Pelabuhan Senja — Elemental Pools (Pink & Blue)
  // =========================================================================
  {
    id: 4,
    name: 'Pelabuhan Senja',
    subtitle: 'Kolam Elemen Pink & Biru',
    width: 2500,
    height: 620,
    theme: THEMES.harbor,
    spawnP1: { x: 65, y: 440 },
    spawnP2: { x: 120, y: 440 },
    goalPink: { x: 2300, y: 430 },
    goalBlue: { x: 2400, y: 430 },
    hint: 'Kolam Pink hanya aman untuk Cewek! Kolam Biru hanya aman untuk Cowok! Kolam Gelap bahaya untuk keduanya.',
    platforms: [
      { id: 'p1', x: 0, y: 500, w: 320, h: 120, kind: 'solid' },
      // Pool 1 basin (Pink pool: Girl walks through, Boy must wait for bridge!)
      { id: 'p_pink_floor', x: 320, y: 530, w: 280, h: 90, kind: 'solid' },
      { id: 'b1', x: 335, y: 485, w: 250, h: 22, kind: 'gate_bridge', linkId: 'harbor_pink_br' },
      { id: 'p2', x: 600, y: 490, w: 320, h: 130, kind: 'solid' },
      // Pool 2 basin (Blue pool: Boy walks through to press lever/plate!)
      { id: 'p_blue_floor', x: 920, y: 530, w: 280, h: 90, kind: 'solid' },
      { id: 'b2', x: 935, y: 485, w: 250, h: 22, kind: 'gate_bridge', linkId: 'harbor_blue_br' },
      { id: 'p3', x: 1200, y: 480, w: 340, h: 140, kind: 'solid' },
      // Mid dark pool with moving elevator
      { id: 'el1', x: 1600, y: 480, w: 130, h: 24, kind: 'elevator', endX: 1810, endY: 430, speed: 95 },
      { id: 'p4', x: 1990, y: 430, w: 510, h: 190, kind: 'solid' },
    ],
    crates: [],
    plates: [
      { id: 'pl1', x: 660, y: 490, color: 'pink', linkId: 'harbor_pink_br' },
      { id: 'pl2', x: 1265, y: 480, color: 'blue', linkId: 'harbor_blue_br' },
    ],
    levers: [
      // Optional permanent lever inside/after pool
    ],
    lasers: [],
    trampolines: [],
    seesaws: [],
    hazards: [
      { id: 'hp1', x: 320, y: 510, w: 280, h: 22, kind: 'pink_pool' },
      { id: 'hb1', x: 920, y: 510, w: 280, h: 22, kind: 'blue_pool' },
      { id: 'hd1', x: 1540, y: 560, w: 450, h: 60, kind: 'dark_pool' },
    ],
    enemies: [
      { id: 'e1', x: 1380, y: 480, kind: 'crab', patrolMin: 1310, patrolMax: 1515, speed: 75 },
      { id: 'e2', x: 2140, y: 430, kind: 'crab', patrolMin: 2020, patrolMax: 2230, speed: 80 },
    ],
    collectibles: [
      { id: 'c1', x: 460, y: 445, kind: 'love_letter' },
      { id: 'c2', x: 1060, y: 445, kind: 'heart_star' },
      { id: 'c3', x: 1770, y: 365, kind: 'heart_star' },
    ],
    coins: [
      ...coinRow('l4a', 170, 460, 3),
      ...coinRow('l4b', 380, 490, 4),
      ...coinRow('l4c', 980, 490, 4),
      ...coinRow('l4d', 2040, 390, 4),
    ],
    checkpoints: [{ id: 'cp1', x: 1225, y: 480 }],
  },

  // =========================================================================
  // LEVEL 5: Menara Tuas & Lift — Toggle Levers & Elevators
  // =========================================================================
  {
    id: 5,
    name: 'Menara Tuas & Lift',
    subtitle: 'Tuas Mekanik (S / Panah Bawah) & Lift',
    width: 2550,
    height: 660,
    theme: THEMES.clouds,
    spawnP1: { x: 65, y: 480 },
    spawnP2: { x: 120, y: 480 },
    goalPink: { x: 2345, y: 270 },
    goalBlue: { x: 2445, y: 270 },
    hint: 'Dekati tuas lalu tekan S (Cewek) atau Panah Bawah (Cowok) untuk mengaktifkan Lift!',
    platforms: [
      { id: 'p1', x: 0, y: 540, w: 460, h: 120, kind: 'solid' },
      { id: 'el1', x: 485, y: 530, w: 130, h: 24, kind: 'elevator', endX: 485, endY: 360, speed: 110, linkId: 'lift1' },
      { id: 'p2', x: 640, y: 370, w: 430, h: 290, kind: 'solid' },
      { id: 'd1', x: 960, y: 235, w: 26, h: 135, kind: 'door_wall', linkId: 'tower_gate1' },
      { id: 'p3', x: 1140, y: 420, w: 380, h: 240, kind: 'solid' },
      { id: 'el2', x: 1545, y: 420, w: 130, h: 24, kind: 'elevator', endX: 1750, endY: 290, speed: 105, linkId: 'lift2' },
      { id: 'p4', x: 1910, y: 290, w: 240, h: 370, kind: 'solid' },
      { id: 'p5', x: 2210, y: 270, w: 340, h: 390, kind: 'solid' },
    ],
    crates: [
      { id: 'cr1', x: 710, y: 334, size: 36 },
    ],
    plates: [
      { id: 'pl1', x: 880, y: 370, color: 'purple', linkId: 'tower_gate1' },
    ],
    levers: [
      { id: 'lv1', x: 370, y: 540, linkId: 'lift1' },
      { id: 'lv2', x: 1445, y: 420, linkId: 'lift2' },
    ],
    lasers: [],
    trampolines: [],
    seesaws: [],
    hazards: [
      { id: 'h1', x: 460, y: 600, w: 180, h: 60, kind: 'dark_pool' },
      { id: 'h2', x: 1070, y: 600, w: 70, h: 60, kind: 'dark_pool' },
      { id: 'h3', x: 1520, y: 600, w: 390, h: 60, kind: 'dark_pool' },
      { id: 'h4', x: 2150, y: 600, w: 60, h: 60, kind: 'dark_pool' },
    ],
    enemies: [
      { id: 'e1', x: 1290, y: 420, kind: 'crab', patrolMin: 1170, patrolMax: 1390, speed: 75 },
      { id: 'e2', x: 1700, y: 210, kind: 'seagull', patrolMin: 1550, patrolMax: 1910, speed: 95 },
    ],
    collectibles: [
      { id: 'c1', x: 550, y: 300, kind: 'heart_star' },
      { id: 'c2', x: 1290, y: 340, kind: 'love_letter' },
      { id: 'c3', x: 2030, y: 230, kind: 'heart_star' },
    ],
    coins: [
      ...coinRow('l5a', 175, 500, 4),
      ...coinRow('l5b', 670, 330, 3),
      ...coinRow('l5c', 1170, 380, 4),
      ...coinRow('l5d', 1945, 250, 4),
    ],
    checkpoints: [{ id: 'cp1', x: 1175, y: 420 }],
  },

  // =========================================================================
  // LEVEL 6: Pabrik Awan Permen — Timed Bridges & Cloud Platforms
  // =========================================================================
  {
    id: 6,
    name: 'Pabrik Awan Permen',
    subtitle: 'Jembatan Waktu & Awan Menghilang',
    width: 2680,
    height: 640,
    theme: THEMES.clouds,
    spawnP1: { x: 65, y: 460 },
    spawnP2: { x: 120, y: 460 },
    goalPink: { x: 2475, y: 340 },
    goalBlue: { x: 2575, y: 340 },
    hint: 'Injak tombol waktu dan cepat menyeberang sebelum jembatan cahayanya padam!',
    platforms: [
      { id: 'p1', x: 0, y: 520, w: 360, h: 120, kind: 'solid' },
      { id: 'tb1', x: 375, y: 495, w: 280, h: 22, kind: 'timed_bridge', linkId: 'timed1', timedDuration: 5.0 },
      { id: 'p2', x: 670, y: 480, w: 280, h: 160, kind: 'solid' },
      { id: 'c1', x: 1010, y: 440, w: 125, h: 24, kind: 'cloud' },
      { id: 'c2', x: 1200, y: 400, w: 125, h: 24, kind: 'cloud' },
      { id: 'p3', x: 1390, y: 410, w: 320, h: 230, kind: 'solid' },
      { id: 'tb2', x: 1725, y: 390, w: 290, h: 22, kind: 'timed_bridge', linkId: 'timed2', timedDuration: 5.2 },
      { id: 'p4', x: 2030, y: 380, w: 220, h: 260, kind: 'solid' },
      { id: 'p5', x: 2320, y: 340, w: 360, h: 300, kind: 'solid' },
    ],
    crates: [],
    plates: [
      { id: 'pl1', x: 290, y: 520, color: 'purple', linkId: 'timed1', timedDuration: 5.0 },
      { id: 'pl2', x: 1640, y: 410, color: 'purple', linkId: 'timed2', timedDuration: 5.2 },
    ],
    levers: [],
    lasers: [],
    trampolines: [
      { id: 't1', x: 2200, y: 380, style: 'heart_cushion', power: 680 },
    ],
    seesaws: [],
    hazards: [
      { id: 'h1', x: 360, y: 580, w: 310, h: 60, kind: 'dark_pool' },
      { id: 'h2', x: 950, y: 580, w: 440, h: 60, kind: 'dark_pool' },
      { id: 'h3', x: 1710, y: 580, w: 320, h: 60, kind: 'dark_pool' },
      { id: 'h4', x: 2250, y: 580, w: 70, h: 60, kind: 'dark_pool' },
    ],
    enemies: [
      { id: 'e1', x: 1120, y: 320, kind: 'seagull', patrolMin: 960, patrolMax: 1360, speed: 100 },
      { id: 'e2', x: 1500, y: 410, kind: 'crab', patrolMin: 1415, patrolMax: 1590, speed: 75 },
    ],
    collectibles: [
      { id: 'k1', x: 515, y: 430, kind: 'heart_star' },
      { id: 'k2', x: 1260, y: 340, kind: 'love_letter' },
      { id: 'k3', x: 1870, y: 325, kind: 'heart_star' },
    ],
    coins: [
      ...coinRow('l6a', 420, 455, 4),
      ...coinRow('l6b', 1030, 395, 3),
      ...coinRow('l6c', 1775, 350, 4),
      ...coinRow('l6d', 2060, 340, 3),
    ],
    checkpoints: [{ id: 'cp1', x: 1425, y: 410 }],
  },

  // =========================================================================
  // LEVEL 7: Terowongan Laser Pastel — Laser Blocking (Crate & Element)
  // =========================================================================
  {
    id: 7,
    name: 'Terowongan Laser Pastel',
    subtitle: 'Blokir Sinar Laser dengan Kotak & Elemen',
    width: 2700,
    height: 620,
    theme: THEMES.night,
    spawnP1: { x: 65, y: 440 },
    spawnP2: { x: 120, y: 440 },
    goalPink: { x: 2495, y: 450 },
    goalBlue: { x: 2595, y: 450 },
    hint: 'Dorong kotak untuk memblokir Laser Gelap! Cewek bisa menahan Laser Pink & Cowok menahan Laser Biru!',
    platforms: [
      { id: 'p1', x: 0, y: 500, w: 680, h: 120, kind: 'solid' },
      // Ceiling beams holding laser emitters
      { id: 'ceil1', x: 300, y: 310, w: 120, h: 35, kind: 'solid' },
      { id: 'p2', x: 750, y: 470, w: 560, h: 150, kind: 'solid' },
      { id: 'ceil2', x: 960, y: 280, w: 200, h: 35, kind: 'solid' },
      { id: 'p3', x: 1380, y: 470, w: 560, h: 150, kind: 'solid' },
      { id: 'ceil3', x: 1560, y: 280, w: 240, h: 35, kind: 'solid' },
      { id: 'p4', x: 2010, y: 450, w: 690, h: 170, kind: 'solid' },
      { id: 'ceil4', x: 2150, y: 260, w: 180, h: 35, kind: 'solid' },
    ],
    crates: [
      // Crate on p1 to block Dark laser
      { id: 'cr1', x: 220, y: 464, size: 36 },
      // Crate on p4 to block final Dark laser
      { id: 'cr2', x: 2070, y: 414, size: 36 },
    ],
    plates: [],
    levers: [
      { id: 'lv1', x: 2380, y: 450, linkId: 'laser_final_off' },
    ],
    lasers: [
      // Laser 1: Dark laser on p1 -> push crate under emitter at x=360 so both cross!
      { id: 'lz1', x: 360, y: 345, dir: 'down', maxLength: 155, color: 'dark' },
      // Laser 2: Pink laser on p2 -> Girl stands under x=1010 to shield Boy!
      { id: 'lz2', x: 1010, y: 315, dir: 'down', maxLength: 155, color: 'pink' },
      // Laser 3: Blue laser on p3 -> Boy stands under x=1660 to shield Girl!
      { id: 'lz3', x: 1660, y: 315, dir: 'down', maxLength: 155, color: 'blue' },
      // Laser 4: Dark laser on p4 -> push crate OR pull lever
      { id: 'lz4', x: 2240, y: 295, dir: 'down', maxLength: 155, color: 'dark', linkId: 'laser_final_off' },
    ],
    trampolines: [],
    seesaws: [],
    hazards: [
      { id: 'h1', x: 680, y: 560, w: 70, h: 60, kind: 'dark_pool' },
      { id: 'h2', x: 1310, y: 560, w: 70, h: 60, kind: 'dark_pool' },
      { id: 'h3', x: 1940, y: 560, w: 70, h: 60, kind: 'dark_pool' },
    ],
    enemies: [],
    collectibles: [
      { id: 'c1', x: 520, y: 440, kind: 'heart_star' },
      { id: 'c2', x: 1180, y: 410, kind: 'love_letter' },
      { id: 'c3', x: 1820, y: 410, kind: 'heart_star' },
    ],
    coins: [
      ...coinRow('l7a', 420, 460, 4),
      ...coinRow('l7b', 810, 430, 4),
      ...coinRow('l7c', 1430, 430, 4),
      ...coinRow('l7d', 2310, 410, 3),
    ],
    checkpoints: [{ id: 'cp1', x: 1410, y: 470 }],
  },

  // =========================================================================
  // LEVEL 8: Dermaga Bintang — Crates on Elevators & Elemental Divide
  // =========================================================================
  {
    id: 8,
    name: 'Dermaga Bintang',
    subtitle: 'Angkut Kotak Naik Lift & Kolam Elemen',
    width: 2800,
    height: 660,
    theme: THEMES.beach,
    spawnP1: { x: 65, y: 480 },
    spawnP2: { x: 120, y: 480 },
    goalPink: { x: 2590, y: 330 },
    goalBlue: { x: 2690, y: 330 },
    hint: 'Dorong kotak masuk ke atas Lift, naik bersama ke atas untuk menekan tombol gerbang!',
    platforms: [
      { id: 'p1', x: 0, y: 540, w: 500, h: 120, kind: 'solid' },
      { id: 'el1', x: 520, y: 530, w: 140, h: 24, kind: 'elevator', endX: 520, endY: 360, speed: 95, linkId: 'dock_lift1' },
      { id: 'p2', x: 685, y: 370, w: 460, h: 290, kind: 'solid' },
      { id: 'd1', x: 1055, y: 230, w: 28, h: 140, kind: 'door_wall', linkId: 'dock_door1' },
      // Lower pool split: Pink pool + Blue pool side by side with bridge
      { id: 'p3_base', x: 1215, y: 520, w: 480, h: 140, kind: 'solid' },
      { id: 'b1', x: 1220, y: 470, w: 470, h: 22, kind: 'gate_bridge', linkId: 'dock_bridge' },
      { id: 'p4', x: 1695, y: 470, w: 360, h: 190, kind: 'solid' },
      { id: 'el2', x: 2080, y: 465, w: 130, h: 24, kind: 'elevator', endX: 2255, endY: 330, speed: 100 },
      { id: 'p5', x: 2410, y: 330, w: 390, h: 330, kind: 'solid' },
    ],
    crates: [
      { id: 'cr1', x: 310, y: 504, size: 36 },
      { id: 'cr2', x: 750, y: 334, size: 36 },
    ],
    plates: [
      { id: 'pl1', x: 960, y: 370, color: 'purple', linkId: 'dock_door1' },
      { id: 'pl2', x: 1785, y: 470, color: 'blue', linkId: 'dock_bridge' },
    ],
    levers: [
      { id: 'lv1', x: 230, y: 540, linkId: 'dock_lift1' },
    ],
    lasers: [],
    trampolines: [],
    seesaws: [],
    hazards: [
      { id: 'h1', x: 500, y: 600, w: 185, h: 60, kind: 'dark_pool' },
      { id: 'h2', x: 1145, y: 600, w: 70, h: 60, kind: 'dark_pool' },
      { id: 'hb1', x: 1225, y: 500, w: 460, h: 22, kind: 'blue_pool' },
      { id: 'h3', x: 2055, y: 600, w: 355, h: 60, kind: 'dark_pool' },
      { id: 'k1', x: 1920, y: 446, w: 48, h: 24, kind: 'cactus' },
    ],
    enemies: [
      { id: 'e1', x: 860, y: 370, kind: 'crab', patrolMin: 790, patrolMax: 925, speed: 70 },
      { id: 'e2', x: 2180, y: 240, kind: 'seagull', patrolMin: 2040, patrolMax: 2420, speed: 105 },
    ],
    collectibles: [
      { id: 'c1', x: 590, y: 295, kind: 'heart_star' },
      { id: 'c2', x: 1455, y: 420, kind: 'love_letter' },
      { id: 'c3', x: 2235, y: 270, kind: 'heart_star' },
    ],
    coins: [
      ...coinRow('l8a', 140, 500, 3),
      ...coinRow('l8b', 1290, 480, 5),
      ...coinRow('l8c', 1730, 430, 3),
      ...coinRow('l8d', 2450, 290, 3),
    ],
    checkpoints: [{ id: 'cp1', x: 1720, y: 470 }],
  },

  // =========================================================================
  // LEVEL 9: Jembatan Timbangan Senja — Seesaws + Crates + Levers
  // =========================================================================
  {
    id: 9,
    name: 'Jembatan Timbangan',
    subtitle: 'Jungkat-jungkit, Pemberat Kotak & Tuas',
    width: 2900,
    height: 640,
    theme: THEMES.campus,
    spawnP1: { x: 65, y: 440 },
    spawnP2: { x: 120, y: 440 },
    goalPink: { x: 2690, y: 410 },
    goalBlue: { x: 2790, y: 410 },
    hint: 'Seimbangkan papan jungkat-jungkit atau dorong kotak sebagai pemberat!',
    platforms: [
      { id: 'p1', x: 0, y: 500, w: 320, h: 140, kind: 'solid' },
      { id: 'p2', x: 620, y: 470, w: 360, h: 170, kind: 'solid' },
      { id: 'b1', x: 995, y: 470, w: 200, h: 24, kind: 'gate_bridge', linkId: 'sw_bridge1' },
      { id: 'p3', x: 1210, y: 470, w: 360, h: 170, kind: 'solid' },
      { id: 'p4', x: 1875, y: 450, w: 360, h: 190, kind: 'solid' },
      { id: 'ceil1', x: 1980, y: 260, w: 140, h: 35, kind: 'solid' },
      { id: 'c1', x: 2300, y: 410, w: 125, h: 24, kind: 'cloud' },
      { id: 'p5', x: 2490, y: 410, w: 410, h: 230, kind: 'solid' },
    ],
    crates: [
      { id: 'cr1', x: 700, y: 434, size: 36 },
      { id: 'cr2', x: 1270, y: 434, size: 36 },
    ],
    plates: [
      { id: 'pl1', x: 890, y: 470, color: 'pink', linkId: 'sw_bridge1' },
    ],
    levers: [
      { id: 'lv1', x: 1500, y: 470, linkId: 'sw_bridge1' },
      { id: 'lv2', x: 2170, y: 450, linkId: 'sw_laser_off' },
    ],
    lasers: [
      { id: 'lz1', x: 2050, y: 295, dir: 'down', maxLength: 155, color: 'pink', linkId: 'sw_laser_off' },
    ],
    trampolines: [],
    seesaws: [
      { id: 'sw1', cx: 470, cy: 485, length: 225, maxAngle: 0.32 },
      { id: 'sw2', cx: 1720, cy: 460, length: 225, maxAngle: 0.34 },
    ],
    hazards: [
      { id: 'h1', x: 320, y: 575, w: 300, h: 65, kind: 'dark_pool' },
      { id: 'h2', x: 980, y: 575, w: 230, h: 65, kind: 'dark_pool' },
      { id: 'h3', x: 1570, y: 575, w: 305, h: 65, kind: 'dark_pool' },
      { id: 'h4', x: 2235, y: 575, w: 255, h: 65, kind: 'dark_pool' },
    ],
    enemies: [
      { id: 'e1', x: 1720, y: 345, kind: 'seagull', patrolMin: 1580, patrolMax: 1870, speed: 102 },
    ],
    collectibles: [
      { id: 'c1', x: 470, y: 385, kind: 'love_letter' },
      { id: 'c2', x: 1720, y: 380, kind: 'heart_star' },
      { id: 'c3', x: 2360, y: 345, kind: 'heart_star' },
    ],
    coins: [
      ...coinRow('l9a', 175, 460, 3),
      ...coinRow('l9b', 1030, 430, 4),
      ...coinRow('l9c', 1910, 410, 3),
      ...coinRow('l9d', 2530, 370, 3),
    ],
    checkpoints: [{ id: 'cp1', x: 1235, y: 470 }],
  },

  // =========================================================================
  // LEVEL 10: Benteng Kaktus & Kepiting — Action Puzzle
  // =========================================================================
  {
    id: 10,
    name: 'Benteng Kaktus & Kepiting',
    subtitle: 'Rintangan Pantai, Kolam & Duri Mini',
    width: 3050,
    height: 640,
    theme: THEMES.beach,
    spawnP1: { x: 65, y: 440 },
    spawnP2: { x: 120, y: 440 },
    goalPink: { x: 2845, y: 410 },
    goalBlue: { x: 2945, y: 410 },
    hint: 'Hindari kepiting dan burung camar sambil tetap menjaga kerja sama tombol!',
    platforms: [
      { id: 'p1', x: 0, y: 500, w: 380, h: 140, kind: 'solid' },
      { id: 'p2', x: 455, y: 480, w: 380, h: 160, kind: 'solid' },
      // Split elemental pool with upper timed bridge
      { id: 'p_pool', x: 835, y: 520, w: 340, h: 120, kind: 'solid' },
      { id: 'tb1', x: 845, y: 470, w: 320, h: 22, kind: 'timed_bridge', linkId: 'fort_timed', timedDuration: 5.5 },
      { id: 'p3', x: 1175, y: 470, w: 380, h: 170, kind: 'solid' },
      // High cliff -> trampolin + wall jump or stack
      { id: 'p4', x: 1625, y: 350, w: 320, h: 290, kind: 'solid' },
      { id: 'm1', x: 2015, y: 380, w: 140, h: 24, kind: 'elevator', endX: 2230, endY: 380, speed: 115 },
      { id: 'p5', x: 2430, y: 410, w: 620, h: 230, kind: 'solid' },
      { id: 'd1', x: 2740, y: 270, w: 28, h: 140, kind: 'door_wall', linkId: 'fort_door' },
    ],
    crates: [
      { id: 'cr1', x: 2490, y: 374, size: 36 },
    ],
    plates: [
      { id: 'pl1', x: 770, y: 480, color: 'purple', linkId: 'fort_timed', timedDuration: 5.5 },
      { id: 'pl2', x: 2660, y: 410, color: 'purple', linkId: 'fort_door' },
    ],
    levers: [],
    lasers: [],
    trampolines: [
      { id: 't1', x: 1500, y: 470, style: 'mushroom', power: 730 },
    ],
    seesaws: [],
    hazards: [
      { id: 'h1', x: 380, y: 575, w: 75, h: 65, kind: 'dark_pool' },
      { id: 'hp1', x: 845, y: 500, w: 320, h: 22, kind: 'pink_pool' },
      { id: 'h2', x: 1555, y: 575, w: 70, h: 65, kind: 'dark_pool' },
      { id: 'h3', x: 1945, y: 575, w: 485, h: 65, kind: 'dark_pool' },
      { id: 'k1', x: 615, y: 456, w: 48, h: 24, kind: 'cactus' },
      { id: 'k2', x: 1765, y: 326, w: 48, h: 24, kind: 'cactus' },
    ],
    enemies: [
      { id: 'e1', x: 520, y: 480, kind: 'crab', patrolMin: 470, patrolMax: 595, speed: 78 },
      { id: 'e2', x: 1300, y: 470, kind: 'crab', patrolMin: 1200, patrolMax: 1445, speed: 85 },
      { id: 'e3', x: 2150, y: 270, kind: 'seagull', patrolMin: 1960, patrolMax: 2410, speed: 112 },
    ],
    collectibles: [
      { id: 'c1', x: 1005, y: 410, kind: 'heart_star' },
      { id: 'c2', x: 1785, y: 270, kind: 'love_letter' },
      { id: 'c3', x: 2180, y: 325, kind: 'heart_star' },
    ],
    coins: [
      ...coinRow('l10a', 175, 460, 4),
      ...coinRow('l10b', 910, 430, 4),
      ...coinRow('l10c', 1650, 310, 3),
      ...coinRow('l10d', 2060, 340, 4),
    ],
    checkpoints: [
      { id: 'cp1', x: 1210, y: 470 },
      { id: 'cp2', x: 2455, y: 410 },
    ],
  },

  // =========================================================================
  // LEVEL 11: Laboratorium Pelangi Malam — Multi-Layer Pepelo Puzzle
  // =========================================================================
  {
    id: 11,
    name: 'Laboratorium Pelangi',
    subtitle: 'Teka-teki Bertingkat, Laser & Kotak',
    width: 3150,
    height: 660,
    theme: THEMES.night,
    spawnP1: { x: 65, y: 480 },
    spawnP2: { x: 120, y: 480 },
    goalPink: { x: 2945, y: 310 },
    goalBlue: { x: 3045, y: 310 },
    hint: 'Gunakan kotak, lift, dan kekuatan elemen masing-masing untuk membuka gerbang laboratorium!',
    platforms: [
      { id: 'p1', x: 0, y: 540, w: 480, h: 120, kind: 'solid' },
      // Floor 2 balcony reachable by stacking; extends to x=475 so Girl jumps to p2 above d1!
      { id: 'p1_up', x: 200, y: 410, w: 275, h: 22, kind: 'solid' },
      { id: 'd1', x: 430, y: 432, w: 26, h: 108, kind: 'door_wall', linkId: 'lab_door1' },
      // Section 2: Pool + laser + lever
      { id: 'p2', x: 540, y: 500, w: 500, h: 160, kind: 'solid' },
      { id: 'ceil1', x: 730, y: 310, w: 140, h: 35, kind: 'solid' },
      { id: 'el1', x: 1065, y: 495, w: 130, h: 24, kind: 'elevator', endX: 1065, endY: 340, speed: 105, linkId: 'lab_lift1' },
      { id: 'p3', x: 1220, y: 350, w: 460, h: 310, kind: 'solid' },
      { id: 'c1', x: 1745, y: 340, w: 125, h: 24, kind: 'cloud' },
      { id: 'p4', x: 1935, y: 360, w: 420, h: 300, kind: 'solid' },
      { id: 'tb1', x: 2370, y: 340, w: 260, h: 22, kind: 'timed_bridge', linkId: 'lab_timed', timedDuration: 5.5 },
      { id: 'p5', x: 2645, y: 310, w: 505, h: 350, kind: 'solid' },
      { id: 'ceil2', x: 2740, y: 120, w: 140, h: 35, kind: 'solid' },
    ],
    crates: [
      { id: 'cr1', x: 600, y: 464, size: 36 },
      { id: 'cr2', x: 1300, y: 314, size: 36 },
    ],
    plates: [
      { id: 'pl1', x: 350, y: 410, color: 'pink', linkId: 'lab_door1' },
      { id: 'pl2', x: 1580, y: 350, color: 'blue', linkId: 'lab_lift1' },
      { id: 'pl3', x: 2295, y: 360, color: 'purple', linkId: 'lab_timed', timedDuration: 5.5 },
    ],
    levers: [
      { id: 'lv1', x: 960, y: 500, linkId: 'lab_lift1' },
      { id: 'lv2', x: 2690, y: 310, linkId: 'lab_laser_off' },
    ],
    lasers: [
      { id: 'lz1', x: 800, y: 345, dir: 'down', maxLength: 155, color: 'dark' },
      { id: 'lz2', x: 2810, y: 155, dir: 'down', maxLength: 155, color: 'blue', linkId: 'lab_laser_off' },
    ],
    trampolines: [],
    seesaws: [],
    hazards: [
      { id: 'h1', x: 480, y: 600, w: 60, h: 60, kind: 'dark_pool' },
      { id: 'h2', x: 1040, y: 600, w: 180, h: 60, kind: 'dark_pool' },
      { id: 'h3', x: 1680, y: 600, w: 255, h: 60, kind: 'dark_pool' },
      { id: 'h4', x: 2355, y: 600, w: 290, h: 60, kind: 'dark_pool' },
      { id: 'k1', x: 2090, y: 336, w: 48, h: 24, kind: 'cactus' },
    ],
    enemies: [
      { id: 'e1', x: 1440, y: 350, kind: 'crab', patrolMin: 1360, patrolMax: 1545, speed: 80 },
      { id: 'e2', x: 1810, y: 245, kind: 'seagull', patrolMin: 1690, patrolMax: 1940, speed: 112 },
    ],
    collectibles: [
      { id: 'c1', x: 255, y: 365, kind: 'heart_star' },
      { id: 'c2', x: 1805, y: 290, kind: 'love_letter' },
      { id: 'c3', x: 2500, y: 285, kind: 'heart_star' },
    ],
    coins: [
      ...coinRow('l11a', 140, 500, 3),
      ...coinRow('l11b', 835, 460, 3),
      ...coinRow('l11c', 1255, 310, 4),
      ...coinRow('l11d', 2405, 300, 4),
    ],
    checkpoints: [
      { id: 'cp1', x: 1245, y: 350 },
      { id: 'cp2', x: 1965, y: 360 },
    ],
  },

  // =========================================================================
  // LEVEL 12: Istana Cinta Abadi — Ultimate Pepelo Master Finale
  // =========================================================================
  {
    id: 12,
    name: 'Istana Cinta Abadi',
    subtitle: 'Ujian Master Co-op Pasangan',
    width: 3500,
    height: 660,
    theme: THEMES.night,
    spawnP1: { x: 65, y: 480 },
    spawnP2: { x: 120, y: 480 },
    goalPink: { x: 3290, y: 290 },
    goalBlue: { x: 3390, y: 290 },
    hint: 'Gabungkan semua jurus Pepelo: Gendong, Kotak, Tombol, Tuas, Lift, Laser & Elemen hingga Pintu Istana!',
    platforms: [
      { id: 'p1', x: 0, y: 540, w: 460, h: 120, kind: 'solid' },
      { id: 'p1_up', x: 460, y: 410, w: 320, h: 250, kind: 'solid' },
      // Pool split + crate bridge
      { id: 'p_pool', x: 780, y: 510, w: 340, h: 150, kind: 'solid' },
      { id: 'b1', x: 790, y: 455, w: 320, h: 22, kind: 'gate_bridge', linkId: 'fin_bridge1' },
      { id: 'p2', x: 1120, y: 460, w: 420, h: 200, kind: 'solid' },
      { id: 'ceil1', x: 1260, y: 270, w: 140, h: 35, kind: 'solid' },
      // Seesaw over dark abyss
      { id: 'p3', x: 1845, y: 450, w: 360, h: 210, kind: 'solid' },
      { id: 'el1', x: 2230, y: 445, w: 130, h: 24, kind: 'elevator', endX: 2230, endY: 295, speed: 105, linkId: 'fin_lift' },
      { id: 'p4', x: 2385, y: 300, w: 360, h: 360, kind: 'solid' },
      { id: 'tb1', x: 2760, y: 295, w: 270, h: 22, kind: 'timed_bridge', linkId: 'fin_timed', timedDuration: 5.5 },
      { id: 'p5', x: 3045, y: 290, w: 455, h: 370, kind: 'solid' },
      { id: 'd1', x: 3205, y: 150, w: 28, h: 140, kind: 'door_wall', linkId: 'fin_final_door' },
    ],
    crates: [
      { id: 'cr1', x: 260, y: 504, size: 36 },
      { id: 'cr2', x: 1170, y: 424, size: 36 },
      { id: 'cr3', x: 3090, y: 254, size: 36 },
    ],
    plates: [
      { id: 'pl1', x: 690, y: 410, color: 'pink', linkId: 'fin_bridge1' },
      { id: 'pl2', x: 2675, y: 300, color: 'purple', linkId: 'fin_timed', timedDuration: 5.5 },
      { id: 'pl3', x: 3155, y: 290, color: 'purple', linkId: 'fin_final_door' },
    ],
    levers: [
      { id: 'lv1', x: 2145, y: 450, linkId: 'fin_lift' },
    ],
    lasers: [
      { id: 'lz1', x: 1330, y: 305, dir: 'down', maxLength: 155, color: 'dark' },
    ],
    trampolines: [],
    seesaws: [
      { id: 'sw1', cx: 1690, cy: 455, length: 225, maxAngle: 0.32 },
    ],
    hazards: [
      { id: 'hp1', x: 790, y: 490, w: 320, h: 22, kind: 'pink_pool' },
      { id: 'h1', x: 1540, y: 600, w: 305, h: 60, kind: 'dark_pool' },
      { id: 'h2', x: 2205, y: 600, w: 180, h: 60, kind: 'dark_pool' },
      { id: 'h3', x: 2745, y: 600, w: 300, h: 60, kind: 'dark_pool' },
      { id: 'k1', x: 1960, y: 426, w: 48, h: 24, kind: 'cactus' },
    ],
    enemies: [
      { id: 'e1', x: 1450, y: 460, kind: 'crab', patrolMin: 1375, patrolMax: 1515, speed: 78 },
      { id: 'e2', x: 1690, y: 330, kind: 'seagull', patrolMin: 1550, patrolMax: 1850, speed: 112 },
      { id: 'e3', x: 2530, y: 300, kind: 'crab', patrolMin: 2410, patrolMax: 2630, speed: 88 },
    ],
    collectibles: [
      { id: 'c1', x: 950, y: 400, kind: 'heart_star' },
      { id: 'c2', x: 1690, y: 365, kind: 'love_letter' },
      { id: 'c3', x: 2895, y: 240, kind: 'heart_star' },
    ],
    coins: [
      ...coinRow('l12a', 150, 500, 3),
      ...coinRow('l12b', 515, 370, 4),
      ...coinRow('l12c', 850, 415, 4),
      ...coinRow('l12d', 1880, 410, 3),
      ...coinRow('l12e', 2415, 260, 4),
      ...coinRow('l12f', 2800, 255, 4),
    ],
    checkpoints: [
      { id: 'cp1', x: 1145, y: 460 },
      { id: 'cp2', x: 2410, y: 300 },
    ],
  },
];
