import { ElementColor } from '../game/types';

export type BlockStyle3D =
  | 'stone'
  | 'grass'
  | 'wood'
  | 'stucco'
  | 'terracotta'
  | 'cloud'
  | 'elevator'
  | 'boat'
  | 'bridge'
  | 'gate_wall'
  | 'conveyor';

export interface BlockDef3D {
  id: string;
  x: number; // center X
  y: number; // bottom Y
  z: number; // center Z
  w: number; // width (X)
  h: number; // height (Y)
  d: number; // depth (Z)
  style: BlockStyle3D;
  endX?: number;
  endY?: number;
  endZ?: number;
  speed?: number;
  linkId?: string;
  autoPingPong?: boolean;
  timedDuration?: number;
  flowX?: number;
  flowZ?: number;
  reverseLinkId?: string;
  isRoof?: boolean;
}

export interface LadderDef3D {
  id: string;
  x: number;
  z: number;
  yBottom: number;
  yTop: number;
  facing: '+x' | '-x' | '+z' | '-z';
}

export interface CrateDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
  size?: number;
}

export interface PlateDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
  color: ElementColor;
  linkId: string;
  timedDuration?: number;
}

export interface LeverDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
  linkId: string;
  initialOn?: boolean;
}

export interface LaserDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
  dir: '+x' | '-x' | '+z' | '-z';
  maxLength: number;
  color: 'pink' | 'blue' | 'dark';
  linkId?: string;
}

export interface PoolDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  kind: 'pink_pool' | 'blue_pool' | 'dark_pool' | 'cactus';
}

export interface TrampolineDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
  style: 'mushroom' | 'heart_cushion';
  power?: number;
}

export interface EnemyDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
  kind: 'crab' | 'seagull';
  axis: 'x' | 'z';
  min: number;
  max: number;
  speed: number;
}

export interface CollectibleDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface CheckpointDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface SawDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
  axis: 'x' | 'z';
  min: number;
  max: number;
  speed: number;
  radius?: number;
  linkId?: string;
}

export interface SpikeDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
  w?: number;
  d?: number;
  cycleSeconds?: number;
  phase?: number;
  linkId?: string;
}

export interface CannonDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
  dir: '+x' | '-x' | '+z' | '-z';
  interval: number;
  speed: number;
  maxRange: number;
  linkId?: string;
}

export interface KeyDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
  color: 'gold' | 'pink' | 'blue';
  linkId: string;
}

export interface TeleporterDef3D {
  id: string;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  color: 'pink' | 'blue' | 'purple';
}

export type BiomeBackdrop3D =
  | 'campus'
  | 'harbor'
  | 'rooftops'
  | 'forest'
  | 'desert'
  | 'snow'
  | 'clouds'
  | 'castle';

export interface LevelTheme3D {
  skyTop: string;
  skyBottom: string;
  fogColor: string;
  waterColor: string;
  sunColor: string;
  backdrop: BiomeBackdrop3D;
}

export interface LevelDef3D {
  id: number;
  name: string;
  subtitle: string;
  theme: LevelTheme3D;
  waterY: number;
  spawnP1: { x: number; y: number; z: number };
  spawnP2: { x: number; y: number; z: number };
  goalPink: { x: number; y: number; z: number };
  goalBlue: { x: number; y: number; z: number };
  blocks: BlockDef3D[];
  ladders: LadderDef3D[];
  crates: CrateDef3D[];
  plates: PlateDef3D[];
  levers: LeverDef3D[];
  lasers: LaserDef3D[];
  pools: PoolDef3D[];
  trampolines: TrampolineDef3D[];
  enemies: EnemyDef3D[];
  stars: CollectibleDef3D[];
  coins: CollectibleDef3D[];
  checkpoints: CheckpointDef3D[];
  saws?: SawDef3D[];
  spikes?: SpikeDef3D[];
  cannons?: CannonDef3D[];
  keys?: KeyDef3D[];
  teleporters?: TeleporterDef3D[];
  hint: string;
}

export const LEVELS_3D: LevelDef3D[] = [
  // =========================================================================
  // LEVEL 1: Halaman Kampus UNNES Pastel (Panjang: 42 unit)
  // =========================================================================
  {
    id: 1,
    name: 'Halaman Kampus Pastel',
    subtitle: 'Isol & Salman melompati taman kampus, mendorong kotak & naik tangga!',
    theme: {
      skyTop: '#87CEFA',
      skyBottom: '#FFE4EC',
      fogColor: '#E1F5FE',
      waterColor: '#A5D6A7',
      sunColor: '#FFF3E0',
      backdrop: 'campus',
    },
    waterY: -2.2,
    spawnP1: { x: -16, y: 1.05, z: -1.5 },
    spawnP2: { x: -16, y: 1.05, z: 1.5 },
    goalPink: { x: 22.5, y: 3.0, z: -1.8 },
    goalBlue: { x: 22.5, y: 3.0, z: 1.8 },
    blocks: [
      { id: 'b1', x: -13.5, y: 0, z: 0, w: 8.5, h: 1.0, d: 8.5, style: 'grass' },
      { id: 'b1_path', x: -13.5, y: 0.04, z: 0, w: 7.5, h: 1.0, d: 3.2, style: 'stone' },
      // Batu lompat taman
      { id: 'hop1', x: -6.5, y: 0, z: -1.2, w: 2.8, h: 1.4, d: 3.2, style: 'stone' },
      { id: 'hop2', x: -2.2, y: 0, z: 1.2, w: 2.8, h: 1.8, d: 3.2, style: 'stone' },
      // Halaman Tengah (Kotak + Tombol)
      { id: 'b2', x: 4.5, y: 0, z: 0, w: 8.5, h: 1.0, d: 8.5, style: 'grass' },
      { id: 'br1', x: 11.4, y: 0.7, z: 0, w: 5.4, h: 0.3, d: 3.6, style: 'bridge', linkId: 'open_br1' },
      { id: 'b3', x: 16.8, y: 0, z: 0, w: 5.5, h: 1.0, d: 8.0, style: 'stone' },
      { id: 'b4', x: 22.0, y: 0, z: 0, w: 5.5, h: 3.0, d: 8.0, style: 'stucco' },
      { id: 'wall_trim', x: 22.0, y: 3.0, z: -3.7, w: 5.6, h: 0.4, d: 0.4, style: 'terracotta' },
    ],
    ladders: [
      { id: 'lad1', x: 19.2, z: 0, yBottom: 1.0, yTop: 3.05, facing: '-x' },
    ],
    crates: [
      { id: 'cr1', x: 2.2, y: 1.05, z: 0 },
    ],
    plates: [
      { id: 'pl1', x: 6.2, y: 1.04, z: -2.2, color: 'purple', linkId: 'open_br1' },
    ],
    levers: [
      { id: 'lv1', x: 15.6, y: 1.0, z: 2.4, linkId: 'open_br1' },
    ],
    lasers: [],
    pools: [],
    trampolines: [],
    enemies: [],
    stars: [
      { id: 's1', x: -2.2, y: 2.9, z: 1.2 },
      { id: 's2', x: 11.4, y: 2.1, z: 0 },
      { id: 's3', x: 21.2, y: 4.2, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -11.5, y: 1.6, z: 0 },
      { id: 'c2', x: -6.5, y: 2.0, z: -1.2 },
      { id: 'c3', x: 4.5, y: 1.6, z: 1.8 },
      { id: 'c4', x: 10.5, y: 1.6, z: 0 },
      { id: 'c5', x: 12.6, y: 1.6, z: 0 },
      { id: 'c6', x: 17.0, y: 1.6, z: -1.6 },
      { id: 'c7', x: 21.0, y: 3.6, z: 1.6 },
      { id: 'c8', x: 21.0, y: 3.6, z: -1.6 },
    ],
    checkpoints: [
      { id: 'cp1', x: 1.4, y: 1.0, z: -2.2 },
      { id: 'cp2', x: 15.6, y: 1.0, z: -2.0 },
    ],
    hint: 'Lompat pakai Spasi (tekan 2x untuk Double Jump)! Dorong kotak kayu ke tombol ungu agar jembatan muncul, lalu panjat tangga!',
  },

  // =========================================================================
  // LEVEL 2: Dermaga Perahu Senja (Harbor Laut Biru — Panjang: 46 unit)
  // =========================================================================
  {
    id: 2,
    name: 'Dermaga Perahu Senja',
    subtitle: 'Isol & Salman naik perahu kayu melintasi dua teluk pelabuhan!',
    theme: {
      skyTop: '#4FC3F7',
      skyBottom: '#FFCCBC',
      fogColor: '#FFE0B2',
      waterColor: '#0288D1',
      sunColor: '#FFE0B2',
      backdrop: 'harbor',
    },
    waterY: 0,
    spawnP1: { x: -17, y: 1.2, z: -1.4 },
    spawnP2: { x: -17, y: 1.2, z: 1.4 },
    goalPink: { x: 24.5, y: 1.2, z: -2.2 },
    goalBlue: { x: 24.5, y: 1.2, z: 2.2 },
    blocks: [
      { id: 'd1', x: -15.5, y: -0.8, z: 0, w: 7.5, h: 2.0, d: 8.5, style: 'grass' },
      { id: 'pier1', x: -10.5, y: 0.7, z: 0, w: 3.5, h: 0.45, d: 4.0, style: 'wood' },
      {
        id: 'boat1',
        x: -6.8,
        y: -0.1,
        z: 0,
        w: 3.8,
        h: 1.25,
        d: 2.9,
        style: 'boat',
        endX: 1.8,
        endY: -0.1,
        endZ: 0,
        speed: 3.4,
        linkId: 'boat_go',
      },
      { id: 'pier2', x: 5.5, y: 0.7, z: 0, w: 3.8, h: 0.45, d: 4.4, style: 'wood' },
      { id: 'd_mid', x: 10.5, y: -0.8, z: 0, w: 6.5, h: 2.0, d: 8.5, style: 'stone' },
      {
        id: 'boat2',
        x: 15.6,
        y: -0.1,
        z: 0,
        w: 3.6,
        h: 1.25,
        d: 2.8,
        style: 'boat',
        endX: 18.8,
        endY: -0.1,
        endZ: 0,
        speed: 3.0,
        autoPingPong: true,
      },
      { id: 'd2', x: 23.8, y: -0.8, z: 0, w: 7.2, h: 2.0, d: 8.5, style: 'grass' },
      { id: 'gate1', x: 21.8, y: 1.2, z: 0, w: 0.6, h: 3.2, d: 7.5, style: 'gate_wall', linkId: 'harbor_gate' },
    ],
    ladders: [],
    crates: [
      { id: 'cr1', x: -14.2, y: 1.2, z: 2.2 },
    ],
    plates: [
      { id: 'pl1', x: 12.2, y: 1.15, z: -2.2, color: 'purple', linkId: 'harbor_gate' },
    ],
    levers: [
      { id: 'lv_boat1', x: -9.5, y: 1.15, z: -1.4, linkId: 'boat_go' },
      { id: 'lv_boat2', x: 5.0, y: 1.15, z: 1.5, linkId: 'boat_go' },
    ],
    lasers: [],
    pools: [],
    trampolines: [],
    enemies: [
      { id: 'crab1', x: 10.5, y: 1.2, z: 0, kind: 'crab', axis: 'z', min: -3.2, max: 3.2, speed: 2.3 },
    ],
    stars: [
      { id: 's1', x: -2.5, y: 2.2, z: 0 },
      { id: 's2', x: 10.5, y: 2.4, z: 2.2 },
      { id: 's3', x: 23.6, y: 2.4, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -13.0, y: 1.8, z: 0 },
      { id: 'c2', x: -4.5, y: 1.8, z: 0 },
      { id: 'c3', x: 0.0, y: 1.8, z: 0 },
      { id: 'c4', x: 5.5, y: 1.8, z: 0 },
      { id: 'c5', x: 10.5, y: 1.8, z: -1.8 },
      { id: 'c6', x: 17.2, y: 1.8, z: 0 },
      { id: 'c7', x: 23.0, y: 1.8, z: -1.5 },
      { id: 'c8', x: 23.0, y: 1.8, z: 1.5 },
    ],
    checkpoints: [
      { id: 'cp1', x: 8.2, y: 1.15, z: 0 },
      { id: 'cp2', x: 20.8, y: 1.2, z: -2.2 },
    ],
    hint: 'Bawa kotak masuk ke perahu pertama, taruh di tombol pulau tengah untuk membuka gerbang pulau terakhir, lalu naik perahu kedua!',
  },

  // =========================================================================
  // LEVEL 3: Atap Kota Terracotta (Kota Daratan — Panjang: 46 unit)
  // =========================================================================
  {
    id: 3,
    name: 'Atap Kota Terracotta',
    subtitle: 'Lompati atap genteng oranye & panjat menara kota bersama!',
    theme: {
      skyTop: '#64B5F6',
      skyBottom: '#FFF8E1',
      fogColor: '#E3F2FD',
      waterColor: '#BCAAA4',
      sunColor: '#FFFDE7',
      backdrop: 'rooftops',
    },
    waterY: -3.2,
    spawnP1: { x: -16.5, y: 3.0, z: -1.4 },
    spawnP2: { x: -16.5, y: 3.0, z: 1.4 },
    goalPink: { x: 23.5, y: 5.0, z: -1.8 },
    goalBlue: { x: 23.5, y: 5.0, z: 1.8 },
    blocks: [
      { id: 'bldA', x: -15.0, y: -3, z: 0, w: 8.0, h: 6.0, d: 8.0, style: 'stucco' },
      { id: 'roofA', x: -15.0, y: 2.6, z: 0, w: 8.4, h: 0.45, d: 8.4, style: 'terracotta', isRoof: true },
      // Atap melayang tengah
      { id: 'roof_hop', x: -8.0, y: 1.5, z: 0, w: 3.6, h: 1.6, d: 5.2, style: 'terracotta' },
      // Gedung B (Teras putih + tangga panjat)
      { id: 'bldB', x: -1.5, y: -3, z: 0, w: 7.5, h: 4.5, d: 8.0, style: 'stucco' },
      { id: 'bldB_top', x: 0.2, y: 1.5, z: 0, w: 4.6, h: 2.5, d: 7.4, style: 'stucco' },
      { id: 'roof_br', x: 6.0, y: 3.75, z: 0, w: 6.8, h: 0.3, d: 3.6, style: 'bridge', linkId: 'roof_bridge' },
      // Gedung C + Atap panjang ke finis
      { id: 'bldC', x: 13.0, y: -3, z: 0, w: 7.2, h: 7.0, d: 8.4, style: 'stucco' },
      { id: 'roof_step', x: 13.0, y: 3.6, z: -3.9, w: 7.4, h: 0.45, d: 0.5, style: 'terracotta' },
      { id: 'bldD', x: 22.0, y: -3, z: 0, w: 7.2, h: 8.0, d: 8.4, style: 'stucco' },
      { id: 'roofD_trim', x: 22.0, y: 4.7, z: -4.0, w: 7.4, h: 0.4, d: 0.5, style: 'terracotta', isRoof: true },
    ],
    ladders: [
      { id: 'lad1', x: -2.15, z: 0, yBottom: 1.5, yTop: 4.05, facing: '-x' },
      { id: 'lad2', x: 18.35, z: 0, yBottom: 4.0, yTop: 5.05, facing: '-x' },
    ],
    crates: [
      { id: 'cr1', x: 1.2, y: 4.0, z: -2.2 },
    ],
    plates: [
      { id: 'pl1', x: -0.4, y: 4.0, z: 2.2, color: 'purple', linkId: 'roof_bridge' },
    ],
    levers: [
      { id: 'lv1', x: 10.6, y: 4.0, z: 2.4, linkId: 'roof_bridge' },
    ],
    lasers: [],
    pools: [],
    trampolines: [],
    enemies: [
      { id: 'gull1', x: 6.0, y: 5.6, z: 0, kind: 'seagull', axis: 'z', min: -3.2, max: 3.2, speed: 2.6 },
      { id: 'gull2', x: 14.5, y: 5.5, z: 0, kind: 'seagull', axis: 'z', min: -3.0, max: 3.0, speed: 2.4 },
    ],
    stars: [
      { id: 's1', x: -8.0, y: 4.2, z: 0 },
      { id: 's2', x: 6.0, y: 5.2, z: 0 },
      { id: 's3', x: 21.5, y: 6.3, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -13.5, y: 3.6, z: -1.5 },
      { id: 'c2', x: -8.0, y: 3.7, z: 0 },
      { id: 'c3', x: -3.0, y: 2.2, z: 0 },
      { id: 'c4', x: 1.0, y: 4.6, z: 0 },
      { id: 'c5', x: 6.0, y: 4.6, z: 0 },
      { id: 'c6', x: 13.0, y: 4.6, z: -1.6 },
      { id: 'c7', x: 13.0, y: 4.6, z: 1.6 },
      { id: 'c8', x: 21.0, y: 5.6, z: 0 },
    ],
    checkpoints: [
      { id: 'cp1', x: 0.0, y: 4.0, z: -2.0 },
      { id: 'cp2', x: 12.0, y: 4.0, z: 0 },
    ],
    hint: 'Lompati atap oranye, panjat tangga putih, taruh kotak di tombol ungu, dan lanjut ke gedung finis!',
  },

  // =========================================================================
  // LEVEL 4: Hutan Sakura Pastel (Forest Biome — Panjang: 46 unit)
  // =========================================================================
  {
    id: 4,
    name: 'Hutan Sakura Pastel',
    subtitle: 'Isol aman di kolam pink, Salman aman di kolam biru!',
    theme: {
      skyTop: '#F8BBD0',
      skyBottom: '#E8F5E9',
      fogColor: '#FCE4EC',
      waterColor: '#81C784',
      sunColor: '#FFF8E1',
      backdrop: 'forest',
    },
    waterY: -2.0,
    spawnP1: { x: -17, y: 1.0, z: -2.0 },
    spawnP2: { x: -17, y: 1.0, z: 2.0 },
    goalPink: { x: 23.0, y: 1.0, z: -2.0 },
    goalBlue: { x: 23.0, y: 1.0, z: 2.0 },
    blocks: [
      { id: 'start', x: -15.5, y: 0, z: 0, w: 7.0, h: 1.0, d: 9.0, style: 'grass' },
      { id: 'lane_p', x: -6.0, y: 0, z: -2.6, w: 11.5, h: 1.0, d: 3.8, style: 'stone' },
      { id: 'lane_b', x: -6.0, y: 0, z: 2.6, w: 11.5, h: 1.0, d: 3.8, style: 'stone' },
      { id: 'mid', x: 3.0, y: 0, z: 0, w: 6.5, h: 1.0, d: 9.0, style: 'grass' },
      { id: 'elev_m', x: 9.0, y: 0, z: 0, w: 5.5, h: 1.5, d: 7.5, style: 'wood' },
      { id: 'gate_p', x: 14.5, y: 1.0, z: -2.2, w: 0.6, h: 3.2, d: 4.2, style: 'gate_wall', linkId: 'unlock_pink_door' },
      { id: 'gate_b', x: 14.5, y: 1.0, z: 2.2, w: 0.6, h: 3.2, d: 4.2, style: 'gate_wall', linkId: 'unlock_blue_door' },
      { id: 'end', x: 19.5, y: 0, z: 0, w: 10.5, h: 1.0, d: 9.0, style: 'grass' },
    ],
    ladders: [],
    crates: [],
    plates: [
      { id: 'pl_p', x: -2.2, y: 1.0, z: -2.6, color: 'pink', linkId: 'unlock_blue_door' },
      { id: 'pl_b', x: -2.2, y: 1.0, z: 2.6, color: 'blue', linkId: 'unlock_pink_door' },
    ],
    levers: [
      { id: 'lv1', x: 4.0, y: 1.0, z: -3.2, linkId: 'unlock_blue_door' },
      { id: 'lv2', x: 4.0, y: 1.0, z: 3.2, linkId: 'unlock_pink_door' },
    ],
    lasers: [],
    pools: [
      { id: 'pool_p', x: -7.5, y: 1.04, z: -2.6, w: 4.4, d: 3.2, kind: 'pink_pool' },
      { id: 'pool_b', x: -7.5, y: 1.04, z: 2.6, w: 4.4, d: 3.2, kind: 'blue_pool' },
      { id: 'pool_d', x: 9.0, y: 1.54, z: 0, w: 2.0, d: 3.0, kind: 'dark_pool' },
    ],
    trampolines: [],
    enemies: [],
    stars: [
      { id: 's1', x: -7.5, y: 2.1, z: -2.6 },
      { id: 's2', x: -7.5, y: 2.1, z: 2.6 },
      { id: 's3', x: 17.5, y: 2.3, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -11.0, y: 1.6, z: -2.6 },
      { id: 'c2', x: -11.0, y: 1.6, z: 2.6 },
      { id: 'c3', x: 1.5, y: 1.6, z: 0 },
      { id: 'c4', x: 9.0, y: 2.1, z: -2.6 },
      { id: 'c5', x: 9.0, y: 2.1, z: 2.6 },
      { id: 'c6', x: 16.5, y: 1.6, z: 0 },
      { id: 'c7', x: 21.0, y: 1.6, z: -2.0 },
      { id: 'c8', x: 21.0, y: 1.6, z: 2.0 },
    ],
    checkpoints: [
      { id: 'cp1', x: 2.2, y: 1.0, z: 0 },
      { id: 'cp2', x: 13.0, y: 1.0, z: 0 },
    ],
    hint: 'Isol melewati kolam pink, Salman melewati kolam biru! Tarik tuas di hutan tengah untuk membuka gerbang bersama!',
  },

  // =========================================================================
  // LEVEL 5: Ngarai Gurun & Menara Gendong (Desert Biome — Panjang: 46 unit)
  // =========================================================================
  {
    id: 5,
    name: 'Ngarai Menara Gurun',
    subtitle: 'Isol naik ke atas kepala Salman untuk mencapai puncak tebing gurun!',
    theme: {
      skyTop: '#4FC3F7',
      skyBottom: '#FFE0B2',
      fogColor: '#FFF3E0',
      waterColor: '#FFB74D',
      sunColor: '#FFFDE7',
      backdrop: 'desert',
    },
    waterY: -2.4,
    spawnP1: { x: -16.5, y: 1.0, z: -1.4 },
    spawnP2: { x: -16.5, y: 1.0, z: 1.4 },
    goalPink: { x: 22.5, y: 6.2, z: -1.8 },
    goalBlue: { x: 22.5, y: 6.2, z: 1.8 },
    blocks: [
      { id: 'base', x: -12.5, y: 0, z: 0, w: 11.0, h: 1.0, d: 8.5, style: 'stone' },
      {
        id: 'el_help',
        x: -6.2,
        y: 4.5,
        z: -2.4,
        w: 2.5,
        h: 0.4,
        d: 2.6,
        style: 'elevator',
        endX: -6.2,
        endY: 0.7,
        endZ: -2.4,
        speed: 2.8,
        linkId: 'ledge_help',
      },
      // Tebing tinggi 4.9 -> butuh naik ke atas kepala pasangan (2.62 + jump 2.24 = 4.86 + double jump!)
      { id: 'ledge1', x: -1.8, y: 0, z: 0, w: 6.0, h: 4.9, d: 7.8, style: 'stucco' },
      { id: 'br_des', x: 4.5, y: 4.6, z: 0, w: 6.6, h: 0.3, d: 4.0, style: 'bridge', linkId: 'des_bridge' },
      { id: 'mid_d', x: 10.5, y: 0, z: 0, w: 5.5, h: 4.9, d: 8.0, style: 'terracotta' },
      {
        id: 'elev1',
        x: 15.6,
        y: 4.5,
        z: 0,
        w: 3.8,
        h: 0.4,
        d: 4.4,
        style: 'elevator',
        endX: 15.6,
        endY: 5.8,
        endZ: 0,
        speed: 2.4,
        linkId: 'lift_up',
      },
      { id: 'top_plat', x: 21.5, y: 0, z: 0, w: 7.8, h: 6.2, d: 8.5, style: 'terracotta' },
    ],
    ladders: [],
    crates: [],
    plates: [],
    levers: [
      { id: 'lv_help', x: -3.2, y: 4.9, z: -2.4, linkId: 'ledge_help' },
      { id: 'lv_br', x: -0.2, y: 4.9, z: 2.4, linkId: 'des_bridge' },
      { id: 'lv_up', x: 12.0, y: 4.9, z: 2.4, linkId: 'lift_up' },
      { id: 'lv_up2', x: 18.6, y: 6.2, z: 2.4, linkId: 'lift_up' },
    ],
    lasers: [],
    pools: [
      { id: 'p_cac1', x: -11.0, y: 1.04, z: 2.6, w: 1.4, d: 1.4, kind: 'cactus' },
      { id: 'p_cac2', x: -11.0, y: 1.04, z: -2.6, w: 1.4, d: 1.4, kind: 'cactus' },
      { id: 'p_cac3', x: 10.5, y: 4.94, z: -2.6, w: 1.4, d: 1.4, kind: 'cactus' },
    ],
    trampolines: [],
    enemies: [],
    stars: [
      { id: 's1', x: -3.2, y: 6.0, z: 0 },
      { id: 's2', x: 4.5, y: 6.1, z: 0 },
      { id: 's3', x: 20.5, y: 7.4, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -13.0, y: 1.6, z: 0 },
      { id: 'c2', x: -9.5, y: 1.6, z: 0 },
      { id: 'c3', x: -1.8, y: 5.5, z: 0 },
      { id: 'c4', x: 3.5, y: 5.5, z: 0 },
      { id: 'c5', x: 5.5, y: 5.5, z: 0 },
      { id: 'c6', x: 10.5, y: 5.5, z: 0 },
      { id: 'c7', x: 15.6, y: 6.6, z: 0 },
      { id: 'c8', x: 20.5, y: 6.8, z: 0 },
    ],
    checkpoints: [
      { id: 'cp1', x: -0.5, y: 4.9, z: 0 },
      { id: 'cp2', x: 10.5, y: 4.9, z: 0 },
    ],
    hint: 'Lompat ke atas kepala pasanganmu lalu lompat lagi untuk naik tebing 4.9m! Tarik tuas untuk lift & jembatan gurun!',
  },

  // =========================================================================
  // LEVEL 6: Jembatan Laser Kastel (Castle Biome — Panjang: 48 unit)
  // =========================================================================
  {
    id: 6,
    name: 'Jembatan Laser Kastel',
    subtitle: 'Isol & Salman saling melindungi dari laser kastel!',
    theme: {
      skyTop: '#5C6BC0',
      skyBottom: '#F8BBD0',
      fogColor: '#E8EAF6',
      waterColor: '#455A64',
      sunColor: '#FFE082',
      backdrop: 'castle',
    },
    waterY: -2.4,
    spawnP1: { x: -17.5, y: 1.0, z: -1.5 },
    spawnP2: { x: -17.5, y: 1.0, z: 1.5 },
    goalPink: { x: 24.0, y: 1.0, z: -1.8 },
    goalBlue: { x: 24.0, y: 1.0, z: 1.8 },
    blocks: [
      { id: 'c1', x: -12.5, y: 0, z: 0, w: 12.5, h: 1.0, d: 8.5, style: 'stone' },
      { id: 'c2', x: -0.5, y: 0, z: 0, w: 10.5, h: 1.0, d: 8.5, style: 'stone' },
      { id: 'c3', x: 10.2, y: 0, z: 0, w: 8.5, h: 1.0, d: 8.5, style: 'stucco' },
      { id: 'br_las', x: 16.8, y: 0.7, z: 0, w: 4.6, h: 0.3, d: 4.6, style: 'bridge', linkId: 'castle_br' },
      { id: 'c4', x: 22.8, y: 0, z: 0, w: 7.0, h: 1.0, d: 8.5, style: 'stone' },
      { id: 'pil1', x: -6.5, y: 1.0, z: -3.6, w: 1.2, h: 3.2, d: 1.2, style: 'stucco' },
      { id: 'pil2', x: -6.5, y: 1.0, z: 3.6, w: 1.2, h: 3.2, d: 1.2, style: 'stucco' },
    ],
    ladders: [],
    crates: [
      { id: 'cr1', x: -14.0, y: 1.05, z: 0 },
    ],
    plates: [
      { id: 'pl_br', x: 12.6, y: 1.0, z: 0, color: 'purple', linkId: 'castle_br' },
    ],
    levers: [
      { id: 'lv_off', x: 20.6, y: 1.0, z: -2.8, linkId: 'castle_br' },
    ],
    lasers: [
      { id: 'las_p', x: -9.5, y: 1.75, z: -3.6, dir: '+z', maxLength: 7.2, color: 'pink' },
      { id: 'las_b', x: 6.8, y: 1.75, z: 3.6, dir: '-z', maxLength: 7.2, color: 'blue' },
      { id: 'las_d', x: -1.2, y: 1.75, z: -3.6, dir: '+z', maxLength: 7.2, color: 'dark' },
    ],
    pools: [],
    trampolines: [],
    enemies: [],
    stars: [
      { id: 's1', x: -9.5, y: 2.8, z: 0 },
      { id: 's2', x: -1.2, y: 2.8, z: 2.2 },
      { id: 's3', x: 22.5, y: 2.3, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -14.5, y: 1.6, z: -2.0 },
      { id: 'c2', x: -6.5, y: 1.6, z: 0 },
      { id: 'c3', x: 2.0, y: 1.6, z: -2.0 },
      { id: 'c4', x: 6.8, y: 1.6, z: 0 },
      { id: 'c5', x: 10.5, y: 1.6, z: 2.0 },
      { id: 'c6', x: 16.8, y: 1.6, z: 0 },
      { id: 'c7', x: 22.0, y: 1.6, z: -1.5 },
      { id: 'c8', x: 22.0, y: 1.6, z: 1.5 },
    ],
    checkpoints: [
      { id: 'cp1', x: -4.2, y: 1.0, z: 0 },
      { id: 'cp2', x: 9.2, y: 1.0, z: 0 },
    ],
    hint: 'Isol blokir laser Pink untuk Salman, Salman blokir laser Biru untuk Isol, dan dorong kotak kayu untuk memblokir laser Gelap!',
  },

  // =========================================================================
  // LEVEL 7: Kepulauan & Dua Perahu (Harbor Laut — Panjang: 48 unit)
  // =========================================================================
  {
    id: 7,
    name: 'Kepulauan Dua Perahu',
    subtitle: 'Koordinasikan perahu ferry Isol & Salman melewati kepulauan!',
    theme: {
      skyTop: '#29B6F6',
      skyBottom: '#FFF3E0',
      fogColor: '#E1F5FE',
      waterColor: '#0277BD',
      sunColor: '#FFF9C4',
      backdrop: 'harbor',
    },
    waterY: 0,
    spawnP1: { x: -18, y: 1.2, z: -1.5 },
    spawnP2: { x: -18, y: 1.2, z: 1.5 },
    goalPink: { x: 24.5, y: 1.2, z: -2.0 },
    goalBlue: { x: 24.5, y: 1.2, z: 2.0 },
    blocks: [
      { id: 'isl1', x: -16.5, y: -0.8, z: 0, w: 6.5, h: 2.0, d: 8.5, style: 'grass' },
      {
        id: 'boat_a',
        x: -11.2,
        y: -0.05,
        z: -1.6,
        w: 3.6,
        h: 1.25,
        d: 2.6,
        style: 'boat',
        endX: -4.2,
        endY: -0.05,
        endZ: -1.6,
        speed: 3.4,
        linkId: 'boat_a_go',
      },
      {
        id: 'boat_b',
        x: -11.2,
        y: -0.05,
        z: 1.8,
        w: 3.6,
        h: 1.25,
        d: 2.6,
        style: 'boat',
        endX: -4.2,
        endY: -0.05,
        endZ: 1.8,
        speed: 3.4,
        autoPingPong: true,
      },
      { id: 'isl2', x: 1.5, y: -0.8, z: 0, w: 7.8, h: 2.0, d: 8.8, style: 'stone' },
      { id: 'tbr', x: 8.6, y: 0.9, z: 0, w: 6.4, h: 0.3, d: 3.8, style: 'bridge', linkId: 'timed_cross', timedDuration: 8 },
      { id: 'isl_mid', x: 15.0, y: -0.8, z: 0, w: 6.2, h: 2.0, d: 8.5, style: 'stucco' },
      { id: 'tbr2', x: 19.6, y: 0.9, z: 0, w: 3.2, h: 0.3, d: 3.8, style: 'bridge', linkId: 'final_island_br' },
      { id: 'isl3', x: 24.0, y: -0.8, z: 0, w: 6.2, h: 2.0, d: 8.5, style: 'grass' },
    ],
    ladders: [],
    crates: [],
    plates: [
      { id: 'pl_a', x: -14.0, y: 1.2, z: 2.5, color: 'purple', linkId: 'boat_a_go' },
      { id: 'pl_time', x: 4.2, y: 1.2, z: -2.6, color: 'purple', linkId: 'timed_cross', timedDuration: 8 },
    ],
    levers: [
      { id: 'lv_a', x: -1.0, y: 1.2, z: -2.6, linkId: 'boat_a_go' },
      { id: 'lv_fin', x: 16.5, y: 1.2, z: 2.6, linkId: 'final_island_br' },
    ],
    lasers: [],
    pools: [],
    trampolines: [],
    enemies: [
      { id: 'crab1', x: 1.5, y: 1.2, z: 0, kind: 'crab', axis: 'z', min: -3.2, max: 3.2, speed: 2.5 },
      { id: 'crab2', x: 14.5, y: 1.2, z: 0, kind: 'crab', axis: 'z', min: -3.0, max: 3.0, speed: 2.5 },
    ],
    stars: [
      { id: 's1', x: -7.5, y: 2.0, z: -1.6 },
      { id: 's2', x: 8.6, y: 2.2, z: 0 },
      { id: 's3', x: 23.5, y: 2.4, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -7.5, y: 1.7, z: 1.8 },
      { id: 'c2', x: 0.0, y: 1.8, z: 0 },
      { id: 'c3', x: 6.8, y: 1.8, z: 0 },
      { id: 'c4', x: 10.4, y: 1.8, z: 0 },
      { id: 'c5', x: 14.5, y: 1.8, z: -2.0 },
      { id: 'c6', x: 19.6, y: 1.8, z: 0 },
      { id: 'c7', x: 23.5, y: 1.8, z: -1.6 },
      { id: 'c8', x: 23.5, y: 1.8, z: 1.6 },
    ],
    checkpoints: [
      { id: 'cp1', x: 1.5, y: 1.2, z: 2.6 },
      { id: 'cp2', x: 13.5, y: 1.2, z: -2.6 },
    ],
    hint: 'Naik perahu melintasi kepulauan, injak tombol berwaktu 8 detik untuk menyeberang, dan tarik tuas pulau ketiga!',
  },

  // =========================================================================
  // LEVEL 8: Negeri Awan Permen (Cloud Sky Biome — Panjang: 48 unit)
  // =========================================================================
  {
    id: 8,
    name: 'Negeri Awan Permen',
    subtitle: 'Memantul di trampolin bantal hati di atas lautan awan!',
    theme: {
      skyTop: '#90CAF9',
      skyBottom: '#FCE4EC',
      fogColor: '#FCE4EC',
      waterColor: '#FFF0F6',
      sunColor: '#FFF8E1',
      backdrop: 'clouds',
    },
    waterY: -3.2,
    spawnP1: { x: -17.5, y: 1.0, z: -1.4 },
    spawnP2: { x: -17.5, y: 1.0, z: 1.4 },
    goalPink: { x: 24.0, y: 5.0, z: -1.8 },
    goalBlue: { x: 24.0, y: 5.0, z: 1.8 },
    blocks: [
      { id: 'st', x: -16.0, y: 0, z: 0, w: 6.5, h: 1.0, d: 7.5, style: 'grass' },
      { id: 'cl1', x: -10.2, y: 0.8, z: -1.8, w: 3.4, h: 0.5, d: 3.2, style: 'cloud' },
      { id: 'cl2', x: -10.2, y: 0.8, z: 1.8, w: 3.4, h: 0.5, d: 3.2, style: 'cloud' },
      { id: 'cl3', x: -5.2, y: 1.1, z: 0, w: 3.6, h: 0.5, d: 4.2, style: 'cloud' },
      { id: 'mid', x: 0.5, y: 0, z: 0, w: 6.5, h: 1.2, d: 8.5, style: 'stucco' },
      { id: 'high1', x: 8.2, y: 0, z: 0, w: 6.2, h: 3.5, d: 7.5, style: 'stone' },
      { id: 'cl4', x: 14.5, y: 3.8, z: 0, w: 3.8, h: 0.5, d: 4.4, style: 'cloud' },
      { id: 'end', x: 22.0, y: 0, z: 0, w: 8.2, h: 5.0, d: 8.5, style: 'grass' },
    ],
    ladders: [],
    crates: [],
    plates: [],
    levers: [],
    lasers: [],
    pools: [],
    trampolines: [
      { id: 'tr1', x: 2.8, y: 1.2, z: -1.8, style: 'heart_cushion', power: 15.2 },
      { id: 'tr2', x: 2.8, y: 1.2, z: 1.8, style: 'mushroom', power: 15.2 },
      { id: 'tr3', x: 10.4, y: 3.5, z: 0, style: 'heart_cushion', power: 14.5 },
    ],
    enemies: [
      { id: 'gull1', x: 8.2, y: 5.0, z: 0, kind: 'seagull', axis: 'z', min: -3.2, max: 3.2, speed: 2.8 },
    ],
    stars: [
      { id: 's1', x: -5.2, y: 2.7, z: 0 },
      { id: 's2', x: 5.0, y: 5.4, z: 0 },
      { id: 's3', x: 21.0, y: 6.2, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -10.2, y: 2.0, z: -1.8 },
      { id: 'c2', x: -10.2, y: 2.0, z: 1.8 },
      { id: 'c3', x: 0.5, y: 1.8, z: 0 },
      { id: 'c4', x: 8.2, y: 4.1, z: -1.6 },
      { id: 'c5', x: 8.2, y: 4.1, z: 1.6 },
      { id: 'c6', x: 14.5, y: 5.1, z: 0 },
      { id: 'c7', x: 21.0, y: 5.6, z: -1.6 },
      { id: 'c8', x: 21.0, y: 5.6, z: 1.6 },
    ],
    checkpoints: [
      { id: 'cp1', x: 0.5, y: 1.2, z: 0 },
      { id: 'cp2', x: 7.2, y: 3.5, z: -2.0 },
    ],
    hint: 'Awan menghilang setelah diinjak! Lompat cepat antar awan lalu pakai trampolin bantal hati dan jamur!',
  },

  // =========================================================================
  // LEVEL 9: Benteng Salju Tuas Ganda (Snow Valley Biome — Panjang: 50 unit)
  // =========================================================================
  {
    id: 9,
    name: 'Benteng Salju Tuas Ganda',
    subtitle: 'Bawa kotak naik lift menara es & matikan laser untuk Isol & Salman!',
    theme: {
      skyTop: '#81D4FA',
      skyBottom: '#FFFFFF',
      fogColor: '#E1F5FE',
      waterColor: '#E0F7FA',
      sunColor: '#FFFDE7',
      backdrop: 'snow',
    },
    waterY: -2.4,
    spawnP1: { x: -17.5, y: 1.0, z: -1.4 },
    spawnP2: { x: -17.5, y: 1.0, z: 1.4 },
    goalPink: { x: 24.5, y: 3.5, z: -2.0 },
    goalBlue: { x: 24.5, y: 3.5, z: 2.0 },
    blocks: [
      { id: 'b1', x: -14.0, y: 0, z: 0, w: 9.5, h: 1.0, d: 8.5, style: 'stone' },
      {
        id: 'el1',
        x: -6.8,
        y: 0.65,
        z: 0,
        w: 4.8,
        h: 0.4,
        d: 4.2,
        style: 'elevator',
        endX: -6.8,
        endY: 3.15,
        endZ: 0,
        speed: 2.5,
        linkId: 'fort_el',
      },
      { id: 'b2', x: -0.5, y: 0, z: 0, w: 7.8, h: 3.5, d: 8.5, style: 'stucco' },
      { id: 'br2', x: 6.2, y: 3.2, z: 0, w: 5.6, h: 0.3, d: 4.2, style: 'bridge', linkId: 'fort_br' },
      { id: 'b2b', x: 12.6, y: 0, z: 0, w: 7.2, h: 3.5, d: 8.5, style: 'stone' },
      { id: 'br3', x: 18.2, y: 3.2, z: 0, w: 4.2, h: 0.3, d: 4.2, style: 'bridge', linkId: 'fort_br2' },
      { id: 'b3', x: 23.8, y: 0, z: 0, w: 7.0, h: 3.5, d: 8.5, style: 'stucco' },
    ],
    ladders: [],
    crates: [
      { id: 'cr1', x: -13.0, y: 1.05, z: 1.8 },
    ],
    plates: [
      { id: 'pl_br', x: 1.8, y: 3.5, z: -2.4, color: 'purple', linkId: 'fort_br' },
    ],
    levers: [
      { id: 'lv_el', x: -10.5, y: 1.0, z: -2.5, linkId: 'fort_el' },
      { id: 'lv_el2', x: -2.5, y: 3.5, z: 2.6, linkId: 'fort_el' },
      { id: 'lv_las', x: 14.5, y: 3.5, z: -2.8, linkId: 'las_off' },
      { id: 'lv_br2', x: 14.5, y: 3.5, z: 2.8, linkId: 'fort_br2' },
    ],
    lasers: [
      { id: 'las1', x: 6.2, y: 4.2, z: -2.4, dir: '+z', maxLength: 4.8, color: 'blue' },
      { id: 'las2', x: 18.2, y: 4.2, z: -2.4, dir: '+z', maxLength: 4.8, color: 'dark', linkId: 'las_off' },
    ],
    pools: [],
    trampolines: [],
    enemies: [],
    stars: [
      { id: 's1', x: -6.8, y: 4.4, z: 0 },
      { id: 's2', x: 6.2, y: 4.8, z: 0 },
      { id: 's3', x: 23.0, y: 4.8, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -14.5, y: 1.6, z: -1.5 },
      { id: 'c2', x: -0.5, y: 4.1, z: 0 },
      { id: 'c3', x: 6.2, y: 4.1, z: 0 },
      { id: 'c4', x: 12.6, y: 4.1, z: -1.6 },
      { id: 'c5', x: 12.6, y: 4.1, z: 1.6 },
      { id: 'c6', x: 18.2, y: 4.1, z: 0 },
      { id: 'c7', x: 23.5, y: 4.1, z: -1.6 },
      { id: 'c8', x: 23.5, y: 4.1, z: 1.6 },
    ],
    checkpoints: [
      { id: 'cp1', x: -2.0, y: 3.5, z: 0 },
      { id: 'cp2', x: 11.2, y: 3.5, z: 0 },
    ],
    hint: 'Naikkan kotak kayu di lift salju, buka jembatan pertama, lalu tarik dua tuas di menara tengah!',
  },

  // =========================================================================
  // LEVEL 10: Kota Menara Jam (Rooftops + Trampoline + Key — Panjang: 50 unit)
  // =========================================================================
  {
    id: 10,
    name: 'Kota Menara Jam',
    subtitle: 'Lintasi atap kota tua, ambil kunci & buka gerbang plaza!',
    theme: {
      skyTop: '#EC407A',
      skyBottom: '#FFE082',
      fogColor: '#FCE4EC',
      waterColor: '#A1887F',
      sunColor: '#FFFDE7',
      backdrop: 'rooftops',
    },
    waterY: -2.6,
    spawnP1: { x: -18, y: 1.2, z: -1.4 },
    spawnP2: { x: -18, y: 1.2, z: 1.4 },
    goalPink: { x: 25.5, y: 4.2, z: -2.0 },
    goalBlue: { x: 25.5, y: 4.2, z: 2.0 },
    blocks: [
      { id: 'f_start', x: -16, y: -0.8, z: 0, w: 7.5, h: 2.0, d: 8.5, style: 'stone' },
      { id: 'f_hop', x: -9.5, y: -0.8, z: 0, w: 4.2, h: 2.6, d: 5.5, style: 'terracotta', isRoof: true },
      { id: 'f_mid', x: -2.0, y: -0.8, z: 0, w: 8.5, h: 2.0, d: 9.0, style: 'stucco' },
      { id: 'f_high', x: 7.5, y: -0.8, z: 0, w: 7.5, h: 5.0, d: 9.0, style: 'stucco' },
      { id: 'f_roof', x: 7.5, y: 3.85, z: -4.2, w: 7.8, h: 0.45, d: 0.6, style: 'terracotta' },
      { id: 'f_br', x: 14.5, y: 3.9, z: 0, w: 6.4, h: 0.3, d: 4.2, style: 'bridge', linkId: 'clock_br' },
      { id: 'f_gate', x: 21.8, y: 4.2, z: 0, w: 0.6, h: 3.2, d: 8.5, style: 'gate_wall', linkId: 'fin_gate' },
      { id: 'f_end', x: 22.8, y: -0.8, z: 0, w: 9.5, h: 5.0, d: 9.0, style: 'grass' },
    ],
    ladders: [
      { id: 'lad_fin', x: 3.7, z: 0, yBottom: 1.2, yTop: 4.25, facing: '-x' },
    ],
    crates: [
      { id: 'cr1', x: -3.8, y: 1.2, z: 2.2 },
      { id: 'cr2', x: 6.5, y: 4.2, z: 2.4 },
    ],
    plates: [
      { id: 'pl_br', x: 9.5, y: 4.2, z: -2.4, color: 'purple', linkId: 'clock_br' },
    ],
    levers: [],
    lasers: [
      { id: 'las_f', x: 6.2, y: 4.95, z: -4.0, dir: '+z', maxLength: 8.0, color: 'pink' },
    ],
    pools: [
      { id: 'fp1', x: -0.2, y: 1.24, z: -2.6, w: 2.4, d: 3.0, kind: 'pink_pool' },
      { id: 'fp2', x: -0.2, y: 1.24, z: 2.6, w: 2.4, d: 3.0, kind: 'blue_pool' },
    ],
    trampolines: [
      { id: 'tr_fin', x: 1.4, y: 1.2, z: 0, style: 'heart_cushion', power: 15.0 },
    ],
    enemies: [
      { id: 'crab_fin', x: -3.0, y: 1.2, z: 0, kind: 'crab', axis: 'z', min: -3.2, max: 3.2, speed: 2.5 },
    ],
    keys: [
      { id: 'k_clock', x: 19.5, y: 5.0, z: 0, color: 'gold', linkId: 'fin_gate' },
    ],
    stars: [
      { id: 's1', x: -9.5, y: 3.1, z: 0 },
      { id: 's2', x: 14.5, y: 5.2, z: 0 },
      { id: 's3', x: 24.0, y: 5.4, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -14.0, y: 1.8, z: 0 },
      { id: 'c2', x: -9.5, y: 2.4, z: 1.5 },
      { id: 'c3', x: -2.0, y: 1.8, z: 0 },
      { id: 'c4', x: 7.5, y: 4.8, z: 0 },
      { id: 'c5', x: 13.0, y: 4.8, z: 0 },
      { id: 'c6', x: 16.0, y: 4.8, z: 0 },
      { id: 'c7', x: 24.5, y: 4.8, z: -1.6 },
      { id: 'c8', x: 24.5, y: 4.8, z: 1.6 },
    ],
    checkpoints: [
      { id: 'cp1', x: -4.2, y: 1.2, z: -2.5 },
      { id: 'cp2', x: 5.5, y: 4.2, z: 0 },
    ],
    hint: 'Naik atap menara lewat tangga atau trampolin, taruh kotak di tombol, lalu ambil Kunci Emas sebelum gerbang akhir!',
  },

  // =========================================================================
  // LEVEL 11: Rel Gergaji & Duri Kastel (Castle Biome — Panjang: 50 unit)
  // =========================================================================
  {
    id: 11,
    name: 'Rel Gergaji & Duri',
    subtitle: 'Lompati gergaji berputar & jebakan duri lantai mekanik!',
    theme: {
      skyTop: '#5C6BC0',
      skyBottom: '#FFCCBC',
      fogColor: '#EDE7F6',
      waterColor: '#37474F',
      sunColor: '#FFE082',
      backdrop: 'castle',
    },
    waterY: -2.4,
    spawnP1: { x: -18, y: 1.05, z: -1.5 },
    spawnP2: { x: -18, y: 1.05, z: 1.5 },
    goalPink: { x: 24.5, y: 1.0, z: -1.8 },
    goalBlue: { x: 24.5, y: 1.0, z: 1.8 },
    blocks: [
      { id: 's1', x: -16, y: 0, z: 0, w: 7.5, h: 1.0, d: 8.5, style: 'stone' },
      { id: 'saw_br', x: -7.0, y: 0, z: 0, w: 10.5, h: 1.0, d: 5.8, style: 'wood' },
      { id: 's2', x: 2.5, y: 0, z: 0, w: 9.0, h: 1.0, d: 8.5, style: 'stucco' },
      { id: 'saw_br2', x: 11.5, y: 0, z: 0, w: 9.0, h: 1.0, d: 6.0, style: 'stone' },
      { id: 's3', x: 21.0, y: 0, z: 0, w: 10.0, h: 1.0, d: 8.5, style: 'grass' },
    ],
    ladders: [],
    crates: [
      { id: 'cr1', x: 0.0, y: 1.05, z: 2.6 },
    ],
    plates: [
      { id: 'pl_sp', x: 4.5, y: 1.0, z: -2.8, color: 'purple', linkId: 'spike_gate_off' },
    ],
    levers: [
      { id: 'lv_saw', x: 16.8, y: 1.0, z: 2.8, linkId: 'stop_final_saw' },
    ],
    lasers: [],
    pools: [],
    trampolines: [],
    enemies: [],
    saws: [
      { id: 'saw1', x: -9.8, y: 1.0, z: 0, axis: 'z', min: -2.2, max: 2.2, speed: 3.0, radius: 0.7 },
      { id: 'saw2', x: -4.2, y: 1.0, z: 0, axis: 'z', min: -2.2, max: 2.2, speed: 3.4, radius: 0.7 },
      { id: 'saw3', x: 19.2, y: 1.0, z: 0, axis: 'z', min: -3.2, max: 3.2, speed: 3.5, radius: 0.75, linkId: 'stop_final_saw' },
    ],
    spikes: [
      { id: 'sp1', x: 2.0, y: 1.0, z: -1.6, w: 2.2, d: 2.0, cycleSeconds: 3.2, phase: 0 },
      { id: 'sp2', x: 2.0, y: 1.0, z: 1.6, w: 2.2, d: 2.0, cycleSeconds: 3.2, phase: 1.6 },
      { id: 'sp_gate', x: 6.6, y: 1.0, z: 0, w: 1.6, d: 4.4, linkId: 'spike_gate_off' },
      { id: 'sp3', x: 11.5, y: 1.0, z: 0, w: 2.6, d: 3.2, cycleSeconds: 3.0, phase: 0.8 },
    ],
    stars: [
      { id: 's1', x: -7.0, y: 2.2, z: 0 },
      { id: 's2', x: 11.5, y: 2.4, z: 0 },
      { id: 's3', x: 22.8, y: 2.2, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -13.5, y: 1.6, z: 0 },
      { id: 'c2', x: -7.0, y: 1.6, z: 1.8 },
      { id: 'c3', x: 2.0, y: 1.6, z: -1.6 },
      { id: 'c4', x: 6.6, y: 1.6, z: 0 },
      { id: 'c5', x: 10.0, y: 1.6, z: -1.8 },
      { id: 'c6', x: 13.0, y: 1.6, z: 1.8 },
      { id: 'c7', x: 22.5, y: 1.6, z: -1.5 },
      { id: 'c8', x: 22.5, y: 1.6, z: 1.5 },
    ],
    checkpoints: [
      { id: 'cp1', x: -1.2, y: 1.0, z: 0 },
      { id: 'cp2', x: 15.8, y: 1.0, z: -2.6 },
    ],
    hint: 'Awas gergaji berputar! Dorong kotak ke tombol ungu agar duri turun, lewati jembatan duri, dan matikan gergaji terakhir!',
  },

  // =========================================================================
  // LEVEL 12: Benteng Meriam Laut (Harbor Biome — Panjang: 50 unit)
  // =========================================================================
  {
    id: 12,
    name: 'Benteng Meriam Laut',
    subtitle: 'Tahan tembakan meriam pakai kotak kayu & ambil Kunci Emas!',
    theme: {
      skyTop: '#29B6F6',
      skyBottom: '#FFE0B2',
      fogColor: '#E1F5FE',
      waterColor: '#0277BD',
      sunColor: '#FFF3E0',
      backdrop: 'harbor',
    },
    waterY: 0,
    spawnP1: { x: -18.5, y: 1.25, z: -1.2 },
    spawnP2: { x: -18.5, y: 1.25, z: 1.2 },
    goalPink: { x: 24.5, y: 1.2, z: -2.0 },
    goalBlue: { x: 24.5, y: 1.2, z: 2.0 },
    blocks: [
      { id: 'isl1', x: -16.5, y: -0.8, z: 0, w: 8.0, h: 2.0, d: 8.5, style: 'grass' },
      { id: 'pier1', x: -7.5, y: 0.8, z: 0, w: 10.2, h: 0.4, d: 6.4, style: 'wood' },
      { id: 'isl2', x: 2.2, y: -0.8, z: 0, w: 9.5, h: 2.0, d: 9.0, style: 'stone' },
      { id: 'isl2_high', x: 2.5, y: 1.2, z: -2.8, w: 3.6, h: 1.7, d: 2.8, style: 'stucco' },
      { id: 'pier2', x: 11.2, y: 0.8, z: 0, w: 8.6, h: 0.4, d: 6.0, style: 'wood' },
      { id: 'gate_gold', x: 17.5, y: 1.2, z: 0, w: 0.6, h: 3.2, d: 8.0, style: 'gate_wall', linkId: 'gold_gate' },
      { id: 'isl3', x: 21.5, y: -0.8, z: 0, w: 11.5, h: 2.0, d: 8.5, style: 'grass' },
    ],
    ladders: [
      { id: 'lad_k', x: 0.65, z: -2.8, yBottom: 1.2, yTop: 2.95, facing: '-x' },
    ],
    crates: [
      { id: 'cr1', x: -14.2, y: 1.25, z: -1.2 },
    ],
    plates: [],
    levers: [
      { id: 'lv_can', x: -0.8, y: 1.2, z: 3.2, linkId: 'cannons_off' },
    ],
    lasers: [],
    pools: [],
    trampolines: [],
    enemies: [
      { id: 'crab1', x: 20.0, y: 1.2, z: 0, kind: 'crab', axis: 'z', min: -3.0, max: 3.0, speed: 2.5 },
    ],
    cannons: [
      { id: 'can1', x: -2.2, y: 1.2, z: -1.2, dir: '-x', interval: 2.2, speed: 5.8, maxRange: 11.5, linkId: 'cannons_off' },
      { id: 'can2', x: -2.2, y: 1.2, z: 1.6, dir: '-x', interval: 2.7, speed: 5.4, maxRange: 11.5, linkId: 'cannons_off' },
      { id: 'can3', x: 15.0, y: 1.2, z: 0, dir: '-x', interval: 2.4, speed: 5.8, maxRange: 9.0, linkId: 'cannons_off' },
    ],
    keys: [
      { id: 'k_gold', x: 2.5, y: 3.6, z: -2.8, color: 'gold', linkId: 'gold_gate' },
    ],
    stars: [
      { id: 's1', x: -7.5, y: 2.4, z: -1.2 },
      { id: 's2', x: 2.5, y: 4.1, z: -2.8 },
      { id: 's3', x: 22.5, y: 2.4, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -11.5, y: 1.8, z: 1.6 },
      { id: 'c2', x: -5.5, y: 1.8, z: 1.6 },
      { id: 'c3', x: 2.2, y: 1.8, z: 0 },
      { id: 'c4', x: 9.5, y: 1.8, z: 1.5 },
      { id: 'c5', x: 13.0, y: 1.8, z: -1.5 },
      { id: 'c6', x: 19.2, y: 1.8, z: 0 },
      { id: 'c7', x: 23.5, y: 1.8, z: -1.5 },
      { id: 'c8', x: 23.5, y: 1.8, z: 1.5 },
    ],
    checkpoints: [
      { id: 'cp1', x: -1.0, y: 1.2, z: 0 },
      { id: 'cp2', x: 6.2, y: 1.2, z: 0 },
    ],
    hint: 'Dorong kotak di depan meriam untuk menahan bola meriam! Panjat tangga ambil Kunci Emas untuk membuka gerbang pelabuhan!',
  },

  // =========================================================================
  // LEVEL 13: Pabrik Sabuk Gurun (Desert Biome — Panjang: 50 unit)
  // =========================================================================
  {
    id: 13,
    name: 'Pabrik Sabuk Gurun',
    subtitle: 'Balikkan arah sabuk berjalan & gunakan portal menara gurun!',
    theme: {
      skyTop: '#64B5F6',
      skyBottom: '#FFE0B2',
      fogColor: '#FFF3E0',
      waterColor: '#FFCC80',
      sunColor: '#FFFDE7',
      backdrop: 'desert',
    },
    waterY: -2.4,
    spawnP1: { x: -18, y: 1.05, z: -1.4 },
    spawnP2: { x: -18, y: 1.05, z: 1.4 },
    goalPink: { x: 24.5, y: 1.0, z: -1.8 },
    goalBlue: { x: 24.5, y: 1.0, z: 1.8 },
    blocks: [
      { id: 'start', x: -16.5, y: 0, z: 0, w: 7.0, h: 1.0, d: 8.5, style: 'stone' },
      {
        id: 'conv1',
        x: -8.5,
        y: 0,
        z: 0,
        w: 9.2,
        h: 1.0,
        d: 5.6,
        style: 'conveyor',
        flowX: -2.8,
        flowZ: 0,
        reverseLinkId: 'rev_belt',
      },
      { id: 'mid', x: 0.0, y: 0, z: 0, w: 8.0, h: 1.0, d: 9.0, style: 'stucco' },
      { id: 'tower', x: 1.5, y: 1.0, z: 2.8, w: 3.8, h: 2.6, d: 3.2, style: 'terracotta' },
      { id: 'conv_br', x: 6.5, y: 0.7, z: 0, w: 5.4, h: 0.3, d: 4.2, style: 'bridge', linkId: 'open_conv_br' },
      { id: 'conv2', x: 13.5, y: 0, z: 0, w: 8.6, h: 1.0, d: 6.0, style: 'conveyor', flowX: 2.5, flowZ: 0 },
      { id: 'gate_fac', x: 19.2, y: 1.0, z: 0, w: 0.6, h: 3.2, d: 8.2, style: 'gate_wall', linkId: 'factory_gate' },
      { id: 'end', x: 22.8, y: 0, z: 0, w: 8.5, h: 1.0, d: 8.5, style: 'grass' },
    ],
    ladders: [],
    crates: [
      { id: 'cr1', x: -14.2, y: 1.05, z: 0 },
    ],
    plates: [
      { id: 'pl_br', x: 2.2, y: 1.0, z: -1.4, color: 'purple', linkId: 'open_conv_br' },
    ],
    levers: [
      { id: 'lv_belt', x: -14.0, y: 1.0, z: -2.8, linkId: 'rev_belt' },
    ],
    lasers: [],
    pools: [],
    trampolines: [],
    enemies: [],
    saws: [
      { id: 'saw_c2', x: 13.5, y: 1.0, z: 0, axis: 'z', min: -2.2, max: 2.2, speed: 3.0, radius: 0.7 },
    ],
    keys: [
      { id: 'k_fac', x: 1.5, y: 4.3, z: 2.8, color: 'pink', linkId: 'factory_gate' },
    ],
    teleporters: [
      { id: 'tp_up', x: -2.2, y: 1.0, z: -2.8, targetX: 1.5, targetY: 3.7, targetZ: 2.0, color: 'purple' },
      { id: 'tp_dn', x: 1.5, y: 3.6, z: 3.6, targetX: -2.2, targetY: 1.05, targetZ: 0, color: 'pink' },
    ],
    stars: [
      { id: 's1', x: -8.5, y: 2.2, z: 0 },
      { id: 's2', x: 1.5, y: 4.9, z: 2.8 },
      { id: 's3', x: 13.5, y: 2.4, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -10.5, y: 1.6, z: 0 },
      { id: 'c2', x: -6.5, y: 1.6, z: 0 },
      { id: 'c3', x: 0.0, y: 1.6, z: 0 },
      { id: 'c4', x: 6.5, y: 1.6, z: 0 },
      { id: 'c5', x: 11.5, y: 1.6, z: -1.6 },
      { id: 'c6', x: 15.5, y: 1.6, z: 1.6 },
      { id: 'c7', x: 22.5, y: 1.6, z: -1.5 },
      { id: 'c8', x: 22.5, y: 1.6, z: 1.5 },
    ],
    checkpoints: [
      { id: 'cp1', x: -2.2, y: 1.0, z: 0 },
      { id: 'cp2', x: 9.8, y: 1.0, z: -2.0 },
    ],
    hint: 'Tarik tuas agar sabuk membawa kotak ke tombol ungu! Masuk portal ungu untuk mengambil Kunci di atas menara!',
  },

  // =========================================================================
  // LEVEL 14: Labirin Portal Salju (Snow Biome — Panjang: 50 unit)
  // =========================================================================
  {
    id: 14,
    name: 'Labirin Portal Salju',
    subtitle: 'Tukar kunci di jalur es & lompati gergaji salju!',
    theme: {
      skyTop: '#90CAF9',
      skyBottom: '#FFFFFF',
      fogColor: '#E3F2FD',
      waterColor: '#E1F5FE',
      sunColor: '#FFFDE7',
      backdrop: 'snow',
    },
    waterY: -2.8,
    spawnP1: { x: -18, y: 1.0, z: -2.0 },
    spawnP2: { x: -18, y: 1.0, z: 2.0 },
    goalPink: { x: 24.5, y: 1.0, z: -2.0 },
    goalBlue: { x: 24.5, y: 1.0, z: 2.0 },
    blocks: [
      { id: 'st', x: -16.5, y: 0, z: 0, w: 6.5, h: 1.0, d: 9.0, style: 'grass' },
      { id: 'isl_p', x: -7.5, y: 0, z: -2.6, w: 11.0, h: 1.0, d: 3.8, style: 'stucco' },
      { id: 'isl_b', x: -7.5, y: 0, z: 2.6, w: 11.0, h: 1.0, d: 3.8, style: 'stucco' },
      { id: 'mid', x: 3.5, y: 0, z: 0, w: 10.0, h: 1.0, d: 9.0, style: 'stone' },
      { id: 'mid2', x: 13.5, y: 0, z: 0, w: 8.5, h: 1.0, d: 9.0, style: 'stucco' },
      { id: 'gate_p', x: 18.8, y: 1.0, z: -2.2, w: 0.6, h: 3.2, d: 4.2, style: 'gate_wall', linkId: 'door_pink' },
      { id: 'gate_b', x: 18.8, y: 1.0, z: 2.2, w: 0.6, h: 3.2, d: 4.2, style: 'gate_wall', linkId: 'door_blue' },
      { id: 'end', x: 23.0, y: 0, z: 0, w: 7.5, h: 1.0, d: 9.0, style: 'grass' },
    ],
    ladders: [],
    crates: [],
    plates: [],
    levers: [],
    lasers: [
      { id: 'las_p', x: 1.5, y: 1.75, z: -4.2, dir: '+z', maxLength: 4.0, color: 'pink' },
      { id: 'las_b', x: 1.5, y: 1.75, z: 4.2, dir: '-z', maxLength: 4.0, color: 'blue' },
    ],
    pools: [
      { id: 'pp', x: -9.5, y: 1.04, z: -2.6, w: 3.2, d: 3.0, kind: 'pink_pool' },
      { id: 'pb', x: -9.5, y: 1.04, z: 2.6, w: 3.2, d: 3.0, kind: 'blue_pool' },
    ],
    trampolines: [],
    enemies: [],
    saws: [
      { id: 'saw_m1', x: 5.5, y: 1.0, z: 0, axis: 'z', min: -3.2, max: 3.2, speed: 3.3, radius: 0.7 },
      { id: 'saw_m2', x: 13.5, y: 1.0, z: 0, axis: 'z', min: -3.2, max: 3.2, speed: 3.5, radius: 0.7 },
    ],
    spikes: [
      { id: 'sp_m', x: 15.8, y: 1.0, z: 0, w: 1.8, d: 3.6, cycleSeconds: 3.0 },
    ],
    keys: [
      { id: 'k_b', x: -5.5, y: 1.8, z: -2.6, color: 'blue', linkId: 'door_blue' },
      { id: 'k_p', x: -5.5, y: 1.8, z: 2.6, color: 'pink', linkId: 'door_pink' },
    ],
    teleporters: [
      { id: 'tp_p', x: -2.8, y: 1.0, z: -2.6, targetX: -0.2, targetY: 1.05, targetZ: -2.2, color: 'pink' },
      { id: 'tp_b', x: -2.8, y: 1.0, z: 2.6, targetX: -0.2, targetY: 1.05, targetZ: 2.2, color: 'blue' },
    ],
    stars: [
      { id: 's1', x: -9.5, y: 2.2, z: -2.6 },
      { id: 's2', x: -9.5, y: 2.2, z: 2.6 },
      { id: 's3', x: 21.5, y: 2.2, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -12.0, y: 1.6, z: -2.6 },
      { id: 'c2', x: -12.0, y: 1.6, z: 2.6 },
      { id: 'c3', x: 3.5, y: 1.6, z: 0 },
      { id: 'c4', x: 10.5, y: 1.6, z: -2.0 },
      { id: 'c5', x: 10.5, y: 1.6, z: 2.0 },
      { id: 'c6', x: 15.8, y: 1.6, z: 0 },
      { id: 'c7', x: 22.5, y: 1.6, z: -2.0 },
      { id: 'c8', x: 22.5, y: 1.6, z: 2.0 },
    ],
    checkpoints: [
      { id: 'cp1', x: 0.2, y: 1.0, z: 0 },
      { id: 'cp2', x: 11.2, y: 1.0, z: 0 },
    ],
    hint: 'Isol ambil kunci Salman di jalur kiri, Salman ambil kunci Isol di jalur kanan, lalu masuk portal & lewati gergaji salju!',
  },

  // =========================================================================
  // LEVEL 15: Puncak Mahkota Sakura (Grand Finale Forest+Castle — Panjang: 54 unit)
  // =========================================================================
  {
    id: 15,
    name: 'Puncak Mahkota Cinta',
    subtitle: 'Ujian puncak Isol & Salman: semua rintangan dalam satu perjalanan panjang!',
    theme: {
      skyTop: '#EC407A',
      skyBottom: '#FFE082',
      fogColor: '#FCE4EC',
      waterColor: '#81C784',
      sunColor: '#FFFDE7',
      backdrop: 'forest',
    },
    waterY: 0,
    spawnP1: { x: -20, y: 1.25, z: -1.4 },
    spawnP2: { x: -20, y: 1.25, z: 1.4 },
    goalPink: { x: 28.5, y: 3.7, z: -2.0 },
    goalBlue: { x: 28.5, y: 3.7, z: 2.0 },
    blocks: [
      { id: 'f_start', x: -18.5, y: -0.8, z: 0, w: 6.5, h: 2.0, d: 8.5, style: 'grass' },
      {
        id: 'f_boat',
        x: -13.0,
        y: -0.05,
        z: 0,
        w: 3.8,
        h: 1.25,
        d: 2.9,
        style: 'boat',
        endX: -7.5,
        endY: -0.05,
        endZ: 0,
        speed: 3.6,
        linkId: 'fin_boat',
      },
      { id: 'f_mid', x: -1.0, y: -0.8, z: 0, w: 9.5, h: 2.0, d: 9.0, style: 'stucco' },
      { id: 'f_conv', x: 7.5, y: 0.2, z: 0, w: 7.4, h: 1.0, d: 5.6, style: 'conveyor', flowX: 2.4, flowZ: 0 },
      { id: 'f_plat', x: 14.5, y: -0.8, z: 0, w: 7.0, h: 2.0, d: 9.0, style: 'stone' },
      { id: 'f_cl1', x: 19.8, y: 2.2, z: 0, w: 3.2, h: 0.5, d: 4.5, style: 'cloud' },
      { id: 'f_crown', x: 25.5, y: -0.8, z: 0, w: 9.0, h: 4.5, d: 9.0, style: 'terracotta' },
      { id: 'gate_crown', x: 25.4, y: 3.7, z: 0, w: 0.6, h: 3.2, d: 8.5, style: 'gate_wall', linkId: 'crown_gate' },
    ],
    ladders: [
      { id: 'lad_c', x: 20.95, z: -2.6, yBottom: 1.2, yTop: 3.75, facing: '-x' },
    ],
    crates: [
      { id: 'cr1', x: -16.5, y: 1.25, z: 0 },
    ],
    plates: [],
    levers: [
      { id: 'lv_b1', x: -15.8, y: 1.2, z: -2.6, linkId: 'fin_boat' },
      { id: 'lv_b2', x: -4.8, y: 1.2, z: -2.6, linkId: 'fin_boat' },
      { id: 'lv_can', x: 2.5, y: 1.2, z: 3.2, linkId: 'fin_can_off' },
    ],
    lasers: [],
    pools: [],
    trampolines: [
      { id: 'tr_c', x: 16.5, y: 1.2, z: 1.6, style: 'heart_cushion', power: 14.8 },
    ],
    enemies: [],
    saws: [
      { id: 'saw_c', x: 7.5, y: 1.2, z: 0, axis: 'z', min: -2.2, max: 2.2, speed: 3.2, radius: 0.7 },
    ],
    spikes: [
      { id: 'sp_f1', x: -1.0, y: 1.2, z: -2.6, w: 2.2, d: 2.0, cycleSeconds: 3.0 },
      { id: 'sp_f2', x: -1.0, y: 1.2, z: 2.6, w: 2.2, d: 2.0, cycleSeconds: 3.0, phase: 1.5 },
    ],
    cannons: [
      { id: 'can_f', x: 3.0, y: 1.2, z: 0, dir: '-x', interval: 2.4, speed: 5.8, maxRange: 8.8, linkId: 'fin_can_off' },
    ],
    keys: [
      { id: 'k_crown', x: 23.0, y: 4.5, z: -2.2, color: 'gold', linkId: 'crown_gate' },
    ],
    stars: [
      { id: 's1', x: -10.0, y: 2.2, z: 0 },
      { id: 's2', x: 7.5, y: 2.6, z: 0 },
      { id: 's3', x: 23.8, y: 5.0, z: 0 },
    ],
    coins: [
      { id: 'c1', x: -17.5, y: 1.8, z: 1.8 },
      { id: 'c2', x: -1.0, y: 1.8, z: 0 },
      { id: 'c3', x: 7.5, y: 1.8, z: 1.4 },
      { id: 'c4', x: 14.5, y: 1.8, z: 0 },
      { id: 'c5', x: 19.8, y: 3.6, z: 0 },
      { id: 'c6', x: 23.0, y: 4.3, z: 1.6 },
      { id: 'c7', x: 27.5, y: 4.3, z: -1.6 },
      { id: 'c8', x: 27.5, y: 4.3, z: 1.6 },
    ],
    checkpoints: [
      { id: 'cp1', x: -4.0, y: 1.2, z: 2.6 },
      { id: 'cp2', x: 13.0, y: 1.2, z: 0 },
      { id: 'cp3', x: 22.0, y: 3.7, z: 2.2 },
    ],
    hint: 'Bawa kotak di perahu untuk menahan meriam, lewati sabuk berjalan & awan, lalu ambil Kunci Mahkota bersama!',
  },
];
