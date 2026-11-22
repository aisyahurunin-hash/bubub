import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { soundFX } from '../game/audio';
import {
  AnimState,
  HudSnapshot,
  LocalControlMode,
  NetworkInput3D,
  OutfitConfig,
  PlayMode,
} from '../game/types';
import {
  CharacterRig3D,
  animateCharacter3D,
  buildBoyCharacter3D,
  buildGirlCharacter3D,
} from './characters';
import {
  BlockDef3D,
  CannonDef3D,
  KeyDef3D,
  LEVELS_3D,
  LevelDef3D,
  SawDef3D,
  SpikeDef3D,
  TeleporterDef3D,
} from './levels3d';
import { ProceduralTextures, createProceduralTextures } from './textures';

export interface NetworkSyncSnapshot3D {
  p1: {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    yaw: number;
    grounded: boolean;
    wallNormalX: number;
    wallNormalZ: number;
    pulled: boolean;
    dizzy: number;
    pushing: boolean;
  };
  p2: {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    yaw: number;
    grounded: boolean;
    wallNormalX: number;
    wallNormalZ: number;
    pulled: boolean;
    dizzy: number;
    pushing: boolean;
  };
  crates: { id: string; x: number; y: number; z: number }[];
  movers: { id: string; x: number; y: number; z: number }[];
  clouds: { id: string; state: 'solid' | 'shaking' | 'gone'; timer: number }[];
  enemies: { id: string; x: number; y: number; z: number; facing: 1 | -1 }[];
  collectedStars: string[];
  collectedCoins: string[];
  collectedKeys: string[];
  activeLinks: string[];
  leverStates: [string, boolean][];
  timedLinks: [string, number][];
  activatedCheckpoints: string[];
  saws: { id: string; x: number; z: number; paused: boolean }[];
  spikes: { id: string; upFactor: number }[];
  cannonballs: { x: number; y: number; z: number }[];
  tetherEnabled: boolean;
  elapsed: number;
}

interface PlayerRuntime3D {
  id: 'p1' | 'p2';
  x: number;
  y: number;
  z: number;
  prevX: number;
  prevY: number;
  prevZ: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  radius: number;
  height: number;
  grounded: boolean;
  wallNormalX: number;
  wallNormalZ: number;
  wallJumpLock: number;
  coyoteTimer: number;
  airJumpsRemaining: number;
  dizzyTimer: number;
  invulnTimer: number;
  pulledActive: boolean;
  isPushing: boolean;
  onLadder: boolean;
  ridingBlockId: string | null;
  ridingPartnerId: 'p1' | 'p2' | null;
  teleportCooldown: number;
  lastSafeX: number;
  lastSafeY: number;
  lastSafeZ: number;
}

interface CrateRuntime3D {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  grounded: boolean;
  ridingBlockId: string | null;
  mesh: THREE.Group;
}

interface MoverRuntime3D {
  id: string;
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
  progress: number;
  dir: 1 | -1;
  mesh: THREE.Object3D;
}

interface CloudRuntime3D {
  id: string;
  state: 'solid' | 'shaking' | 'gone';
  timer: number;
  mesh: THREE.Object3D;
}

interface EnemyRuntime3D {
  id: string;
  x: number;
  y: number;
  z: number;
  baseY: number;
  facing: 1 | -1;
  kind: 'crab' | 'seagull';
  axis: 'x' | 'z';
  min: number;
  max: number;
  speed: number;
  mesh: THREE.Group;
}

interface LaserVisual3D {
  def: LevelDef3D['lasers'][number];
  beamMesh: THREE.Mesh;
  coreMesh: THREE.Mesh;
}

interface SawRuntime3D {
  def: SawDef3D;
  x: number;
  z: number;
  dir: 1 | -1;
  paused: boolean;
  discGroup: THREE.Group;
}

interface SpikeRuntime3D {
  def: SpikeDef3D;
  upFactor: number; // 0 = retracted, 1 = extended
  warning: boolean;
  spikesGroup: THREE.Group;
  plateMat: THREE.MeshStandardMaterial;
}

interface CannonRuntime3D {
  def: CannonDef3D;
  timer: number;
  mesh: THREE.Group;
}

interface CannonballRuntime3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  life: number;
  mesh: THREE.Mesh;
}

interface Particle3D {
  mesh: THREE.Mesh;
  active: boolean;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

interface InputPadState {
  moveX: number;
  moveZ: number;
  jumpHeld: boolean;
  jumpPressedAt: number;
  interactPressedAt: number;
  camYaw: number;
}

const GRAVITY = 26.0;
const MOVE_SPEED = 6.2;
const JUMP_VEL = 10.8;
const DOUBLE_JUMP_VEL = 8.4;
const WALL_SLIDE_MAX_VY = -2.6;
const COYOTE_TIME = 0.14;
const JUMP_BUFFER = 0.16;
const TETHER_REST = 4.6;
const TETHER_MAX = 6.8;

const _v3A = new THREE.Vector3();
const _v3B = new THREE.Vector3();
const _v3C = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class CoOpGameEngine3D {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private textures: ProceduralTextures;

  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private floorMesh!: THREE.Mesh;
  private floorGrassTex!: THREE.CanvasTexture;
  private floorStoneTex!: THREE.CanvasTexture;
  private floorStuccoTex!: THREE.CanvasTexture;
  private skyCloudsGroup!: THREE.Group;
  private skyCloudGeo!: THREE.SphereGeometry;
  private skyCloudMat!: THREE.MeshStandardMaterial;
  private worldGroup: THREE.Group = new THREE.Group();
  private tetherMesh!: THREE.Mesh;

  private p1Rig!: CharacterRig3D;
  private p2Rig!: CharacterRig3D;
  private outfits: OutfitConfig;

  private frameId: number = 0;
  private isTimeoutFrame: boolean = false;
  private lastTimestamp: number = 0;
  private worldTime: number = 0;
  private disposed: boolean = false;

  private mode: 'DIORAMA' | 'PLAYING' | 'PAUSED' | 'VICTORY' = 'DIORAMA';
  private playMode: PlayMode = 'LOCAL';
  private myRole: 'p1' | 'p2' = 'p1';
  private localControlMode: LocalControlMode = 'solo_switch';
  private activeLocalChar: 'p1' | 'p2' = 'p1';
  private tetherEnabled: boolean = false;
  private level: LevelDef3D = LEVELS_3D[0];

  private p1!: PlayerRuntime3D;
  private p2!: PlayerRuntime3D;

  private crates: CrateRuntime3D[] = [];
  private movers: Map<string, MoverRuntime3D> = new Map();
  private clouds: Map<string, CloudRuntime3D> = new Map();
  private blockMeshes: Map<string, THREE.Object3D> = new Map();
  private platePads: Map<string, { pad: THREE.Mesh; baseY: number }> = new Map();
  private leverHandles: Map<string, { handle: THREE.Group; orb: THREE.Mesh }> = new Map();
  private laserVisuals: LaserVisual3D[] = [];
  private trampolineMeshes: Map<string, { mesh: THREE.Group; bounce: number }> = new Map();
  private starMeshes: Map<string, THREE.Group> = new Map();
  private coinMeshes: Map<string, THREE.Group> = new Map();
  private checkpointFlags: Map<string, THREE.Mesh> = new Map();
  private enemies: EnemyRuntime3D[] = [];
  private saws: SawRuntime3D[] = [];
  private spikes: SpikeRuntime3D[] = [];
  private cannons: CannonRuntime3D[] = [];
  private cannonballs: CannonballRuntime3D[] = [];
  private guestCannonballMeshes: THREE.Mesh[] = [];
  private cannonballGeo: THREE.SphereGeometry = new THREE.SphereGeometry(0.32, 12, 10);
  private cannonballMat: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: '#263238',
    roughness: 0.3,
    metalness: 0.78,
  });
  private keyMeshes: Map<string, THREE.Group> = new Map();
  private teleporterMeshes: { def: TeleporterDef3D; ring: THREE.Mesh }[] = [];
  private conveyorBelts: { blk: BlockDef3D; beltMesh: THREE.Mesh; tex: THREE.CanvasTexture }[] = [];
  private particlePool: Particle3D[] = [];
  private particleCursor: number = 0;
  private particleGeo: THREE.BoxGeometry = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  private particleMats: Map<string, THREE.MeshBasicMaterial> = new Map();
  private pinkDoorOrb!: THREE.Mesh;
  private blueDoorOrb!: THREE.Mesh;

  private collectedStars: Set<string> = new Set();
  private collectedCoins: Set<string> = new Set();
  private collectedKeys: Set<string> = new Set();
  private leverStates: Map<string, boolean> = new Map();
  private timedLinks: Map<string, number> = new Map();
  private activeLinks: Set<string> = new Set();
  private pressedPlates: Set<string> = new Set();
  private activatedCheckpoints: Set<string> = new Set();

  // Camera state
  private camYaw: number = 0.0; // looking along -Z by default, slight angle
  private camPitch: number = 0.56; // ~32 deg downward
  private camDist: number = 14.5;
  private camTargetX: number = 0;
  private camTargetY: number = 1.5;
  private camTargetZ: number = 0;
  private shakeTimer: number = 0;
  private shakeIntensity: number = 0;

  // Drag orbit state
  private isDraggingCam: boolean = false;
  private dragPointerId: number | null = null;
  private dragLastX: number = 0;
  private dragLastY: number = 0;

  // Timers
  private levelElapsed: number = 0;
  private goalCelebrateTimer: number = 0;
  private victoryTriggered: boolean = false;
  private rescueBannerTimer: number = 0;
  private checkpointBannerTimer: number = 0;
  private tugSoundCooldown: number = 0;
  private crateSoundCooldown: number = 0;
  private hudEmitTimer: number = 0;
  private lastHudSignature: string = '';
  private netSyncTimer: number = 0;
  private netInputTimer: number = 0;

  // Inputs
  private keys: Set<string> = new Set();
  private touchPadP1 = { left: false, right: false, up: false, down: false, jump: false, interact: false };
  private touchPadP2 = { left: false, right: false, up: false, down: false, jump: false, interact: false };
  private inputP1: InputPadState = { moveX: 0, moveZ: 0, jumpHeld: false, jumpPressedAt: -10, interactPressedAt: -10, camYaw: 0 };
  private inputP2: InputPadState = { moveX: 0, moveZ: 0, jumpHeld: false, jumpPressedAt: -10, interactPressedAt: -10, camYaw: 0 };
  private guestPendingJump: boolean = false;
  private guestPendingInteract: boolean = false;
  private lastSentInputKey: string = '';

  // Callbacks
  private onHudUpdate: (hud: HudSnapshot) => void;
  private onLevelVictory: (stars: number, coins: number, elapsed: number) => void;
  private onPauseToggle?: () => void;
  private onHostBroadcastState?: (state: NetworkSyncSnapshot3D) => void;
  private onGuestSendInput?: (input: NetworkInput3D) => void;
  private onHostBroadcastEvent?: (eventName: string, payload?: unknown) => void;

  constructor(
    container: HTMLElement,
    initialOutfits: OutfitConfig,
    callbacks: {
      onHudUpdate: (hud: HudSnapshot) => void;
      onLevelVictory: (stars: number, coins: number, elapsed: number) => void;
      onPauseToggle?: () => void;
      onHostBroadcastState?: (state: NetworkSyncSnapshot3D) => void;
      onGuestSendInput?: (input: NetworkInput3D) => void;
      onHostBroadcastEvent?: (eventName: string, payload?: unknown) => void;
    }
  ) {
    this.container = container;
    this.outfits = initialOutfits;
    this.onHudUpdate = callbacks.onHudUpdate;
    this.onLevelVictory = callbacks.onLevelVictory;
    this.onPauseToggle = callbacks.onPauseToggle;
    this.onHostBroadcastState = callbacks.onHostBroadcastState;
    this.onGuestSendInput = callbacks.onGuestSendInput;
    this.onHostBroadcastEvent = callbacks.onHostBroadcastEvent;

    this.isSoftwareGl = detectSoftwareWebGL();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.2, 220);

    // Studio environment reflection for glass rims, gold badges, water & metals
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.textures = createProceduralTextures(maxAniso);

    this.floorGrassTex = this.textures.grass.clone();
    this.floorGrassTex.repeat.set(22, 22);
    this.floorGrassTex.needsUpdate = true;

    this.floorStoneTex = this.textures.stone.clone();
    this.floorStoneTex.repeat.set(24, 24);
    this.floorStoneTex.needsUpdate = true;

    this.floorStuccoTex = this.textures.stucco.clone();
    this.floorStuccoTex.repeat.set(20, 20);
    this.floorStuccoTex.needsUpdate = true;

    this.setupLightsAndEnvironment();
    this.initParticlePool();
    this.scene.add(this.worldGroup);
    this.rebuildCharacterMeshes();

    // Optional Tali Cinta 3D cylinder ribbon
    const tetherGeo = new THREE.CylinderGeometry(0.055, 0.055, 1, 8);
    tetherGeo.rotateX(Math.PI / 2);
    const tetherMat = new THREE.MeshStandardMaterial({
      color: '#FF4081',
      emissive: '#FF80AB',
      emissiveIntensity: 0.75,
      roughness: 0.25,
    });
    this.tetherMesh = new THREE.Mesh(tetherGeo, tetherMat);
    this.tetherMesh.visible = false;
    this.scene.add(this.tetherMesh);

    this.loadLevel(1, 'DIORAMA');
    this.handleResize();
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private setupLightsAndEnvironment() {
    this.hemiLight = new THREE.HemisphereLight('#E1F5FE', '#8D6E63', 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#FFF3E0', 1.65);
    this.sunLight.position.set(16, 28, 18);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    const d = 18;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 70;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    const rimLight = new THREE.DirectionalLight('#B3E5FC', 0.45);
    rimLight.position.set(-14, 12, -16);
    this.scene.add(rimLight);

    // Wide biome floor plane extending to fog horizon (switches cleanly per level biome)
    const floorGeo = new THREE.PlaneGeometry(360, 360, 1, 1);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.floorGrassTex,
      color: '#A5D6A7',
      roughness: 0.85,
      metalness: 0.04,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Fluffy floating 3D sky clouds sharing 1 unit-sphere geometry & 1 material
    this.skyCloudsGroup = new THREE.Group();
    this.skyCloudGeo = new THREE.SphereGeometry(1, 10, 8);
    this.skyCloudMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.95 });
    for (let i = 0; i < 14; i++) {
      const grp = new THREE.Group();
      const ang = (i / 14) * Math.PI * 2;
      const rad = 38 + (i % 3) * 14;
      grp.position.set(Math.cos(ang) * rad, 14 + (i % 4) * 2.5, Math.sin(ang) * rad - 8);
      for (let b = 0; b < 3; b++) {
        const puff = new THREE.Mesh(this.skyCloudGeo, this.skyCloudMat);
        const s = b === 1 ? 2.4 : 1.7;
        puff.position.set((b - 1) * 1.9, b === 1 ? 0.5 : 0, 0);
        puff.scale.set(s * 1.3, s * 0.75, s * 1.0);
        grp.add(puff);
      }
      this.skyCloudsGroup.add(grp);
    }
    this.scene.add(this.skyCloudsGroup);
  }

  private getParticleMaterial(color: string): THREE.MeshBasicMaterial {
    let mat = this.particleMats.get(color);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({ color });
      this.particleMats.set(color, mat);
    }
    return mat;
  }

  private initParticlePool() {
    const defaultMat = this.getParticleMaterial('#FFFFFF');
    for (let i = 0; i < 48; i++) {
      const mesh = new THREE.Mesh(this.particleGeo, defaultMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particlePool.push({
        mesh,
        active: false,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.8,
      });
    }
  }

  private rebuildCharacterMeshes() {
    if (this.p1Rig) {
      this.scene.remove(this.p1Rig.root);
      this.p1Rig.dispose();
    }
    if (this.p2Rig) {
      this.scene.remove(this.p2Rig.root);
      this.p2Rig.dispose();
    }
    this.p1Rig = buildGirlCharacter3D(this.outfits.girl);
    this.p2Rig = buildBoyCharacter3D(this.outfits.boy);
    this.scene.add(this.p1Rig.root);
    this.scene.add(this.p2Rig.root);
  }

  public startLoop() {
    this.lastTimestamp = performance.now();
    const tick = () => {
      if (this.disposed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      this.update(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.isTimeoutFrame = false;
        this.frameId = requestAnimationFrame(tick);
      }
    };
    this.isTimeoutFrame = false;
    this.frameId = requestAnimationFrame(tick);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.isTimeoutFrame = true;
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.isTimeoutFrame = true;
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.isTimeoutFrame = true;
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.isTimeoutFrame = true;
    this.frameId = window.setTimeout(poll, 5);
  }

  public destroy() {
    this.disposed = true;
    if (this.isTimeoutFrame) clearTimeout(this.frameId);
    else cancelAnimationFrame(this.frameId);

    this.unbindEvents();
    this.clearLevelObjects();
    this.cannonballGeo.dispose();
    this.cannonballMat.dispose();
    this.particleGeo.dispose();
    for (const mat of this.particleMats.values()) mat.dispose();
    this.particleMats.clear();
    this.skyCloudGeo.dispose();
    this.skyCloudMat.dispose();
    this.floorMesh.geometry.dispose();
    (this.floorMesh.material as THREE.Material).dispose();
    this.floorGrassTex.dispose();
    this.floorStoneTex.dispose();
    this.floorStuccoTex.dispose();
    this.p1Rig?.dispose();
    this.p2Rig?.dispose();
    this.textures.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  public setOutfits(outfits: OutfitConfig) {
    if (this.outfits.girl === outfits.girl && this.outfits.boy === outfits.boy) return;
    this.outfits = outfits;
    this.rebuildCharacterMeshes();
  }

  public setTetherEnabled(enabled: boolean) {
    this.tetherEnabled = enabled;
    if (!enabled && this.tetherMesh) this.tetherMesh.visible = false;
  }

  public setLocalControlMode(mode: LocalControlMode) {
    this.localControlMode = mode;
    this.emitHud();
  }

  public switchActiveCharacter() {
    if (this.playMode === 'LOCAL' && this.localControlMode === 'solo_switch') {
      this.activeLocalChar = this.activeLocalChar === 'p1' ? 'p2' : 'p1';
      soundFX.playPlateDown();
      this.emitHud();
    }
  }

  public rotateCameraStep(deltaYaw: number) {
    this.camYaw += deltaYaw;
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

  public setTouchInput(
    player: 'p1' | 'p2',
    action: 'left' | 'right' | 'up' | 'down' | 'jump' | 'interact',
    pressed: boolean
  ) {
    const pad = player === 'p1' ? this.touchPadP1 : this.touchPadP2;
    if (action === 'left') pad.left = pressed;
    if (action === 'right') pad.right = pressed;
    if (action === 'up') pad.up = pressed;
    if (action === 'down') pad.down = pressed;
    if (action === 'jump') {
      if (pressed && !pad.jump) {
        if (this.playMode === 'LDR_GUEST') this.guestPendingJump = true;
        else if (player === 'p1') this.inputP1.jumpPressedAt = this.worldTime;
        else this.inputP2.jumpPressedAt = this.worldTime;
      }
      pad.jump = pressed;
    }
    if (action === 'interact') {
      if (pressed && !pad.interact) {
        if (this.playMode === 'LDR_GUEST') this.guestPendingInteract = true;
        else if (player === 'p1') this.inputP1.interactPressedAt = this.worldTime;
        else this.inputP2.interactPressedAt = this.worldTime;
      }
      pad.interact = pressed;
    }
  }

  public applyRemoteInput(role: 'p1' | 'p2', input: NetworkInput3D) {
    const target = role === 'p1' ? this.inputP1 : this.inputP2;
    target.moveX = Math.max(-1, Math.min(1, Number(input.moveX) || 0));
    target.moveZ = Math.max(-1, Math.min(1, Number(input.moveZ) || 0));
    target.camYaw = Number(input.camYaw) || 0;
    if (input.jumpJustPressed || (input.jumpHeld && !target.jumpHeld)) {
      target.jumpPressedAt = this.worldTime;
    }
    target.jumpHeld = Boolean(input.jumpHeld);
    if (input.interactJustPressed) {
      target.interactPressedAt = this.worldTime;
    }
  }

  public applyRemoteSyncState(s: NetworkSyncSnapshot3D) {
    if (this.playMode !== 'LDR_GUEST') return;
    const lerpP = (p: PlayerRuntime3D, src: NetworkSyncSnapshot3D['p1']) => {
      p.x += (src.x - p.x) * 0.65;
      p.y += (src.y - p.y) * 0.65;
      p.z += (src.z - p.z) * 0.65;
      p.vx = src.vx;
      p.vy = src.vy;
      p.vz = src.vz;
      p.yaw = src.yaw;
      p.grounded = src.grounded;
      p.wallNormalX = src.wallNormalX;
      p.wallNormalZ = src.wallNormalZ;
      p.pulledActive = src.pulled;
      p.dizzyTimer = src.dizzy;
      p.isPushing = src.pushing;
    };
    lerpP(this.p1, s.p1);
    lerpP(this.p2, s.p2);

    for (const cr of s.crates) {
      const rt = this.crates.find((c) => c.id === cr.id);
      if (rt) {
        rt.x = cr.x;
        rt.y = cr.y;
        rt.z = cr.z;
      }
    }
    for (const mv of s.movers) {
      const rt = this.movers.get(mv.id);
      if (rt) {
        rt.x = mv.x;
        rt.y = mv.y;
        rt.z = mv.z;
      }
    }
    for (const cl of s.clouds) {
      const rt = this.clouds.get(cl.id);
      if (rt) {
        rt.state = cl.state;
        rt.timer = cl.timer;
      }
    }
    for (const en of s.enemies) {
      const rt = this.enemies.find((e) => e.id === en.id);
      if (rt) {
        rt.x = en.x;
        rt.y = en.y;
        rt.z = en.z;
        rt.facing = en.facing;
      }
    }

    for (const sw of s.saws || []) {
      const rt = this.saws.find((x) => x.def.id === sw.id);
      if (rt) {
        rt.x = sw.x;
        rt.z = sw.z;
        rt.paused = sw.paused;
      }
    }
    for (const sp of s.spikes || []) {
      const rt = this.spikes.find((x) => x.def.id === sp.id);
      if (rt) {
        rt.upFactor = sp.upFactor;
      }
    }
    const cbs = s.cannonballs || [];
    while (this.guestCannonballMeshes.length < cbs.length) {
      const m = new THREE.Mesh(this.cannonballGeo, this.cannonballMat);
      m.castShadow = true;
      this.worldGroup.add(m);
      this.guestCannonballMeshes.push(m);
    }
    for (let i = 0; i < this.guestCannonballMeshes.length; i++) {
      const m = this.guestCannonballMeshes[i];
      if (i < cbs.length) {
        m.visible = true;
        m.position.set(cbs[i].x, cbs[i].y, cbs[i].z);
      } else {
        m.visible = false;
      }
    }

    this.collectedStars = new Set(s.collectedStars);
    this.collectedCoins = new Set(s.collectedCoins);
    this.collectedKeys = new Set(s.collectedKeys || []);
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
      const d = (payload || {}) as { isGirl?: boolean; isDouble?: boolean };
      soundFX.playJump(Boolean(d.isGirl), Boolean(d.isDouble));
    } else if (eventName === 'wallJump') {
      const d = (payload || {}) as { isGirl?: boolean };
      soundFX.playWallJump(Boolean(d.isGirl));
    } else if (eventName === 'bounce') soundFX.playBounce();
    else if (eventName === 'coin') soundFX.playCoin();
    else if (eventName === 'collect') soundFX.playCollect();
    else if (eventName === 'lever') soundFX.playLever();
    else if (eventName === 'plate') soundFX.playPlateDown();
    else if (eventName === 'checkpoint') {
      soundFX.playCheckpoint();
      this.checkpointBannerTimer = 1.8;
    } else if (eventName === 'bonk') {
      soundFX.playBonk();
      this.triggerShake(0.25, 0.22);
    } else if (eventName === 'splash') soundFX.playSplash();
    else if (eventName === 'victory') {
      const d = (payload || {}) as { stars?: number; coins?: number; elapsed?: number };
      if (!this.victoryTriggered) {
        this.victoryTriggered = true;
        this.mode = 'VICTORY';
        soundFX.playVictory();
        this.onLevelVictory(d.stars ?? 0, d.coins ?? 0, d.elapsed ?? this.levelElapsed);
      }
    }
  }

  private clearLevelObjects() {
    while (this.worldGroup.children.length > 0) {
      const obj = this.worldGroup.children[0];
      this.worldGroup.remove(obj);
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
    }
    this.crates = [];
    this.movers.clear();
    this.clouds.clear();
    this.blockMeshes.clear();
    this.platePads.clear();
    this.leverHandles.clear();
    this.laserVisuals = [];
    this.trampolineMeshes.clear();
    this.starMeshes.clear();
    this.coinMeshes.clear();
    this.checkpointFlags.clear();
    this.enemies = [];
    this.saws = [];
    this.spikes = [];
    this.cannons = [];
    this.cannonballs = [];
    this.guestCannonballMeshes = [];
    this.keyMeshes.clear();
    this.teleporterMeshes = [];
    for (const cb of this.conveyorBelts) {
      cb.tex.dispose();
    }
    this.conveyorBelts = [];
    for (const pt of this.particlePool) {
      pt.active = false;
      pt.mesh.visible = false;
    }
  }

  private applyBiomeFloor(lvl: LevelDef3D) {
    const mat = this.floorMesh.material as THREE.MeshStandardMaterial;
    const b = lvl.theme.backdrop;
    if (b === 'harbor') {
      mat.map = this.textures.water;
      mat.color.set(lvl.theme.waterColor);
      mat.roughness = 0.22;
      mat.metalness = 0.15;
    } else if (b === 'campus' || b === 'forest') {
      mat.map = this.floorGrassTex;
      mat.color.set(lvl.theme.waterColor);
      mat.roughness = 0.88;
      mat.metalness = 0.02;
    } else if (b === 'rooftops' || b === 'castle') {
      mat.map = this.floorStoneTex;
      mat.color.set(lvl.theme.waterColor);
      mat.roughness = b === 'castle' ? 0.78 : 0.85;
      mat.metalness = b === 'castle' ? 0.12 : 0.04;
    } else if (b === 'desert' || b === 'snow') {
      mat.map = this.floorStuccoTex;
      mat.color.set(lvl.theme.waterColor);
      mat.roughness = b === 'snow' ? 0.65 : 0.92;
      mat.metalness = b === 'snow' ? 0.08 : 0.02;
    } else {
      // 'clouds'
      mat.map = null;
      mat.color.set(lvl.theme.waterColor);
      mat.roughness = 0.95;
      mat.metalness = 0.0;
    }
    mat.needsUpdate = true;
    this.floorMesh.position.y = lvl.waterY;
  }

  public loadLevel(levelId: number, targetMode: 'DIORAMA' | 'PLAYING' = 'PLAYING') {
    const found = LEVELS_3D.find((l) => l.id === levelId) || LEVELS_3D[0];
    this.level = found;
    this.mode = targetMode;

    this.clearLevelObjects();

    // Theme atmosphere & distinct 3D biome floor
    this.scene.background = new THREE.Color(found.theme.skyTop);
    this.scene.fog = new THREE.FogExp2(found.theme.fogColor, 0.011);
    this.sunLight.color.set(found.theme.sunColor);
    this.applyBiomeFloor(found);

    // Players
    this.p1 = this.createPlayer('p1', found.spawnP1.x, found.spawnP1.y, found.spawnP1.z);
    this.p2 = this.createPlayer('p2', found.spawnP2.x, found.spawnP2.y, found.spawnP2.z);
    this.activeLocalChar = 'p1';

    this.collectedStars.clear();
    this.collectedCoins.clear();
    this.collectedKeys.clear();
    this.leverStates.clear();
    this.timedLinks.clear();
    this.activeLinks.clear();
    this.pressedPlates.clear();
    this.activatedCheckpoints.clear();
    this.levelElapsed = 0;
    this.goalCelebrateTimer = 0;
    this.victoryTriggered = false;
    this.rescueBannerTimer = 0;
    this.checkpointBannerTimer = 0;

    // Build 3D world geometry
    this.buildLevelGeometry(found);
    this.buildHorizonScenery(found);

    // Initialize camera nicely framed behind players
    this.camYaw = -0.32;
    this.camPitch = 0.56;
    this.camTargetX = (this.p1.x + this.p2.x) * 0.5 + 3;
    this.camTargetY = (this.p1.y + this.p2.y) * 0.5 + 1.0;
    this.camTargetZ = (this.p1.z + this.p2.z) * 0.5;
    this.updateCamera(1);

    this.emitHud();
  }

  private createPlayer(id: 'p1' | 'p2', x: number, y: number, z: number): PlayerRuntime3D {
    return {
      id,
      x,
      y,
      z,
      prevX: x,
      prevY: y,
      prevZ: z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: Math.PI / 2,
      radius: 0.36,
      height: 1.62,
      grounded: false,
      wallNormalX: 0,
      wallNormalZ: 0,
      wallJumpLock: 0,
      coyoteTimer: 0,
      airJumpsRemaining: 1,
      dizzyTimer: 0,
      invulnTimer: 0,
      pulledActive: false,
      isPushing: false,
      onLadder: false,
      ridingBlockId: null,
      ridingPartnerId: null,
      teleportCooldown: 0,
      lastSafeX: x,
      lastSafeY: y,
      lastSafeZ: z,
    };
  }

  private buildLevelGeometry(lvl: LevelDef3D) {
    // 1. Blocks, Boats, Elevators, Bridges, Gates, Terracotta Rooftops
    for (const blk of lvl.blocks) {
      const obj = this.createBlockMesh(blk);
      this.worldGroup.add(obj);
      this.blockMeshes.set(blk.id, obj);

      if (blk.style === 'boat' || blk.style === 'elevator') {
        this.movers.set(blk.id, {
          id: blk.id,
          x: blk.x,
          y: blk.y,
          z: blk.z,
          dx: 0,
          dy: 0,
          dz: 0,
          progress: 0,
          dir: 1,
          mesh: obj,
        });
      } else if (blk.style === 'cloud') {
        this.clouds.set(blk.id, {
          id: blk.id,
          state: 'solid',
          timer: 0,
          mesh: obj,
        });
      }
    }

    // 2. Ladders (composite side rails + rungs)
    const ladderMat = new THREE.MeshStandardMaterial({ color: '#ECEFF1', roughness: 0.4, metalness: 0.5 });
    for (const lad of lvl.ladders) {
      const grp = new THREE.Group();
      const h = lad.yTop - lad.yBottom;
      for (const offset of [-0.28, 0.28]) {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h, 8), ladderMat);
        rail.castShadow = true;
        if (lad.facing === '+x' || lad.facing === '-x') rail.position.set(0, h / 2, offset);
        else rail.position.set(offset, h / 2, 0);
        grp.add(rail);
      }
      const steps = Math.max(3, Math.floor(h / 0.42));
      for (let i = 1; i <= steps; i++) {
        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.58, 8), ladderMat);
        if (lad.facing === '+x' || lad.facing === '-x') rung.rotation.x = Math.PI / 2;
        else rung.rotation.z = Math.PI / 2;
        rung.position.y = (i / (steps + 1)) * h;
        grp.add(rung);
      }
      grp.position.set(lad.x, lad.yBottom, lad.z);
      this.worldGroup.add(grp);
    }

    // 3. Pushable Wooden Crates
    const crateMat = new THREE.MeshStandardMaterial({
      map: this.textures.crate,
      roughness: 0.78,
      metalness: 0.04,
    });
    for (const cr of lvl.crates) {
      const s = cr.size || 1.1;
      const grp = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), crateMat);
      box.position.y = s / 2;
      box.castShadow = true;
      box.receiveShadow = true;
      grp.add(box);
      grp.position.set(cr.x, cr.y, cr.z);
      this.worldGroup.add(grp);
      this.crates.push({
        id: cr.id,
        x: cr.x,
        y: cr.y,
        z: cr.z,
        vx: 0,
        vy: 0,
        vz: 0,
        size: s,
        grounded: false,
        ridingBlockId: null,
        mesh: grp,
      });
    }

    // 4. Pressure Plates
    for (const pl of lvl.plates) {
      const grp = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.08, 1.4),
        new THREE.MeshStandardMaterial({ color: '#5D4037', roughness: 0.8 })
      );
      base.position.y = 0.04;
      base.receiveShadow = true;
      const colorHex = pl.color === 'pink' ? '#FF80AB' : pl.color === 'blue' ? '#4FC3F7' : '#BA68C8';
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(1.12, 0.12, 1.12),
        new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: 0.3,
          roughness: 0.4,
        })
      );
      pad.position.y = 0.1;
      pad.castShadow = true;
      grp.add(base, pad);
      grp.position.set(pl.x, pl.y, pl.z);
      this.worldGroup.add(grp);
      this.platePads.set(pl.id, { pad, baseY: 0.1 });
    }

    // 5. Toggle Levers
    for (const lv of lvl.levers) {
      this.leverStates.set(lv.id, Boolean(lv.initialOn));
      const grp = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.38, 0.16, 12),
        new THREE.MeshStandardMaterial({ color: '#4E342E', roughness: 0.65, metalness: 0.2 })
      );
      base.position.y = 0.08;
      base.castShadow = true;
      const handlePivot = new THREE.Group();
      handlePivot.position.y = 0.16;
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.72, 8),
        new THREE.MeshStandardMaterial({ color: '#CFD8DC', roughness: 0.35, metalness: 0.7 })
      );
      stick.position.y = 0.36;
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 12),
        new THREE.MeshStandardMaterial({
          color: '#FF7043',
          emissive: '#FF5722',
          emissiveIntensity: 0.4,
          roughness: 0.3,
        })
      );
      orb.position.y = 0.74;
      handlePivot.add(stick, orb);
      grp.add(base, handlePivot);
      grp.position.set(lv.x, lv.y, lv.z);
      this.worldGroup.add(grp);
      this.leverHandles.set(lv.id, { handle: handlePivot, orb });
    }

    // 6. Lasers
    for (const las of lvl.lasers) {
      const col = las.color === 'pink' ? '#FF4081' : las.color === 'blue' ? '#29B6F6' : '#AB47BC';
      const emitter = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.45, 0.45),
        new THREE.MeshStandardMaterial({ color: '#37474F', roughness: 0.35, metalness: 0.7 })
      );
      emitter.position.set(las.x, las.y, las.z);
      emitter.castShadow = true;
      this.worldGroup.add(emitter);

      const beamGeo = new THREE.CylinderGeometry(0.11, 0.11, 1, 10);
      const beamMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.42,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);

      const coreGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
      const coreMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);

      this.worldGroup.add(beamMesh, coreMesh);
      this.laserVisuals.push({ def: las, beamMesh, coreMesh });
    }

    // 7. Elemental Pools & Cacti
    for (const pl of lvl.pools) {
      if (pl.kind === 'cactus') {
        const grp = new THREE.Group();
        const cacMat = new THREE.MeshStandardMaterial({ color: '#66BB6A', roughness: 0.8 });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.95, 10), cacMat);
        trunk.position.y = 0.47;
        trunk.castShadow = true;
        const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.45, 8), cacMat);
        arm1.position.set(-0.26, 0.56, 0);
        arm1.rotation.z = 0.45;
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 8, 8),
          new THREE.MeshStandardMaterial({ color: '#FF4081', emissive: '#FF80AB', emissiveIntensity: 0.3 })
        );
        flower.position.y = 0.98;
        grp.add(trunk, arm1, flower);
        grp.position.set(pl.x, pl.y - 0.04, pl.z);
        this.worldGroup.add(grp);
      } else {
        const col =
          pl.kind === 'pink_pool' ? '#FF4081' : pl.kind === 'blue_pool' ? '#039BE5' : '#4A148C';
        const pool = new THREE.Mesh(
          new THREE.BoxGeometry(pl.w, 0.12, pl.d),
          new THREE.MeshStandardMaterial({
            color: col,
            emissive: col,
            emissiveIntensity: 0.45,
            roughness: 0.15,
            transparent: true,
            opacity: 0.85,
          })
        );
        pool.position.set(pl.x, pl.y, pl.z);
        this.worldGroup.add(pool);
      }
    }

    // 8. Trampolines
    for (const tr of lvl.trampolines) {
      const grp = new THREE.Group();
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.34, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: '#FFF8E1', roughness: 0.85 })
      );
      stem.position.y = 0.15;
      const capColor = tr.style === 'mushroom' ? '#FF7043' : '#FF4081';
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.62, 0.24, 16),
        new THREE.MeshStandardMaterial({
          color: capColor,
          emissive: capColor,
          emissiveIntensity: 0.15,
          roughness: 0.45,
        })
      );
      cap.position.y = 0.36;
      cap.castShadow = true;
      grp.add(stem, cap);
      grp.position.set(tr.x, tr.y, tr.z);
      this.worldGroup.add(grp);
      this.trampolineMeshes.set(tr.id, { mesh: grp, bounce: 0 });
    }

    // 9. Enemies (3D Crab & Seagull)
    for (const en of lvl.enemies) {
      const grp = new THREE.Group();
      if (en.kind === 'crab') {
        const shellMat = new THREE.MeshStandardMaterial({ color: '#EF5350', roughness: 0.55 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), shellMat);
        body.scale.set(1.25, 0.65, 1.0);
        body.position.y = 0.28;
        body.castShadow = true;
        grp.add(body);
        for (const sx of [-0.36, 0.36]) {
          const claw = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), shellMat);
          claw.position.set(sx, 0.38, 0.25);
          grp.add(claw);
        }
      } else {
        const gullMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.7 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), gullMat);
        body.scale.set(0.8, 0.75, 1.35);
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.26), gullMat);
        wingL.position.set(-0.42, 0.08, 0);
        const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.26), gullMat);
        wingR.position.set(0.42, 0.08, 0);
        const beak = new THREE.Mesh(
          new THREE.ConeGeometry(0.08, 0.25, 8),
          new THREE.MeshStandardMaterial({ color: '#FFB300' })
        );
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0, 0.45);
        grp.add(body, wingL, wingR, beak);
      }
      grp.position.set(en.x, en.y, en.z);
      this.worldGroup.add(grp);
      this.enemies.push({
        id: en.id,
        x: en.x,
        y: en.y,
        z: en.z,
        baseY: en.y,
        facing: 1,
        kind: en.kind,
        axis: en.axis,
        min: en.min,
        max: en.max,
        speed: en.speed,
        mesh: grp,
      });
    }

    // 10. Heart Stars & Love Coins
    const starMat = new THREE.MeshStandardMaterial({
      color: '#FFD54F',
      emissive: '#FFB300',
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.7,
    });
    for (const st of lvl.stars) {
      const grp = new THREE.Group();
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), starMat);
      core.castShadow = true;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.04, 8, 20),
        new THREE.MeshBasicMaterial({ color: '#FF80AB' })
      );
      grp.add(core, ring);
      grp.position.set(st.x, st.y, st.z);
      this.worldGroup.add(grp);
      this.starMeshes.set(st.id, grp);
    }

    const coinMat = new THREE.MeshStandardMaterial({
      color: '#FFE082',
      emissive: '#FFCA28',
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.85,
    });
    for (const cn of lvl.coins) {
      const grp = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.08, 14), coinMat);
      disc.rotation.z = Math.PI / 2;
      grp.add(disc);
      grp.position.set(cn.x, cn.y, cn.z);
      this.worldGroup.add(grp);
      this.coinMeshes.set(cn.id, grp);
    }

    // 11. Checkpoints
    for (const cp of lvl.checkpoints) {
      const grp = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 1.8, 8),
        new THREE.MeshStandardMaterial({ color: '#ECEFF1', roughness: 0.35, metalness: 0.6 })
      );
      pole.position.y = 0.9;
      const flag = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.38, 0.06),
        new THREE.MeshStandardMaterial({ color: '#FF80AB', roughness: 0.7 })
      );
      flag.position.set(0.34, 1.55, 0);
      grp.add(pole, flag);
      grp.position.set(cp.x, cp.y, cp.z);
      this.worldGroup.add(grp);
      this.checkpointFlags.set(cp.id, flag);
    }

    // 12. Spinning Sawblades on Rails
    const metalMat = new THREE.MeshStandardMaterial({ color: '#CFD8DC', roughness: 0.25, metalness: 0.85 });
    const trackMat = new THREE.MeshStandardMaterial({ color: '#263238', roughness: 0.7 });
    for (const sw of lvl.saws || []) {
      const r = sw.radius || 0.7;
      const trackLen = Math.max(1.2, sw.max - sw.min + r * 1.4);
      const track = new THREE.Mesh(
        new THREE.BoxGeometry(sw.axis === 'x' ? trackLen : 0.22, 0.08, sw.axis === 'z' ? trackLen : 0.22),
        trackMat
      );
      track.position.set(
        sw.axis === 'x' ? (sw.min + sw.max) / 2 : sw.x,
        sw.y + 0.04,
        sw.axis === 'z' ? (sw.min + sw.max) / 2 : sw.z
      );
      this.worldGroup.add(track);

      const discGrp = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.1, 18), metalMat);
      disc.rotation.x = Math.PI / 2;
      if (sw.axis === 'z') disc.rotation.z = Math.PI / 2;
      disc.castShadow = true;
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.26, r * 0.26, 0.16, 10),
        new THREE.MeshStandardMaterial({ color: '#FF5252', roughness: 0.45 })
      );
      hub.rotation.copy(disc.rotation);
      discGrp.add(disc, hub);

      // 8 metallic saw teeth
      for (let t = 0; t < 8; t++) {
        const ang = (t / 8) * Math.PI * 2;
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.08), metalMat);
        if (sw.axis === 'z') {
          tooth.position.set(Math.cos(ang) * r, Math.sin(ang) * r, 0);
          tooth.rotation.z = ang + Math.PI / 4;
        } else {
          tooth.position.set(0, Math.sin(ang) * r, Math.cos(ang) * r);
          tooth.rotation.x = ang + Math.PI / 4;
        }
        discGrp.add(tooth);
      }

      discGrp.position.set(sw.x, sw.y + r * 0.55, sw.z);
      this.worldGroup.add(discGrp);
      this.saws.push({
        def: sw,
        x: sw.x,
        z: sw.z,
        dir: 1,
        paused: false,
        discGroup: discGrp,
      });
    }

    // 13. Pop-up & Switchable Floor Spikes
    const spikeConeGeo = new THREE.ConeGeometry(0.14, 0.55, 6);
    const spikeMat = new THREE.MeshStandardMaterial({ color: '#ECEFF1', roughness: 0.2, metalness: 0.85 });
    for (const sp of lvl.spikes || []) {
      const w = sp.w || 2.0;
      const d = sp.d || 2.0;
      const grp = new THREE.Group();
      const plateMat = new THREE.MeshStandardMaterial({
        color: '#455A64',
        emissive: '#000000',
        emissiveIntensity: 0,
        roughness: 0.65,
        metalness: 0.3,
      });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), plateMat);
      plate.position.y = 0.04;
      plate.receiveShadow = true;
      grp.add(plate);

      const spikesGroup = new THREE.Group();
      const cols = Math.max(2, Math.round(w / 0.65));
      const rows = Math.max(2, Math.round(d / 0.65));
      for (let cx = 0; cx < cols; cx++) {
        for (let cz = 0; cz < rows; cz++) {
          const sx = ((cx + 0.5) / cols - 0.5) * (w - 0.35);
          const sz = ((cz + 0.5) / rows - 0.5) * (d - 0.35);
          const cone = new THREE.Mesh(spikeConeGeo, spikeMat);
          cone.position.set(sx, 0.27, sz);
          cone.castShadow = true;
          spikesGroup.add(cone);
        }
      }
      grp.add(spikesGroup);
      grp.position.set(sp.x, sp.y, sp.z);
      this.worldGroup.add(grp);
      this.spikes.push({
        def: sp,
        upFactor: sp.linkId ? 1 : 0,
        warning: false,
        spikesGroup,
        plateMat,
      });
    }

    // 14. Cannon Turrets
    const cannonIronMat = new THREE.MeshStandardMaterial({ color: '#37474F', roughness: 0.4, metalness: 0.7 });
    const cannonGoldMat = new THREE.MeshStandardMaterial({ color: '#FFD54F', roughness: 0.3, metalness: 0.8 });
    for (const can of lvl.cannons || []) {
      const grp = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.9), new THREE.MeshStandardMaterial({ color: '#6D4C41', roughness: 0.8 }));
      base.position.y = 0.225;
      base.castShadow = true;

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.05, 12), cannonIronMat);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(0.18, 0.65, 0);
      barrel.castShadow = true;

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 8, 16), cannonGoldMat);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(0.66, 0.65, 0);

      grp.add(base, barrel, ring);
      if (can.dir === '-x') grp.rotation.y = Math.PI;
      else if (can.dir === '+z') grp.rotation.y = -Math.PI / 2;
      else if (can.dir === '-z') grp.rotation.y = Math.PI / 2;
      grp.position.set(can.x, can.y, can.z);
      this.worldGroup.add(grp);
      this.cannons.push({ def: can, timer: can.interval * 0.45, mesh: grp });
    }

    // 15. Collectible Keys (Golden / Pink / Blue)
    for (const k of lvl.keys || []) {
      const col = k.color === 'pink' ? '#FF4081' : k.color === 'blue' ? '#29B6F6' : '#FFD54F';
      const kMat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.35,
        roughness: 0.25,
        metalness: 0.8,
      });
      const grp = new THREE.Group();
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 8, 16), kMat);
      bow.position.y = 0.28;
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.56, 8), kMat);
      shaft.position.y = -0.06;
      const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), kMat);
      tooth1.position.set(0.12, -0.22, 0);
      const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.08), kMat);
      tooth2.position.set(0.1, -0.34, 0);
      grp.add(bow, shaft, tooth1, tooth2);
      grp.position.set(k.x, k.y, k.z);
      this.worldGroup.add(grp);
      this.keyMeshes.set(k.id, grp);
    }

    // 16. Teleporter Pads
    for (const tp of lvl.teleporters || []) {
      const col = tp.color === 'pink' ? '#FF4081' : tp.color === 'blue' ? '#29B6F6' : '#AB47BC';
      const grp = new THREE.Group();
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.82, 0.1, 20),
        new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.55,
          roughness: 0.3,
        })
      );
      pad.position.y = 0.05;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.68, 0.06, 8, 24),
        new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.22;
      grp.add(pad, ring);
      grp.position.set(tp.x, tp.y, tp.z);
      this.worldGroup.add(grp);
      this.teleporterMeshes.push({ def: tp, ring });
    }

    // 17. Dual Finish Doors (Pink Cewek & Blue Cowok)
    this.pinkDoorOrb = this.createGoalArch(lvl.goalPink, '#FF4081', '#F8BBD0');
    this.blueDoorOrb = this.createGoalArch(lvl.goalBlue, '#0288D1', '#B3E5FC');
  }

  private createGoalArch(pos: { x: number; y: number; z: number }, mainCol: string, trimCol: string): THREE.Mesh {
    const grp = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: '#FFF8F0', roughness: 0.6 });
    const trimMat = new THREE.MeshStandardMaterial({ color: trimCol, roughness: 0.5 });

    for (const sz of [-0.65, 0.65]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.2, 0.26), frameMat);
      pillar.position.set(0, 1.1, sz);
      pillar.castShadow = true;
      grp.add(pillar);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 1.6), trimMat);
    top.position.set(0, 2.25, 0);
    top.castShadow = true;

    const portal = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.0, 1.08),
      new THREE.MeshStandardMaterial({
        color: mainCol,
        emissive: mainCol,
        emissiveIntensity: 0.65,
        transparent: true,
        opacity: 0.78,
      })
    );
    portal.position.set(0, 1.0, 0);

    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      new THREE.MeshStandardMaterial({
        color: mainCol,
        emissive: mainCol,
        emissiveIntensity: 0.9,
      })
    );
    orb.position.set(0, 2.65, 0);

    grp.add(top, portal, orb);
    grp.position.set(pos.x, pos.y, pos.z);
    this.worldGroup.add(grp);
    return orb;
  }

  private createBlockMesh(blk: BlockDef3D): THREE.Object3D {
    if (blk.style === 'boat') {
      // Composite 3D wooden rowboat inspired by Pepelo screenshot!
      const grp = new THREE.Group();
      const hullMat = new THREE.MeshStandardMaterial({
        map: this.textures.wood,
        color: '#8D5524',
        roughness: 0.78,
      });
      const benchMat = new THREE.MeshStandardMaterial({
        color: '#FFD54F',
        roughness: 0.7,
      });

      // Main deck/hull box
      const hull = new THREE.Mesh(new THREE.BoxGeometry(blk.w, blk.h * 0.85, blk.d), hullMat);
      hull.position.y = (blk.h * 0.85) / 2;
      hull.castShadow = true;
      hull.receiveShadow = true;
      grp.add(hull);

      // Raised wooden gunwale trim on sides
      for (const sz of [-blk.d / 2 + 0.12, blk.d / 2 - 0.12]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(blk.w + 0.15, 0.22, 0.22), hullMat);
        rail.position.set(0, blk.h * 0.85 + 0.08, sz);
        rail.castShadow = true;
        grp.add(rail);
      }

      // Yellow wooden center bench like Pepelo boat
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, blk.d - 0.45), benchMat);
      bench.position.set(0, blk.h * 0.85 + 0.04, 0);
      grp.add(bench);

      // Pointed bow prow
      const bow = new THREE.Mesh(new THREE.ConeGeometry(blk.d * 0.52, 0.9, 4), hullMat);
      bow.rotation.y = Math.PI / 4;
      bow.rotation.z = -Math.PI / 2;
      bow.position.set(blk.w / 2 + 0.42, blk.h * 0.48, 0);
      grp.add(bow);

      grp.position.set(blk.x, blk.y, blk.z);
      return grp;
    }

    if (blk.style === 'conveyor') {
      const grp = new THREE.Group();
      const frameMat = new THREE.MeshStandardMaterial({ color: '#455A64', roughness: 0.5, metalness: 0.4 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(blk.w, blk.h - 0.08, blk.d), frameMat);
      base.position.y = (blk.h - 0.08) / 2;
      base.castShadow = true;
      base.receiveShadow = true;

      const beltTex = this.textures.conveyor.clone();
      beltTex.needsUpdate = true;
      beltTex.repeat.set(Math.max(1, Math.round(blk.w / 2.2)), Math.max(1, Math.round(blk.d / 2.2)));
      const beltMat = new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.72 });
      const beltMesh = new THREE.Mesh(new THREE.BoxGeometry(blk.w - 0.1, 0.1, blk.d - 0.18), beltMat);
      beltMesh.position.y = blk.h - 0.04;
      beltMesh.receiveShadow = true;

      grp.add(base, beltMesh);
      grp.position.set(blk.x, blk.y, blk.z);
      this.conveyorBelts.push({ blk, beltMesh, tex: beltTex });
      return grp;
    }

    let mat: THREE.MeshStandardMaterial;
    if (blk.style === 'terracotta') {
      mat = new THREE.MeshStandardMaterial({ map: this.textures.terracotta, roughness: 0.82 });
    } else if (blk.style === 'grass') {
      mat = new THREE.MeshStandardMaterial({ map: this.textures.grass, roughness: 0.88 });
    } else if (blk.style === 'wood' || blk.style === 'bridge') {
      mat = new THREE.MeshStandardMaterial({ map: this.textures.wood, roughness: 0.75 });
    } else if (blk.style === 'stucco') {
      mat = new THREE.MeshStandardMaterial({ map: this.textures.stucco, roughness: 0.85 });
    } else if (blk.style === 'cloud') {
      mat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.92, transparent: true, opacity: 0.95 });
    } else if (blk.style === 'elevator') {
      mat = new THREE.MeshStandardMaterial({ color: '#FFD54F', roughness: 0.55, metalness: 0.2 });
    } else if (blk.style === 'gate_wall') {
      mat = new THREE.MeshStandardMaterial({
        color: '#CE93D8',
        emissive: '#8E24AA',
        emissiveIntensity: 0.25,
        roughness: 0.45,
        transparent: true,
        opacity: 0.9,
      });
    } else {
      mat = new THREE.MeshStandardMaterial({ map: this.textures.stone, roughness: 0.82 });
    }

    const grp = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(blk.w, blk.h, blk.d), mat);
    box.position.y = blk.h / 2;
    box.castShadow = true;
    box.receiveShadow = true;
    grp.add(box);

    // Padlock badge on locked gate_wall
    if (blk.style === 'gate_wall') {
      const lockMat = new THREE.MeshStandardMaterial({ color: '#FFD54F', roughness: 0.3, metalness: 0.8 });
      const lockBody = new THREE.Mesh(new THREE.BoxGeometry(blk.w + 0.18, 0.55, 0.55), lockMat);
      lockBody.position.y = Math.min(blk.h * 0.5, 1.4);
      const lockLoop = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 14, Math.PI), lockMat);
      lockLoop.rotation.y = Math.PI / 2;
      lockLoop.position.y = lockBody.position.y + 0.26;
      grp.add(lockBody, lockLoop);
    }

    // Rooftop detail (chimney/AC unit) for terracotta roofs
    if (blk.isRoof) {
      const chimney = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.9, 0.7),
        new THREE.MeshStandardMaterial({ map: this.textures.stucco, roughness: 0.85 })
      );
      chimney.position.set(-blk.w * 0.28, blk.h + 0.45, -blk.d * 0.34);
      chimney.castShadow = true;
      grp.add(chimney);
    }

    grp.position.set(blk.x, blk.y, blk.z);
    return grp;
  }

  private buildHorizonScenery(lvl: LevelDef3D) {
    const b = lvl.theme.backdrop;
    const count = 24;
    const dummy = new THREE.Object3D();
    const yFloor = lvl.waterY;

    const addRing = (
      geo1: THREE.BufferGeometry,
      mat1: THREE.Material,
      geo2: THREE.BufferGeometry,
      mat2: THREE.Material,
      placeFn: (i: number, ang: number, dist: number) => void
    ) => {
      const m1 = new THREE.InstancedMesh(geo1, mat1, count);
      const m2 = new THREE.InstancedMesh(geo2, mat2, count);
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        const dist = 30 + (i % 4) * 7.5;
        placeFn(i, ang, dist);
      }
      m1.instanceMatrix.needsUpdate = true;
      m2.instanceMatrix.needsUpdate = true;
      m1.computeBoundingSphere();
      m2.computeBoundingSphere();
      this.worldGroup.add(m1, m2);
      return { m1, m2 };
    };

    if (b === 'campus' || b === 'rooftops') {
      const stuccoGeo = new THREE.BoxGeometry(1, 1, 1);
      const stuccoMat = new THREE.MeshStandardMaterial({ map: this.textures.stucco, roughness: 0.85 });
      const roofGeo = new THREE.ConeGeometry(0.76, 1, 4);
      const roofMat = new THREE.MeshStandardMaterial({
        map: this.textures.terracotta,
        color: b === 'campus' ? '#FFD54F' : '#E07A38',
        roughness: 0.78,
      });
      const m1 = new THREE.InstancedMesh(stuccoGeo, stuccoMat, count);
      const m2 = new THREE.InstancedMesh(roofGeo, roofMat, count);
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        const dist = 32 + (i % 4) * 8;
        const sx = Math.cos(ang) * dist;
        const sz = Math.sin(ang) * dist;
        const bh = 5.5 + (i % 4) * 2.8;
        const bw = 4.2 + (i % 3) * 1.4;
        dummy.position.set(sx, yFloor + bh / 2 - 0.3, sz);
        dummy.rotation.set(0, ang, 0);
        dummy.scale.set(bw, bh, bw);
        dummy.updateMatrix();
        m1.setMatrixAt(i, dummy.matrix);

        dummy.position.set(sx, yFloor + bh + 0.9, sz);
        dummy.rotation.set(0, ang + Math.PI / 4, 0);
        dummy.scale.set(bw, 2.4, bw);
        dummy.updateMatrix();
        m2.setMatrixAt(i, dummy.matrix);
      }
      m1.instanceMatrix.needsUpdate = true;
      m2.instanceMatrix.needsUpdate = true;
      m1.computeBoundingSphere();
      m2.computeBoundingSphere();
      this.worldGroup.add(m1, m2);
      return;
    }

    if (b === 'forest') {
      const trunkGeo = new THREE.CylinderGeometry(0.32, 0.48, 2.4, 7);
      const trunkMat = new THREE.MeshStandardMaterial({ color: '#6D4C41', roughness: 0.88 });
      const crownGeo = new THREE.DodecahedronGeometry(2.0, 0);
      const crownMat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
      const m1 = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
      const m2 = new THREE.InstancedMesh(crownGeo, crownMat, count);
      const colEmerald = new THREE.Color('#66BB6A');
      const colSakura = new THREE.Color('#F48FB1');
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        const dist = 28 + (i % 4) * 7.5;
        const sx = Math.cos(ang) * dist;
        const sz = Math.sin(ang) * dist;
        const sc = 0.85 + (i % 3) * 0.3;
        dummy.position.set(sx, yFloor + 1.1 * sc, sz);
        dummy.rotation.set(0, ang, 0);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        m1.setMatrixAt(i, dummy.matrix);

        dummy.position.set(sx, yFloor + 3.1 * sc, sz);
        dummy.scale.set(sc * 1.15, sc * 0.95, sc * 1.15);
        dummy.updateMatrix();
        m2.setMatrixAt(i, dummy.matrix);
        m2.setColorAt(i, i % 3 === 0 ? colSakura : colEmerald);
      }
      m1.instanceMatrix.needsUpdate = true;
      m2.instanceMatrix.needsUpdate = true;
      if (m2.instanceColor) m2.instanceColor.needsUpdate = true;
      m1.computeBoundingSphere();
      m2.computeBoundingSphere();
      this.worldGroup.add(m1, m2);
      return;
    }

    if (b === 'desert') {
      const mesaGeo = new THREE.CylinderGeometry(2.6, 4.2, 4.5, 6);
      const mesaMat = new THREE.MeshStandardMaterial({ color: '#D87A4A', roughness: 0.9 });
      const cacGeo = new THREE.CylinderGeometry(0.35, 0.42, 3.2, 7);
      const cacMat = new THREE.MeshStandardMaterial({ color: '#66BB6A', roughness: 0.82 });
      const m1 = new THREE.InstancedMesh(mesaGeo, mesaMat, count);
      const m2 = new THREE.InstancedMesh(cacGeo, cacMat, count);
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        const dist = 31 + (i % 4) * 8;
        const sx = Math.cos(ang) * dist;
        const sz = Math.sin(ang) * dist;
        const mh = 0.8 + (i % 3) * 0.65;
        dummy.position.set(sx, yFloor + 2.0 * mh - 0.3, sz);
        dummy.rotation.set(0, ang, 0);
        dummy.scale.set(1, mh, 1);
        dummy.updateMatrix();
        m1.setMatrixAt(i, dummy.matrix);

        const cAng = ang + 0.14;
        dummy.position.set(Math.cos(cAng) * (dist - 5), yFloor + 1.5, Math.sin(cAng) * (dist - 5));
        dummy.scale.setScalar(0.85 + (i % 3) * 0.25);
        dummy.updateMatrix();
        m2.setMatrixAt(i, dummy.matrix);
      }
      m1.instanceMatrix.needsUpdate = true;
      m2.instanceMatrix.needsUpdate = true;
      m1.computeBoundingSphere();
      m2.computeBoundingSphere();
      this.worldGroup.add(m1, m2);
      return;
    }

    if (b === 'snow') {
      const pineGeo = new THREE.ConeGeometry(1.8, 5.0, 7);
      const pineMat = new THREE.MeshStandardMaterial({ color: '#4DB6AC', roughness: 0.78 });
      const crystalGeo = new THREE.OctahedronGeometry(1.4, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: '#80DEEA',
        emissive: '#4DD0E1',
        emissiveIntensity: 0.35,
        roughness: 0.18,
        metalness: 0.3,
      });
      const m1 = new THREE.InstancedMesh(pineGeo, pineMat, count);
      const m2 = new THREE.InstancedMesh(crystalGeo, crystalMat, count);
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        const dist = 29 + (i % 4) * 7.5;
        const sc = 0.85 + (i % 3) * 0.3;
        dummy.position.set(Math.cos(ang) * dist, yFloor + 2.3 * sc, Math.sin(ang) * dist);
        dummy.rotation.set(0, ang, 0);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        m1.setMatrixAt(i, dummy.matrix);

        const cAng = ang + 0.15;
        dummy.position.set(Math.cos(cAng) * (dist - 4), yFloor + 1.2, Math.sin(cAng) * (dist - 4));
        dummy.scale.set(0.7, 1.4, 0.7);
        dummy.updateMatrix();
        m2.setMatrixAt(i, dummy.matrix);
      }
      m1.instanceMatrix.needsUpdate = true;
      m2.instanceMatrix.needsUpdate = true;
      m1.computeBoundingSphere();
      m2.computeBoundingSphere();
      this.worldGroup.add(m1, m2);
      return;
    }

    if (b === 'clouds') {
      const puffGeo = new THREE.SphereGeometry(2.6, 10, 8);
      const puffMat = new THREE.MeshStandardMaterial({ roughness: 0.94 });
      const pillarGeo = new THREE.CylinderGeometry(0.7, 0.9, 6, 8);
      const pillarMat = new THREE.MeshStandardMaterial({ color: '#FFD54F', roughness: 0.35, metalness: 0.5 });
      const m1 = new THREE.InstancedMesh(puffGeo, puffMat, count);
      const m2 = new THREE.InstancedMesh(pillarGeo, pillarMat, count);
      const cPink = new THREE.Color('#F8BBD0');
      const cWhite = new THREE.Color('#FFFFFF');
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        const dist = 28 + (i % 4) * 8;
        dummy.position.set(Math.cos(ang) * dist, yFloor + 1.2 + (i % 3) * 1.4, Math.sin(ang) * dist);
        dummy.rotation.set(0, ang, 0);
        dummy.scale.set(1.4, 0.75, 1.2);
        dummy.updateMatrix();
        m1.setMatrixAt(i, dummy.matrix);
        m1.setColorAt(i, i % 2 === 0 ? cWhite : cPink);

        dummy.position.set(Math.cos(ang + 0.12) * (dist + 5), yFloor + 2.8, Math.sin(ang + 0.12) * (dist + 5));
        dummy.scale.set(1, 1 + (i % 3) * 0.35, 1);
        dummy.updateMatrix();
        m2.setMatrixAt(i, dummy.matrix);
      }
      m1.instanceMatrix.needsUpdate = true;
      m2.instanceMatrix.needsUpdate = true;
      if (m1.instanceColor) m1.instanceColor.needsUpdate = true;
      m1.computeBoundingSphere();
      m2.computeBoundingSphere();
      this.worldGroup.add(m1, m2);
      return;
    }

    if (b === 'castle') {
      const towerGeo = new THREE.CylinderGeometry(1.7, 2.0, 9.0, 8);
      const towerMat = new THREE.MeshStandardMaterial({ color: '#455A64', roughness: 0.75 });
      const spireGeo = new THREE.ConeGeometry(2.1, 3.6, 8);
      const spireMat = new THREE.MeshStandardMaterial({
        color: '#AB47BC',
        emissive: '#6A1B9A',
        emissiveIntensity: 0.25,
        roughness: 0.45,
      });
      const m1 = new THREE.InstancedMesh(towerGeo, towerMat, count);
      const m2 = new THREE.InstancedMesh(spireGeo, spireMat, count);
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        const dist = 32 + (i % 3) * 8;
        const sc = 0.85 + (i % 4) * 0.22;
        dummy.position.set(Math.cos(ang) * dist, yFloor + 4.3 * sc, Math.sin(ang) * dist);
        dummy.rotation.set(0, ang, 0);
        dummy.scale.set(1, sc, 1);
        dummy.updateMatrix();
        m1.setMatrixAt(i, dummy.matrix);

        dummy.position.set(Math.cos(ang) * dist, yFloor + 8.8 * sc + 1.6, Math.sin(ang) * dist);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        m2.setMatrixAt(i, dummy.matrix);
      }
      m1.instanceMatrix.needsUpdate = true;
      m2.instanceMatrix.needsUpdate = true;
      m1.computeBoundingSphere();
      m2.computeBoundingSphere();
      this.worldGroup.add(m1, m2);
      return;
    }

    // Default: 'harbor' coastal rocks & green island tops
    const rockGeo = new THREE.ConeGeometry(3.8, 3.6, 7);
    const rockMat = new THREE.MeshStandardMaterial({ color: '#8D99AE', roughness: 0.9 });
    const treeGeo = new THREE.ConeGeometry(1.2, 2.6, 7);
    const treeMat = new THREE.MeshStandardMaterial({ color: '#81C784', roughness: 0.88 });
    addRing(rockGeo, rockMat, treeGeo, treeMat, () => {});
    // Populating matrices directly:
    const children = this.worldGroup.children;
    const mRock = children[children.length - 2] as THREE.InstancedMesh;
    const mTree = children[children.length - 1] as THREE.InstancedMesh;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const dist = 30 + (i % 4) * 7.5;
      const sx = Math.cos(ang) * dist;
      const sz = Math.sin(ang) * dist;
      const sc = 0.85 + (i % 4) * 0.28;
      dummy.position.set(sx, yFloor + 1.4 * sc, sz);
      dummy.rotation.set(0, ang, 0);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      mRock.setMatrixAt(i, dummy.matrix);

      dummy.position.set(sx, yFloor + 3.4 * sc, sz);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      mTree.setMatrixAt(i, dummy.matrix);
    }
    mRock.instanceMatrix.needsUpdate = true;
    mTree.instanceMatrix.needsUpdate = true;
    mRock.computeBoundingSphere();
    mTree.computeBoundingSphere();
  }

  private isBlockActive(blk: BlockDef3D): boolean {
    if (blk.style === 'cloud') {
      const c = this.clouds.get(blk.id);
      return !c || c.state !== 'gone';
    }
    if (blk.style === 'bridge') {
      return !blk.linkId || this.activeLinks.has(blk.linkId);
    }
    if (blk.style === 'gate_wall') {
      return !blk.linkId || !this.activeLinks.has(blk.linkId);
    }
    return true;
  }

  private getBlockCurrentBounds(blk: BlockDef3D) {
    const mv = this.movers.get(blk.id);
    const x = mv ? mv.x : blk.x;
    const y = mv ? mv.y : blk.y;
    const z = mv ? mv.z : blk.z;
    return {
      minX: x - blk.w / 2,
      maxX: x + blk.w / 2,
      minY: y,
      maxY: y + blk.h,
      minZ: z - blk.d / 2,
      maxZ: z + blk.d / 2,
      dx: mv ? mv.dx : 0,
      dy: mv ? mv.dy : 0,
      dz: mv ? mv.dz : 0,
    };
  }

  private update(dt: number) {
    this.worldTime += dt;

    // Gentle ocean wave on harbor levels & slow cloud drift
    if (this.level.theme.backdrop === 'harbor') {
      this.textures.water.offset.x = (this.worldTime * 0.03) % 1;
      this.textures.water.offset.y = (this.worldTime * 0.02) % 1;
    }
    this.skyCloudsGroup.rotation.y = this.worldTime * 0.012;

    if (this.mode === 'DIORAMA') {
      // Orbit showcase camera smoothly on Title screen
      this.camYaw = Math.sin(this.worldTime * 0.25) * 0.45 - 0.3;
      this.camTargetX = (this.p1.x + this.p2.x) * 0.5 + 4;
      this.camTargetY = 1.6;
      this.camTargetZ = 0;
      this.p1Rig.root.position.set(this.p1.x, this.p1.y, this.p1.z);
      this.p2Rig.root.position.set(this.p2.x, this.p2.y, this.p2.z);
      animateCharacter3D(this.p1Rig, 'idle', this.worldTime);
      animateCharacter3D(this.p2Rig, 'idle', this.worldTime + 0.8);
      this.updateCamera(dt);
      return;
    }

    if (this.mode === 'PAUSED' || this.mode === 'VICTORY') {
      this.syncVisuals(dt);
      this.updateCamera(dt);
      return;
    }

    // Gather local inputs into inputP1 / inputP2 (or send to Host if Guest)
    this.gatherLocalInputs(dt);

    if (this.playMode === 'LDR_GUEST') {
      this.syncVisuals(dt);
      this.updateParticles(dt);
      this.updateCamera(dt);
      this.hudEmitTimer -= dt;
      if (this.hudEmitTimer <= 0) {
        this.hudEmitTimer = 0.1;
        this.emitHud();
      }
      return;
    }

    // --- HOST / LOCAL SIMULATION ---
    this.levelElapsed += dt;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;
    if (this.tugSoundCooldown > 0) this.tugSoundCooldown -= dt;
    if (this.crateSoundCooldown > 0) this.crateSoundCooldown -= dt;
    if (this.rescueBannerTimer > 0) this.rescueBannerTimer -= dt;
    if (this.checkpointBannerTimer > 0) this.checkpointBannerTimer -= dt;

    // 1. Update timed links, levers & pressure plates
    this.updateMechanisms(dt);

    // 2. Update boats & elevators
    for (const blk of this.level.blocks) {
      if (blk.style === 'boat' || blk.style === 'elevator') {
        const mv = this.movers.get(blk.id)!;
        const endX = blk.endX ?? blk.x;
        const endY = blk.endY ?? blk.y;
        const endZ = blk.endZ ?? blk.z;
        const dist = Math.hypot(endX - blk.x, endY - blk.y, endZ - blk.z);
        const speed = blk.speed || 2.8;
        const step = dist > 0.01 ? (speed / dist) * dt : 0;

        const prevX = mv.x;
        const prevY = mv.y;
        const prevZ = mv.z;

        if (blk.linkId) {
          const active = this.activeLinks.has(blk.linkId);
          mv.progress = active ? Math.min(1, mv.progress + step) : Math.max(0, mv.progress - step);
        } else if (blk.autoPingPong) {
          mv.progress += step * mv.dir;
          if (mv.progress >= 1) {
            mv.progress = 1;
            mv.dir = -1;
          } else if (mv.progress <= 0) {
            mv.progress = 0;
            mv.dir = 1;
          }
        }

        mv.x = blk.x + (endX - blk.x) * mv.progress;
        mv.y = blk.y + (endY - blk.y) * mv.progress;
        mv.z = blk.z + (endZ - blk.z) * mv.progress;
        mv.dx = mv.x - prevX;
        mv.dy = mv.y - prevY;
        mv.dz = mv.z - prevZ;
      }
    }

    // 3. Update cloud timers
    for (const [id, c] of this.clouds.entries()) {
      if (c.state === 'shaking') {
        c.timer -= dt;
        if (c.timer <= 0) {
          c.state = 'gone';
          c.timer = 2.6;
          const blk = this.level.blocks.find((b) => b.id === id);
          if (blk) this.spawnParticles3D(blk.x, blk.y + 0.5, blk.z, '#FFFFFF', 8);
        }
      } else if (c.state === 'gone') {
        c.timer -= dt;
        if (c.timer <= 0) {
          c.state = 'solid';
          c.timer = 0;
        }
      }
    }

    // 4. Update enemies
    for (const en of this.enemies) {
      if (en.axis === 'x') {
        en.x += en.facing * en.speed * dt;
        if (en.x >= en.max) {
          en.x = en.max;
          en.facing = -1;
        } else if (en.x <= en.min) {
          en.x = en.min;
          en.facing = 1;
        }
      } else {
        en.z += en.facing * en.speed * dt;
        if (en.z >= en.max) {
          en.z = en.max;
          en.facing = -1;
        } else if (en.z <= en.min) {
          en.z = en.min;
          en.facing = 1;
        }
      }
      if (en.kind === 'seagull') {
        en.y = en.baseY + Math.sin(this.worldTime * 3.8 + en.min) * 0.45;
      }
    }

    // 4b. Update Saws, Spikes, and Cannons / Cannonballs
    this.updateObstacles3D(dt);

    // 5. Update crates & players
    this.p1.prevX = this.p1.x;
    this.p1.prevY = this.p1.y;
    this.p1.prevZ = this.p1.z;
    this.p2.prevX = this.p2.x;
    this.p2.prevY = this.p2.y;
    this.p2.prevZ = this.p2.z;

    this.updateCrates3D(dt);
    this.updatePlayer3D(this.p1, this.inputP1, dt, true);
    this.updatePlayer3D(this.p2, this.inputP2, dt, false);
    this.resolvePlayerStacking3D();

    if (this.tetherEnabled) {
      this.applyTetherPhysics3D(dt);
    } else {
      this.p1.pulledActive = false;
      this.p2.pulledActive = false;
    }

    this.checkWorldInteractions3D();

    // 6. Dual Goal Doors Check
    const p1AtGoal = this.isAtGoal(this.p1, this.level.goalPink);
    const p2AtGoal = this.isAtGoal(this.p2, this.level.goalBlue);
    if (p1AtGoal && p2AtGoal && !this.victoryTriggered) {
      this.goalCelebrateTimer += dt;
      if (Math.random() < 0.35) {
        this.spawnParticles3D(this.level.goalPink.x, this.level.goalPink.y + 1.5, this.level.goalPink.z, '#FF4081', 2);
        this.spawnParticles3D(this.level.goalBlue.x, this.level.goalBlue.y + 1.5, this.level.goalBlue.z, '#29B6F6', 2);
      }
      if (this.goalCelebrateTimer >= 0.7) {
        this.victoryTriggered = true;
        this.mode = 'VICTORY';
        soundFX.playVictory();
        this.emitNetEvent('victory', {
          stars: this.collectedStars.size,
          coins: this.collectedCoins.size,
          elapsed: this.levelElapsed,
        });
        this.onLevelVictory(this.collectedStars.size, this.collectedCoins.size, this.levelElapsed);
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

    this.syncVisuals(dt);
    this.updateParticles(dt);
    this.updateCamera(dt);

    this.hudEmitTimer -= dt;
    if (this.hudEmitTimer <= 0) {
      this.hudEmitTimer = 0.1;
      this.emitHud();
    }
  }

  private gatherLocalInputs(dt: number) {
    // Camera keyboard rotate (Q / E)
    if (this.keys.has('KeyQ')) this.camYaw += 1.9 * dt;
    if (this.keys.has('KeyE')) this.camYaw -= 1.9 * dt;

    if (this.playMode === 'LOCAL') {
      if (this.localControlMode === 'solo_switch') {
        const activeTarget = this.activeLocalChar === 'p1' ? this.inputP1 : this.inputP2;
        const idleTarget = this.activeLocalChar === 'p1' ? this.inputP2 : this.inputP1;
        const pad = this.activeLocalChar === 'p1' ? this.touchPadP1 : this.touchPadP2;

        const mx =
          (this.keys.has('KeyD') || this.keys.has('ArrowRight') || pad.right ? 1 : 0) -
          (this.keys.has('KeyA') || this.keys.has('ArrowLeft') || pad.left ? 1 : 0);
        const mz =
          (this.keys.has('KeyS') || this.keys.has('ArrowDown') || pad.down ? 1 : 0) -
          (this.keys.has('KeyW') || this.keys.has('ArrowUp') || pad.up ? 1 : 0);
        const len = Math.hypot(mx, mz);
        activeTarget.moveX = len > 1 ? mx / len : mx;
        activeTarget.moveZ = len > 1 ? mz / len : mz;
        activeTarget.jumpHeld = this.keys.has('Space') || this.keys.has('KeyZ') || this.keys.has('ShiftLeft') || pad.jump;
        activeTarget.camYaw = this.camYaw;

        idleTarget.moveX = 0;
        idleTarget.moveZ = 0;
        idleTarget.jumpHeld = false;
      } else {
        // 2 Players on 1 Keyboard!
        const mx1 = (this.keys.has('KeyD') || this.touchPadP1.right ? 1 : 0) - (this.keys.has('KeyA') || this.touchPadP1.left ? 1 : 0);
        const mz1 = (this.keys.has('KeyS') || this.touchPadP1.down ? 1 : 0) - (this.keys.has('KeyW') || this.touchPadP1.up ? 1 : 0);
        const l1 = Math.hypot(mx1, mz1);
        this.inputP1.moveX = l1 > 1 ? mx1 / l1 : mx1;
        this.inputP1.moveZ = l1 > 1 ? mz1 / l1 : mz1;
        this.inputP1.jumpHeld = this.keys.has('ShiftLeft') || this.keys.has('KeyV') || this.keys.has('KeyZ') || this.touchPadP1.jump;
        this.inputP1.camYaw = this.camYaw;

        const mx2 = (this.keys.has('ArrowRight') || this.touchPadP2.right ? 1 : 0) - (this.keys.has('ArrowLeft') || this.touchPadP2.left ? 1 : 0);
        const mz2 = (this.keys.has('ArrowDown') || this.touchPadP2.down ? 1 : 0) - (this.keys.has('ArrowUp') || this.touchPadP2.up ? 1 : 0);
        const l2 = Math.hypot(mx2, mz2);
        this.inputP2.moveX = l2 > 1 ? mx2 / l2 : mx2;
        this.inputP2.moveZ = l2 > 1 ? mz2 / l2 : mz2;
        this.inputP2.jumpHeld = this.keys.has('Space') || this.keys.has('Slash') || this.keys.has('Numpad0') || this.touchPadP2.jump;
        this.inputP2.camYaw = this.camYaw;
      }
      return;
    }

    // LDR_HOST or LDR_GUEST: single character per device using WASD or Arrows
    const pad = this.myRole === 'p1' ? this.touchPadP1 : this.touchPadP2;
    const mx =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') || pad.right ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') || pad.left ? 1 : 0);
    const mz =
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') || pad.down ? 1 : 0) -
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') || pad.up ? 1 : 0);
    const len = Math.hypot(mx, mz);
    const normX = len > 1 ? mx / len : mx;
    const normZ = len > 1 ? mz / len : mz;
    const jumpHeld = this.keys.has('Space') || this.keys.has('KeyZ') || this.keys.has('ShiftLeft') || pad.jump;

    if (this.playMode === 'LDR_HOST') {
      const target = this.myRole === 'p1' ? this.inputP1 : this.inputP2;
      target.moveX = normX;
      target.moveZ = normZ;
      target.jumpHeld = jumpHeld;
      target.camYaw = this.camYaw;
    } else if (this.playMode === 'LDR_GUEST') {
      this.netInputTimer -= dt;
      const key = `${normX.toFixed(1)},${normZ.toFixed(1)},${jumpHeld ? 1 : 0},${this.camYaw.toFixed(2)}`;
      if (
        key !== this.lastSentInputKey ||
        this.guestPendingJump ||
        this.guestPendingInteract ||
        this.netInputTimer <= 0
      ) {
        this.lastSentInputKey = key;
        this.netInputTimer = 0.045;
        this.onGuestSendInput?.({
          moveX: normX,
          moveZ: normZ,
          jumpHeld,
          jumpJustPressed: this.guestPendingJump,
          interactJustPressed: this.guestPendingInteract,
          camYaw: this.camYaw,
        });
        this.guestPendingJump = false;
        this.guestPendingInteract = false;
      }
    }
  }

  private updateMechanisms(dt: number) {
    for (const [linkId, rem] of this.timedLinks.entries()) {
      const next = rem - dt;
      if (next <= 0) this.timedLinks.delete(linkId);
      else this.timedLinks.set(linkId, next);
    }

    // Handle lever toggles
    for (const lv of this.level.levers) {
      const checkLever = (p: PlayerRuntime3D, inp: InputPadState) => {
        if (this.worldTime - inp.interactPressedAt <= 0.16) {
          const dist = Math.hypot(p.x - lv.x, p.z - lv.z);
          if (dist < 1.35 && Math.abs(p.y - lv.y) < 1.3) {
            inp.interactPressedAt = -10;
            const next = !this.leverStates.get(lv.id);
            this.leverStates.set(lv.id, next);
            soundFX.playLever();
            this.emitNetEvent('lever');
            this.spawnParticles3D(lv.x, lv.y + 0.8, lv.z, next ? '#A5D6A7' : '#FFAB91', 8);
          }
        }
      };
      checkLever(this.p1, this.inputP1);
      checkLever(this.p2, this.inputP2);
    }

    this.activeLinks.clear();
    for (const lv of this.level.levers) {
      if (this.leverStates.get(lv.id)) this.activeLinks.add(lv.linkId);
    }
    for (const [linkId, rem] of this.timedLinks.entries()) {
      if (rem > 0) this.activeLinks.add(linkId);
    }
    for (const k of this.level.keys || []) {
      if (this.collectedKeys.has(k.id)) this.activeLinks.add(k.linkId);
    }

    // Pressure Plates
    const prevPlates = new Set(this.pressedPlates);
    this.pressedPlates.clear();
    for (const pl of this.level.plates) {
      let pressed = false;
      for (const cr of this.crates) {
        if (
          Math.abs(cr.x - pl.x) < 0.85 &&
          Math.abs(cr.z - pl.z) < 0.85 &&
          Math.abs(cr.y - pl.y) < 0.35
        ) {
          pressed = true;
          break;
        }
      }
      if (!pressed && (pl.color === 'pink' || pl.color === 'purple')) {
        if (
          Math.abs(this.p1.x - pl.x) < 0.78 &&
          Math.abs(this.p1.z - pl.z) < 0.78 &&
          Math.abs(this.p1.y - pl.y) < 0.4
        ) {
          pressed = true;
        }
      }
      if (!pressed && (pl.color === 'blue' || pl.color === 'purple')) {
        if (
          Math.abs(this.p2.x - pl.x) < 0.78 &&
          Math.abs(this.p2.z - pl.z) < 0.78 &&
          Math.abs(this.p2.y - pl.y) < 0.4
        ) {
          pressed = true;
        }
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

  private updateCrates3D(dt: number) {
    for (const cr of this.crates) {
      if (cr.ridingBlockId) {
        const mv = this.movers.get(cr.ridingBlockId);
        if (mv) {
          cr.x += mv.dx;
          cr.y += mv.dy;
          cr.z += mv.dz;
        }
      }

      // Check players pushing crate horizontally in X or Z
      let pushX = 0;
      let pushZ = 0;
      const half = cr.size / 2;
      for (const p of [this.p1, this.p2]) {
        const inp = p.id === 'p1' ? this.inputP1 : this.inputP2;
        const { worldX, worldZ } = this.getCameraRelativeInput(inp);
        const dx = cr.x - p.x;
        const dz = cr.z - p.z;
        const overlapY = p.y + p.height > cr.y + 0.1 && p.y < cr.y + cr.size - 0.1;
        if (overlapY && Math.abs(dx) < half + p.radius + 0.16 && Math.abs(dz) < half + p.radius + 0.16) {
          if (Math.abs(dx) > Math.abs(dz)) {
            if (Math.sign(dx) === Math.sign(worldX) && Math.abs(worldX) > 0.15) {
              pushX += worldX * 2.4;
              p.isPushing = true;
            }
          } else {
            if (Math.sign(dz) === Math.sign(worldZ) && Math.abs(worldZ) > 0.15) {
              pushZ += worldZ * 2.4;
              p.isPushing = true;
            }
          }
        }
      }

      if ((Math.abs(pushX) > 0.2 || Math.abs(pushZ) > 0.2) && this.crateSoundCooldown <= 0) {
        soundFX.playCratePush();
        this.crateSoundCooldown = 0.24;
      }

      cr.vx = pushX;
      cr.vz = pushZ;
      cr.vy -= GRAVITY * dt;

      // Move X & resolve blocks
      cr.x += cr.vx * dt;
      this.resolveCrateHorizontal(cr, 'x');
      cr.z += cr.vz * dt;
      this.resolveCrateHorizontal(cr, 'z');

      // Move Y & land on blocks
      cr.y += cr.vy * dt;
      cr.grounded = false;
      cr.ridingBlockId = null;

      for (const blk of this.level.blocks) {
        if (!this.isBlockActive(blk)) continue;
        const b = this.getBlockCurrentBounds(blk);
        if (cr.x + half > b.minX + 0.04 && cr.x - half < b.maxX - 0.04 && cr.z + half > b.minZ + 0.04 && cr.z - half < b.maxZ - 0.04) {
          if (cr.vy <= 0 && cr.y <= b.maxY && cr.y >= b.maxY - 0.5) {
            cr.y = b.maxY;
            cr.vy = 0;
            cr.grounded = true;
            if (blk.style === 'boat' || blk.style === 'elevator') cr.ridingBlockId = blk.id;
            if (blk.style === 'conveyor') {
              const rev = blk.reverseLinkId && this.activeLinks.has(blk.reverseLinkId) ? -1 : 1;
              cr.x += (blk.flowX || 0) * rev * dt;
              cr.z += (blk.flowZ || 0) * rev * dt;
            }
          }
        }
      }

      // Reset crate if fell into abyss/water
      if (cr.y < this.level.waterY - 2.5) {
        const def = this.level.crates.find((c) => c.id === cr.id);
        if (def) {
          cr.x = def.x;
          cr.y = def.y + 0.5;
          cr.z = def.z;
          cr.vx = 0;
          cr.vy = 0;
          cr.vz = 0;
        }
      }
    }
  }

  private resolveCrateHorizontal(cr: CrateRuntime3D, axis: 'x' | 'z') {
    const half = cr.size / 2;
    for (const blk of this.level.blocks) {
      if (!this.isBlockActive(blk)) continue;
      const b = this.getBlockCurrentBounds(blk);
      if (
        cr.y + cr.size > b.minY + 0.08 &&
        cr.y < b.maxY - 0.08 &&
        cr.x + half > b.minX &&
        cr.x - half < b.maxX &&
        cr.z + half > b.minZ &&
        cr.z - half < b.maxZ
      ) {
        if (axis === 'x') {
          if (cr.x < (b.minX + b.maxX) / 2) cr.x = b.minX - half;
          else cr.x = b.maxX + half;
          cr.vx = 0;
        } else {
          if (cr.z < (b.minZ + b.maxZ) / 2) cr.z = b.minZ - half;
          else cr.z = b.maxZ + half;
          cr.vz = 0;
        }
      }
    }
  }

  private getCameraRelativeInput(inp: InputPadState): { worldX: number; worldZ: number } {
    const yaw = inp.camYaw;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    // Forward direction on XZ when pressing W (moveZ = -1): (-sin, -cos)
    // Right direction on XZ when pressing D (moveX = +1): (cos, -sin)
    const worldX = inp.moveX * cos + inp.moveZ * sin;
    const worldZ = -inp.moveX * sin + inp.moveZ * cos;
    return { worldX, worldZ };
  }

  private updatePlayer3D(p: PlayerRuntime3D, inp: InputPadState, dt: number, isGirl: boolean) {
    p.isPushing = false;
    if (p.dizzyTimer > 0) p.dizzyTimer -= dt;
    if (p.invulnTimer > 0) p.invulnTimer -= dt;
    if (p.wallJumpLock > 0) p.wallJumpLock -= dt;
    if (p.teleportCooldown > 0) p.teleportCooldown -= dt;

    // Carry from riding moving boat / elevator
    if (p.ridingBlockId) {
      const mv = this.movers.get(p.ridingBlockId);
      if (mv) {
        p.x += mv.dx;
        p.y += mv.dy;
        p.z += mv.dz;
      }
    }

    const { worldX, worldZ } = this.getCameraRelativeInput(inp);
    const speedMult = p.dizzyTimer > 0 ? 0.45 : 1;

    if (p.wallJumpLock <= 0) {
      const targetVx = worldX * MOVE_SPEED * speedMult;
      const targetVz = worldZ * MOVE_SPEED * speedMult;
      const accel = p.grounded ? 22 : 12;
      p.vx = THREE.MathUtils.damp(p.vx, targetVx, accel, dt);
      p.vz = THREE.MathUtils.damp(p.vz, targetVz, accel, dt);
    }

    if (Math.hypot(worldX, worldZ) > 0.12) {
      const targetYaw = Math.atan2(worldX, worldZ);
      let diff = targetYaw - p.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      p.yaw += diff * Math.min(1, 14 * dt);
    }

    // Check Ladder climb
    p.onLadder = false;
    for (const lad of this.level.ladders) {
      const distXZ = Math.hypot(p.x - lad.x, p.z - lad.z);
      if (distXZ < 0.78 && p.y >= lad.yBottom - 0.3 && p.y <= lad.yTop + 0.15) {
        const pushingIn = Math.hypot(worldX, worldZ) > 0.1 || inp.jumpHeld;
        if (pushingIn) {
          p.onLadder = true;
          p.vy = 4.5;
          p.grounded = false;
          break;
        }
      }
    }

    if (!p.onLadder) {
      if (p.grounded) {
        p.coyoteTimer = COYOTE_TIME;
        p.airJumpsRemaining = 1;
      } else {
        p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
      }

      const hasJumpBuf = this.worldTime - inp.jumpPressedAt <= JUMP_BUFFER;
      if (hasJumpBuf) {
        if (p.coyoteTimer > 0) {
          p.vy = JUMP_VEL;
          p.grounded = false;
          p.coyoteTimer = 0;
          p.airJumpsRemaining = 1;
          p.ridingPartnerId = null;
          inp.jumpPressedAt = -10;
          soundFX.playJump(isGirl, false);
          this.emitNetEvent('jump', { isGirl, isDouble: false });
          this.spawnParticles3D(p.x, p.y + 0.15, p.z, '#FFF8F0', 4);
        } else if (p.wallNormalX !== 0 || p.wallNormalZ !== 0) {
          // Wall-Jump!
          p.vy = JUMP_VEL * 0.94;
          p.vx = p.wallNormalX * 6.5;
          p.vz = p.wallNormalZ * 6.5;
          p.wallJumpLock = 0.16;
          p.airJumpsRemaining = 1;
          inp.jumpPressedAt = -10;
          soundFX.playWallJump(isGirl);
          this.emitNetEvent('wallJump', { isGirl });
          this.spawnParticles3D(p.x, p.y + 0.8, p.z, '#FFFFFF', 6);
        } else if (p.airJumpsRemaining > 0) {
          // Mid-air Double Jump!
          p.vy = DOUBLE_JUMP_VEL;
          p.airJumpsRemaining = 0;
          p.ridingPartnerId = null;
          inp.jumpPressedAt = -10;
          soundFX.playJump(isGirl, true);
          this.emitNetEvent('jump', { isGirl, isDouble: true });
          this.spawnParticles3D(p.x, p.y + 0.25, p.z, isGirl ? '#FF80AB' : '#81D4FA', 6);
        }
      }

      // Gravity + Wall-Slide slow descent
      p.vy -= GRAVITY * dt;
      if (!p.grounded && (p.wallNormalX !== 0 || p.wallNormalZ !== 0) && p.vy < WALL_SLIDE_MAX_VY) {
        p.vy = WALL_SLIDE_MAX_VY;
      }
    } else {
      p.airJumpsRemaining = 1;
    }

    // Move & Collide X, Z, Y
    p.wallNormalX = 0;
    p.wallNormalZ = 0;

    p.x += p.vx * dt;
    this.resolvePlayerHorizontal(p, 'x');
    p.z += p.vz * dt;
    this.resolvePlayerHorizontal(p, 'z');

    p.y += p.vy * dt;
    p.grounded = false;
    p.ridingBlockId = null;

    // Land on blocks
    for (const blk of this.level.blocks) {
      if (!this.isBlockActive(blk)) continue;
      const b = this.getBlockCurrentBounds(blk);
      if (
        p.x + p.radius > b.minX + 0.04 &&
        p.x - p.radius < b.maxX - 0.04 &&
        p.z + p.radius > b.minZ + 0.04 &&
        p.z - p.radius < b.maxZ - 0.04
      ) {
        if (p.vy <= 0 && p.y <= b.maxY && p.y >= b.maxY - 0.55) {
          p.y = b.maxY;
          p.vy = 0;
          p.grounded = true;
          if (blk.style === 'boat' || blk.style === 'elevator') p.ridingBlockId = blk.id;
          if (blk.style === 'conveyor') {
            const rev = blk.reverseLinkId && this.activeLinks.has(blk.reverseLinkId) ? -1 : 1;
            p.x += (blk.flowX || 0) * rev * dt;
            p.z += (blk.flowZ || 0) * rev * dt;
          }
          if (blk.style === 'cloud') {
            const cl = this.clouds.get(blk.id);
            if (cl && cl.state === 'solid') {
              cl.state = 'shaking';
              cl.timer = 0.85;
            }
          }
          if (blk.style !== 'cloud' && blk.style !== 'bridge' && blk.style !== 'conveyor') {
            p.lastSafeX = p.x;
            p.lastSafeY = b.maxY + 0.05;
            p.lastSafeZ = p.z;
          }
        } else if (p.vy > 0 && p.y + p.height > b.minY && p.y + p.height < b.minY + 0.45) {
          p.y = b.minY - p.height;
          p.vy = 0;
        }
      }
    }

    // Land on Crates
    for (const cr of this.crates) {
      const half = cr.size / 2;
      if (
        p.x + p.radius > cr.x - half &&
        p.x - p.radius < cr.x + half &&
        p.z + p.radius > cr.z - half &&
        p.z - p.radius < cr.z + half
      ) {
        if (p.vy <= 0 && p.y <= cr.y + cr.size && p.y >= cr.y + cr.size - 0.48) {
          p.y = cr.y + cr.size;
          p.vy = 0;
          p.grounded = true;
          p.x += cr.vx * dt;
          p.z += cr.vz * dt;
        }
      }
    }
  }

  private resolvePlayerHorizontal(p: PlayerRuntime3D, axis: 'x' | 'z') {
    for (const blk of this.level.blocks) {
      if (!this.isBlockActive(blk)) continue;
      const b = this.getBlockCurrentBounds(blk);
      if (
        p.y + p.height > b.minY + 0.14 &&
        p.y < b.maxY - 0.14 &&
        p.x + p.radius > b.minX &&
        p.x - p.radius < b.maxX &&
        p.z + p.radius > b.minZ &&
        p.z - p.radius < b.maxZ
      ) {
        if (axis === 'x') {
          if (p.x < (b.minX + b.maxX) / 2) {
            p.x = b.minX - p.radius;
            p.wallNormalX = -1;
          } else {
            p.x = b.maxX + p.radius;
            p.wallNormalX = 1;
          }
          p.vx = 0;
        } else {
          if (p.z < (b.minZ + b.maxZ) / 2) {
            p.z = b.minZ - p.radius;
            p.wallNormalZ = -1;
          } else {
            p.z = b.maxZ + p.radius;
            p.wallNormalZ = 1;
          }
          p.vz = 0;
        }
      }
    }

    // Collide horizontally with crates (so player pushes rather than phasing inside)
    for (const cr of this.crates) {
      const half = cr.size / 2;
      if (
        p.y + p.height > cr.y + 0.15 &&
        p.y < cr.y + cr.size - 0.15 &&
        p.x + p.radius > cr.x - half &&
        p.x - p.radius < cr.x + half &&
        p.z + p.radius > cr.z - half &&
        p.z - p.radius < cr.z + half
      ) {
        if (axis === 'x') {
          if (p.x < cr.x) p.x = cr.x - half - p.radius;
          else p.x = cr.x + half + p.radius;
        } else {
          if (p.z < cr.z) p.z = cr.z - half - p.radius;
          else p.z = cr.z + half + p.radius;
        }
      }
    }
  }

  private resolvePlayerStacking3D() {
    this.p1.ridingPartnerId = null;
    this.p2.ridingPartnerId = null;

    const tryStack = (top: PlayerRuntime3D, bot: PlayerRuntime3D) => {
      const distXZ = Math.hypot(top.x - bot.x, top.z - bot.z);
      const headY = bot.y + bot.height;
      if (distXZ < 0.62 && top.vy <= 0 && top.y >= headY - 0.42 && top.y <= headY + 0.18) {
        top.y = headY;
        top.vy = 0;
        top.grounded = true;
        top.ridingPartnerId = bot.id;
        top.x += bot.x - bot.prevX;
        top.z += bot.z - bot.prevZ;
        return true;
      }
      return false;
    };

    if (!tryStack(this.p1, this.p2)) {
      tryStack(this.p2, this.p1);
    }
  }

  private applyTetherPhysics3D(dt: number) {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const dz = this.p2.z - this.p1.z;
    const dist = Math.hypot(dx, dy, dz);
    this.p1.pulledActive = false;
    this.p2.pulledActive = false;

    if (dist <= TETHER_REST) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const nz = dz / dist;
    const stretch = dist - TETHER_REST;
    const k = 16.0;

    const p1Anchored = this.p1.grounded;
    const p2Anchored = this.p2.grounded;
    const w1 = p1Anchored && !p2Anchored ? 0.15 : !p1Anchored && p2Anchored ? 0.85 : 0.5;
    const w2 = 1 - w1;

    this.p1.vx += nx * stretch * k * w1 * dt;
    this.p1.vy += ny * stretch * k * w1 * dt;
    this.p1.vz += nz * stretch * k * w1 * dt;

    this.p2.vx -= nx * stretch * k * w2 * dt;
    this.p2.vy -= ny * stretch * k * w2 * dt;
    this.p2.vz -= nz * stretch * k * w2 * dt;

    if (dist > TETHER_MAX) {
      const excess = dist - TETHER_MAX;
      this.p1.x += nx * excess * w1;
      this.p1.y += ny * excess * w1;
      this.p1.z += nz * excess * w1;
      this.p2.x -= nx * excess * w2;
      this.p2.y -= ny * excess * w2;
      this.p2.z -= nz * excess * w2;

      if (!this.p1.grounded && this.p2.grounded) {
        this.p1.pulledActive = true;
        this.rescueBannerTimer = 1.1;
      } else if (!this.p2.grounded && this.p1.grounded) {
        this.p2.pulledActive = true;
        this.rescueBannerTimer = 1.1;
      }

      if (this.tugSoundCooldown <= 0) {
        soundFX.playTug();
        this.tugSoundCooldown = 0.5;
      }
    }
  }

  private getLaserLength(las: LevelDef3D['lasers'][number]): number {
    if (las.linkId && this.activeLinks.has(las.linkId)) return 0;

    let maxLen = las.maxLength;
    const dirX = las.dir === '+x' ? 1 : las.dir === '-x' ? -1 : 0;
    const dirZ = las.dir === '+z' ? 1 : las.dir === '-z' ? -1 : 0;

    const checkBoxHit = (minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number) => {
      if (las.y < minY || las.y > maxY) return;
      if (dirX !== 0 && las.z >= minZ && las.z <= maxZ) {
        const edge = dirX > 0 ? minX : maxX;
        const t = (edge - las.x) * dirX;
        if (t > 0.1 && t < maxLen) maxLen = t;
      } else if (dirZ !== 0 && las.x >= minX && las.x <= maxX) {
        const edge = dirZ > 0 ? minZ : maxZ;
        const t = (edge - las.z) * dirZ;
        if (t > 0.1 && t < maxLen) maxLen = t;
      }
    };

    for (const cr of this.crates) {
      const h = cr.size / 2;
      checkBoxHit(cr.x - h, cr.x + h, cr.y, cr.y + cr.size, cr.z - h, cr.z + h);
    }

    if (las.color === 'pink') {
      const p = this.p1;
      checkBoxHit(p.x - p.radius, p.x + p.radius, p.y, p.y + p.height, p.z - p.radius, p.z + p.radius);
    } else if (las.color === 'blue') {
      const p = this.p2;
      checkBoxHit(p.x - p.radius, p.x + p.radius, p.y, p.y + p.height, p.z - p.radius, p.z + p.radius);
    }

    return maxLen;
  }

  private checkWorldInteractions3D() {
    // Trampolines
    for (const tr of this.level.trampolines) {
      for (const p of [this.p1, this.p2]) {
        const dist = Math.hypot(p.x - tr.x, p.z - tr.z);
        if (dist < 0.85 && p.vy <= 0 && Math.abs(p.y - (tr.y + 0.45)) < 0.45) {
          p.vy = tr.power || 14.5;
          p.grounded = false;
          p.airJumpsRemaining = 1;
          const vis = this.trampolineMeshes.get(tr.id);
          if (vis) vis.bounce = 1;
          soundFX.playBounce();
          this.emitNetEvent('bounce');
          this.spawnParticles3D(tr.x, tr.y + 0.6, tr.z, '#FF80AB', 8);
        }
      }
    }

    // Stars & Coins
    for (const st of this.level.stars) {
      if (this.collectedStars.has(st.id)) continue;
      for (const p of [this.p1, this.p2]) {
        if (Math.hypot(p.x - st.x, p.y + 0.8 - st.y, p.z - st.z) < 0.95) {
          this.collectedStars.add(st.id);
          soundFX.playCollect();
          this.emitNetEvent('collect');
          this.spawnParticles3D(st.x, st.y, st.z, '#FFD54F', 12);
          break;
        }
      }
    }
    for (const cn of this.level.coins) {
      if (this.collectedCoins.has(cn.id)) continue;
      for (const p of [this.p1, this.p2]) {
        if (Math.hypot(p.x - cn.x, p.y + 0.8 - cn.y, p.z - cn.z) < 0.85) {
          this.collectedCoins.add(cn.id);
          soundFX.playCoin();
          this.emitNetEvent('coin');
          this.spawnParticles3D(cn.x, cn.y, cn.z, '#FFE082', 6);
          break;
        }
      }
    }

    // Checkpoints
    for (const cp of this.level.checkpoints) {
      if (this.activatedCheckpoints.has(cp.id)) continue;
      for (const p of [this.p1, this.p2]) {
        if (Math.hypot(p.x - cp.x, p.y - cp.y, p.z - cp.z) < 1.35) {
          this.activatedCheckpoints.add(cp.id);
          this.checkpointBannerTimer = 1.8;
          soundFX.playCheckpoint();
          this.emitNetEvent('checkpoint');
          this.spawnParticles3D(cp.x, cp.y + 1.4, cp.z, '#81C784', 12);
          break;
        }
      }
    }

    // Elemental Pools & Cacti
    for (const pl of this.level.pools) {
      for (const p of [this.p1, this.p2]) {
        const insideXZ = Math.abs(p.x - pl.x) < pl.w / 2 + 0.15 && Math.abs(p.z - pl.z) < pl.d / 2 + 0.15;
        if (insideXZ && Math.abs(p.y - pl.y) < 0.45) {
          if (pl.kind === 'pink_pool' && p.id === 'p1') continue;
          if (pl.kind === 'blue_pool' && p.id === 'p2') continue;
          this.respawnPlayer(p);
        }
      }
    }

    // Lasers hazard
    for (const las of this.level.lasers) {
      const len = this.getLaserLength(las);
      if (len <= 0.1) continue;
      const dirX = las.dir === '+x' ? 1 : las.dir === '-x' ? -1 : 0;
      const dirZ = las.dir === '+z' ? 1 : las.dir === '-z' ? -1 : 0;
      const x1 = Math.min(las.x, las.x + dirX * len);
      const x2 = Math.max(las.x, las.x + dirX * len);
      const z1 = Math.min(las.z, las.z + dirZ * len);
      const z2 = Math.max(las.z, las.z + dirZ * len);

      for (const p of [this.p1, this.p2]) {
        if (las.color === 'pink' && p.id === 'p1') continue;
        if (las.color === 'blue' && p.id === 'p2') continue;
        if (
          p.x + p.radius * 0.8 > x1 &&
          p.x - p.radius * 0.8 < x2 &&
          p.z + p.radius * 0.8 > z1 &&
          p.z - p.radius * 0.8 < z2 &&
          las.y > p.y &&
          las.y < p.y + p.height
        ) {
          this.respawnPlayer(p);
        }
      }
    }

    // Enemies bonk
    for (const en of this.enemies) {
      for (const p of [this.p1, this.p2]) {
        if (p.invulnTimer > 0) continue;
        if (Math.hypot(p.x - en.x, p.y + 0.6 - en.y, p.z - en.z) < 0.78) {
          p.dizzyTimer = 0.75;
          p.invulnTimer = 1.2;
          p.vy = 6.2;
          soundFX.playBonk();
          this.emitNetEvent('bonk');
          this.triggerShake(0.25, 0.22);
        }
      }
    }

    // Keys collection
    for (const k of this.level.keys || []) {
      if (this.collectedKeys.has(k.id)) continue;
      for (const p of [this.p1, this.p2]) {
        if (Math.hypot(p.x - k.x, p.y + 0.8 - k.y, p.z - k.z) < 0.95) {
          this.collectedKeys.add(k.id);
          this.activeLinks.add(k.linkId);
          soundFX.playCollect();
          this.emitNetEvent('collect');
          this.spawnParticles3D(k.x, k.y, k.z, '#FFD54F', 14);
          break;
        }
      }
    }

    // Teleporter pads
    for (const tp of this.level.teleporters || []) {
      for (const p of [this.p1, this.p2]) {
        if (p.teleportCooldown > 0) continue;
        if (Math.hypot(p.x - tp.x, p.z - tp.z) < 0.78 && Math.abs(p.y - tp.y) < 0.5) {
          p.x = tp.targetX;
          p.y = tp.targetY;
          p.z = tp.targetZ;
          p.vx = 0;
          p.vy = 0;
          p.vz = 0;
          p.teleportCooldown = 0.9;
          soundFX.playBounce();
          this.emitNetEvent('bounce');
          this.spawnParticles3D(tp.x, tp.y + 0.5, tp.z, '#E040FB', 10);
          this.spawnParticles3D(tp.targetX, tp.targetY + 0.5, tp.targetZ, '#E040FB', 10);
        }
      }
    }

    // Saws hazard
    for (const sw of this.saws) {
      if (sw.paused) continue;
      const r = sw.def.radius || 0.7;
      for (const p of [this.p1, this.p2]) {
        if (p.invulnTimer > 0) continue;
        const dXZ = Math.hypot(p.x - sw.x, p.z - sw.z);
        if (dXZ < r + p.radius * 0.65 && p.y < sw.def.y + r * 1.25 && p.y + p.height > sw.def.y) {
          this.respawnPlayer(p);
        }
      }
    }

    // Spikes hazard
    for (const sp of this.spikes) {
      if (sp.upFactor < 0.48) continue;
      const hw = (sp.def.w || 2.0) / 2;
      const hd = (sp.def.d || 2.0) / 2;
      for (const p of [this.p1, this.p2]) {
        if (p.invulnTimer > 0) continue;
        if (
          Math.abs(p.x - sp.def.x) < hw + 0.1 &&
          Math.abs(p.z - sp.def.z) < hd + 0.1 &&
          p.y >= sp.def.y - 0.2 &&
          p.y < sp.def.y + 0.55
        ) {
          this.respawnPlayer(p);
        }
      }
    }

    // Cannonballs hazard
    for (let i = this.cannonballs.length - 1; i >= 0; i--) {
      const cb = this.cannonballs[i];
      for (const p of [this.p1, this.p2]) {
        if (p.invulnTimer > 0) continue;
        if (Math.hypot(p.x - cb.x, p.y + 0.7 - cb.y, p.z - cb.z) < 0.62) {
          this.respawnPlayer(p);
          cb.life = 0;
          break;
        }
      }
    }

    // Water fall respawn
    for (const p of [this.p1, this.p2]) {
      if (p.y < this.level.waterY - 0.8) {
        this.respawnPlayer(p);
      }
    }
  }

  private updateObstacles3D(dt: number) {
    // 1. Saws movement along track
    for (const sw of this.saws) {
      sw.paused = Boolean(sw.def.linkId && this.activeLinks.has(sw.def.linkId));
      if (sw.paused) continue;
      const val = sw.def.axis === 'x' ? sw.x : sw.z;
      let next = val + sw.dir * sw.def.speed * dt;
      if (next >= sw.def.max) {
        next = sw.def.max;
        sw.dir = -1;
      } else if (next <= sw.def.min) {
        next = sw.def.min;
        sw.dir = 1;
      }
      if (sw.def.axis === 'x') sw.x = next;
      else sw.z = next;
    }

    // 2. Spikes cycle / switch state
    for (const sp of this.spikes) {
      if (sp.def.linkId) {
        const retracted = this.activeLinks.has(sp.def.linkId);
        sp.upFactor = THREE.MathUtils.damp(sp.upFactor, retracted ? 0 : 1, 14, dt);
        sp.warning = false;
      } else if (sp.def.cycleSeconds && sp.def.cycleSeconds > 0) {
        const cyc = sp.def.cycleSeconds;
        const phase = (this.worldTime + (sp.def.phase || 0)) % cyc;
        const ratio = phase / cyc;
        const target = ratio >= 0.55 ? 1 : 0;
        sp.warning = ratio >= 0.36 && ratio < 0.55;
        sp.upFactor = THREE.MathUtils.damp(sp.upFactor, target, 18, dt);
      }
    }

    // 3. Cannons fire + cannonballs update
    for (const can of this.cannons) {
      if (can.def.linkId && this.activeLinks.has(can.def.linkId)) continue;
      can.timer -= dt;
      if (can.timer <= 0) {
        can.timer = can.def.interval;
        const dirX = can.def.dir === '+x' ? 1 : can.def.dir === '-x' ? -1 : 0;
        const dirZ = can.def.dir === '+z' ? 1 : can.def.dir === '-z' ? -1 : 0;
        const m = new THREE.Mesh(this.cannonballGeo, this.cannonballMat);
        m.castShadow = true;
        const sx = can.def.x + dirX * 0.72;
        const sy = can.def.y + 0.65;
        const sz = can.def.z + dirZ * 0.72;
        m.position.set(sx, sy, sz);
        this.worldGroup.add(m);
        this.cannonballs.push({
          x: sx,
          y: sy,
          z: sz,
          vx: dirX * can.def.speed,
          vz: dirZ * can.def.speed,
          life: can.def.maxRange / Math.max(0.5, can.def.speed),
          mesh: m,
        });
        this.spawnParticles3D(sx, sy, sz, '#FFE0B2', 5);
      }
    }

    for (let i = this.cannonballs.length - 1; i >= 0; i--) {
      const cb = this.cannonballs[i];
      cb.life -= dt;
      cb.x += cb.vx * dt;
      cb.z += cb.vz * dt;

      // Blocked by Wooden Crates!
      let hit = cb.life <= 0;
      if (!hit) {
        for (const cr of this.crates) {
          const h = cr.size / 2 + 0.25;
          if (
            Math.abs(cb.x - cr.x) < h &&
            Math.abs(cb.z - cr.z) < h &&
            cb.y >= cr.y &&
            cb.y <= cr.y + cr.size
          ) {
            hit = true;
            this.spawnParticles3D(cb.x, cb.y, cb.z, '#D7CCC8', 6);
            break;
          }
        }
      }
      // Blocked by solid gate/wall
      if (!hit) {
        for (const blk of this.level.blocks) {
          if (!this.isBlockActive(blk)) continue;
          const b = this.getBlockCurrentBounds(blk);
          if (
            cb.y > b.minY + 0.05 &&
            cb.y < b.maxY - 0.05 &&
            cb.x + 0.25 > b.minX &&
            cb.x - 0.25 < b.maxX &&
            cb.z + 0.25 > b.minZ &&
            cb.z - 0.25 < b.maxZ
          ) {
            hit = true;
            this.spawnParticles3D(cb.x, cb.y, cb.z, '#CFD8DC', 5);
            break;
          }
        }
      }

      if (hit) {
        this.worldGroup.remove(cb.mesh);
        this.cannonballs.splice(i, 1);
      } else {
        cb.mesh.position.set(cb.x, cb.y, cb.z);
      }
    }
  }

  private respawnPlayer(p: PlayerRuntime3D) {
    soundFX.playSplash();
    this.emitNetEvent('splash');
    this.triggerShake(0.2, 0.18);
    this.spawnParticles3D(p.x, p.y + 0.5, p.z, '#B3E5FC', 10);

    const cpList = this.level.checkpoints.filter((c) => this.activatedCheckpoints.has(c.id));
    if (cpList.length > 0) {
      const last = cpList[cpList.length - 1];
      p.x = last.x + (p.id === 'p1' ? -0.45 : 0.45);
      p.y = last.y + 0.35;
      p.z = last.z;
    } else {
      p.x = p.lastSafeX;
      p.y = p.lastSafeY + 0.35;
      p.z = p.lastSafeZ;
    }
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
    p.airJumpsRemaining = 1;
    p.invulnTimer = 0.8;
  }

  private isAtGoal(p: PlayerRuntime3D, goal: { x: number; y: number; z: number }): boolean {
    return Math.hypot(p.x - goal.x, p.z - goal.z) < 1.15 && Math.abs(p.y - goal.y) < 1.2;
  }

  private syncVisuals(dt: number) {
    // Sync players
    const syncPlayerRig = (p: PlayerRuntime3D, rig: CharacterRig3D) => {
      rig.root.position.set(p.x, p.y, p.z);
      rig.bodyPivot.rotation.y = p.yaw;
      const speed = Math.hypot(p.vx, p.vz);
      let anim: AnimState = 'idle';
      if (p.dizzyTimer > 0) anim = 'dizzy';
      else if (p.pulledActive) anim = 'pulled';
      else if (p.onLadder || (!p.grounded && (p.wallNormalX !== 0 || p.wallNormalZ !== 0))) anim = 'wallSlide';
      else if (!p.grounded) anim = 'jump';
      else if (speed > 0.35) anim = 'walk';
      animateCharacter3D(rig, anim, this.worldTime, p.isPushing);

      // Hide shadow when falling far above nothing
      rig.shadowMesh.visible = p.grounded;
    };
    syncPlayerRig(this.p1, this.p1Rig);
    syncPlayerRig(this.p2, this.p2Rig);

    // Sync active-character subtle scale highlight or ring
    // Sync crates
    for (const cr of this.crates) {
      cr.mesh.position.set(cr.x, cr.y, cr.z);
    }

    // Sync boats & elevators
    for (const mv of this.movers.values()) {
      const bob = mv.id.includes('boat') ? Math.sin(this.worldTime * 2.8) * 0.04 : 0;
      mv.mesh.position.set(mv.x, mv.y + bob, mv.z);
    }

    // Sync bridges, gates & clouds
    for (const blk of this.level.blocks) {
      const mesh = this.blockMeshes.get(blk.id);
      if (!mesh) continue;
      if (blk.style === 'cloud') {
        const cl = this.clouds.get(blk.id);
        mesh.visible = !cl || cl.state !== 'gone';
        if (cl && cl.state === 'shaking') {
          mesh.position.x = blk.x + Math.sin(this.worldTime * 42) * 0.07;
        } else {
          mesh.position.x = blk.x;
        }
      } else if (blk.style === 'bridge' || blk.style === 'gate_wall') {
        mesh.visible = this.isBlockActive(blk);
      }
    }

    // Sync pressure plates
    for (const pl of this.level.plates) {
      const item = this.platePads.get(pl.id);
      if (!item) continue;
      const pressed = this.pressedPlates.has(pl.id);
      item.pad.position.y = THREE.MathUtils.damp(item.pad.position.y, pressed ? 0.05 : item.baseY, 18, dt);
    }

    // Sync levers
    for (const lv of this.level.levers) {
      const item = this.leverHandles.get(lv.id);
      if (!item) continue;
      const isOn = Boolean(this.leverStates.get(lv.id));
      item.handle.rotation.z = THREE.MathUtils.damp(item.handle.rotation.z, isOn ? -0.65 : 0.65, 14, dt);
      (item.orb.material as THREE.MeshStandardMaterial).color.set(isOn ? '#66BB6A' : '#FF7043');
      (item.orb.material as THREE.MeshStandardMaterial).emissive.set(isOn ? '#43A047' : '#FF5722');
    }

    // Sync lasers
    for (const lv of this.laserVisuals) {
      const len = this.getLaserLength(lv.def);
      const visible = len > 0.1;
      lv.beamMesh.visible = visible;
      lv.coreMesh.visible = visible;
      if (visible) {
        const dirX = lv.def.dir === '+x' ? 1 : lv.def.dir === '-x' ? -1 : 0;
        const dirZ = lv.def.dir === '+z' ? 1 : lv.def.dir === '-z' ? -1 : 0;
        const midX = lv.def.x + (dirX * len) / 2;
        const midZ = lv.def.z + (dirZ * len) / 2;
        for (const m of [lv.beamMesh, lv.coreMesh]) {
          m.position.set(midX, lv.def.y, midZ);
          m.scale.set(1, len, 1);
          m.rotation.set(dirZ !== 0 ? Math.PI / 2 : 0, 0, dirX !== 0 ? Math.PI / 2 : 0);
        }
      }
    }

    // Sync trampolines
    for (const tr of this.trampolineMeshes.values()) {
      if (tr.bounce > 0) tr.bounce = Math.max(0, tr.bounce - dt * 5);
      const sq = Math.sin(tr.bounce * Math.PI) * 0.28;
      tr.mesh.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    }

    // Sync enemies
    for (const en of this.enemies) {
      en.mesh.position.set(en.x, en.y, en.z);
      if (en.kind === 'seagull') {
        en.mesh.rotation.y = en.axis === 'x' ? (en.facing > 0 ? Math.PI / 2 : -Math.PI / 2) : en.facing > 0 ? 0 : Math.PI;
      }
    }

    // Sync stars, coins, doors & checkpoints
    for (const [id, grp] of this.starMeshes.entries()) {
      grp.visible = !this.collectedStars.has(id);
      if (grp.visible) {
        grp.rotation.y = this.worldTime * 2.2;
        grp.position.y += Math.sin(this.worldTime * 3.5 + grp.position.x) * 0.002;
      }
    }
    for (const [id, grp] of this.coinMeshes.entries()) {
      grp.visible = !this.collectedCoins.has(id);
      if (grp.visible) grp.rotation.y = this.worldTime * 3.2;
    }
    for (const [id, flag] of this.checkpointFlags.entries()) {
      const saved = this.activatedCheckpoints.has(id);
      (flag.material as THREE.MeshStandardMaterial).color.set(saved ? '#66BB6A' : '#FF80AB');
    }

    if (this.pinkDoorOrb) this.pinkDoorOrb.rotation.y = this.worldTime * 2;
    if (this.blueDoorOrb) this.blueDoorOrb.rotation.y = -this.worldTime * 2;

    // Sync Saws, Spikes, Keys, Teleporters & Conveyor Belts
    for (const sw of this.saws) {
      sw.discGroup.position.x = sw.x;
      sw.discGroup.position.z = sw.z;
      if (!sw.paused) {
        if (sw.def.axis === 'z') sw.discGroup.rotation.z += dt * 12 * sw.dir;
        else sw.discGroup.rotation.x += dt * 12 * sw.dir;
      }
    }
    for (const sp of this.spikes) {
      sp.spikesGroup.position.y = -0.45 + sp.upFactor * 0.45;
      sp.spikesGroup.visible = sp.upFactor > 0.06;
      if (sp.warning) {
        sp.plateMat.emissive.set('#FFB300');
        sp.plateMat.emissiveIntensity = 0.55;
      } else if (sp.upFactor > 0.48) {
        sp.plateMat.emissive.set('#EF5350');
        sp.plateMat.emissiveIntensity = 0.25;
      } else {
        sp.plateMat.emissive.set('#000000');
        sp.plateMat.emissiveIntensity = 0;
      }
    }
    for (const [id, grp] of this.keyMeshes.entries()) {
      grp.visible = !this.collectedKeys.has(id);
      if (grp.visible) grp.rotation.y = this.worldTime * 2.4;
    }
    for (const tp of this.teleporterMeshes) {
      tp.ring.rotation.z = this.worldTime * 2.6;
      tp.ring.position.y = 0.22 + Math.sin(this.worldTime * 4) * 0.06;
    }
    for (const cb of this.conveyorBelts) {
      const rev = cb.blk.reverseLinkId && this.activeLinks.has(cb.blk.reverseLinkId) ? -1 : 1;
      const fx = (cb.blk.flowX || 0) * rev;
      cb.beltMesh.rotation.y = fx < 0 ? Math.PI : 0;
      cb.tex.offset.x = (cb.tex.offset.x - Math.abs(fx) * 0.28 * dt) % 1;
    }

    // Optional 3D Tali Cinta
    if (this.tetherEnabled) {
      _v3A.set(this.p1.x, this.p1.y + 0.85, this.p1.z);
      _v3B.set(this.p2.x, this.p2.y + 0.85, this.p2.z);
      const dist = _v3A.distanceTo(_v3B);
      if (dist > 0.05) {
        this.tetherMesh.visible = true;
        _v3C.addVectors(_v3A, _v3B).multiplyScalar(0.5);
        this.tetherMesh.position.copy(_v3C);
        this.tetherMesh.scale.set(1, 1, dist);
        this.tetherMesh.lookAt(_v3B);
      } else {
        this.tetherMesh.visible = false;
      }
    } else {
      this.tetherMesh.visible = false;
    }
  }

  private updateCamera(dt: number) {
    let focusX = (this.p1.x + this.p2.x) * 0.5;
    let focusY = (this.p1.y + this.p2.y) * 0.5 + 1.0;
    let focusZ = (this.p1.z + this.p2.z) * 0.5;
    let desiredDist = 14.5;

    if (this.mode === 'PLAYING') {
      if (this.playMode === 'LDR_HOST' || this.playMode === 'LDR_GUEST') {
        const mine = this.myRole === 'p1' ? this.p1 : this.p2;
        focusX = mine.x;
        focusY = mine.y + 1.1;
        focusZ = mine.z;
        desiredDist = 11.5;
      } else if (this.localControlMode === 'solo_switch') {
        const active = this.activeLocalChar === 'p1' ? this.p1 : this.p2;
        focusX = active.x * 0.72 + focusX * 0.28;
        focusY = active.y + 1.1;
        focusZ = active.z * 0.72 + focusZ * 0.28;
        desiredDist = 12.0;
      } else {
        const sep = Math.hypot(this.p1.x - this.p2.x, this.p1.z - this.p2.z);
        desiredDist = THREE.MathUtils.clamp(11.5 + sep * 0.55, 11.5, 22);
      }
    }

    this.camTargetX = THREE.MathUtils.damp(this.camTargetX, focusX, 7, dt);
    this.camTargetY = THREE.MathUtils.damp(this.camTargetY, focusY, 7, dt);
    this.camTargetZ = THREE.MathUtils.damp(this.camTargetZ, focusZ, 7, dt);
    this.camDist = THREE.MathUtils.damp(this.camDist, desiredDist, 5, dt);

    const horiz = Math.cos(this.camPitch) * this.camDist;
    const vert = Math.sin(this.camPitch) * this.camDist;
    const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;
    const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;

    this.camera.position.set(
      this.camTargetX + Math.sin(this.camYaw) * horiz + shakeX,
      this.camTargetY + vert + shakeY,
      this.camTargetZ + Math.cos(this.camYaw) * horiz
    );
    this.camera.lookAt(this.camTargetX, this.camTargetY, this.camTargetZ);

    // Keep shadow frustum centered near players
    this.sunLight.position.set(this.camTargetX + 14, this.camTargetY + 24, this.camTargetZ + 16);
    this.sunLight.target.position.set(this.camTargetX, this.camTargetY, this.camTargetZ);
  }

  private spawnParticles3D(x: number, y: number, z: number, color: string, count: number) {
    if (this.particlePool.length === 0) return;
    const mat = this.getParticleMaterial(color);
    const n = Math.min(count, 10);
    for (let i = 0; i < n; i++) {
      const pt = this.particlePool[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % this.particlePool.length;
      pt.active = true;
      pt.mesh.material = mat;
      pt.mesh.visible = true;
      pt.mesh.position.set(x, y, z);
      pt.mesh.scale.setScalar(1);
      pt.vx = (Math.random() - 0.5) * 4.5;
      pt.vy = 1.5 + Math.random() * 4.0;
      pt.vz = (Math.random() - 0.5) * 4.5;
      pt.life = 0.5 + Math.random() * 0.25;
      pt.maxLife = 0.75;
    }
  }

  private updateParticles(dt: number) {
    for (let i = 0; i < this.particlePool.length; i++) {
      const pt = this.particlePool[i];
      if (!pt.active) continue;
      pt.life -= dt;
      if (pt.life <= 0) {
        pt.active = false;
        pt.mesh.visible = false;
      } else {
        pt.vy -= 12 * dt;
        pt.mesh.position.x += pt.vx * dt;
        pt.mesh.position.y += pt.vy * dt;
        pt.mesh.position.z += pt.vz * dt;
        const s = Math.max(0.05, pt.life / pt.maxLife);
        pt.mesh.scale.setScalar(s);
      }
    }
  }

  private triggerShake(intensity: number, duration: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  private emitNetEvent(eventName: string, payload?: unknown) {
    if (this.playMode === 'LDR_HOST') {
      this.onHostBroadcastEvent?.(eventName, payload);
    }
  }

  private exportSyncSnapshot(): NetworkSyncSnapshot3D {
    return {
      p1: {
        x: this.p1.x,
        y: this.p1.y,
        z: this.p1.z,
        vx: this.p1.vx,
        vy: this.p1.vy,
        vz: this.p1.vz,
        yaw: this.p1.yaw,
        grounded: this.p1.grounded,
        wallNormalX: this.p1.wallNormalX,
        wallNormalZ: this.p1.wallNormalZ,
        pulled: this.p1.pulledActive,
        dizzy: this.p1.dizzyTimer,
        pushing: this.p1.isPushing,
      },
      p2: {
        x: this.p2.x,
        y: this.p2.y,
        z: this.p2.z,
        vx: this.p2.vx,
        vy: this.p2.vy,
        vz: this.p2.vz,
        yaw: this.p2.yaw,
        grounded: this.p2.grounded,
        wallNormalX: this.p2.wallNormalX,
        wallNormalZ: this.p2.wallNormalZ,
        pulled: this.p2.pulledActive,
        dizzy: this.p2.dizzyTimer,
        pushing: this.p2.isPushing,
      },
      crates: this.crates.map((c) => ({ id: c.id, x: c.x, y: c.y, z: c.z })),
      movers: Array.from(this.movers.values()).map((m) => ({ id: m.id, x: m.x, y: m.y, z: m.z })),
      clouds: Array.from(this.clouds.values()).map((c) => ({ id: c.id, state: c.state, timer: c.timer })),
      enemies: this.enemies.map((e) => ({ id: e.id, x: e.x, y: e.y, z: e.z, facing: e.facing })),
      collectedStars: Array.from(this.collectedStars),
      collectedCoins: Array.from(this.collectedCoins),
      collectedKeys: Array.from(this.collectedKeys),
      activeLinks: Array.from(this.activeLinks),
      leverStates: Array.from(this.leverStates.entries()),
      timedLinks: Array.from(this.timedLinks.entries()),
      activatedCheckpoints: Array.from(this.activatedCheckpoints),
      saws: this.saws.map((s) => ({ id: s.def.id, x: s.x, z: s.z, paused: s.paused })),
      spikes: this.spikes.map((sp) => ({ id: sp.def.id, upFactor: sp.upFactor })),
      cannonballs: this.cannonballs.map((c) => ({ x: c.x, y: c.y, z: c.z })),
      tetherEnabled: this.tetherEnabled,
      elapsed: this.levelElapsed,
    };
  }

  private emitHud() {
    let p1Near = false;
    let p2Near = false;
    for (const lv of this.level.levers) {
      if (Math.hypot(this.p1.x - lv.x, this.p1.z - lv.z) < 1.35 && Math.abs(this.p1.y - lv.y) < 1.3) p1Near = true;
      if (Math.hypot(this.p2.x - lv.x, this.p2.z - lv.z) < 1.35 && Math.abs(this.p2.y - lv.y) < 1.3) p2Near = true;
    }

    const dist = Math.hypot(this.p1.x - this.p2.x, this.p1.y - this.p2.y, this.p1.z - this.p2.z);
    const tension = this.tetherEnabled ? Math.min(1, Math.max(0, (dist - TETHER_REST) / (TETHER_MAX - TETHER_REST))) : 0;

    const snapshot: HudSnapshot = {
      levelId: this.level.id,
      levelName: this.level.name,
      starsCollected: this.collectedStars.size,
      totalStars: this.level.stars.length,
      coinsCollected: this.collectedCoins.size,
      totalCoins: this.level.coins.length,
      elapsedSeconds: Math.floor(this.levelElapsed),
      p1AtGoal: this.isAtGoal(this.p1, this.level.goalPink),
      p2AtGoal: this.isAtGoal(this.p2, this.level.goalBlue),
      tetherTension: tension,
      rescueAlert: this.rescueBannerTimer > 0,
      checkpointSaved: this.checkpointBannerTimer > 0,
      nearLeverHint: p1Near && p2Near ? 'both' : p1Near ? 'p1' : p2Near ? 'p2' : null,
      activeLocalChar: this.activeLocalChar,
      localControlMode: this.localControlMode,
    };

    const sig = `${snapshot.levelId}|${snapshot.starsCollected}|${snapshot.coinsCollected}|${snapshot.elapsedSeconds}|${snapshot.p1AtGoal}|${snapshot.p2AtGoal}|${snapshot.tetherTension.toFixed(2)}|${snapshot.rescueAlert}|${snapshot.checkpointSaved}|${snapshot.nearLeverHint}|${snapshot.activeLocalChar}|${snapshot.localControlMode}`;
    if (sig === this.lastHudSignature) return;
    this.lastHudSignature = sig;
    this.onHudUpdate(snapshot);
  }

  // --- Events & Resize ---
  private handleResize = () => {
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(320, rect.width);
    const h = Math.max(240, rect.height);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  };

  private clearInputs = () => {
    this.keys.clear();
    this.inputP1 = { moveX: 0, moveZ: 0, jumpHeld: false, jumpPressedAt: -10, interactPressedAt: -10, camYaw: this.camYaw };
    this.inputP2 = { moveX: 0, moveZ: 0, jumpHeld: false, jumpPressedAt: -10, interactPressedAt: -10, camYaw: this.camYaw };
  };

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

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) {
      e.preventDefault();
    }

    const wasDown = this.keys.has(e.code);
    this.keys.add(e.code);

    if (this.playMode === 'LOCAL') {
      if ((e.code === 'Tab' || e.code === 'KeyC') && !wasDown && this.localControlMode === 'solo_switch') {
        this.switchActiveCharacter();
        return;
      }

      if (this.localControlMode === 'solo_switch') {
        const target = this.activeLocalChar === 'p1' ? this.inputP1 : this.inputP2;
        if ((e.code === 'Space' || e.code === 'KeyZ' || e.code === 'ShiftLeft') && !wasDown) {
          target.jumpPressedAt = this.worldTime;
        }
        if ((e.code === 'KeyF' || e.code === 'KeyG' || e.code === 'Enter') && !wasDown) {
          target.interactPressedAt = this.worldTime;
        }
      } else {
        if ((e.code === 'ShiftLeft' || e.code === 'KeyV' || e.code === 'KeyZ') && !wasDown) {
          this.inputP1.jumpPressedAt = this.worldTime;
        }
        if (e.code === 'KeyF' && !wasDown) {
          this.inputP1.interactPressedAt = this.worldTime;
        }
        if ((e.code === 'Space' || e.code === 'Slash' || e.code === 'Numpad0') && !wasDown) {
          this.inputP2.jumpPressedAt = this.worldTime;
        }
        if ((e.code === 'Enter' || e.code === 'KeyK') && !wasDown) {
          this.inputP2.interactPressedAt = this.worldTime;
        }
      }
    } else {
      // LDR Mode
      if ((e.code === 'Space' || e.code === 'KeyZ' || e.code === 'ShiftLeft') && !wasDown) {
        if (this.playMode === 'LDR_HOST') {
          const t = this.myRole === 'p1' ? this.inputP1 : this.inputP2;
          t.jumpPressedAt = this.worldTime;
        } else {
          this.guestPendingJump = true;
        }
      }
      if ((e.code === 'KeyF' || e.code === 'KeyG' || e.code === 'Enter') && !wasDown) {
        if (this.playMode === 'LDR_HOST') {
          const t = this.myRole === 'p1' ? this.inputP1 : this.inputP2;
          t.interactPressedAt = this.worldTime;
        } else {
          this.guestPendingInteract = true;
        }
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onPointerDown = (e: PointerEvent) => {
    this.isDraggingCam = true;
    this.dragPointerId = e.pointerId;
    this.dragLastX = e.clientX;
    this.dragLastY = e.clientY;
    try {
      this.renderer.domElement.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDraggingCam || e.pointerId !== this.dragPointerId) return;
    const dx = e.clientX - this.dragLastX;
    const dy = e.clientY - this.dragLastY;
    this.dragLastX = e.clientX;
    this.dragLastY = e.clientY;
    this.camYaw -= dx * 0.0075;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * 0.0055, 0.22, 1.18);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerId === this.dragPointerId) {
      this.isDraggingCam = false;
      this.dragPointerId = null;
    }
  };

  private onWheel = (e: WheelEvent) => {
    this.camDist = THREE.MathUtils.clamp(this.camDist + e.deltaY * 0.01, 7, 26);
  };

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('blur', this.clearInputs);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('pointercancel', this.onPointerUp);
    dom.addEventListener('wheel', this.onWheel, { passive: true });
  }

  private unbindEvents() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('blur', this.clearInputs);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('pointercancel', this.onPointerUp);
    dom.removeEventListener('wheel', this.onWheel);
  }
}
