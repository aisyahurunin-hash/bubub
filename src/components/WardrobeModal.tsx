import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Sparkles, X } from 'lucide-react';
import { soundFX } from '../game/audio';
import { BOY_OUTFITS, GIRL_OUTFITS } from '../game/sprites';
import { AnimState, BoyOutfitId, GirlOutfitId, OutfitConfig } from '../game/types';
import {
  CharacterRig3D,
  animateCharacter3D,
  buildBoyCharacter3D,
  buildGirlCharacter3D,
} from '../game3d/characters';

interface WardrobeModalProps {
  outfits: OutfitConfig;
  onChange: (next: OutfitConfig) => void;
  onClose: () => void;
}

export const WardrobeModal: React.FC<WardrobeModalProps> = ({
  outfits,
  onChange,
  onClose,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [previewAnim, setPreviewAnim] = useState<AnimState>('idle');
  const animRef = useRef<AnimState>('idle');
  animRef.current = previewAnim;

  const rigsRef = useRef<{
    scene: THREE.Scene;
    turntable: THREE.Group;
    girl: CharacterRig3D;
    boy: CharacterRig3D;
  } | null>(null);
  const outfitsRef = useRef(outfits);
  outfitsRef.current = outfits;

  const rotYRef = useRef(0.15);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);

  // Mount mini 3D Wardrobe Studio once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    const dbg = gl?.getExtension('WEBGL_debug_renderer_info');
    const rawRenderer = dbg && gl ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    const isSoftware = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rawRenderer);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();

    const renderer = new THREE.WebGLRenderer({ antialias: !isSoftware, alpha: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftware ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 340, container.clientHeight || 200, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#E1F5FE');

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      36,
      (container.clientWidth || 340) / (container.clientHeight || 200),
      0.1,
      50
    );
    camera.position.set(0, 1.35, 4.1);
    camera.lookAt(0, 0.85, 0);

    const hemi = new THREE.HemisphereLight('#FFF8F0', '#F8BBD0', 0.9);
    const key = new THREE.DirectionalLight('#FFFDE7', 1.6);
    key.position.set(3, 5, 4);
    scene.add(hemi, key);

    const turntable = new THREE.Group();
    scene.add(turntable);

    // Cute pastel podium rug
    const podiumGeo = new THREE.CylinderGeometry(1.45, 1.55, 0.14, 28);
    const podiumMat = new THREE.MeshStandardMaterial({ color: '#F8BBD0', roughness: 0.75 });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.y = -0.07;
    const trimGeo = new THREE.CylinderGeometry(1.32, 1.32, 0.16, 28);
    const trimMat = new THREE.MeshStandardMaterial({ color: '#FFF3E0', roughness: 0.8 });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = -0.06;
    turntable.add(podium, trim);

    const girl = buildGirlCharacter3D(outfitsRef.current.girl);
    girl.root.position.set(-0.58, 0, 0);
    girl.root.rotation.y = 0.25;

    const boy = buildBoyCharacter3D(outfitsRef.current.boy);
    boy.root.position.set(0.58, 0, 0);
    boy.root.rotation.y = -0.25;

    turntable.add(girl.root, boy.root);
    rigsRef.current = { scene, turntable, girl, boy };

    let raf = 0;
    let disposed = false;
    const start = performance.now();
    const tick = (now: number) => {
      if (disposed) return;
      const t = (now - start) / 1000;
      const cur = rigsRef.current;
      if (cur) {
        if (!draggingRef.current) {
          rotYRef.current = Math.sin(t * 0.65) * 0.35;
        }
        cur.turntable.rotation.y = rotYRef.current;
        animateCharacter3D(cur.girl, animRef.current, t);
        animateCharacter3D(cur.boy, animRef.current, t + 0.4);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      rigsRef.current?.girl.dispose();
      rigsRef.current?.boy.dispose();
      rigsRef.current = null;
      podiumGeo.dispose();
      podiumMat.dispose();
      trimGeo.dispose();
      trimMat.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Rebuild 3D meshes smoothly when outfits change
  useEffect(() => {
    const cur = rigsRef.current;
    if (!cur) return;
    cur.turntable.remove(cur.girl.root);
    cur.turntable.remove(cur.boy.root);
    cur.girl.dispose();
    cur.boy.dispose();

    const nextGirl = buildGirlCharacter3D(outfits.girl);
    nextGirl.root.position.set(-0.58, 0, 0);
    nextGirl.root.rotation.y = 0.25;

    const nextBoy = buildBoyCharacter3D(outfits.boy);
    nextBoy.root.position.set(0.58, 0, 0);
    nextBoy.root.rotation.y = -0.25;

    cur.turntable.add(nextGirl.root, nextBoy.root);
    cur.girl = nextGirl;
    cur.boy = nextBoy;
  }, [outfits.girl, outfits.boy]);

  const selectGirl = (girl: GirlOutfitId) => {
    soundFX.playWardrobe();
    onChange({ ...outfits, girl });
  };

  const selectBoy = (boy: BoyOutfitId) => {
    soundFX.playWardrobe();
    onChange({ ...outfits, boy });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#4E342E]/45 p-3 sm:p-6">
      <div className="pixel-box w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#FFF8F0] p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b-2 border-[#E6CEB2] pb-3">
          <div>
            <h2 className="font-pixel text-lg sm:text-xl text-[#4E342E]">
              Ruang Ganti Baju 3D
            </h2>
            <p className="text-sm text-[#795548]">
              Pilih outfit pasanganmu &amp; geser pratinjau untuk memutar karakter 3D!
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn bg-[#F8BBD0] px-3 py-2 text-sm font-semibold text-[#4E342E] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="Tutup Ruang Ganti Baju"
          >
            <X className="w-4 h-4" />
            <span>Selesai</span>
          </button>
        </div>

        {/* Live 3D Couple Preview */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <div
            ref={mountRef}
            onPointerDown={(e) => {
              draggingRef.current = true;
              lastXRef.current = e.clientX;
              (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!draggingRef.current) return;
              const dx = e.clientX - lastXRef.current;
              lastXRef.current = e.clientX;
              rotYRef.current += dx * 0.015;
            }}
            onPointerUp={() => {
              draggingRef.current = false;
            }}
            onPointerCancel={() => {
              draggingRef.current = false;
            }}
            className="pixel-box-sm overflow-hidden bg-[#E1F5FE] w-[290px] h-[175px] sm:w-[380px] sm:h-[215px] cursor-grab active:cursor-grabbing touch-none-zone"
          />

          {/* Animation State Preview Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {(
              [
                { id: 'idle', label: 'Diam' },
                { id: 'walk', label: 'Jalan' },
                { id: 'jump', label: 'Lompat' },
                { id: 'wallSlide', label: 'Panjat' },
                { id: 'pulled', label: 'Ketarik' },
              ] as { id: AnimState; label: string }[]
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setPreviewAnim(st.id)}
                className={`px-3 py-1 text-xs font-pixel border-2 border-[#5D4037] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  previewAnim === st.id
                    ? 'bg-[#FF80AB] text-white'
                    : 'bg-white text-[#5D4037] hover:bg-[#FCE4EC]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dual Columns: Girl & Boy Outfits */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Cewek */}
          <div className="bg-[#FCE4EC]/70 border-2 border-[#5D4037] p-3.5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-pixel text-sm text-[#4E342E]">
                Outfit Isol (Cewek · P1)
              </h3>
              <span className="text-xs font-medium text-[#AD1457]">
                Hijab &amp; Kacamata Bening
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {GIRL_OUTFITS.map((item) => {
                const active = outfits.girl === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectGirl(item.id)}
                    className={`w-full text-left p-2.5 border-2 border-[#5D4037] flex items-center gap-3 transition-transform cursor-pointer ${
                      active
                        ? 'bg-[#FFF3E0] shadow-[0_3px_0_#5D4037] -translate-y-0.5'
                        : 'bg-white/90 hover:bg-white'
                    }`}
                  >
                    <div className="flex flex-col border-2 border-[#5D4037] w-8 h-8 shrink-0">
                      <span className="flex-1" style={{ backgroundColor: item.swatchPrimary }} />
                      <span className="flex-1" style={{ backgroundColor: item.swatchSecondary }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-[#4E342E] truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-[#795548] truncate">
                        {item.subtitle}
                      </div>
                    </div>
                    {active && <Sparkles className="w-4 h-4 text-[#EC407A] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cowok */}
          <div className="bg-[#E1F5FE]/75 border-2 border-[#5D4037] p-3.5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-pixel text-sm text-[#4E342E]">
                Outfit Salman (Cowok · P2)
              </h3>
              <span className="text-xs font-medium text-[#0277BD]">
                Pelayaran &amp; Kasual
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {BOY_OUTFITS.map((item) => {
                const active = outfits.boy === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectBoy(item.id)}
                    className={`w-full text-left p-2.5 border-2 border-[#5D4037] flex items-center gap-3 transition-transform cursor-pointer ${
                      active
                        ? 'bg-[#FFF3E0] shadow-[0_3px_0_#5D4037] -translate-y-0.5'
                        : 'bg-white/90 hover:bg-white'
                    }`}
                  >
                    <div className="flex flex-col border-2 border-[#5D4037] w-8 h-8 shrink-0">
                      <span className="flex-1" style={{ backgroundColor: item.swatchPrimary }} />
                      <span className="flex-1" style={{ backgroundColor: item.swatchSecondary }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-[#4E342E] truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-[#795548] truncate">
                        {item.subtitle}
                      </div>
                    </div>
                    {active && <Sparkles className="w-4 h-4 text-[#0288D1] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
