import React from 'react';
import { ArrowDown, ArrowLeft, ArrowLeftRight, ArrowRight, ArrowUp, Hand } from 'lucide-react';
import { LocalControlMode } from '../game/types';

interface TouchControlsProps {
  singlePlayerRole?: 'p1' | 'p2' | null;
  localControlMode?: LocalControlMode;
  activeLocalChar?: 'p1' | 'p2';
  nearLeverHint?: 'p1' | 'p2' | 'both' | null;
  onSwitchChar?: () => void;
  onInput: (
    player: 'p1' | 'p2',
    action: 'left' | 'right' | 'up' | 'down' | 'jump' | 'interact',
    pressed: boolean
  ) => void;
}

interface TouchButtonProps {
  label: string;
  bgClass: string;
  sizeClass?: string;
  onPressChange: (pressed: boolean) => void;
  children: React.ReactNode;
}

const TouchButton: React.FC<TouchButtonProps> = ({
  label,
  bgClass,
  sizeClass = 'w-12 h-12 sm:w-14 sm:h-14',
  onPressChange,
  children,
}) => {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        onPressChange(true);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onPressChange(false);
      }}
      onPointerCancel={(e) => {
        e.preventDefault();
        onPressChange(false);
      }}
      className={`touch-none-zone ${sizeClass} border-2 border-[#5D4037] shadow-[0_3px_0_#5D4037] active:translate-y-0.5 active:shadow-[0_1px_0_#5D4037] flex flex-col items-center justify-center opacity-85 ${bgClass}`}
    >
      {children}
    </button>
  );
};

export const TouchControls: React.FC<TouchControlsProps> = ({
  singlePlayerRole = null,
  localControlMode = 'solo_switch',
  activeLocalChar = 'p1',
  nearLeverHint = null,
  onSwitchChar,
  onInput,
}) => {
  // Single-character touch layout (used for LDR Online AND Solo Switch)
  const targetRole =
    singlePlayerRole || (localControlMode === 'solo_switch' ? activeLocalChar : null);

  if (targetRole) {
    const colorClass = targetRole === 'p1' ? 'bg-[#F8BBD0]' : 'bg-[#B3E5FC]';
    const isNearLever = nearLeverHint === targetRole || nearLeverHint === 'both';

    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end justify-between p-4 sm:p-6">
        {/* Left: 4-Way 3D Movement D-Pad */}
        <div className="pointer-events-auto grid grid-cols-3 gap-1.5">
          <div />
          <TouchButton
            label="Maju"
            bgClass={colorClass}
            onPressChange={(p) => onInput(targetRole, 'up', p)}
          >
            <ArrowUp className="w-6 h-6 text-[#4E342E]" />
          </TouchButton>
          <div />
          <TouchButton
            label="Kiri"
            bgClass={colorClass}
            onPressChange={(p) => onInput(targetRole, 'left', p)}
          >
            <ArrowLeft className="w-6 h-6 text-[#4E342E]" />
          </TouchButton>
          <TouchButton
            label="Mundur"
            bgClass={colorClass}
            onPressChange={(p) => onInput(targetRole, 'down', p)}
          >
            <ArrowDown className="w-6 h-6 text-[#4E342E]" />
          </TouchButton>
          <TouchButton
            label="Kanan"
            bgClass={colorClass}
            onPressChange={(p) => onInput(targetRole, 'right', p)}
          >
            <ArrowRight className="w-6 h-6 text-[#4E342E]" />
          </TouchButton>
        </div>

        {/* Right: Hand/Tuas, Switch (if solo), and Jump */}
        <div className="pointer-events-auto flex items-end gap-2.5 sm:gap-3">
          {!singlePlayerRole && onSwitchChar && (
            <button
              type="button"
              onClick={onSwitchChar}
              className="pixel-btn bg-[#FFF3E0] px-3 py-2.5 flex flex-col items-center justify-center gap-0.5 text-[#4E342E] opacity-90 cursor-pointer"
              aria-label="Ganti Karakter"
            >
              <ArrowLeftRight className="w-5 h-5" />
              <span className="font-pixel text-[8px] leading-none">
                {activeLocalChar === 'p1' ? 'Isol' : 'Salman'}
              </span>
            </button>
          )}
          <TouchButton
            label="Tarik Tuas"
            bgClass={isNearLever ? 'bg-[#A5D6A7]' : 'bg-[#FFF3E0]'}
            onPressChange={(p) => onInput(targetRole, 'interact', p)}
          >
            <Hand className="w-5 h-5 text-[#4E342E]" />
            <span className="font-pixel text-[8px] leading-none text-[#4E342E]">Tuas</span>
          </TouchButton>
          <TouchButton
            label="Lompat"
            bgClass="bg-[#FFD54F]"
            sizeClass="w-14 h-14 sm:w-16 sm:h-16"
            onPressChange={(p) => onInput(targetRole, 'jump', p)}
          >
            <ArrowUp className="w-7 h-7 text-[#4E342E]" />
          </TouchButton>
        </div>
      </div>
    );
  }

  // Dual 2-Player 1-Screen Touch Layout
  const p1Near = nearLeverHint === 'p1' || nearLeverHint === 'both';
  const p2Near = nearLeverHint === 'p2' || nearLeverHint === 'both';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end justify-between p-2.5 sm:p-4">
      <div className="pointer-events-auto flex flex-col items-start gap-1">
        <span className="font-pixel text-[9px] text-[#4E342E] bg-[#FFF8F0]/90 px-1.5 py-0.5 border border-[#5D4037]">
          P1 Isol
        </span>
        <div className="flex items-end gap-1.5">
          <div className="grid grid-cols-3 gap-1">
            <div />
            <TouchButton label="P1 Maju" sizeClass="w-10 h-10" bgClass="bg-[#F8BBD0]" onPressChange={(p) => onInput('p1', 'up', p)}>
              <ArrowUp className="w-4 h-4 text-[#4E342E]" />
            </TouchButton>
            <div />
            <TouchButton label="P1 Kiri" sizeClass="w-10 h-10" bgClass="bg-[#F8BBD0]" onPressChange={(p) => onInput('p1', 'left', p)}>
              <ArrowLeft className="w-4 h-4 text-[#4E342E]" />
            </TouchButton>
            <TouchButton label="P1 Mundur" sizeClass="w-10 h-10" bgClass="bg-[#F8BBD0]" onPressChange={(p) => onInput('p1', 'down', p)}>
              <ArrowDown className="w-4 h-4 text-[#4E342E]" />
            </TouchButton>
            <TouchButton label="P1 Kanan" sizeClass="w-10 h-10" bgClass="bg-[#F8BBD0]" onPressChange={(p) => onInput('p1', 'right', p)}>
              <ArrowRight className="w-4 h-4 text-[#4E342E]" />
            </TouchButton>
          </div>
          <div className="flex flex-col gap-1">
            <TouchButton label="P1 Tuas" sizeClass="w-10 h-10" bgClass={p1Near ? 'bg-[#A5D6A7]' : 'bg-[#FFF3E0]'} onPressChange={(p) => onInput('p1', 'interact', p)}>
              <Hand className="w-4 h-4 text-[#4E342E]" />
            </TouchButton>
            <TouchButton label="P1 Lompat" sizeClass="w-10 h-10" bgClass="bg-[#FFD54F]" onPressChange={(p) => onInput('p1', 'jump', p)}>
              <ArrowUp className="w-5 h-5 text-[#4E342E]" />
            </TouchButton>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto flex flex-col items-end gap-1">
        <span className="font-pixel text-[9px] text-[#4E342E] bg-[#FFF8F0]/90 px-1.5 py-0.5 border border-[#5D4037]">
          P2 Salman
        </span>
        <div className="flex items-end gap-1.5">
          <div className="flex flex-col gap-1">
            <TouchButton label="P2 Tuas" sizeClass="w-10 h-10" bgClass={p2Near ? 'bg-[#A5D6A7]' : 'bg-[#FFF3E0]'} onPressChange={(p) => onInput('p2', 'interact', p)}>
              <Hand className="w-4 h-4 text-[#4E342E]" />
            </TouchButton>
            <TouchButton label="P2 Lompat" sizeClass="w-10 h-10" bgClass="bg-[#FFD54F]" onPressChange={(p) => onInput('p2', 'jump', p)}>
              <ArrowUp className="w-5 h-5 text-[#4E342E]" />
            </TouchButton>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div />
            <TouchButton label="P2 Maju" sizeClass="w-10 h-10" bgClass="bg-[#B3E5FC]" onPressChange={(p) => onInput('p2', 'up', p)}>
              <ArrowUp className="w-4 h-4 text-[#4E342E]" />
            </TouchButton>
            <div />
            <TouchButton label="P2 Kiri" sizeClass="w-10 h-10" bgClass="bg-[#B3E5FC]" onPressChange={(p) => onInput('p2', 'left', p)}>
              <ArrowLeft className="w-4 h-4 text-[#4E342E]" />
            </TouchButton>
            <TouchButton label="P2 Mundur" sizeClass="w-10 h-10" bgClass="bg-[#B3E5FC]" onPressChange={(p) => onInput('p2', 'down', p)}>
              <ArrowDown className="w-4 h-4 text-[#4E342E]" />
            </TouchButton>
            <TouchButton label="P2 Kanan" sizeClass="w-10 h-10" bgClass="bg-[#B3E5FC]" onPressChange={(p) => onInput('p2', 'right', p)}>
              <ArrowRight className="w-4 h-4 text-[#4E342E]" />
            </TouchButton>
          </div>
        </div>
      </div>
    </div>
  );
};
