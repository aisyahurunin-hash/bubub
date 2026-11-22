import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  Copy,
  LogOut,
  Mic,
  MicOff,
  Play,
  Users,
  X,
} from 'lucide-react';
import { LdrRoomState } from '../game/types';

interface LdrRoomModalProps {
  room: LdrRoomState;
  micActive: boolean;
  micError: string | null;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
  onSwapRoles: () => void;
  onToggleMic: () => void;
  onStartLdrGame: () => void;
  onClose: () => void;
}

export const LdrRoomModal: React.FC<LdrRoomModalProps> = ({
  room,
  micActive,
  micError,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onSwapRoles,
  onToggleMic,
  onStartLdrGame,
  onClose,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!room.code) return;
    navigator.clipboard?.writeText(room.code).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#4E342E]/45 p-3 sm:p-6">
      <div className="pixel-box w-full max-w-lg bg-[#FFF8F0] p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4 border-b-2 border-[#E6CEB2] pb-3">
          <div>
            <h2 className="font-pixel text-lg sm:text-xl text-[#4E342E]">
              Mode LDR Online
            </h2>
            <p className="text-sm text-[#795548]">
              Main berdua beda kota pakai kode room &amp; ngobrol lewat mikrofon.
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

        {!room.code ? (
          <div className="mt-5 flex flex-col gap-4">
            {/* Create Room */}
            <div className="bg-[#FCE4EC]/75 border-2 border-[#5D4037] p-4">
              <div className="font-pixel text-sm text-[#4E342E]">
                1. Buat Room Baru
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#795548]">
                Buat kode room unik lalu kirim ke pacarmu.
              </p>
              <button
                type="button"
                onClick={onCreateRoom}
                className="mt-3 pixel-btn bg-[#FF80AB] text-white px-4 py-2.5 font-pixel text-xs sm:text-sm w-full cursor-pointer"
              >
                Buat Kode Room
              </button>
            </div>

            {/* Join Room */}
            <div className="bg-[#E1F5FE]/80 border-2 border-[#5D4037] p-4">
              <div className="font-pixel text-sm text-[#4E342E]">
                2. Masukkan Kode Pacar
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#795548]">
                Sudah dapat kode room? Masukkan di sini untuk langsung bergabung.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (joinCode.trim().length >= 4) onJoinRoom(joinCode);
                }}
                className="mt-3 flex gap-2"
              >
                <input
                  type="text"
                  maxLength={8}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="KODE (cth: BUB42K)"
                  className="flex-1 border-2 border-[#5D4037] bg-white px-3 py-2 font-pixel text-sm text-[#4E342E] uppercase focus:outline-none focus:bg-[#FFF8F0]"
                />
                <button
                  type="submit"
                  disabled={joinCode.trim().length < 4}
                  className="pixel-btn bg-[#81D4FA] text-[#4E342E] px-4 py-2 font-pixel text-xs sm:text-sm disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Gabung
                </button>
              </form>
            </div>

            {room.statusMessage && (
              <div className="bg-[#FFF3E0] border-2 border-[#5D4037] p-2.5 text-xs sm:text-sm text-[#C62828] text-center">
                {room.statusMessage}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            {/* Room Code Display */}
            <div className="bg-[#FFF3E0] border-2 border-[#5D4037] p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-[#795548]">
                  Kode Room LDR Kalian
                </div>
                <div className="font-pixel text-2xl sm:text-3xl tracking-widest text-[#AD1457] mt-0.5">
                  {room.code}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="pixel-btn bg-white px-3 py-2 text-xs font-semibold text-[#4E342E] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-[#2E7D32]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
              </button>
            </div>

            {/* Partner Presence & Role */}
            <div className="bg-white border-2 border-[#5D4037] p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#4E342E]">
                  <Users className="w-4 h-4 text-[#EC407A]" />
                  <span>
                    {room.partnerJoined
                      ? 'Pasangan sudah terhubung!'
                      : 'Menunggu pasangan memasukkan kode...'}
                  </span>
                </div>
                <span className="font-pixel text-xs text-[#795548]">
                  {room.partnerJoined ? '2/2' : '1/2'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EFEBE9]">
                <div className="text-xs sm:text-sm text-[#5D4037]">
                  Kamu bermain sebagai:{' '}
                  <strong className="font-pixel text-[#AD1457]">
                    {room.myRole === 'p1' ? 'Isol (P1)' : 'Salman (P2)'}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={onSwapRoles}
                  className="pixel-btn bg-[#E1F5FE] px-2.5 py-1.5 text-xs font-semibold text-[#4E342E] flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Tukar Karakter</span>
                </button>
              </div>
            </div>

            {/* Voice Chat Mic Control */}
            <div className="bg-[#FCE4EC]/60 border-2 border-[#5D4037] p-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-sm text-[#4E342E]">
                  Obrolan Suara (Mikrofon)
                </div>
                <div className="text-xs text-[#795548]">
                  {micError
                    ? micError
                    : room.partnerMicOn
                      ? 'Mikrofon pasangan sedang menyala'
                      : 'Nyalakan mikrofon untuk ngobrol saat bermain'}
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleMic}
                className={`pixel-btn px-3 py-2 text-xs font-pixel flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  micActive ? 'bg-[#A5D6A7] text-[#1B5E20]' : 'bg-white text-[#4E342E]'
                }`}
              >
                {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span>{micActive ? 'Mic ON' : 'Mic OFF'}</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {room.isHost ? (
                <button
                  type="button"
                  onClick={onStartLdrGame}
                  className="flex-1 pixel-btn bg-[#FF80AB] text-white py-3 px-4 font-pixel text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    {room.partnerJoined ? 'Mulai Main Berdua!' : 'Masuk Level Sambil Menunggu'}
                  </span>
                </button>
              ) : (
                <div className="flex-1 bg-[#E1F5FE] border-2 border-[#5D4037] py-2.5 px-3 text-xs sm:text-sm font-medium text-[#0277BD] text-center">
                  Menunggu {room.myRole === 'p1' ? 'Salman' : 'Isol'} (Host) memulai level...
                </div>
              )}

              <button
                type="button"
                onClick={onLeaveRoom}
                className="pixel-btn bg-white text-[#5D4037] py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Room</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
