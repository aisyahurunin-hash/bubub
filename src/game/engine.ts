import { soundFX } from './audio';
import { LEVELS } from './levels';
import {
  drawBoySprite,
  drawCactus,
  drawCheckpointFlag,
  drawCoin,
  drawCollectible,
  drawCrab,
  drawCrate,
  drawElementalDoor,
  drawGirlSprite,
  drawHeart,
  drawLever,
  drawSeagull,
} from './sprites';
import {
  AnimState,
  HudSnapshot,
  LevelDef,
  OutfitConfig,
  PlayMode,
  PlayerInputState,
} from './types';

interface PlayerRuntime {
  id: 'p1' | 'p2';
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  wallDir: -1 | 0 | 1;
  wallJumpLock: number;
  coyoteTimer: number;
  dizzyTimer: number;
  invulnTimer: number;
  pulledActive: boolean;
  scaleX: number;
  scaleY: number;
  ridingPlatformId: string | null;
  ridingPartnerId: 'p1' | 'p2' | null;
  onSeesawId: string | null;
  lastSafeX: number;
  lastSafeY: number;
}

interface CrateRuntime {
  id: string;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  grounded: boolean;
  ridingPlatformId: string | null;
}

interface CloudRuntime {
  id: string;
  state: 'solid' | 'shaking' | 'gone';
  timer: number;
}

interface ElevatorRuntime {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  progress: number; // 0..1
  dir: 1 | -1; // for continuous ping-pong
}

interface SeesawRuntime {
  id: string;
  angle: number;
}

interface EnemyRuntime {
  id: string;
  x: number;
  y: number;
  baseY: number;
  facing: 1 | -1;
  kind: 'crab' | 'seagull';
  patrolMin: number;
  patrolMax: number;
  speed: number;
}

interface TrampolineRuntime {
  id: string;
  bounce: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: 'dot' | 'heart' | 'bubble';
}

export interface NetworkSyncSnapshot {
  p1: { x: number; y: number; vx: number; vy: number; facing: 1 | -1; grounded: boolean; wallDir: -1 | 0 | 1; pulled: boolean; dizzy: number };
  p2: { x: number; y: number; vx: number; vy: number; facing: 1 | -1; grounded: boolean; wallDir: -1 | 0 | 1; pulled: boolean; dizzy: number };
  crates: { id: string; x: number; y: number }[];
  clouds: { id: string; state: 'solid' | 'shaking' | 'gone'; timer: number }[];
  elevators: { id: string; x: number; y: number }[];
  seesaws: { id: string; angle: number }[];
  enemies: { id: string; x: number; y: number; facing: 1 | -1 }[];
  collectedIds: string[];
  coinIds: string[];
  activeLinks: string[];
  leverStates: [string, boolean][];
  timedLinks: [string, number][];
  activatedCheckpoints: string[];
  tetherEnabled: boolean;
  elapsed: number;
}

const GRAVITY = 1250;
const MOVE_SPEED = 240;
const JUMP_VEL = -520;
const WALL_SLIDE_MAX_VY = 88;
const COYOTE_TIME = 0.095;
const JUMP_BUFFER = 0.11;
const TETHER_REST = 140;
const TETHER_MAX = 205;

export class CoOpGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId: number = 0;
  private lastTimestamp: number = 0;
  private worldTime: number = 0;

  private mode: 'DIORAMA' | 'PLAYING' | 'PAUSED' | 'VICTORY' = 'DIORAMA';
  private playMode: PlayMode = 'LOCAL';
  private myRole: 'p1' | 'p2' = 'p1';
  private tetherEnabled: boolean = false;
  private level: LevelDef = LEVELS[0];
  private outfits: OutfitConfig;

  private p1!: PlayerRuntime;
  private p2!: PlayerRuntime;

  private crates: CrateRuntime[] = [];
  private clouds: Map<string, CloudRuntime> = new Map();
  private elevators: Map<string, ElevatorRuntime> = new Map();
  private seesaws: Map<string, SeesawRuntime> = new Map();
  private enemies: EnemyRuntime[] = [];
  private trampolines: Map<string, TrampolineRuntime> = new Map();
  private collectedIds: Set<string> = new Set();
  private coinIds: Set<string> = new Set();
  private leverStates: Map<string, boolean> = new Map();
  private timedLinks: Map<string, number> = new Map();
  private activeLinks: Set<string> = new Set();
  private pressedPlates: Set<string> = new Set();
  private activatedCheckpoints: Set<string> = new Set();

  private particles: Particle[] = [];
  private cameraX: number = 0;
  private cameraY: number = 0;
  private shakeTimer: number = 0;
  private shakeIntensity: number = 0;
  private hitstopTimer: number = 0;
  private levelElapsed: number = 0;
  private goalCelebrateTimer: number = 0;
  private victoryTriggered: boolean = false;
  private closeHeartTimer: number = 0;
  private tugSoundCooldown: number = 0;
  private crateSoundCooldown: number = 0;
  private rescueBannerTimer: number = 0;
  private checkpointBannerTimer: number = 0;
  private hudEmitTimer: number = 0;
  private netSyncTimer: number = 0;
  private netInputTimer: number = 0;

  private inputP1: PlayerInputState = { left: false, right: false, jumpHeld: false, jumpPressedAt: -10, down: false, interactPressedAt: -10 };
  private inputP2: PlayerInputState = { left: false, right: false, jumpHeld: false, jumpPressedAt: -10, down: false, interactPressedAt: -10 };
  private localSingleInput: { left: boolean; right: boolean; jumpHeld: boolean; jumpJustPressed: boolean; down: boolean; interactJustPressed: boolean } = {
    left: false,
    right: false,
    jumpHeld: false,
    jumpJustPressed: false,
    down: false,
    interactJustPressed: false,
  };
  private lastSentInputKey: string = '';

  private onHudUpdate: (hud: HudSnapshot) => void;
  private onLevelVictory: (stars: number, coins: number, elapsed: number) => void;
  private onPauseToggle?: () => void;
  private onHostBroadcastState?: (state: NetworkSyncSnapshot) => void;
  private onGuestSendInput?: (input: { left: boolean; right: boolean; jumpHeld: boolean; jumpJustPressed: boolean; down: boolean; interactJustPressed: boolean }) => void;
  private onHostBroadcastEvent?: (eventName: string, payload?: unknown) => void;

  private bgStars = Array.from({ length: 56 }, (_, i) => ({
    x: (i * 197) % 3800,
    y: 22 + ((i * 89) % 260),
    phase: i * 0.7,
    size: i % 3 === 0 ? 4 : 2,
  }));

  constructor(
    canvas: HTMLCanvasElement,
    initialOutfits: OutfitConfig,
    callbacks: {
      onHudUpdate: (hud: HudSnapshot) => void;
      onLevelVictory: (stars: number, coins: number, elapsed: number) => void;
      onPauseToggle?: () => void;
      onHostBroadcastState?: (state: NetworkSyncSnapshot) => void;
      onGuestSendInput?: (input: { left: boolean; right: boolean; jumpHeld: boolean; jumpJustPressed: boolean; down: boolean; interactJustPressed: boolean }) => void;
      onHostBroadcastEvent?: (eventName: string, payload?: unknown) => void;
    }
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context not available');
    this.ctx = context;
    this.outfits = initialOutfits;
    this.onHudUpdate = callbacks.onHudUpdate;
    this.onLevelVictory = callbacks.onLevelVictory;
    this.onPauseToggle = callbacks.onPauseToggle;
    this.onHostBroadcastState = callbacks.onHostBroadcastState;
    this.onGuestSendInput = callbacks.onGuestSendInput;
    this.onHostBroadcastEvent = callbacks.onHostBroadcastEvent;

    this.loadLevel(1, 'DIORAMA');
    this.bindKeyboard();
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('blur', this.clearInputs);
  }

  public startLoop() {
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public destroy() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('blur', this.clearInputs);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  public setOutfits(outfits: OutfitConfig) {
    this.outfits = outfits;
  }

  public setTetherEnabled(enabled: boolean) {
    this.tetherEnabled = enabled;
  }

  public setNetworkConfig(playMode: PlayMode, myRole: 'p1' | 'p2') {
    this.playMode = playMode;
    this.myRole = myRole;
    this.clearInputs();
  }

  public getCurrentLevelId(): number {
    return this.level.id;
  }

  public setMode(mode: 'DIORAMA' | 'PLAYING' | 'PAUSED' | 'VICTORY') {
    this.mode = mode;
    if (mode !== 'PLAYING') {
      this.clearInputs();
    }
  }

  public applyRemoteInput(
    role: 'p1' | 'p2',
    input: { left: boolean; right: boolean; jumpHeld: boolean; jumpJustPressed: boolean; down: boolean; interactJustPressed?: boolean }
  ) {
    const target = role === 'p1' ? this.inputP1 : this.inputP2;
    target.left = Boolean(input.left);
    target.right = Boolean(input.right);
    if (input.down && !target.down) {
      target.interactPressedAt = this.worldTime;
    }
    if (input.interactJustPressed) {
      target.interactPressedAt = this.worldTime;
    }
    target.down = Boolean(input.down);
    if (input.jumpJustPressed || (input.jumpHeld && !target.jumpHeld)) {
      target.jumpPressedAt = this.worldTime;
    }
    target.jumpHeld = Boolean(input.jumpHeld);
  }

  public applyRemoteSyncState(s: NetworkSyncSnapshot) {
    if (this.playMode !== 'LDR_GUEST') return;
    this.p1.x += (s.p1.x - this.p1.x) * 0.65;
    this.p1.y += (s.p1.y - this.p1.y) * 0.65;
    this.p1.vx = s.p1.vx;
    this.p1.vy = s.p1.vy;
    this.p1.facing = s.p1.facing;
    this.p1.grounded = s.p1.grounded;
    this.p1.wallDir = s.p1.wallDir;
    this.p1.pulledActive = s.p1.pulled;
    this.p1.dizzyTimer = s.p1.dizzy;

    this.p2.x += (s.p2.x - this.p2.x) * 0.65;
    this.p2.y += (s.p2.y - this.p2.y) * 0.65;
    this.p2.vx = s.p2.vx;
    this.p2.vy = s.p2.vy;
    this.p2.facing = s.p2.facing;
    this.p2.grounded = s.p2.grounded;
    this.p2.wallDir = s.p2.wallDir;
    this.p2.pulledActive = s.p2.pulled;
    this.p2.dizzyTimer = s.p2.dizzy;

    for (const cr of s.crates) {
      const rt = this.crates.find((c) => c.id === cr.id);
      if (rt) {
        rt.x = cr.x;
        rt.y = cr.y;
      }
    }
    for (const c of s.clouds) {
      this.clouds.set(c.id, { id: c.id, state: c.state, timer: c.timer });
    }
    for (const el of s.elevators) {
      const rt = this.elevators.get(el.id);
      if (rt) {
        rt.x = el.x;
        rt.y = el.y;
      }
    }
    for (const sw of s.seesaws) {
      const rt = this.seesaws.get(sw.id);
      if (rt) rt.angle = sw.angle;
    }
    for (const en of s.enemies) {
      const rt = this.enemies.find((e) => e.id === en.id);
      if (rt) {
        rt.x = en.x;
        rt.y = en.y;
        rt.facing = en.facing;
      }
    }

    this.collectedIds = new Set(s.collectedIds);
    this.coinIds = new Set(s.coinIds);
    this.activeLinks = new Set(s.activeLinks);
    this.leverStates = new Map(s.leverStates);
    this.timedLinks = new Map(s.timedLinks);
    this.activatedCheckpoints = new Set(s.activatedCheckpoints);
    this.tetherEnabled = s.tetherEnabled;
    this.levelElapsed = s.elapsed;
    this.emitHud();
  }

  public handleRemoteEvent(eventName: string, payload?: unknown) {
    if (eventName === 'jump') {
      const d = (payload || {}) as { isGirl?: boolean };
      soundFX.playJump(Boolean(d.isGirl));
    } else if (eventName === 'wallJump') {
      const d = (payload || {}) as { isGirl?: boolean };
      soundFX.playWallJump(Boolean(d.isGirl));
    } else if (eventName === 'bounce') {
      soundFX.playBounce();
    } else if (eventName === 'coin') {
      soundFX.playCoin();
    } else if (eventName === 'collect') {
      soundFX.playCollect();
    } else if (eventName === 'lever') {
      soundFX.playLever();
    } else if (eventName === 'plate') {
      soundFX.playPlateDown();
    } else if (eventName === 'checkpoint') {
      soundFX.playCheckpoint();
      this.checkpointBannerTimer = 1.8;
    } else if (eventName === 'bonk') {
      soundFX.playBonk();
      this.triggerShake(5, 0.22);
    } else if (eventName === 'splash') {
      soundFX.playSplash();
    } else if (eventName === 'victory') {
      const d = (payload || {}) as { stars?: number; coins?: number; elapsed?: number };
      if (!this.victoryTriggered) {
        this.victoryTriggered = true;
        this.mode = 'VICTORY';
        soundFX.playVictory();
        this.onLevelVictory(d.stars ?? 0, d.coins ?? 0, d.elapsed ?? this.levelElapsed);
      }
    }
  }

  public loadLevel(levelId: number, targetMode: 'DIORAMA' | 'PLAYING' = 'PLAYING') {
    const found = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
    this.level = found;
    this.mode = targetMode;

    this.p1 = this.createPlayer('p1', found.spawnP1.x, found.spawnP1.y);
    this.p2 = this.createPlayer('p2', found.spawnP2.x, found.spawnP2.y);

    this.crates = found.crates.map((cr) => ({
      id: cr.id,
      x: cr.x,
      y: cr.y,
      size: cr.size || 36,
      vx: 0,
      vy: 0,
      grounded: false,
      ridingPlatformId: null,
    }));

    this.clouds.clear();
    this.elevators.clear();
    for (const plat of found.platforms) {
      if (plat.kind === 'cloud') {
        this.clouds.set(plat.id, { id: plat.id, state: 'solid', timer: 0 });
      } else if (plat.kind === 'elevator') {
        this.elevators.set(plat.id, {
          id: plat.id,
          x: plat.x,
          y: plat.y,
          dx: 0,
          dy: 0,
          progress: 0,
          dir: 1,
        });
      }
    }

    this.seesaws.clear();
    for (const sw of found.seesaws) {
      this.seesaws.set(sw.id, { id: sw.id, angle: 0 });
    }

    this.trampolines.clear();
    for (const tr of found.trampolines) {
      this.trampolines.set(tr.id, { id: tr.id, bounce: 0 });
    }

    this.leverStates.clear();
    for (const lv of found.levers) {
      this.leverStates.set(lv.id, Boolean(lv.initialOn));
    }

    this.enemies = found.enemies.map((e) => ({
      id: e.id,
      x: e.x,
      y: e.y,
      baseY: e.y,
      facing: 1,
      kind: e.kind,
      patrolMin: e.patrolMin,
      patrolMax: e.patrolMax,
      speed: e.speed,
    }));

    this.collectedIds.clear();
    this.coinIds.clear();
    this.timedLinks.clear();
    this.activeLinks.clear();
    this.pressedPlates.clear();
    this.activatedCheckpoints.clear();
    this.particles = [];
    this.levelElapsed = 0;
    this.goalCelebrateTimer = 0;
    this.victoryTriggered = false;
    this.shakeTimer = 0;
    this.hitstopTimer = 0;
    this.rescueBannerTimer = 0;
    this.checkpointBannerTimer = 0;
    this.cameraX = 0;
    this.cameraY = 0;
    this.clearInputs();
    this.emitHud();
  }

  public setTouchInput(player: 'p1' | 'p2', action: 'left' | 'right' | 'jump' | 'interact', pressed: boolean) {
    if (this.playMode === 'LOCAL') {
      const target = player === 'p1' ? this.inputP1 : this.inputP2;
      if (action === 'left') target.left = pressed;
      if (action === 'right') target.right = pressed;
      if (action === 'jump') {
        if (pressed && !target.jumpHeld) target.jumpPressedAt = this.worldTime;
        target.jumpHeld = pressed;
      }
      if (action === 'interact') {
        if (pressed && !target.down) target.interactPressedAt = this.worldTime;
        target.down = pressed;
      }
    } else {
      if (action === 'left') this.localSingleInput.left = pressed;
      if (action === 'right') this.localSingleInput.right = pressed;
      if (action === 'jump') {
        if (pressed && !this.localSingleInput.jumpHeld) {
          this.localSingleInput.jumpJustPressed = true;
        }
        this.localSingleInput.jumpHeld = pressed;
      }
      if (action === 'interact') {
        if (pressed && !this.localSingleInput.down) {
          this.localSingleInput.interactJustPressed = true;
        }
        this.localSingleInput.down = pressed;
      }
      this.syncSingleInputToLocalRole();
    }
  }

  private createPlayer(id: 'p1' | 'p2', x: number, y: number): PlayerRuntime {
    return {
      id,
      x,
      y,
      prevX: x,
      prevY: y,
      w: 28,
      h: 44,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      wallDir: 0,
      wallJumpLock: 0,
      coyoteTimer: 0,
      dizzyTimer: 0,
      invulnTimer: 0,
      pulledActive: false,
      scaleX: 1,
      scaleY: 1,
      ridingPlatformId: null,
      ridingPartnerId: null,
      onSeesawId: null,
      lastSafeX: x,
      lastSafeY: y,
    };
  }

  private handleResize = () => {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(320, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(240, Math.floor(rect.height * dpr));
  };

  private clearInputs = () => {
    this.inputP1 = { left: false, right: false, jumpHeld: false, jumpPressedAt: -10, down: false, interactPressedAt: -10 };
    this.inputP2 = { left: false, right: false, jumpHeld: false, jumpPressedAt: -10, down: false, interactPressedAt: -10 };
    this.localSingleInput = { left: false, right: false, jumpHeld: false, jumpJustPressed: false, down: false, interactJustPressed: false };
  };

  private bindKeyboard() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private syncSingleInputToLocalRole() {
    if (this.playMode === 'LDR_HOST') {
      this.applyRemoteInput(this.myRole, this.localSingleInput);
      this.localSingleInput.jumpJustPressed = false;
      this.localSingleInput.interactJustPressed = false;
    } else if (this.playMode === 'LDR_GUEST') {
      this.onGuestSendInput?.({ ...this.localSingleInput });
      this.localSingleInput.jumpJustPressed = false;
      this.localSingleInput.interactJustPressed = false;
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    soundFX.unlockAndStartBgm();

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.mode === 'PLAYING' || this.mode === 'PAUSED') {
        e.preventDefault();
        this.onPauseToggle?.();
      }
      return;
    }

    if (e.code === 'KeyR' && this.mode === 'PLAYING' && this.playMode !== 'LDR_GUEST') {
      e.preventDefault();
      this.loadLevel(this.level.id, 'PLAYING');
      return;
    }

    if (this.mode !== 'PLAYING') return;

    if (this.playMode === 'LOCAL') {
      switch (e.code) {
        case 'KeyA':
          this.inputP1.left = true;
          break;
        case 'KeyD':
          this.inputP1.right = true;
          break;
        case 'KeyW':
          if (!this.inputP1.jumpHeld) this.inputP1.jumpPressedAt = this.worldTime;
          this.inputP1.jumpHeld = true;
          break;
        case 'KeyS':
          if (!this.inputP1.down) this.inputP1.interactPressedAt = this.worldTime;
          this.inputP1.down = true;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.inputP2.left = true;
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.inputP2.right = true;
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!this.inputP2.jumpHeld) this.inputP2.jumpPressedAt = this.worldTime;
          this.inputP2.jumpHeld = true;
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!this.inputP2.down) this.inputP2.interactPressedAt = this.worldTime;
          this.inputP2.down = true;
          break;
      }
    } else {
      let changed = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        e.preventDefault();
        if (!this.localSingleInput.left) changed = true;
        this.localSingleInput.left = true;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        e.preventDefault();
        if (!this.localSingleInput.right) changed = true;
        this.localSingleInput.right = true;
      } else if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        e.preventDefault();
        if (!this.localSingleInput.jumpHeld) {
          this.localSingleInput.jumpJustPressed = true;
          changed = true;
        }
        this.localSingleInput.jumpHeld = true;
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        e.preventDefault();
        if (!this.localSingleInput.down) {
          this.localSingleInput.interactJustPressed = true;
          changed = true;
        }
        this.localSingleInput.down = true;
      }
      if (changed) this.syncSingleInputToLocalRole();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (this.playMode === 'LOCAL') {
      switch (e.code) {
        case 'KeyA':
          this.inputP1.left = false;
          break;
        case 'KeyD':
          this.inputP1.right = false;
          break;
        case 'KeyW':
          this.inputP1.jumpHeld = false;
          break;
        case 'KeyS':
          this.inputP1.down = false;
          break;
        case 'ArrowLeft':
          this.inputP2.left = false;
          break;
        case 'ArrowRight':
          this.inputP2.right = false;
          break;
        case 'ArrowUp':
          this.inputP2.jumpHeld = false;
          break;
        case 'ArrowDown':
          this.inputP2.down = false;
          break;
      }
    } else {
      let changed = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.localSingleInput.left = false;
        changed = true;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.localSingleInput.right = false;
        changed = true;
      } else if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        this.localSingleInput.jumpHeld = false;
        changed = true;
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        this.localSingleInput.down = false;
        changed = true;
      }
      if (changed) this.syncSingleInputToLocalRole();
    }
  };

  private triggerShake(intensity: number, duration: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  private spawnParticles(
    x: number,
    y: number,
    count: number,
    color: string,
    kind: Particle['kind'] = 'dot',
    speedScale = 1
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (35 + Math.random() * 95) * speedScale;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 45,
        life: 0.45 + Math.random() * 0.45,
        maxLife: 0.9,
        size: kind === 'heart' ? 2 : 3 + Math.floor(Math.random() * 3),
        color,
        kind,
      });
    }
  }

  private emitNetEvent(name: string, payload?: unknown) {
    if (this.playMode === 'LDR_HOST') {
      this.onHostBroadcastEvent?.(name, payload);
    }
  }

  private update(dt: number) {
    this.worldTime += dt;

    if (this.mode === 'PAUSED') return;

    if (this.mode === 'DIORAMA') {
      this.cameraX = 110 + Math.sin(this.worldTime * 0.25) * 90;
      this.closeHeartTimer -= dt;
      if (this.closeHeartTimer <= 0) {
        this.closeHeartTimer = 0.7;
        this.spawnParticles(108, 430, 1, '#FF80AB', 'heart', 0.45);
      }
      this.updateParticles(dt);
      return;
    }

    if (this.playMode === 'LDR_GUEST' && this.mode === 'PLAYING') {
      this.p1.x += this.p1.vx * dt * 0.35;
      this.p1.y += this.p1.vy * dt * 0.35;
      this.p2.x += this.p2.vx * dt * 0.35;
      this.p2.y += this.p2.vy * dt * 0.35;
      if (this.shakeTimer > 0) this.shakeTimer -= dt;
      if (this.checkpointBannerTimer > 0) this.checkpointBannerTimer -= dt;

      this.netInputTimer -= dt;
      if (this.netInputTimer <= 0) {
        this.netInputTimer = 0.05;
        const key = `${this.localSingleInput.left},${this.localSingleInput.right},${this.localSingleInput.jumpHeld},${this.localSingleInput.down}`;
        if (key !== this.lastSentInputKey) {
          this.lastSentInputKey = key;
          this.onGuestSendInput?.({ ...this.localSingleInput, jumpJustPressed: false, interactJustPressed: false });
        }
      }

      this.updateParticles(dt);
      this.updateCamera(dt);
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateParticles(dt);
      return;
    }

    if (this.mode === 'PLAYING') {
      this.levelElapsed += dt;
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }
    if (this.tugSoundCooldown > 0) this.tugSoundCooldown -= dt;
    if (this.crateSoundCooldown > 0) this.crateSoundCooldown -= dt;
    if (this.rescueBannerTimer > 0) this.rescueBannerTimer -= dt;
    if (this.checkpointBannerTimer > 0) this.checkpointBannerTimer -= dt;

    // 1. Update Timed Links, Levers & Pressure Plates
    this.updateLinksAndMechanisms(dt);

    // 2. Update Elevators
    for (const plat of this.level.platforms) {
      if (plat.kind === 'elevator') {
        const el = this.elevators.get(plat.id)!;
        const endX = plat.endX ?? plat.x;
        const endY = plat.endY ?? plat.y;
        const dist = Math.hypot(endX - plat.x, endY - plat.y);
        const speed = plat.speed || 100;
        const step = dist > 1 ? (speed / dist) * dt : 0;

        const prevX = el.x;
        const prevY = el.y;

        if (plat.linkId) {
          const active = this.activeLinks.has(plat.linkId);
          if (active) el.progress = Math.min(1, el.progress + step);
          else el.progress = Math.max(0, el.progress - step);
        } else {
          el.progress += step * el.dir;
          if (el.progress >= 1) {
            el.progress = 1;
            el.dir = -1;
          } else if (el.progress <= 0) {
            el.progress = 0;
            el.dir = 1;
          }
        }

        el.x = plat.x + (endX - plat.x) * el.progress;
        el.y = plat.y + (endY - plat.y) * el.progress;
        el.dx = el.x - prevX;
        el.dy = el.y - prevY;
      }
    }

    // 3. Update Clouds
    for (const [id, c] of this.clouds.entries()) {
      if (c.state === 'shaking') {
        c.timer -= dt;
        if (c.timer <= 0) {
          c.state = 'gone';
          c.timer = 2.4;
          const plat = this.level.platforms.find((p) => p.id === id);
          if (plat) this.spawnParticles(plat.x + plat.w / 2, plat.y + 10, 6, '#FFFFFF', 'dot', 0.7);
        }
      } else if (c.state === 'gone') {
        c.timer -= dt;
        if (c.timer <= 0) {
          c.state = 'solid';
          c.timer = 0;
        }
      }
    }

    // 4. Update Trampolines & Enemies
    for (const tr of this.trampolines.values()) {
      if (tr.bounce > 0) tr.bounce = Math.max(0, tr.bounce - dt * 5);
    }
    for (const en of this.enemies) {
      en.x += en.facing * en.speed * dt;
      if (en.x >= en.patrolMax) {
        en.x = en.patrolMax;
        en.facing = -1;
      } else if (en.x <= en.patrolMin) {
        en.x = en.patrolMin;
        en.facing = 1;
      }
      if (en.kind === 'seagull') {
        en.y = en.baseY + Math.sin(this.worldTime * 3.5 + en.patrolMin) * 14;
      }
    }

    // 5. Update Crates & Players
    if (this.mode === 'PLAYING') {
      this.p1.prevX = this.p1.x;
      this.p1.prevY = this.p1.y;
      this.p2.prevX = this.p2.x;
      this.p2.prevY = this.p2.y;

      this.updateCrates(dt);

      // Carry stacked partner before own movement
      if (this.p1.ridingPartnerId === 'p2') {
        // handled after p2 moves; instead apply previous frame delta cleanly below
      }

      this.updatePlayer(this.p1, this.inputP1, dt, true);
      this.updatePlayer(this.p2, this.inputP2, dt, false);

      // Resolve Player Stacking (Gendong / Kepala)
      this.resolvePlayerStacking();

      // Optional Tali Cinta
      if (this.tetherEnabled) {
        this.applyTetherPhysics(dt);
      } else {
        this.p1.pulledActive = false;
        this.p2.pulledActive = false;
      }

      this.updateSeesaws(dt);
      this.checkWorldInteractions();

      // Close or stacked heart particles
      const dist = Math.hypot(this.p1.x - this.p2.x, this.p1.y - this.p2.y);
      const stacked = this.p1.ridingPartnerId !== null || this.p2.ridingPartnerId !== null;
      if ((dist < 48 && this.p1.grounded && this.p2.grounded) || stacked) {
        this.closeHeartTimer -= dt;
        if (this.closeHeartTimer <= 0) {
          this.closeHeartTimer = 0.55;
          this.spawnParticles(
            (this.p1.x + this.p2.x) / 2 + 14,
            Math.min(this.p1.y, this.p2.y) - 4,
            1,
            '#FF80AB',
            'heart',
            0.5
          );
        }
      }

      // Dual Finish Gates Check!
      const p1AtGoal = this.isPlayerAtDoor(this.p1, this.level.goalPink);
      const p2AtGoal = this.isPlayerAtDoor(this.p2, this.level.goalBlue);
      if (p1AtGoal && p2AtGoal && !this.victoryTriggered) {
        this.goalCelebrateTimer += dt;
        if (Math.random() < 0.4) {
          this.spawnParticles(this.level.goalPink.x, this.level.goalPink.y - 35, 1, '#FF4081', 'heart', 1.1);
          this.spawnParticles(this.level.goalBlue.x, this.level.goalBlue.y - 35, 1, '#81D4FA', 'heart', 1.1);
        }
        if (this.goalCelebrateTimer >= 0.75) {
          this.victoryTriggered = true;
          this.mode = 'VICTORY';
          soundFX.playVictory();
          this.emitNetEvent('victory', {
            stars: this.collectedIds.size,
            coins: this.coinIds.size,
            elapsed: this.levelElapsed,
          });
          this.onLevelVictory(this.collectedIds.size, this.coinIds.size, this.levelElapsed);
        }
      } else {
        this.goalCelebrateTimer = Math.max(0, this.goalCelebrateTimer - dt * 2);
      }

      if (this.playMode === 'LDR_HOST') {
        this.netSyncTimer -= dt;
        if (this.netSyncTimer <= 0) {
          this.netSyncTimer = 0.033;
          this.onHostBroadcastState?.(this.exportSyncSnapshot());
        }
      }
    }

    this.updateParticles(dt);
    this.updateCamera(dt);

    this.hudEmitTimer -= dt;
    if (this.hudEmitTimer <= 0) {
      this.hudEmitTimer = 0.1;
      this.emitHud();
    }
  }

  private updateLinksAndMechanisms(dt: number) {
    // Decrement timed links
    for (const [linkId, rem] of this.timedLinks.entries()) {
      const next = rem - dt;
      if (next <= 0) this.timedLinks.delete(linkId);
      else this.timedLinks.set(linkId, next);
    }

    // Handle lever toggles from interactPressedAt
    for (const lv of this.level.levers) {
      const checkPlayer = (p: PlayerRuntime, inp: PlayerInputState) => {
        if (this.worldTime - inp.interactPressedAt <= 0.12) {
          const px = p.x + p.w / 2;
          const py = p.y + p.h;
          if (Math.abs(px - lv.x) < 38 && Math.abs(py - lv.y) < 36) {
            inp.interactPressedAt = -10;
            const next = !this.leverStates.get(lv.id);
            this.leverStates.set(lv.id, next);
            soundFX.playLever();
            this.emitNetEvent('lever');
            this.spawnParticles(lv.x, lv.y - 24, 6, next ? '#A5D6A7' : '#FFAB91', 'dot', 0.7);
          }
        }
      };
      checkPlayer(this.p1, this.inputP1);
      checkPlayer(this.p2, this.inputP2);
    }

    // Rebuild activeLinks
    this.activeLinks.clear();
    for (const lv of this.level.levers) {
      if (this.leverStates.get(lv.id)) {
        this.activeLinks.add(lv.linkId);
      }
    }
    for (const [linkId, rem] of this.timedLinks.entries()) {
      if (rem > 0) this.activeLinks.add(linkId);
    }

    // Check Pressure Plates
    const prevPlates = new Set(this.pressedPlates);
    this.pressedPlates.clear();

    for (const pl of this.level.plates) {
      let pressed = false;
      const checkRect = (rx: number, ry: number, rw: number, rh: number) =>
        rx + rw > pl.x - 16 && rx < pl.x + 16 && Math.abs(ry + rh - pl.y) < 12;

      // Crates press any plate
      for (const cr of this.crates) {
        if (checkRect(cr.x, cr.y, cr.size, cr.size)) {
          pressed = true;
          break;
        }
      }
      if (!pressed && (pl.color === 'pink' || pl.color === 'purple')) {
        if (checkRect(this.p1.x, this.p1.y, this.p1.w, this.p1.h)) pressed = true;
      }
      if (!pressed && (pl.color === 'blue' || pl.color === 'purple')) {
        if (checkRect(this.p2.x, this.p2.y, this.p2.w, this.p2.h)) pressed = true;
      }

      if (pressed) {
        this.pressedPlates.add(pl.id);
        this.activeLinks.add(pl.linkId);
        if (pl.timedDuration && pl.timedDuration > 0) {
          this.timedLinks.set(pl.linkId, pl.timedDuration);
        }
        if (!prevPlates.has(pl.id)) {
          soundFX.playPlateDown();
          this.emitNetEvent('plate');
        }
      }
    }
  }

  private getActiveSolids() {
    const result: { id: string; x: number; y: number; w: number; h: number; kind: string; oneWay: boolean }[] = [];
    for (const plat of this.level.platforms) {
      if (plat.kind === 'cloud') {
        const c = this.clouds.get(plat.id);
        if (!c || c.state === 'gone') continue;
        result.push({ id: plat.id, x: plat.x, y: plat.y, w: plat.w, h: plat.h, kind: 'cloud', oneWay: true });
      } else if (plat.kind === 'elevator') {
        const el = this.elevators.get(plat.id)!;
        result.push({ id: plat.id, x: el.x, y: el.y, w: plat.w, h: plat.h, kind: 'elevator', oneWay: true });
      } else if (plat.kind === 'gate_bridge' || plat.kind === 'timed_bridge') {
        if (plat.linkId && this.activeLinks.has(plat.linkId)) {
          result.push({ id: plat.id, x: plat.x, y: plat.y, w: plat.w, h: plat.h, kind: plat.kind, oneWay: true });
        }
      } else if (plat.kind === 'door_wall') {
        if (!plat.linkId || !this.activeLinks.has(plat.linkId)) {
          result.push({ id: plat.id, x: plat.x, y: plat.y, w: plat.w, h: plat.h, kind: 'door_wall', oneWay: false });
        }
      } else {
        result.push({ id: plat.id, x: plat.x, y: plat.y, w: plat.w, h: plat.h, kind: 'solid', oneWay: false });
      }
    }
    return result;
  }

  private updateCrates(dt: number) {
    const solids = this.getActiveSolids();

    for (const cr of this.crates) {
      // Carry with elevator
      if (cr.grounded && cr.ridingPlatformId) {
        const el = this.elevators.get(cr.ridingPlatformId);
        if (el) {
          cr.x += el.dx;
          cr.y += el.dy;
        }
      }

      // Check how many players are pushing this crate!
      let pushDir = 0;
      let pushCount = 0;
      const checkPush = (p: PlayerRuntime, inp: PlayerInputState) => {
        if (p.y + p.h > cr.y + 6 && p.y < cr.y + cr.size - 4) {
          if (inp.right && Math.abs(p.x + p.w - cr.x) <= 5) {
            pushDir += 1;
            pushCount++;
          } else if (inp.left && Math.abs(p.x - (cr.x + cr.size)) <= 5) {
            pushDir -= 1;
            pushCount++;
          }
        }
      };
      checkPush(this.p1, this.inputP1);
      checkPush(this.p2, this.inputP2);

      if (pushCount > 0 && pushDir !== 0) {
        const dir = pushDir > 0 ? 1 : -1;
        const speed = pushCount >= 2 ? 185 : 95;
        cr.vx = dir * speed;
        if (this.crateSoundCooldown <= 0) {
          this.crateSoundCooldown = 0.22;
          soundFX.playCratePush();
        }
      } else {
        cr.vx *= Math.pow(0.01, dt);
      }

      cr.vy = Math.min(780, cr.vy + GRAVITY * dt);

      // Move crate X & block against walls/other crates
      cr.x += cr.vx * dt;
      cr.x = Math.max(0, Math.min(this.level.width - cr.size, cr.x));
      for (const b of solids) {
        if (b.oneWay) continue;
        if (cr.x < b.x + b.w && cr.x + cr.size > b.x && cr.y < b.y + b.h - 2 && cr.y + cr.size > b.y + 2) {
          if (cr.vx > 0) cr.x = b.x - cr.size;
          else if (cr.vx < 0) cr.x = b.x + b.w;
          cr.vx = 0;
        }
      }

      // Move crate Y
      cr.y += cr.vy * dt;
      cr.grounded = false;
      cr.ridingPlatformId = null;

      for (const b of solids) {
        if (cr.x + cr.size <= b.x + 2 || cr.x >= b.x + b.w - 2) continue;
        if (cr.vy >= 0 && cr.y + cr.size >= b.y && cr.y + cr.size - cr.vy * 0.03 <= b.y + 18) {
          cr.y = b.y - cr.size;
          cr.vy = 0;
          cr.grounded = true;
          if (b.kind === 'elevator') cr.ridingPlatformId = b.id;
        }
      }

      // Crate on crate stacking
      for (const other of this.crates) {
        if (other === cr) continue;
        if (cr.x + cr.size <= other.x + 2 || cr.x >= other.x + other.size - 2) continue;
        if (cr.vy >= 0 && cr.y + cr.size >= other.y && cr.y + cr.size - cr.vy * 0.03 <= other.y + 16) {
          cr.y = other.y - cr.size;
          cr.vy = 0;
          cr.grounded = true;
        }
      }
    }
  }

  private updatePlayer(p: PlayerRuntime, input: PlayerInputState, dt: number, isGirl: boolean) {
    if (p.dizzyTimer > 0) p.dizzyTimer -= dt;
    if (p.invulnTimer > 0) p.invulnTimer -= dt;
    if (p.wallJumpLock > 0) p.wallJumpLock -= dt;

    if (p.grounded && p.ridingPlatformId) {
      const el = this.elevators.get(p.ridingPlatformId);
      if (el) {
        p.x += el.dx;
        p.y += el.dy;
      }
    }

    // Carry with bottom partner when stacked!
    if (p.ridingPartnerId) {
      const partner = p.ridingPartnerId === 'p1' ? this.p1 : this.p2;
      p.x += partner.x - partner.prevX;
      p.y += partner.y - partner.prevY;
    }

    p.scaleX += (1 - p.scaleX) * Math.min(1, dt * 14);
    p.scaleY += (1 - p.scaleY) * Math.min(1, dt * 14);

    if (p.dizzyTimer <= 0 && p.wallJumpLock <= 0) {
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const targetVx = dir * MOVE_SPEED;
      const accel = p.grounded ? 2300 : 1500;
      if (p.vx < targetVx) p.vx = Math.min(targetVx, p.vx + accel * dt);
      else if (p.vx > targetVx) p.vx = Math.max(targetVx, p.vx - accel * dt);
      if (dir !== 0) p.facing = dir as 1 | -1;
    } else if (p.dizzyTimer > 0) {
      p.vx *= Math.pow(0.05, dt);
    }

    if (p.grounded) p.coyoteTimer = COYOTE_TIME;
    else p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);

    const buffered = this.worldTime - input.jumpPressedAt <= JUMP_BUFFER;
    if (buffered && p.dizzyTimer <= 0) {
      if (p.coyoteTimer > 0 || p.pulledActive) {
        p.vy = p.pulledActive && p.coyoteTimer <= 0 ? JUMP_VEL * 0.9 : JUMP_VEL;
        p.grounded = false;
        p.ridingPartnerId = null;
        p.coyoteTimer = 0;
        input.jumpPressedAt = -10;
        p.scaleX = 0.82;
        p.scaleY = 1.22;
        soundFX.playJump(isGirl);
        this.emitNetEvent('jump', { isGirl });
        this.spawnParticles(p.x + p.w / 2, p.y + p.h, 4, '#FFF8F0', 'dot', 0.6);
      } else if (p.wallDir !== 0) {
        p.vy = JUMP_VEL * 0.95;
        p.vx = -p.wallDir * 275;
        p.facing = (-p.wallDir) as 1 | -1;
        p.wallJumpLock = 0.14;
        p.wallDir = 0;
        input.jumpPressedAt = -10;
        p.scaleX = 0.8;
        p.scaleY = 1.24;
        soundFX.playWallJump(isGirl);
        this.emitNetEvent('wallJump', { isGirl });
        this.spawnParticles(p.x + p.w / 2, p.y + p.h * 0.5, 5, '#FFF8F0', 'dot', 0.7);
      }
    }

    if (!input.jumpHeld && p.vy < -180) {
      p.vy += GRAVITY * 1.4 * dt;
    }

    p.vy = Math.min(820, p.vy + GRAVITY * dt);

    // Move X & resolve walls + crates
    p.x += p.vx * dt;
    p.x = Math.max(0, Math.min(this.level.width - p.w, p.x));
    this.resolveHorizontalAndWall(p, input);

    if (!p.grounded && p.wallDir !== 0 && p.vy > 0) {
      p.vy = Math.min(p.vy, WALL_SLIDE_MAX_VY);
      if (Math.random() < 0.25) {
        const dustX = p.wallDir === 1 ? p.x + p.w : p.x;
        this.spawnParticles(dustX, p.y + 18, 1, '#FFF8F0', 'dot', 0.35);
      }
    }

    const wasGrounded = p.grounded;
    p.y += p.vy * dt;
    p.grounded = false;
    p.ridingPlatformId = null;
    p.ridingPartnerId = null;
    p.onSeesawId = null;
    this.resolveVertical(p, wasGrounded);
  }

  private resolveHorizontalAndWall(p: PlayerRuntime, input: PlayerInputState) {
    const solids = this.getActiveSolids();
    p.wallDir = 0;

    for (const b of solids) {
      if (b.oneWay) continue;
      if (p.y < b.y + b.h - 4 && p.y + p.h > b.y + 4) {
        if (p.x < b.x + b.w && p.x + p.w > b.x) {
          if (p.vx > 0) {
            p.x = b.x - p.w;
            p.vx = 0;
            p.wallDir = 1;
          } else if (p.vx < 0) {
            p.x = b.x + b.w;
            p.vx = 0;
            p.wallDir = -1;
          }
        } else if (!p.grounded && b.h >= 40) {
          if (Math.abs(p.x + p.w - b.x) <= 2.5 && (input.right || p.vx >= 0)) p.wallDir = 1;
          else if (Math.abs(p.x - (b.x + b.w)) <= 2.5 && (input.left || p.vx <= 0)) p.wallDir = -1;
        }
      }
    }

    // Horizontal crate collision
    for (const cr of this.crates) {
      if (p.y < cr.y + cr.size - 5 && p.y + p.h > cr.y + 5) {
        if (p.x < cr.x + cr.size && p.x + p.w > cr.x) {
          if (p.x + p.w / 2 < cr.x + cr.size / 2) {
            p.x = cr.x - p.w;
            if (p.vx > 0) p.vx = Math.min(p.vx, 95);
          } else {
            p.x = cr.x + cr.size;
            if (p.vx < 0) p.vx = Math.max(p.vx, -95);
          }
        }
      }
    }
  }

  private resolveVertical(p: PlayerRuntime, wasGrounded: boolean) {
    const solids = this.getActiveSolids();
    for (const b of solids) {
      if (p.x + p.w <= b.x + 2 || p.x >= b.x + b.w - 2) continue;

      if (b.oneWay) {
        const prevBottom = p.y + p.h - p.vy * 0.025;
        if (p.vy >= 0 && prevBottom <= b.y + 14 && p.y + p.h >= b.y && p.y + p.h <= b.y + b.h + 14) {
          p.y = b.y - p.h;
          if (!wasGrounded && p.vy > 180) {
            p.scaleX = 1.22;
            p.scaleY = 0.8;
          }
          p.vy = 0;
          p.grounded = true;
          if (b.kind === 'elevator') p.ridingPlatformId = b.id;
          if (b.kind === 'cloud') {
            const c = this.clouds.get(b.id);
            if (c && c.state === 'solid') {
              c.state = 'shaking';
              c.timer = 1.35;
            }
          }
        }
      } else {
        if (p.y < b.y + b.h && p.y + p.h > b.y) {
          if (p.vy >= 0 && p.y + p.h - p.vy * 0.03 <= b.y + 18) {
            p.y = b.y - p.h;
            if (!wasGrounded && p.vy > 180) {
              p.scaleX = 1.22;
              p.scaleY = 0.8;
            }
            p.vy = 0;
            p.grounded = true;
          } else if (p.vy < 0 && p.y - p.vy * 0.03 >= b.y + b.h - 16) {
            p.y = b.y + b.h;
            p.vy = 0;
          }
        }
      }
    }

    // Stand on top of Pushable Crates
    for (const cr of this.crates) {
      if (p.x + p.w <= cr.x + 2 || p.x >= cr.x + cr.size - 2) continue;
      if (p.vy >= 0 && p.y + p.h >= cr.y && p.y + p.h - p.vy * 0.03 <= cr.y + 16) {
        p.y = cr.y - p.h;
        if (!wasGrounded && p.vy > 180) {
          p.scaleX = 1.2;
          p.scaleY = 0.82;
        }
        p.vy = 0;
        p.grounded = true;
      }
    }

    // Seesaws
    for (const sw of this.level.seesaws) {
      const rt = this.seesaws.get(sw.id)!;
      const half = sw.length / 2;
      const px = p.x + p.w / 2;
      if (px >= sw.cx - half - 4 && px <= sw.cx + half + 4) {
        const surfaceY = sw.cy + (px - sw.cx) * Math.tan(rt.angle) - 8;
        if (p.vy >= 0 && p.y + p.h >= surfaceY - 4 && p.y + p.h <= surfaceY + 22) {
          p.y = surfaceY - p.h;
          if (!wasGrounded && p.vy > 180) {
            p.scaleX = 1.2;
            p.scaleY = 0.82;
          }
          p.vy = 0;
          p.grounded = true;
          p.onSeesawId = sw.id;
        }
      }
    }
  }

  private resolvePlayerStacking() {
    const checkStack = (top: PlayerRuntime, bottom: PlayerRuntime) => {
      if (top.x + top.w <= bottom.x + 3 || top.x >= bottom.x + bottom.w - 3) return;
      const prevBottom = top.prevY + top.h;
      if (top.vy >= 0 && prevBottom <= bottom.y + 14 && top.y + top.h >= bottom.y && top.y + top.h <= bottom.y + 20) {
        top.y = bottom.y - top.h;
        top.vy = 0;
        top.grounded = true;
        top.ridingPartnerId = bottom.id;
      }
    };

    if (this.p1.y < this.p2.y) checkStack(this.p1, this.p2);
    else checkStack(this.p2, this.p1);
  }

  private applyTetherPhysics(dt: number) {
    const cx1 = this.p1.x + this.p1.w / 2;
    const cy1 = this.p1.y + this.p1.h / 2;
    const cx2 = this.p2.x + this.p2.w / 2;
    const cy2 = this.p2.y + this.p2.h / 2;

    const dx = cx2 - cx1;
    const dy = cy2 - cy1;
    const dist = Math.hypot(dx, dy);

    this.p1.pulledActive = false;
    this.p2.pulledActive = false;

    if (dist <= TETHER_REST || dist < 0.001) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const stretch = dist - TETHER_REST;
    const force = stretch * 7.5;

    const w1 = this.p1.grounded || this.p1.wallDir !== 0 ? 0.35 : 1.0;
    const w2 = this.p2.grounded || this.p2.wallDir !== 0 ? 0.35 : 1.0;
    const sumW = w1 + w2;

    this.p1.vx += (nx * force * (w1 / sumW)) * dt * 10;
    this.p1.vy += (ny * force * (w1 / sumW)) * dt * 10;
    this.p2.vx -= (nx * force * (w2 / sumW)) * dt * 10;
    this.p2.vy -= (ny * force * (w2 / sumW)) * dt * 10;

    if (dist > TETHER_MAX) {
      const excess = dist - TETHER_MAX;
      let r1 = 0.5;
      let r2 = 0.5;
      if (this.p1.grounded && !this.p2.grounded) {
        r1 = 0.12;
        r2 = 0.88;
        this.p2.pulledActive = true;
        this.rescueBannerTimer = 0.25;
      } else if (this.p2.grounded && !this.p1.grounded) {
        r1 = 0.88;
        r2 = 0.12;
        this.p1.pulledActive = true;
        this.rescueBannerTimer = 0.25;
      }

      this.p1.x += nx * excess * r1;
      this.p1.y += ny * excess * r1;
      this.p2.x -= nx * excess * r2;
      this.p2.y -= ny * excess * r2;

      const relVx = this.p2.vx - this.p1.vx;
      const relVy = this.p2.vy - this.p1.vy;
      const relDot = relVx * nx + relVy * ny;
      if (relDot > 0) {
        this.p1.vx += nx * relDot * r1;
        this.p1.vy += ny * relDot * r1;
        this.p2.vx -= nx * relDot * r2;
        this.p2.vy -= ny * relDot * r2;
      }

      if (this.tugSoundCooldown <= 0 && (this.p1.pulledActive || this.p2.pulledActive)) {
        this.tugSoundCooldown = 0.45;
        soundFX.playTug();
        this.spawnParticles((cx1 + cx2) / 2, (cy1 + cy2) / 2, 3, '#FF80AB', 'heart', 0.6);
      }
    }
  }

  private updateSeesaws(dt: number) {
    for (const sw of this.level.seesaws) {
      const rt = this.seesaws.get(sw.id)!;
      const maxA = sw.maxAngle ?? 0.32;
      let torque = 0;
      if (this.p1.onSeesawId === sw.id) torque += (this.p1.x + this.p1.w / 2 - sw.cx) / (sw.length / 2);
      if (this.p2.onSeesawId === sw.id) torque += (this.p2.x + this.p2.w / 2 - sw.cx) / (sw.length / 2);
      const targetAngle = Math.max(-maxA, Math.min(maxA, torque * maxA));
      rt.angle += (targetAngle - rt.angle) * Math.min(1, dt * 4.5);
    }
  }

  private getLaserBeamEnd(laser: LevelDef['lasers'][number]): { endX: number; endY: number; blocked: boolean } {
    const solids = this.getActiveSolids();
    let len = laser.maxLength;
    let blocked = false;

    const testBox = (bx: number, by: number, bw: number, bh: number) => {
      if (laser.dir === 'down') {
        if (laser.x >= bx && laser.x <= bx + bw && by >= laser.y && by - laser.y < len) {
          len = by - laser.y;
          blocked = true;
        }
      } else if (laser.dir === 'up') {
        if (laser.x >= bx && laser.x <= bx + bw && by + bh <= laser.y && laser.y - (by + bh) < len) {
          len = laser.y - (by + bh);
          blocked = true;
        }
      } else if (laser.dir === 'right') {
        if (laser.y >= by && laser.y <= by + bh && bx >= laser.x && bx - laser.x < len) {
          len = bx - laser.x;
          blocked = true;
        }
      } else {
        if (laser.y >= by && laser.y <= by + bh && bx + bw <= laser.x && laser.x - (bx + bw) < len) {
          len = laser.x - (bx + bw);
          blocked = true;
        }
      }
    };

    for (const b of solids) {
      if (!b.oneWay) testBox(b.x, b.y, b.w, b.h);
    }
    for (const cr of this.crates) {
      testBox(cr.x, cr.y, cr.size, cr.size);
    }
    // Matching-element player blocks the beam safely!
    if (laser.color === 'pink') testBox(this.p1.x, this.p1.y, this.p1.w, this.p1.h);
    if (laser.color === 'blue') testBox(this.p2.x, this.p2.y, this.p2.w, this.p2.h);

    const endX =
      laser.dir === 'right' ? laser.x + len : laser.dir === 'left' ? laser.x - len : laser.x;
    const endY =
      laser.dir === 'down' ? laser.y + len : laser.dir === 'up' ? laser.y - len : laser.y;

    return { endX, endY, blocked };
  }

  private checkWorldInteractions() {
    const players = [this.p1, this.p2];

    // 1. Trampolines
    for (const tr of this.level.trampolines) {
      for (const p of players) {
        const px = p.x + p.w / 2;
        if (Math.abs(px - tr.x) < 26 && p.vy >= 0 && p.y + p.h >= tr.y - 16 && p.y + p.h <= tr.y + 12) {
          p.vy = -(tr.power || 740);
          p.grounded = false;
          p.scaleX = 0.72;
          p.scaleY = 1.32;
          this.trampolines.get(tr.id)!.bounce = 1.0;
          soundFX.playBounce();
          this.emitNetEvent('bounce');
          this.spawnParticles(tr.x, tr.y - 10, 8, '#FF80AB', 'heart', 0.9);
        }
      }
    }

    // 2. Checkpoints
    for (const cp of this.level.checkpoints) {
      if (this.activatedCheckpoints.has(cp.id)) continue;
      for (const p of players) {
        const px = p.x + p.w / 2;
        const py = p.y + p.h;
        if (Math.abs(px - cp.x) < 36 && Math.abs(py - cp.y) < 48) {
          this.activatedCheckpoints.add(cp.id);
          this.p1.lastSafeX = cp.x - 18;
          this.p1.lastSafeY = cp.y - 46;
          this.p2.lastSafeX = cp.x + 14;
          this.p2.lastSafeY = cp.y - 46;
          this.checkpointBannerTimer = 1.8;
          soundFX.playCheckpoint();
          this.emitNetEvent('checkpoint');
          this.spawnParticles(cp.x, cp.y - 36, 10, '#FF80AB', 'heart', 0.9);
          break;
        }
      }
    }

    // 3. Love Coins
    for (const coin of this.level.coins) {
      if (this.coinIds.has(coin.id)) continue;
      for (const p of players) {
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h / 2;
        if (Math.hypot(cx - coin.x, cy - coin.y) < 26) {
          this.coinIds.add(coin.id);
          soundFX.playCoin();
          this.emitNetEvent('coin');
          this.spawnParticles(coin.x, coin.y, 5, '#FFD54F', 'dot', 0.8);
          this.emitHud();
          break;
        }
      }
    }

    // 4. Special Collectibles (3 Stars)
    for (const col of this.level.collectibles) {
      if (this.collectedIds.has(col.id)) continue;
      for (const p of players) {
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h / 2;
        if (Math.hypot(cx - col.x, cy - col.y) < 32) {
          this.collectedIds.add(col.id);
          soundFX.playCollect();
          this.emitNetEvent('collect');
          this.spawnParticles(col.x, col.y, 10, '#FFD54F', 'heart', 0.9);
          this.emitHud();
          break;
        }
      }
    }

    // 5. Enemies
    for (const en of this.enemies) {
      for (const p of players) {
        if (p.invulnTimer > 0) continue;
        const px = p.x + p.w / 2;
        const py = p.y + p.h / 2;
        if (Math.abs(px - en.x) < 23 && Math.abs(py - (en.y - (en.kind === 'crab' ? 10 : 0))) < 19) {
          this.applyBonk(p, px < en.x ? -1 : 1);
        }
      }
    }

    // 6. Elemental Hazards & Cactus & Lasers
    let respawnNeeded = false;

    for (const p of players) {
      const isGirl = p.id === 'p1';
      if (p.y > this.level.height + 50) {
        respawnNeeded = true;
        break;
      }

      for (const hz of this.level.hazards) {
        if (hz.kind === 'cactus') {
          if (
            p.invulnTimer <= 0 &&
            p.x + p.w > hz.x + 4 &&
            p.x < hz.x + hz.w - 4 &&
            p.y + p.h > hz.y + 4 &&
            p.y < hz.y + hz.h
          ) {
            this.applyBonk(p, p.x + p.w / 2 < hz.x + hz.w / 2 ? -1 : 1);
          }
        } else {
          // Pools: pink_pool safe for Girl, blue_pool safe for Boy, dark_pool dangerous for both!
          const overlapsPool =
            p.x + p.w > hz.x + 6 &&
            p.x < hz.x + hz.w - 6 &&
            p.y + p.h > hz.y + 6 &&
            p.y < hz.y + hz.h;
          if (overlapsPool) {
            if (hz.kind === 'dark_pool') respawnNeeded = true;
            else if (hz.kind === 'pink_pool' && !isGirl) respawnNeeded = true;
            else if (hz.kind === 'blue_pool' && isGirl) respawnNeeded = true;
          }
        }
      }
    }

    // Check Lasers
    if (!respawnNeeded) {
      for (const lz of this.level.lasers) {
        if (lz.linkId && this.activeLinks.has(lz.linkId)) continue;
        const { endX, endY } = this.getLaserBeamEnd(lz);
        const minX = Math.min(lz.x, endX) - 3;
        const maxX = Math.max(lz.x, endX) + 3;
        const minY = Math.min(lz.y, endY) - 3;
        const maxY = Math.max(lz.y, endY) + 3;

        for (const p of players) {
          const isGirl = p.id === 'p1';
          if (lz.color === 'pink' && isGirl) continue;
          if (lz.color === 'blue' && !isGirl) continue;
          if (p.x + p.w > minX && p.x < maxX && p.y + p.h > minY && p.y < maxY) {
            respawnNeeded = true;
          }
        }
      }
    }

    if (respawnNeeded) {
      soundFX.playSplash();
      this.emitNetEvent('splash');
      this.spawnParticles(this.p1.x + 14, this.p1.y + 20, 8, '#B3E5FC', 'bubble', 0.9);
      this.spawnParticles(this.p2.x + 14, this.p2.y + 20, 8, '#B3E5FC', 'bubble', 0.9);
      this.triggerShake(5, 0.2);

      this.p1.x = this.p1.lastSafeX;
      this.p1.y = this.p1.lastSafeY - 6;
      this.p1.vx = 0;
      this.p1.vy = 0;
      this.p2.x = this.p2.lastSafeX;
      this.p2.y = this.p2.lastSafeY - 6;
      this.p2.vx = 0;
      this.p2.vy = 0;
    }
  }

  private applyBonk(p: PlayerRuntime, pushDir: number) {
    p.vx = pushDir * 220;
    p.vy = -290;
    p.grounded = false;
    p.dizzyTimer = 0.65;
    p.invulnTimer = 1.15;
    p.scaleX = 1.25;
    p.scaleY = 0.78;
    this.hitstopTimer = 0.045;
    this.triggerShake(6, 0.24);
    soundFX.playBonk();
    this.emitNetEvent('bonk');
    this.spawnParticles(p.x + p.w / 2, p.y + 10, 7, '#FFD54F', 'dot', 0.9);
  }

  private isPlayerAtDoor(p: PlayerRuntime, door: { x: number; y: number }): boolean {
    const px = p.x + p.w / 2;
    const py = p.y + p.h;
    return Math.abs(px - door.x) < 30 && Math.abs(py - door.y) < 28;
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.kind === 'dot') pt.vy += 260 * dt;
      else pt.vy -= 18 * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  private updateCamera(dt: number) {
    const viewScale = this.getViewportScale();
    const viewW = this.canvas.width / viewScale;
    const viewH = this.canvas.height / viewScale;

    const midX = (this.p1.x + this.p2.x + this.p1.w) / 2;
    const midY = (this.p1.y + this.p2.y + this.p1.h) / 2;

    const targetX = Math.max(0, Math.min(Math.max(0, this.level.width - viewW), midX - viewW * 0.48));
    const targetY = Math.max(0, Math.min(Math.max(0, this.level.height - viewH), midY - viewH * 0.56));

    this.cameraX += (targetX - this.cameraX) * Math.min(1, dt * 6.5);
    this.cameraY += (targetY - this.cameraY) * Math.min(1, dt * 6.5);
  }

  private getViewportScale(): number {
    return Math.max(0.65, this.canvas.height / 580);
  }

  private getNearLeverHint(): 'p1' | 'p2' | 'both' | null {
    let n1 = false;
    let n2 = false;
    for (const lv of this.level.levers) {
      if (Math.abs(this.p1.x + 14 - lv.x) < 38 && Math.abs(this.p1.y + 44 - lv.y) < 36) n1 = true;
      if (Math.abs(this.p2.x + 14 - lv.x) < 38 && Math.abs(this.p2.y + 44 - lv.y) < 36) n2 = true;
    }
    if (n1 && n2) return 'both';
    if (n1) return 'p1';
    if (n2) return 'p2';
    return null;
  }

  private emitHud() {
    const dist = Math.hypot(this.p1.x - this.p2.x, this.p1.y - this.p2.y);
    const tension = this.tetherEnabled
      ? Math.max(0, Math.min(1, (dist - TETHER_REST) / (TETHER_MAX - TETHER_REST)))
      : 0;
    this.onHudUpdate({
      levelId: this.level.id,
      levelName: this.level.name,
      starsCollected: this.collectedIds.size,
      totalStars: this.level.collectibles.length,
      coinsCollected: this.coinIds.size,
      totalCoins: this.level.coins.length,
      elapsedSeconds: Math.floor(this.levelElapsed),
      p1AtGoal: this.isPlayerAtDoor(this.p1, this.level.goalPink),
      p2AtGoal: this.isPlayerAtDoor(this.p2, this.level.goalBlue),
      tetherTension: tension,
      rescueAlert: this.rescueBannerTimer > 0,
      checkpointSaved: this.checkpointBannerTimer > 0,
      nearLeverHint: this.getNearLeverHint(),
      activeLocalChar: 'p1',
      localControlMode: 'two_player',
    });
  }

  private exportSyncSnapshot(): NetworkSyncSnapshot {
    return {
      p1: {
        x: Math.round(this.p1.x * 10) / 10,
        y: Math.round(this.p1.y * 10) / 10,
        vx: Math.round(this.p1.vx),
        vy: Math.round(this.p1.vy),
        facing: this.p1.facing,
        grounded: this.p1.grounded,
        wallDir: this.p1.wallDir,
        pulled: this.p1.pulledActive,
        dizzy: Math.round(this.p1.dizzyTimer * 100) / 100,
      },
      p2: {
        x: Math.round(this.p2.x * 10) / 10,
        y: Math.round(this.p2.y * 10) / 10,
        vx: Math.round(this.p2.vx),
        vy: Math.round(this.p2.vy),
        facing: this.p2.facing,
        grounded: this.p2.grounded,
        wallDir: this.p2.wallDir,
        pulled: this.p2.pulledActive,
        dizzy: Math.round(this.p2.dizzyTimer * 100) / 100,
      },
      crates: this.crates.map((c) => ({ id: c.id, x: Math.round(c.x * 10) / 10, y: Math.round(c.y * 10) / 10 })),
      clouds: Array.from(this.clouds.values()),
      elevators: Array.from(this.elevators.values()).map((e) => ({ id: e.id, x: Math.round(e.x * 10) / 10, y: Math.round(e.y * 10) / 10 })),
      seesaws: Array.from(this.seesaws.values()).map((s) => ({ id: s.id, angle: Math.round(s.angle * 1000) / 1000 })),
      enemies: this.enemies.map((e) => ({ id: e.id, x: Math.round(e.x), y: Math.round(e.y), facing: e.facing })),
      collectedIds: Array.from(this.collectedIds),
      coinIds: Array.from(this.coinIds),
      activeLinks: Array.from(this.activeLinks),
      leverStates: Array.from(this.leverStates.entries()),
      timedLinks: Array.from(this.timedLinks.entries()),
      activatedCheckpoints: Array.from(this.activatedCheckpoints),
      tetherEnabled: this.tetherEnabled,
      elapsed: this.levelElapsed,
    };
  }

  // --- RENDERING ---

  private render() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    ctx.imageSmoothingEnabled = false;

    const theme = this.level.theme;
    const grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, theme.skyTop);
    grad.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    const scale = this.getViewportScale();
    const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeIntensity * 2 : 0;
    const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeIntensity * 2 : 0;

    ctx.save();
    ctx.scale(scale, scale);

    const viewW = cw / scale;
    const viewH = ch / scale;

    this.renderBackdrop(ctx, viewW, viewH);

    ctx.translate(Math.round(-this.cameraX + shakeX), Math.round(-this.cameraY + shakeY));

    // 1. Elemental Pools
    for (const hz of this.level.hazards) {
      if (hz.kind !== 'cactus') {
        this.renderPool(ctx, hz.x, hz.y, hz.w, hz.h, hz.kind);
      }
    }

    // 2. Platforms, Elevators, Timed/Gate Bridges & Door Walls
    this.renderPlatforms(ctx);

    // 3. Seesaws, Plates, Levers, Trampolines
    this.renderSeesaws(ctx);
    this.renderPlatesLeversTrampolines(ctx);

    // 4. Cactus Hazards
    for (const hz of this.level.hazards) {
      if (hz.kind === 'cactus') drawCactus(ctx, hz.x, hz.y, hz.w, hz.h);
    }

    // 5. Checkpoints
    for (const cp of this.level.checkpoints) {
      drawCheckpointFlag(ctx, cp.x, cp.y, this.activatedCheckpoints.has(cp.id), this.worldTime);
    }

    // 6. Dual Finish Doors (Pink & Blue)
    drawElementalDoor(
      ctx,
      this.level.goalPink.x,
      this.level.goalPink.y,
      'pink',
      this.isPlayerAtDoor(this.p1, this.level.goalPink),
      this.worldTime
    );
    drawElementalDoor(
      ctx,
      this.level.goalBlue.x,
      this.level.goalBlue.y,
      'blue',
      this.isPlayerAtDoor(this.p2, this.level.goalBlue),
      this.worldTime
    );

    // 7. Lasers
    this.renderLasers(ctx);

    // 8. Pushable Crates
    for (const cr of this.crates) {
      drawCrate(ctx, cr.x, cr.y, cr.size);
    }

    // 9. Coins & 3 Heart Stars
    for (const coin of this.level.coins) {
      if (!this.coinIds.has(coin.id)) drawCoin(ctx, coin.x, coin.y, this.worldTime);
    }
    for (const col of this.level.collectibles) {
      if (!this.collectedIds.has(col.id)) drawCollectible(ctx, col.x, col.y, col.kind, this.worldTime);
    }

    // 10. Enemies
    for (const en of this.enemies) {
      if (en.kind === 'crab') drawCrab(ctx, en.x, en.y, this.worldTime, en.facing);
      else drawSeagull(ctx, en.x, en.y, this.worldTime, en.facing);
    }

    // 11. Optional Tali Cinta
    if (this.tetherEnabled) {
      this.renderTether(ctx);
    }

    // 12. Players
    this.renderPlayer(ctx, this.p1, true);
    this.renderPlayer(ctx, this.p2, false);

    // 13. Particles
    this.renderParticles(ctx);

    ctx.restore();
  }

  private renderBackdrop(ctx: CanvasRenderingContext2D, viewW: number, viewH: number) {
    const theme = this.level.theme;
    if (theme.backdropProp === 'night') {
      for (const st of this.bgStars) {
        const sx = ((st.x - this.cameraX * 0.12) % (viewW + 200) + viewW + 200) % (viewW + 200) - 50;
        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(this.worldTime * 2 + st.phase));
        ctx.fillStyle = `rgba(255, 248, 225, ${alpha.toFixed(2)})`;
        ctx.fillRect(Math.round(sx), st.y, st.size, st.size);
      }
    }

    const orbX = Math.round(viewW * 0.82 - this.cameraX * 0.04);
    const orbY = 72;
    ctx.fillStyle = theme.backdropProp === 'night' ? '#FFF59D' : '#FFE082';
    ctx.fillRect(orbX - 20, orbY - 20, 40, 40);
    ctx.fillStyle = '#FFF8E1';
    ctx.fillRect(orbX - 14, orbY - 14, 28, 28);

    for (let i = 0; i < 6; i++) {
      const cx =
        ((i * 290 + this.worldTime * 12 - this.cameraX * 0.18) % (viewW + 260) + viewW + 260) % (viewW + 260) - 120;
      const cy = 54 + (i % 3) * 46;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.fillRect(Math.round(cx), cy, 68, 18);
      ctx.fillRect(Math.round(cx + 14), cy - 10, 38, 12);
    }

    const hillShift = -(this.cameraX * 0.25) % 320;
    ctx.fillStyle = theme.hillBack;
    for (let x = hillShift - 320; x < viewW + 320; x += 320) {
      ctx.fillRect(Math.round(x), viewH - 180, 180, 180);
      ctx.fillRect(Math.round(x + 30), viewH - 210, 120, 30);
      ctx.fillRect(Math.round(x + 150), viewH - 150, 190, 150);
    }

    const frontShift = -(this.cameraX * 0.42) % 420;
    ctx.fillStyle = theme.hillFront;
    for (let x = frontShift - 420; x < viewW + 420; x += 420) {
      const rx = Math.round(x);
      ctx.fillRect(rx, viewH - 120, 240, 120);
      ctx.fillRect(rx + 210, viewH - 145, 230, 145);

      if (theme.backdropProp === 'campus') {
        ctx.fillStyle = '#FFF3E0';
        ctx.fillRect(rx + 60, viewH - 172, 64, 52);
        ctx.fillStyle = '#FFAB91';
        ctx.fillRect(rx + 54, viewH - 182, 76, 12);
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(rx + 150, viewH - 160, 26, 26);
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(rx + 160, viewH - 134, 6, 14);
        ctx.fillStyle = theme.hillFront;
      } else if (theme.backdropProp === 'harbor' || theme.backdropProp === 'night') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(rx + 300, viewH - 180, 16, 28);
        ctx.fillStyle = '#F48FB1';
        ctx.fillRect(rx + 292, viewH - 152, 34, 8);
        ctx.fillStyle = theme.hillFront;
      }
    }
  }

  private renderPool(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    kind: 'pink_pool' | 'blue_pool' | 'dark_pool'
  ) {
    const base =
      kind === 'pink_pool' ? '#FF80AB' : kind === 'blue_pool' ? '#4FC3F7' : '#5D4037';
    const hi =
      kind === 'pink_pool' ? '#FCE4EC' : kind === 'blue_pool' ? '#E1F5FE' : '#8D6E63';
    ctx.fillStyle = base;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = hi;
    const waveShift = Math.floor(this.worldTime * 24) % 24;
    for (let wx = x - 24 + waveShift; wx < x + w; wx += 24) {
      const drawX = Math.max(x, wx);
      const drawW = Math.min(12, x + w - drawX);
      if (drawW > 0) ctx.fillRect(drawX, y + 2, drawW, 4);
    }
  }

  private renderPlatforms(ctx: CanvasRenderingContext2D) {
    const theme = this.level.theme;
    for (const plat of this.level.platforms) {
      if (plat.kind === 'cloud') {
        const c = this.clouds.get(plat.id);
        if (!c || c.state === 'gone') {
          ctx.strokeStyle = 'rgba(255,255,255,0.45)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          ctx.setLineDash([]);
          continue;
        }
        const shakeX = c.state === 'shaking' ? Math.sin(this.worldTime * 48) * 3 : 0;
        const cx = Math.round(plat.x + shakeX);
        const cy = Math.round(plat.y);
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(cx - 2, cy - 2, plat.w + 4, plat.h + 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx, cy, plat.w, plat.h);
        ctx.fillStyle = '#FCE4EC';
        ctx.fillRect(cx, cy + plat.h - 7, plat.w, 7);
        ctx.fillStyle = '#FFFFFF';
        for (let bx = 8; bx < plat.w - 20; bx += 26) {
          ctx.fillRect(cx + bx, cy - 6, 18, 6);
        }
      } else if (plat.kind === 'elevator') {
        const el = this.elevators.get(plat.id)!;
        const mx = Math.round(el.x);
        const my = Math.round(el.y);
        // Subtle guide track
        ctx.strokeStyle = 'rgba(93, 64, 55, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(plat.x + plat.w / 2, plat.y + 12);
        ctx.lineTo((plat.endX ?? plat.x) + plat.w / 2, (plat.endY ?? plat.y) + 12);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#5D4037';
        ctx.fillRect(mx - 2, my - 2, plat.w + 4, plat.h + 4);
        ctx.fillStyle = '#FFF3E0';
        ctx.fillRect(mx, my, plat.w, plat.h);
        ctx.fillStyle = plat.linkId && this.activeLinks.has(plat.linkId) ? '#A5D6A7' : '#81D4FA';
        ctx.fillRect(mx, my, plat.w, 6);
      } else if (plat.kind === 'gate_bridge' || plat.kind === 'timed_bridge') {
        const open = plat.linkId ? this.activeLinks.has(plat.linkId) : true;
        if (!open) {
          ctx.strokeStyle = 'rgba(255, 128, 171, 0.55)';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          ctx.setLineDash([]);
          continue;
        }
        const rem = plat.linkId ? this.timedLinks.get(plat.linkId) ?? 99 : 99;
        if (plat.kind === 'timed_bridge' && rem < 1.3 && Math.floor(this.worldTime * 12) % 2 === 0) {
          ctx.globalAlpha = 0.5;
        }
        const stripes = ['#FF80AB', '#FFD54F', '#A5D6A7', '#81D4FA'];
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(plat.x - 2, plat.y - 2, plat.w + 4, plat.h + 4);
        const stripeH = Math.max(4, Math.floor(plat.h / stripes.length));
        stripes.forEach((col, idx) => {
          ctx.fillStyle = col;
          ctx.fillRect(plat.x, plat.y + idx * stripeH, plat.w, stripeH);
        });
        ctx.globalAlpha = 1;

        // Countdown bar for timed bridge
        if (plat.kind === 'timed_bridge' && plat.timedDuration) {
          const pct = Math.max(0, Math.min(1, rem / plat.timedDuration));
          ctx.fillStyle = '#5D4037';
          ctx.fillRect(plat.x, plat.y - 9, plat.w, 5);
          ctx.fillStyle = '#FFD54F';
          ctx.fillRect(plat.x + 1, plat.y - 8, Math.round((plat.w - 2) * pct), 3);
        }
      } else if (plat.kind === 'door_wall') {
        const open = plat.linkId ? this.activeLinks.has(plat.linkId) : false;
        if (open) {
          ctx.strokeStyle = 'rgba(93, 64, 55, 0.25)';
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          ctx.setLineDash([]);
          continue;
        }
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(plat.x - 2, plat.y - 2, plat.w + 4, plat.h + 4);
        ctx.fillStyle = '#CE93D8';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.fillStyle = '#FFF8F0';
        ctx.fillRect(plat.x + 6, plat.y + 8, plat.w - 12, plat.h - 16);
      } else {
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(plat.x - 2, plat.y - 2, plat.w + 4, plat.h + 4);
        ctx.fillStyle = theme.groundBody;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.fillStyle = theme.groundTop;
        ctx.fillRect(plat.x, plat.y, plat.w, 12);
        ctx.fillStyle = 'rgba(93, 64, 55, 0.14)';
        for (let bx = plat.x + 12; bx < plat.x + plat.w - 16; bx += 36) {
          ctx.fillRect(bx, plat.y + 22, 14, 6);
        }
      }
    }
  }

  private renderSeesaws(ctx: CanvasRenderingContext2D) {
    for (const sw of this.level.seesaws) {
      const rt = this.seesaws.get(sw.id)!;
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(sw.cx - 12, sw.cy - 2, 24, 34);
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(sw.cx - 9, sw.cy + 1, 18, 28);

      ctx.save();
      ctx.translate(sw.cx, sw.cy);
      ctx.rotate(rt.angle);
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(-sw.length / 2 - 2, -10, sw.length + 4, 16);
      ctx.fillStyle = '#FFCCBC';
      ctx.fillRect(-sw.length / 2, -8, sw.length, 12);
      ctx.fillStyle = '#FF80AB';
      ctx.fillRect(-sw.length / 2, -8, sw.length, 4);
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
  }

  private renderPlatesLeversTrampolines(ctx: CanvasRenderingContext2D) {
    for (const tr of this.level.trampolines) {
      const rt = this.trampolines.get(tr.id)!;
      const squish = Math.round(rt.bounce * 6);
      const x = Math.round(tr.x - 18);
      const y = Math.round(tr.y - 16 + squish);
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(x + 10, tr.y - 8, 16, 8);
      if (tr.style === 'mushroom') {
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - 2, y - 2, 40, 14 - Math.floor(squish / 2));
        ctx.fillStyle = '#FF80AB';
        ctx.fillRect(x, y, 36, 10 - Math.floor(squish / 2));
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 6, y + 2, 6, 4);
        ctx.fillRect(x + 22, y + 2, 6, 4);
      } else {
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - 2, y - 2, 40, 14 - Math.floor(squish / 2));
        ctx.fillStyle = '#F48FB1';
        ctx.fillRect(x, y, 36, 10 - Math.floor(squish / 2));
        drawHeart(ctx, tr.x, y + 4, 1.5, '#FFFFFF');
      }
    }

    for (const pl of this.level.plates) {
      const pressed = this.pressedPlates.has(pl.id);
      const h = pressed ? 4 : 10;
      const fill =
        pl.color === 'pink' ? '#FF80AB' : pl.color === 'blue' ? '#81D4FA' : '#CE93D8';
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(pl.x - 18, pl.y - h - 2, 36, h + 2);
      ctx.fillStyle = fill;
      ctx.fillRect(pl.x - 16, pl.y - h, 32, h);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(pl.x - 6, pl.y - h + 2, 12, 2);
    }

    for (const lv of this.level.levers) {
      const on = Boolean(this.leverStates.get(lv.id));
      const near =
        (Math.abs(this.p1.x + 14 - lv.x) < 38 && Math.abs(this.p1.y + 44 - lv.y) < 36) ||
        (Math.abs(this.p2.x + 14 - lv.x) < 38 && Math.abs(this.p2.y + 44 - lv.y) < 36);
      drawLever(ctx, lv.x, lv.y, on, near);
    }
  }

  private renderLasers(ctx: CanvasRenderingContext2D) {
    for (const lz of this.level.lasers) {
      // Emitter block
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(lz.x - 10, lz.y - 8, 20, 12);
      ctx.fillStyle =
        lz.color === 'pink' ? '#FF80AB' : lz.color === 'blue' ? '#81D4FA' : '#9C27B0';
      ctx.fillRect(lz.x - 7, lz.y - 5, 14, 6);

      if (lz.linkId && this.activeLinks.has(lz.linkId)) continue;

      const { endX, endY } = this.getLaserBeamEnd(lz);
      const glow =
        lz.color === 'pink'
          ? 'rgba(255, 128, 171, 0.5)'
          : lz.color === 'blue'
            ? 'rgba(129, 212, 250, 0.5)'
            : 'rgba(186, 104, 200, 0.55)';
      const core =
        lz.color === 'pink' ? '#FF4081' : lz.color === 'blue' ? '#03A9F4' : '#7B1FA2';

      ctx.save();
      ctx.strokeStyle = glow;
      ctx.lineWidth = 10 + Math.sin(this.worldTime * 18) * 2;
      ctx.beginPath();
      ctx.moveTo(lz.x, lz.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.strokeStyle = core;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lz.x, lz.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lz.x, lz.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderTether(ctx: CanvasRenderingContext2D) {
    const x1 = this.p1.x + this.p1.w / 2;
    const y1 = this.p1.y + this.p1.h * 0.56;
    const x2 = this.p2.x + this.p2.w / 2;
    const y2 = this.p2.y + this.p2.h * 0.56;

    const dist = Math.hypot(x2 - x1, y2 - y1);
    const slack = Math.max(0, (TETHER_REST - dist) * 0.28);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 + slack;

    const tension = Math.max(0, Math.min(1, (dist - TETHER_REST) / (TETHER_MAX - TETHER_REST)));

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = tension > 0.65 ? 'rgba(255, 64, 129, 0.55)' : 'rgba(255, 128, 171, 0.42)';
    ctx.lineWidth = 7 + tension * 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.stroke();

    ctx.strokeStyle = tension > 0.75 ? '#FF4081' : '#FF80AB';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
      const t = (this.worldTime * 0.7 + i / 3) % 1;
      const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * midX + t * t * x2;
      const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * midY + t * t * y2;
      ctx.fillStyle = '#FFF8F0';
      ctx.fillRect(Math.round(bx - 2), Math.round(by - 2), 4, 4);
    }
    ctx.restore();
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, p: PlayerRuntime, isGirl: boolean) {
    if (p.invulnTimer > 0 && Math.floor(this.worldTime * 16) % 2 === 0) return;

    let anim: AnimState = 'idle';
    if (p.dizzyTimer > 0) anim = 'dizzy';
    else if (p.pulledActive) anim = 'pulled';
    else if (!p.grounded && p.wallDir !== 0 && p.vy >= 0) anim = 'wallSlide';
    else if (!p.grounded) anim = 'jump';
    else if (Math.abs(p.vx) > 20) anim = 'walk';

    const spriteW = 40;
    const spriteH = 52;
    const drawX = p.x + p.w / 2;
    const drawY = p.y + p.h;
    const drawFacing = anim === 'wallSlide' && p.wallDir !== 0 ? (p.wallDir as 1 | -1) : p.facing;

    ctx.save();
    ctx.translate(Math.round(drawX), Math.round(drawY));
    ctx.scale(p.scaleX, p.scaleY);

    if (isGirl) {
      drawGirlSprite(ctx, this.outfits.girl, {
        x: -spriteW / 2,
        y: -spriteH,
        scale: 2,
        facing: drawFacing,
        anim,
        time: this.worldTime,
      });
    } else {
      drawBoySprite(ctx, this.outfits.boy, {
        x: -spriteW / 2,
        y: -spriteH,
        scale: 2,
        facing: drawFacing,
        anim,
        time: this.worldTime,
      });
    }
    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const pt of this.particles) {
      const alpha = Math.max(0, Math.min(1, pt.life / 0.45));
      ctx.save();
      ctx.globalAlpha = alpha;
      if (pt.kind === 'heart') drawHeart(ctx, pt.x, pt.y, pt.size, pt.color);
      else if (pt.kind === 'bubble') {
        ctx.fillStyle = pt.color;
        ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size + 1, pt.size + 1);
      } else {
        ctx.fillStyle = pt.color;
        ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
      }
      ctx.restore();
    }
  }
}
