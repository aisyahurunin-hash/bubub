import React from 'react';
import { Check, Star, X } from 'lucide-react';
import { LEVELS_3D } from '../game3d/levels3d';

interface LevelSelectModalProps {
  currentLevelId: number;
  starsByLevel: Record<number, number>;
  completedLevels: number[];
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevelId,
  starsByLevel,
  completedLevels,
  onSelectLevel,
  onClose,
}) => {
  const totalStarsEarned = Object.values(starsByLevel).reduce((acc, s) => acc + s, 0);
  const maxStars = LEVELS_3D.length * 3;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#4E342E]/45 p-3 sm:p-6">
      <div className="pixel-box w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#FFF8F0] p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4 border-b-2 border-[#E6CEB2] pb-3">
          <div>
            <h2 className="font-pixel text-lg sm:text-xl text-[#4E342E]">
              Pilih Level 3D Petualangan
            </h2>
            <p className="text-sm text-[#795548] tabular-nums">
              Total Bintang Hati terkumpul: {totalStarsEarned}/{maxStars}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn bg-[#F8BBD0] px-3 py-2 text-sm font-semibold text-[#4E342E] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {LEVELS_3D.map((lvl) => {
            const stars = starsByLevel[lvl.id] || 0;
            const completed = completedLevels.includes(lvl.id);
            const isCurrent = currentLevelId === lvl.id;

            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => onSelectLevel(lvl.id)}
                className={`pixel-btn text-left p-3 flex flex-col justify-between gap-2 cursor-pointer ${
                  isCurrent ? 'bg-[#FFF3E0]' : 'bg-white'
                }`}
              >
                <div>
                  <div
                    className="h-7 w-full border-2 border-[#5D4037] mb-2 flex items-center justify-between px-2"
                    style={{
                      background: `linear-gradient(180deg, ${lvl.theme.skyTop} 0%, ${lvl.theme.skyBottom} 100%)`,
                    }}
                  >
                    <span className="font-pixel text-xs font-bold text-[#4E342E]">
                      #{lvl.id}
                    </span>
                    {completed && (
                      <Check className="w-4 h-4 text-[#2E7D32]" strokeWidth={3} />
                    )}
                  </div>

                  <div className="font-semibold text-sm text-[#4E342E] leading-tight">
                    {lvl.name}
                  </div>
                  <div className="text-xs text-[#795548] mt-0.5 line-clamp-2">
                    {lvl.subtitle}
                  </div>
                </div>

                <div className="flex items-center gap-1 pt-1 border-t border-[#EFEBE9]">
                  {[1, 2, 3].map((idx) => (
                    <Star
                      key={idx}
                      className={`w-4 h-4 ${
                        idx <= stars
                          ? 'fill-[#FFD54F] text-[#5D4037]'
                          : 'fill-[#EFEBE9] text-[#BCAAA4]'
                      }`}
                    />
                  ))}
                  <span className="ml-auto text-xs font-pixel text-[#795548] tabular-nums">
                    {stars}/3
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
