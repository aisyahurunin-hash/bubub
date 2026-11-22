import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Download,
  Globe,
  Grid,
  Heart,
  Link2,
  Mic,
  MicOff,
  Music,
  Pause,
  Play,
  Radio,
  RotateCcw,
  RotateCw,
  Server,
  Shirt,
  Smartphone,
  Star,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { LdrRoomModal } from './components/LdrRoomModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { TouchControls } from './components/TouchControls';
import { WardrobeModal } from './components/WardrobeModal';
import { soundFX } from './game/audio';
import { LdrNetworkClient } from './game/ldrClient';
import {
  GameScreen,
  HudSnapshot,
  LdrRoomState,
  OutfitConfig,
  PlayMode,
  SaveProgress,
} from './game/types';
import { CoOpGameEngine3D } from './game3d/engine3d';
import { LEVELS_3D } from './game3d/levels3d';

const STORAGE_KEY = 'bubub_3d_save_v1';

const DEFAULT_SAVE: SaveProgress = {
  outfits: { girl: 'unnes', boy: 'pelayaran_putih' },
  starsByLevel: {},
  completedLevels: [],
  muted: false,
  bgmMuted: false,
  touchMode: false,
  tetherEnabled: false,
  localControlMode: 'solo_switch',
};

function loadSave(): SaveProgress {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem('bubub_save_v1') ||
      localStorage.getItem('tali_cinta_save_v1');
    if (!raw) return DEFAULT_SAVE;
    const parsed = JSON.parse(raw) as Partial<SaveProgress>;
    return {
      outfits: parsed.outfits || DEFAULT_SAVE.outfits,
      starsByLevel: parsed.starsByLevel || {},
      completedLevels: parsed.completedLevels || [],
      muted: Boolean(parsed.muted),
      bgmMuted: Boolean(parsed.bgmMuted),
      touchMode:
        typeof parsed.touchMode === 'boolean'
          ? parsed.touchMode
          : typeof window !== 'undefined' &&
            window.matchMedia?.('(pointer: coarse)').matches,
      tetherEnabled: Boolean(parsed.tetherEnabled),
      localControlMode:
        parsed.localControlMode === 'two_player' ? 'two_player' : 'solo_switch',
    };
  } catch {
    return DEFAULT_SAVE;
  }
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function App() {
  const [save, setSave] = useState<SaveProgress>(() => loadSave());
  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [playMode, setPlayMode] = useState<PlayMode>('LOCAL');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showLdrModal, setShowLdrModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadingMode, setDownloadingMode] = useState<'static' | 'full' | null>(null);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);
  const [victoryStats, setVictoryStats] = useState<{
    stars: number;
    coins: number;
    elapsed: number;
  } | null>(null);

  const [ldrRoom, setLdrRoom] = useState<LdrRoomState>({
    connected: false,
    code: null,
    isHost: false,
    myRole: 'p1',
    partnerJoined: false,
    partnerMicOn: false,
    statusMessage: '',
  });
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const [hud, setHud] = useState<HudSnapshot>({
    levelId: 1,
    levelName: LEVELS_3D[0].name,
    starsCollected: 0,
    totalStars: LEVELS_3D[0].stars.length,
    coinsCollected: 0,
    totalCoins: LEVELS_3D[0].coins.length,
    elapsedSeconds: 0,
    p1AtGoal: false,
    p2AtGoal: false,
    tetherTension: 0,
    rescueAlert: false,
    checkpointSaved: false,
    nearLeverHint: null,
    activeLocalChar: 'p1',
    localControlMode: 'solo_switch',
  });

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<CoOpGameEngine3D | null>(null);
  const ldrRef = useRef<LdrNetworkClient | null>(null);
  const ldrRoomRef = useRef(ldrRoom);
  ldrRoomRef.current = ldrRoom;

  // Persist save changes & sync audio + engine settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch {
      // Ignore quota errors
    }
    soundFX.setMuted(save.muted);
    soundFX.setBgmMuted(save.bgmMuted);
    engineRef.current?.setOutfits(save.outfits);
    engineRef.current?.setTetherEnabled(save.tetherEnabled);
    engineRef.current?.setLocalControlMode(save.localControlMode);
  }, [save]);

  // Mount Three.js 3D Engine + LDR WebSocket Client once
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const ldr = new LdrNetworkClient({
      onConnectionChange: (connected) => {
        setLdrRoom((prev) => ({ ...prev, connected }));
      },
      onRoomCreated: ({ code, role, levelId }) => {
        setPlayMode('LDR_HOST');
        setCurrentLevelId(levelId);
        setLdrRoom({
          connected: true,
          code,
          isHost: true,
          myRole: role,
          partnerJoined: false,
          partnerMicOn: false,
          statusMessage: '',
        });
        engineRef.current?.setNetworkConfig('LDR_HOST', role);
      },
      onRoomReady: ({ code, isHost, role, levelId, outfits }) => {
        const nextMode: PlayMode = isHost ? 'LDR_HOST' : 'LDR_GUEST';
        setPlayMode(nextMode);
        setCurrentLevelId(levelId);
        setSave((prev) => ({ ...prev, outfits }));
        setLdrRoom((prev) => ({
          ...prev,
          connected: true,
          code,
          isHost,
          myRole: role,
          partnerJoined: true,
          statusMessage: '',
        }));
        engineRef.current?.setNetworkConfig(nextMode, role);
      },
      onRolesUpdated: (role) => {
        setLdrRoom((prev) => {
          const nextMode: PlayMode = prev.isHost ? 'LDR_HOST' : 'LDR_GUEST';
          engineRef.current?.setNetworkConfig(nextMode, role);
          return { ...prev, myRole: role };
        });
      },
      onOutfitsUpdated: (outfits) => {
        setSave((prev) => ({ ...prev, outfits }));
      },
      onLevelStart: (levelId) => {
        setCurrentLevelId(levelId);
        setVictoryStats(null);
        setShowLdrModal(false);
        setShowLevelSelect(false);
        setShowWardrobe(false);
        setScreen('PLAYING');
        soundFX.unlockAndStartBgm();
        engineRef.current?.loadLevel(levelId, 'PLAYING');
      },
      onRemoteInput: (role, input) => {
        engineRef.current?.applyRemoteInput(role, input);
      },
      onStateSync: (state) => {
        engineRef.current?.applyRemoteSyncState(state);
      },
      onGameEvent: (eventName, payload) => {
        engineRef.current?.handleRemoteEvent(eventName, payload);
      },
      onPartnerLeft: (message) => {
        setLdrRoom((prev) => ({
          ...prev,
          partnerJoined: false,
          partnerMicOn: false,
          statusMessage: message,
        }));
      },
      onError: (message) => {
        setLdrRoom((prev) => ({ ...prev, statusMessage: message }));
      },
      onPartnerMicChange: (active) => {
        setLdrRoom((prev) => ({ ...prev, partnerMicOn: active }));
      },
      onLocalMicChange: (active, error) => {
        setMicActive(active);
        setMicError(error || null);
      },
    });

    ldrRef.current = ldr;

    const engine = new CoOpGameEngine3D(mountEl, save.outfits, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onLevelVictory: (stars, coins, elapsed) => {
        const lvl = engine.getCurrentLevelId();
        setVictoryStats({ stars, coins, elapsed });
        setScreen('VICTORY');
        setSave((prev) => {
          const prevStars = prev.starsByLevel[lvl] || 0;
          const completed = prev.completedLevels.includes(lvl)
            ? prev.completedLevels
            : [...prev.completedLevels, lvl];
          return {
            ...prev,
            starsByLevel: {
              ...prev.starsByLevel,
              [lvl]: Math.max(prevStars, stars),
            },
            completedLevels: completed,
          };
        });
      },
      onPauseToggle: () => {
        setScreen((prev) => {
          if (prev === 'PLAYING') {
            engine.setMode('PAUSED');
            return 'PAUSED';
          }
          if (prev === 'PAUSED') {
            engine.setMode('PLAYING');
            return 'PLAYING';
          }
          return prev;
        });
      },
      onHostBroadcastState: (state) => {
        ldr.sendStateSync(state);
      },
      onGuestSendInput: (input) => {
        ldr.sendInput(ldrRoomRef.current.myRole, input);
      },
      onHostBroadcastEvent: (eventName, payload) => {
        ldr.sendGameEvent(eventName, payload);
      },
    });

    engine.setTetherEnabled(save.tetherEnabled);
    engine.setLocalControlMode(save.localControlMode);
    engineRef.current = engine;
    engine.startLoop();

    return () => {
      engine.destroy();
      ldr.destroy();
      engineRef.current = null;
      ldrRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLevel = useCallback(
    (levelId: number, forceLocal = false) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      soundFX.unlockAndStartBgm();
      let modeToUse = playMode;
      if (forceLocal) {
        modeToUse = 'LOCAL';
        setPlayMode('LOCAL');
        engineRef.current?.setNetworkConfig('LOCAL', 'p1');
      }
      if (modeToUse === 'LDR_HOST') {
        ldrRef.current?.sendLevelStart(levelId);
      }
      setCurrentLevelId(levelId);
      setVictoryStats(null);
      setShowLevelSelect(false);
      setShowWardrobe(false);
      setShowLdrModal(false);
      setShowDownloadModal(false);
      setScreen('PLAYING');
      engineRef.current?.loadLevel(levelId, 'PLAYING');
    },
    [playMode]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen === 'TITLE' && !showWardrobe && !showLevelSelect && !showLdrModal && !showDownloadModal) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startLevel(currentLevelId, !ldrRoom.code);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, showWardrobe, showLevelSelect, showLdrModal, showDownloadModal, currentLevelId, ldrRoom.code, startLevel]);

  const handlePause = () => {
    if (screen === 'PLAYING') {
      engineRef.current?.setMode('PAUSED');
      setScreen('PAUSED');
    } else if (screen === 'PAUSED') {
      engineRef.current?.setMode('PLAYING');
      setScreen('PLAYING');
    }
  };

  const handleRestart = () => {
    if (playMode === 'LDR_GUEST') return;
    if (playMode === 'LDR_HOST') {
      ldrRef.current?.sendLevelStart(currentLevelId);
    }
    setVictoryStats(null);
    setScreen('PLAYING');
    engineRef.current?.loadLevel(currentLevelId, 'PLAYING');
  };

  const handleReturnTitle = () => {
    setShowWardrobe(false);
    setShowLevelSelect(false);
    setShowLdrModal(false);
    setVictoryStats(null);
    setScreen('TITLE');
    engineRef.current?.loadLevel(1, 'DIORAMA');
  };

  const updateOutfits = (outfits: OutfitConfig) => {
    setSave((prev) => ({ ...prev, outfits }));
    if (ldrRoom.code) {
      ldrRef.current?.sendOutfitUpdate(outfits);
    }
  };

  const toggleMute = () => {
    soundFX.unlockAndStartBgm();
    setSave((prev) => ({ ...prev, muted: !prev.muted }));
  };

  const toggleBgm = () => {
    soundFX.unlockAndStartBgm();
    setSave((prev) => ({ ...prev, bgmMuted: !prev.bgmMuted }));
  };

  const toggleTouchMode = () => {
    setSave((prev) => ({ ...prev, touchMode: !prev.touchMode }));
  };

  const toggleTether = () => {
    setSave((prev) => ({ ...prev, tetherEnabled: !prev.tetherEnabled }));
  };

  const toggleLocalControlMode = () => {
    setSave((prev) => ({
      ...prev,
      localControlMode:
        prev.localControlMode === 'solo_switch' ? 'two_player' : 'solo_switch',
    }));
  };

  const handleLeaveLdrRoom = () => {
    ldrRef.current?.leaveRoom();
    setPlayMode('LOCAL');
    engineRef.current?.setNetworkConfig('LOCAL', 'p1');
    setLdrRoom({
      connected: false,
      code: null,
      isHost: false,
      myRole: 'p1',
      partnerJoined: false,
      partnerMicOn: false,
      statusMessage: '',
    });
  };

  const handleDownloadZip = async (mode: 'static' | 'full') => {
    setDownloadingMode(mode);
    setDownloadFeedback(null);
    const filename =
      mode === 'static' ? 'bubub-3d-web-statis.zip' : 'bubub-3d-full-project.zip';
    try {
      const res = await fetch(`/api/download-zip?mode=${mode}&t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const ctype = res.headers.get('content-type') || '';
      if (!ctype.includes('zip') && !ctype.includes('octet-stream')) {
        throw new Error('Server tidak mengembalikan file ZIP (mungkin halaman berjalan dalam mode statis).');
      }
      const blob = await res.blob();
      if (blob.size < 512) {
        throw new Error('Ukuran file ZIP kosong atau tidak valid.');
      }
      const fileCount = res.headers.get('x-zip-files');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);

      const kb = Math.round(blob.size / 1024);
      setDownloadFeedback(
        `Berhasil mengunduh ${filename} (${fileCount ? `${fileCount} file · ` : ''}${kb} KB)! Ekstrak dulu isi ZIP sebelum upload ke GitHub.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunduh ZIP.';
      setDownloadFeedback(`Gagal mengunduh: ${msg}`);
    } finally {
      setDownloadingMode(null);
    }
  };

  const activeLevelDef = LEVELS_3D.find((l) => l.id === currentLevelId) || LEVELS_3D[0];
  const hasNextLevel = currentLevelId < LEVELS_3D.length;

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-[#E1F5FE]"
      onPointerDown={() => soundFX.unlockAndStartBgm()}
    >
      {/* Isolated Full-Viewport Three.js WebGL Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0" />

      {/* --- PLAYING HUD --- */}
      {screen === 'PLAYING' && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-2 p-2.5 sm:p-4">
          {/* Left: Level Info & Contextual Cues */}
          <div className="flex flex-col gap-1">
            <div className="pixel-box-sm bg-[#FFF8F0]/95 px-3 py-1.5 flex items-center gap-2.5">
              <span className="font-pixel text-xs sm:text-sm text-[#AD1457] whitespace-nowrap">
                Lv.{hud.levelId}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#4E342E] whitespace-nowrap">
                {hud.levelName}
              </span>
              {ldrRoom.code ? (
                <span className="font-pixel text-[11px] text-[#0277BD] whitespace-nowrap">
                  · LDR {ldrRoom.code} ({ldrRoom.myRole === 'p1' ? 'Isol' : 'Salman'})
                </span>
              ) : (
                <span className="font-pixel text-[11px] text-[#5D4037] whitespace-nowrap">
                  ·{' '}
                  {hud.localControlMode === 'solo_switch'
                    ? `Aktif: ${hud.activeLocalChar === 'p1' ? 'Isol' : 'Salman'}`
                    : '2 Orang'}
                </span>
              )}
            </div>

            {hud.checkpointSaved && (
              <div className="pixel-box-sm bg-[#C8E6C9] px-2.5 py-1 text-xs font-pixel text-[#1B5E20] self-start">
                Checkpoint Tersimpan!
              </div>
            )}
            {!hud.checkpointSaved && hud.rescueAlert && (
              <div className="pixel-box-sm bg-[#FCE4EC] px-2.5 py-1 text-xs font-pixel text-[#C2185B] self-start">
                Tali Cinta Menahan Pasangan!
              </div>
            )}
            {!hud.checkpointSaved && !hud.rescueAlert && hud.nearLeverHint && (
              <div className="pixel-box-sm bg-[#DCEDC8] px-2.5 py-1 text-xs font-pixel text-[#33691E] self-start">
                Tekan F / Tombol Tangan untuk tarik tuas!
              </div>
            )}
            {!hud.checkpointSaved && !hud.rescueAlert && !hud.nearLeverHint && hud.p1AtGoal !== hud.p2AtGoal && (
              <div className="pixel-box-sm bg-[#FFF3E0] px-2.5 py-1 text-xs font-medium text-[#5D4037] self-start">
                {hud.p1AtGoal ? 'Isol' : 'Salman'} menunggu di pintu finis!
              </div>
            )}
            {!hud.checkpointSaved && !hud.rescueAlert && !hud.nearLeverHint && hud.p1AtGoal === hud.p2AtGoal && activeLevelDef.hint && (
              <div className="hidden md:block bg-[#FFF8F0]/90 border-2 border-[#5D4037] px-2.5 py-1 text-xs text-[#5D4037] max-w-md">
                {activeLevelDef.hint}
              </div>
            )}
          </div>

          {/* Right: Stats + Utility Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="pixel-box-sm bg-[#FFF8F0]/95 px-3 py-1.5 flex items-center gap-2.5 tabular-nums">
              <div className="flex items-center gap-1 font-pixel text-xs sm:text-sm text-[#4E342E]" title="Bintang Hati">
                <Star className="w-4 h-4 fill-[#FFD54F] text-[#5D4037]" />
                <span>
                  {hud.starsCollected}/{hud.totalStars}
                </span>
              </div>
              <span className="text-[#BCAAA4]" aria-hidden="true">·</span>
              <div className="flex items-center gap-1 font-pixel text-xs sm:text-sm text-[#AD1457]" title="Koin Cinta">
                <span className="inline-block w-3 h-3 rounded-full bg-[#FFD54F] border border-[#5D4037]" />
                <span>
                  {hud.coinsCollected}/{hud.totalCoins}
                </span>
              </div>
              <span className="text-[#BCAAA4]" aria-hidden="true">·</span>
              <span className="font-pixel text-xs sm:text-sm text-[#5D4037]">
                {formatTime(hud.elapsedSeconds)}
              </span>
            </div>

            <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
              {/* Switch Character Button (Local Solo Switch mode) */}
              {playMode === 'LOCAL' && hud.localControlMode === 'solo_switch' && (
                <button
                  type="button"
                  onClick={() => engineRef.current?.switchActiveCharacter()}
                  title="Ganti Karakter (Tab / C)"
                  className={`pixel-btn px-2.5 py-2 flex items-center gap-1.5 text-xs font-pixel cursor-pointer ${
                    hud.activeLocalChar === 'p1'
                      ? 'bg-[#F8BBD0] text-[#880E4F]'
                      : 'bg-[#B3E5FC] text-[#01579B]'
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>{hud.activeLocalChar === 'p1' ? 'Isol' : 'Salman'}</span>
                </button>
              )}

              {/* Camera Rotate Step Buttons */}
              <button
                type="button"
                onClick={() => engineRef.current?.rotateCameraStep(-Math.PI / 4)}
                title="Putar Kamera Kiri (Q)"
                aria-label="Putar Kamera Kiri"
                className="pixel-btn bg-[#FFF8F0] p-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#4E342E]" />
              </button>
              <button
                type="button"
                onClick={() => engineRef.current?.rotateCameraStep(Math.PI / 4)}
                title="Putar Kamera Kanan (E)"
                aria-label="Putar Kamera Kanan"
                className="pixel-btn bg-[#FFF8F0] p-2 cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-[#4E342E]" />
              </button>

              {ldrRoom.code && (
                <button
                  type="button"
                  onClick={() => ldrRef.current?.toggleMic()}
                  title={micActive ? 'Matikan Mikrofon' : 'Nyalakan Mikrofon (Voice Chat)'}
                  aria-label="Toggle Mikrofon"
                  className={`pixel-btn px-2.5 py-2 flex items-center gap-1 text-xs font-pixel cursor-pointer ${
                    micActive ? 'bg-[#A5D6A7] text-[#1B5E20]' : 'bg-[#FFF8F0] text-[#4E342E]'
                  }`}
                >
                  {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">{micActive ? 'Mic ON' : 'Mic'}</span>
                </button>
              )}

              {playMode !== 'LDR_GUEST' && (
                <button
                  type="button"
                  onClick={toggleTether}
                  title={save.tetherEnabled ? 'Tali Cinta Aktif' : 'Tali Cinta Mati'}
                  aria-label="Toggle Tali Cinta"
                  className={`pixel-btn px-2 py-2 flex items-center gap-1 text-xs font-pixel cursor-pointer ${
                    save.tetherEnabled ? 'bg-[#F8BBD0] text-[#880E4F]' : 'bg-[#FFF8F0] text-[#795548]'
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  <span className="hidden lg:inline">{save.tetherEnabled ? 'Tali ON' : 'Tali OFF'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={toggleTouchMode}
                title="Mode Layar Sentuh"
                aria-label="Mode Layar Sentuh"
                className={`pixel-btn p-2 cursor-pointer ${
                  save.touchMode ? 'bg-[#81D4FA]' : 'bg-[#FFF8F0]'
                }`}
              >
                <Smartphone className="w-4 h-4 text-[#4E342E]" />
              </button>
              <button
                type="button"
                onClick={toggleBgm}
                title={save.bgmMuted ? 'Nyalakan Backsound Lagu' : 'Matikan Backsound Lagu'}
                aria-label="Toggle Musik"
                className={`pixel-btn p-2 cursor-pointer ${
                  !save.bgmMuted && !save.muted ? 'bg-[#FCE4EC]' : 'bg-[#FFF8F0]'
                }`}
              >
                <Music className="w-4 h-4 text-[#4E342E]" />
              </button>
              <button
                type="button"
                onClick={toggleMute}
                title={save.muted ? 'Nyalakan Semua Suara' : 'Bisukan Semua Suara'}
                aria-label="Toggle Suara"
                className="pixel-btn bg-[#FFF8F0] p-2 cursor-pointer"
              >
                {save.muted ? (
                  <VolumeX className="w-4 h-4 text-[#4E342E]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#4E342E]" />
                )}
              </button>
              {playMode !== 'LDR_GUEST' && (
                <button
                  type="button"
                  onClick={handleRestart}
                  title="Ulangi Level (R)"
                  aria-label="Ulangi Level"
                  className="pixel-btn bg-[#FFF3E0] p-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-[#4E342E]" />
                </button>
              )}
              <button
                type="button"
                onClick={handlePause}
                title="Jeda (Esc)"
                aria-label="Jeda"
                className="pixel-btn bg-[#F8BBD0] p-2 cursor-pointer"
              >
                <Pause className="w-4 h-4 text-[#4E342E]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VIRTUAL TOUCH CONTROLS --- */}
      {screen === 'PLAYING' && save.touchMode && !showWardrobe && !showLevelSelect && !showLdrModal && (
        <TouchControls
          singlePlayerRole={playMode === 'LOCAL' ? null : ldrRoom.myRole}
          localControlMode={hud.localControlMode}
          activeLocalChar={hud.activeLocalChar}
          nearLeverHint={hud.nearLeverHint}
          onSwitchChar={() => engineRef.current?.switchActiveCharacter()}
          onInput={(player, action, pressed) =>
            engineRef.current?.setTouchInput(player, action, pressed)
          }
        />
      )}

      {/* --- TITLE SCREEN OVERLAY --- */}
      {screen === 'TITLE' && (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-between p-4 sm:p-8 pointer-events-none">
          <div className="w-full flex flex-wrap items-center justify-end gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={toggleLocalControlMode}
              className="pixel-btn bg-[#FFF3E0] px-3 py-1.5 text-xs font-semibold text-[#4E342E] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>
                Kontrol: {save.localControlMode === 'solo_switch' ? 'Gantian (1 Pemain)' : '2 Orang 1 Keyboard'}
              </span>
            </button>
            <button
              type="button"
              onClick={toggleTether}
              className={`pixel-btn px-3 py-1.5 text-xs font-semibold text-[#4E342E] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                save.tetherEnabled ? 'bg-[#F8BBD0]' : 'bg-[#FFF8F0]'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Tali Cinta: {save.tetherEnabled ? 'ON' : 'OFF'}</span>
            </button>
            <button
              type="button"
              onClick={toggleTouchMode}
              className={`pixel-btn px-3 py-1.5 text-xs font-semibold text-[#4E342E] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                save.touchMode ? 'bg-[#B3E5FC]' : 'bg-[#FFF8F0]'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Sentuh: {save.touchMode ? 'ON' : 'OFF'}</span>
            </button>
            <button
              type="button"
              onClick={toggleBgm}
              className={`pixel-btn px-3 py-1.5 text-xs font-semibold text-[#4E342E] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                !save.bgmMuted && !save.muted ? 'bg-[#FCE4EC]' : 'bg-[#FFF8F0]'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Musik: {save.bgmMuted ? 'OFF' : 'ON'}</span>
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="pixel-btn bg-[#FFF8F0] px-3 py-1.5 text-xs font-semibold text-[#4E342E] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {save.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{save.muted ? 'Bisukan' : 'Suara ON'}</span>
            </button>
          </div>

          <div className="pointer-events-auto flex flex-col items-center text-center max-w-2xl my-auto">
            <h1 className="font-pixel text-4xl sm:text-6xl text-[#4E342E] tracking-tight leading-none drop-shadow-[0_3px_0_#FFFFFF]">
              BUBUB 3D
            </h1>
            <p className="mt-2 font-semibold text-sm sm:text-base text-[#5D4037] bg-[#FFF8F0]/90 px-3.5 py-1 border-2 border-[#5D4037]">
              Petualangan Isol &amp; Salman · Mode LDR + Voice Chat &amp; 1 Layar
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={() => startLevel(currentLevelId, true)}
                className="pixel-btn bg-[#FF80AB] text-white px-5 py-3 font-pixel text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Main 3D</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.unlockAndStartBgm();
                  setShowLdrModal(true);
                }}
                className="pixel-btn bg-[#81D4FA] text-[#4E342E] px-5 py-3 font-pixel text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                <span>{ldrRoom.code ? `Room LDR: ${ldrRoom.code}` : 'Main LDR (Kode & Mic)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.unlockAndStartBgm();
                  setShowWardrobe(true);
                }}
                className="pixel-btn bg-[#FFD54F] text-[#4E342E] px-5 py-3 font-pixel text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Shirt className="w-4 h-4" />
                <span>Wardrobe 3D</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.unlockAndStartBgm();
                  setShowLevelSelect(true);
                }}
                className="pixel-btn bg-[#FFF3E0] text-[#4E342E] px-5 py-3 font-pixel text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Grid className="w-4 h-4" />
                <span>{LEVELS_3D.length} Level 3D</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.unlockAndStartBgm();
                  setShowDownloadModal(true);
                }}
                className="pixel-btn bg-[#C8E6C9] text-[#1B5E20] px-4 py-3 font-pixel text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download ZIP</span>
              </button>
            </div>
          </div>

          <div className="bg-[#FFF8F0]/90 border-2 border-[#5D4037] px-4 py-1.5 text-xs sm:text-sm text-[#4E342E] text-center">
            Gerak: W A S D / Panah · Lompat &amp; Double Jump: Spasi (2x) / Z · Tarik Tuas: F · Ganti Isol/Salman: Tab · Putar Kamera: Q / E / Geser
          </div>
        </div>
      )}

      {/* --- PAUSE MODAL --- */}
      {screen === 'PAUSED' && !showWardrobe && !showLevelSelect && !showLdrModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#4E342E]/45 p-4">
          <div className="pixel-box bg-[#FFF8F0] w-full max-w-sm p-6 text-center">
            <h2 className="font-pixel text-xl text-[#4E342E]">Permainan Dijeda</h2>
            <p className="mt-1 text-sm text-[#795548]">
              Level {currentLevelId} · {activeLevelDef.name}
            </p>

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handlePause}
                className="pixel-btn bg-[#FF80AB] text-white py-2.5 px-4 font-pixel text-sm cursor-pointer"
              >
                Lanjutkan
              </button>
              {playMode !== 'LDR_GUEST' && (
                <button
                  type="button"
                  onClick={handleRestart}
                  className="pixel-btn bg-[#FFF3E0] text-[#4E342E] py-2.5 px-4 font-semibold text-sm cursor-pointer"
                >
                  Ulangi Level
                </button>
              )}
              {playMode === 'LOCAL' && (
                <button
                  type="button"
                  onClick={toggleLocalControlMode}
                  className="pixel-btn bg-[#E1F5FE] text-[#4E342E] py-2.5 px-4 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>
                    Kontrol: {save.localControlMode === 'solo_switch' ? 'Gantian (1 Pemain)' : '2 Orang 1 Keyboard'}
                  </span>
                </button>
              )}
              {ldrRoom.code && (
                <button
                  type="button"
                  onClick={() => setShowLdrModal(true)}
                  className="pixel-btn bg-[#81D4FA] text-[#4E342E] py-2.5 px-4 font-semibold text-sm cursor-pointer"
                >
                  Room LDR &amp; Mikrofon
                </button>
              )}
              {playMode !== 'LDR_GUEST' && (
                <button
                  type="button"
                  onClick={toggleTether}
                  className={`pixel-btn text-[#4E342E] py-2.5 px-4 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer ${
                    save.tetherEnabled ? 'bg-[#F8BBD0]' : 'bg-[#FFF3E0]'
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  <span>Tali Cinta: {save.tetherEnabled ? 'ON' : 'OFF'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowWardrobe(true)}
                className="pixel-btn bg-[#FFD54F] text-[#4E342E] py-2.5 px-4 font-semibold text-sm cursor-pointer"
              >
                Wardrobe 3D / Ganti Baju
              </button>
              {playMode !== 'LDR_GUEST' && (
                <button
                  type="button"
                  onClick={() => setShowLevelSelect(true)}
                  className="pixel-btn bg-[#B3E5FC] text-[#4E342E] py-2.5 px-4 font-semibold text-sm cursor-pointer"
                >
                  Pilih Level Lain
                </button>
              )}
              <button
                type="button"
                onClick={handleReturnTitle}
                className="pixel-btn bg-white text-[#5D4037] py-2 px-4 text-sm cursor-pointer"
              >
                Kembali ke Menu Utama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VICTORY MODAL --- */}
      {screen === 'VICTORY' && victoryStats && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#4E342E]/45 p-4">
          <div className="pixel-box bg-[#FFF8F0] w-full max-w-md p-6 text-center">
            <div className="flex justify-center mb-2">
              <Heart className="w-8 h-8 fill-[#FF80AB] text-[#5D4037]" />
            </div>
            <h2 className="font-pixel text-xl sm:text-2xl text-[#4E342E]">
              Level {currentLevelId} Selesai!
            </h2>
            <p className="mt-1 text-sm text-[#795548]">
              {activeLevelDef.name} — Kerja sama yang manis!
            </p>

            <div className="mt-4 flex items-center justify-center gap-3">
              {[1, 2, 3].map((idx) => (
                <Star
                  key={idx}
                  className={`w-10 h-10 ${
                    idx <= victoryStats.stars
                      ? 'fill-[#FFD54F] text-[#5D4037]'
                      : 'fill-[#EFEBE9] text-[#BCAAA4]'
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 font-pixel text-xs text-[#5D4037] tabular-nums">
              Bintang: {victoryStats.stars}/3 · Koin: {victoryStats.coins} · Waktu: {formatTime(Math.floor(victoryStats.elapsed))}
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              {playMode !== 'LDR_GUEST' && hasNextLevel && (
                <button
                  type="button"
                  onClick={() => startLevel(currentLevelId + 1)}
                  className="pixel-btn bg-[#FF80AB] text-white py-3 px-4 font-pixel text-sm cursor-pointer"
                >
                  Level Berikutnya (#{currentLevelId + 1})
                </button>
              )}
              {playMode === 'LDR_GUEST' && hasNextLevel && (
                <div className="bg-[#E1F5FE] border-2 border-[#5D4037] p-2.5 text-xs text-[#0277BD]">
                  Menunggu pasangan (Host) melanjutkan ke level berikutnya...
                </div>
              )}
              {!hasNextLevel && (
                <div className="bg-[#FCE4EC] border-2 border-[#5D4037] p-3 text-sm font-semibold text-[#AD1457]">
                  Selamat! Kalian telah menamatkan semua {LEVELS_3D.length} level BUBUB 3D!
                </div>
              )}

              {playMode !== 'LDR_GUEST' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="pixel-btn bg-[#FFF3E0] text-[#4E342E] py-2.5 px-3 font-semibold text-sm cursor-pointer"
                  >
                    Main Lagi
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLevelSelect(true)}
                    className="pixel-btn bg-[#B3E5FC] text-[#4E342E] py-2.5 px-3 font-semibold text-sm cursor-pointer"
                  >
                    Pilih Level
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={handleReturnTitle}
                className="pixel-btn bg-white text-[#5D4037] py-2 px-4 text-sm cursor-pointer"
              >
                Menu Utama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LDR ROOM MODAL --- */}
      {showLdrModal && (
        <LdrRoomModal
          room={ldrRoom}
          micActive={micActive}
          micError={micError}
          onCreateRoom={() => ldrRef.current?.createRoom(currentLevelId, save.outfits)}
          onJoinRoom={(code) => ldrRef.current?.joinRoom(code, save.outfits)}
          onLeaveRoom={handleLeaveLdrRoom}
          onSwapRoles={() => ldrRef.current?.swapRoles()}
          onToggleMic={() => ldrRef.current?.toggleMic()}
          onStartLdrGame={() => startLevel(currentLevelId, false)}
          onClose={() => setShowLdrModal(false)}
        />
      )}

      {/* --- WARDROBE 3D MODAL --- */}
      {showWardrobe && (
        <WardrobeModal
          outfits={save.outfits}
          onChange={updateOutfits}
          onClose={() => setShowWardrobe(false)}
        />
      )}

      {/* --- LEVEL SELECTOR MODAL --- */}
      {showLevelSelect && (
        <LevelSelectModal
          currentLevelId={currentLevelId}
          starsByLevel={save.starsByLevel}
          completedLevels={save.completedLevels}
          onSelectLevel={(id) => startLevel(id, !ldrRoom.code)}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {/* --- DOWNLOAD HOSTING ZIP MODAL --- */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#4E342E]/45 p-3 sm:p-6">
          <div className="pixel-box w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#FFF8F0] p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b-2 border-[#E6CEB2] pb-3">
              <div>
                <h2 className="font-pixel text-lg sm:text-xl text-[#4E342E]">
                  Download ZIP untuk GitHub &amp; Hosting
                </h2>
                <p className="text-sm text-[#795548]">
                  Pilih paket ZIP BUBUB 3D (Isol &amp; Salman) sesuai cara hosting kamu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="pixel-btn bg-[#F8BBD0] px-3 py-2 text-sm font-semibold text-[#4E342E] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Tutup</span>
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3.5">
              <div className="bg-[#FCE4EC]/75 border-2 border-[#5D4037] p-4">
                <div className="flex items-center gap-2 font-pixel text-sm text-[#4E342E]">
                  <Globe className="w-4 h-4 text-[#AD1457]" />
                  <span>1. Paket Siap GitHub Pages / Netlify (dist/)</span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#5D4037]">
                  Paling praktis! Ekstrak ZIP ini, lalu upload semua isinya (`index.html` &amp; `assets/`) ke repo GitHub dan aktifkan <strong>Settings → Pages → Branch main / root</strong> (atau drag ke Netlify Drop).
                </p>
                <button
                  type="button"
                  disabled={downloadingMode !== null}
                  onClick={() => handleDownloadZip('static')}
                  className="mt-3 w-full pixel-btn bg-[#FF80AB] text-white px-4 py-2.5 font-pixel text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloadingMode === 'static'
                      ? 'Menyiapkan ZIP Statis...'
                      : 'Download Web Statis (.zip)'}
                  </span>
                </button>
              </div>

              <div className="bg-[#E1F5FE]/80 border-2 border-[#5D4037] p-4">
                <div className="flex items-center gap-2 font-pixel text-sm text-[#4E342E]">
                  <Server className="w-4 h-4 text-[#0277BD]" />
                  <span>2. Full Project Source + GitHub Actions &amp; Server LDR</span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#5D4037]">
                  Berisi seluruh kode sumber (`src/`, `server.ts`, `package.json`, `.github/workflows/deploy.yml`, `README.md`). Ekstrak ZIP lalu upload ke GitHub dan pilih <strong>Settings → Pages → GitHub Actions</strong>, atau jalankan server LDR di Render/Railway.
                </p>
                <button
                  type="button"
                  disabled={downloadingMode !== null}
                  onClick={() => handleDownloadZip('full')}
                  className="mt-3 w-full pixel-btn bg-[#81D4FA] text-[#4E342E] px-4 py-2.5 font-pixel text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloadingMode === 'full'
                      ? 'Menyiapkan Full Project ZIP...'
                      : 'Download Full Project (.zip)'}
                  </span>
                </button>
              </div>

              {downloadFeedback && (
                <div className="bg-[#FFF3E0] border-2 border-[#5D4037] p-3 text-xs sm:text-sm text-[#4E342E]">
                  {downloadFeedback}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
