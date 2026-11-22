export type GirlOutfitId = 'unnes' | 'blouse' | 'sweater' | 'dress';
export type BoyOutfitId = 'pelayaran_putih' | 'pelayaran_navy' | 'kaos_beanie' | 'hoodie_blue';

export interface OutfitConfig {
  girl: GirlOutfitId;
  boy: BoyOutfitId;
}

export interface OutfitOption<T extends string> {
  id: T;
  name: string;
  subtitle: string;
  swatchPrimary: string;
  swatchSecondary: string;
}

export type AnimState = 'idle' | 'walk' | 'jump' | 'pulled' | 'dizzy' | 'wallSlide';

export type GameScreen = 'TITLE' | 'PLAYING' | 'PAUSED' | 'VICTORY';

export type PlayMode = 'LOCAL' | 'LDR_HOST' | 'LDR_GUEST';

export interface LdrRoomState {
  connected: boolean;
  code: string | null;
  isHost: boolean;
  myRole: 'p1' | 'p2';
  partnerJoined: boolean;
  partnerMicOn: boolean;
  statusMessage: string;
}

export type ElementColor = 'pink' | 'blue' | 'purple';

export interface PlatformDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'solid' | 'cloud' | 'elevator' | 'timed_bridge' | 'gate_bridge' | 'door_wall';
  // Elevator / Moving fields
  endX?: number;
  endY?: number;
  speed?: number;
  // Link to lever or plate (if set on elevator/timed_bridge/gate_bridge/door_wall)
  linkId?: string;
  // For door_wall: opens (disappears) when linkId is active; for gate_bridge/timed_bridge: appears when active
  timedDuration?: number;
}

export interface CrateDef {
  id: string;
  x: number;
  y: number;
  size?: number; // default 36
}

export interface PlateDef {
  id: string;
  x: number;
  y: number; // floor Y
  color: ElementColor; // pink = Girl/Crate, blue = Boy/Crate, purple = Anyone/Crate
  linkId: string;
  timedDuration?: number; // If > 0, latches for N seconds (for timed bridges)
}

export interface LeverDef {
  id: string;
  x: number;
  y: number; // floor Y
  linkId: string;
  initialOn?: boolean;
}

export interface LaserDef {
  id: string;
  x: number;
  y: number;
  dir: 'down' | 'up' | 'left' | 'right';
  maxLength: number;
  color: 'pink' | 'blue' | 'dark';
  linkId?: string; // If linked, turns OFF when linkId is active
}

export interface TrampolineDef {
  id: string;
  x: number;
  y: number;
  style: 'mushroom' | 'heart_cushion';
  power?: number;
}

export interface SeesawDef {
  id: string;
  cx: number;
  cy: number;
  length: number;
  maxAngle?: number;
}

export interface HazardDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'pink_pool' | 'blue_pool' | 'dark_pool' | 'cactus';
}

export interface EnemyDef {
  id: string;
  x: number;
  y: number;
  kind: 'crab' | 'seagull';
  patrolMin: number;
  patrolMax: number;
  speed: number;
}

export interface CollectibleDef {
  id: string;
  x: number;
  y: number;
  kind: 'heart_star' | 'love_letter';
}

export interface CoinDef {
  id: string;
  x: number;
  y: number;
}

export interface CheckpointDef {
  id: string;
  x: number;
  y: number;
}

export interface LevelTheme {
  skyTop: string;
  skyBottom: string;
  hillBack: string;
  hillFront: string;
  groundTop: string;
  groundBody: string;
  accent: string;
  backdropProp: 'campus' | 'harbor' | 'clouds' | 'beach' | 'night';
}

export interface LevelDef {
  id: number;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  theme: LevelTheme;
  spawnP1: { x: number; y: number };
  spawnP2: { x: number; y: number };
  goalPink: { x: number; y: number };
  goalBlue: { x: number; y: number };
  platforms: PlatformDef[];
  crates: CrateDef[];
  plates: PlateDef[];
  levers: LeverDef[];
  lasers: LaserDef[];
  trampolines: TrampolineDef[];
  seesaws: SeesawDef[];
  hazards: HazardDef[];
  enemies: EnemyDef[];
  collectibles: CollectibleDef[];
  coins: CoinDef[];
  checkpoints: CheckpointDef[];
  hint?: string;
}

export type LocalControlMode = 'solo_switch' | 'two_player';

export interface SaveProgress {
  outfits: OutfitConfig;
  starsByLevel: Record<number, number>;
  completedLevels: number[];
  muted: boolean;
  bgmMuted: boolean;
  touchMode: boolean;
  tetherEnabled: boolean;
  localControlMode: LocalControlMode;
}

export interface HudSnapshot {
  levelId: number;
  levelName: string;
  starsCollected: number;
  totalStars: number;
  coinsCollected: number;
  totalCoins: number;
  elapsedSeconds: number;
  p1AtGoal: boolean;
  p2AtGoal: boolean;
  tetherTension: number;
  rescueAlert: boolean;
  checkpointSaved: boolean;
  nearLeverHint: 'p1' | 'p2' | 'both' | null;
  activeLocalChar: 'p1' | 'p2';
  localControlMode: LocalControlMode;
}

export interface PlayerInputState {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressedAt: number;
  down: boolean;
  interactPressedAt: number;
}

export interface NetworkInput3D {
  moveX: number;
  moveZ: number;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  interactJustPressed: boolean;
  camYaw: number;
}

