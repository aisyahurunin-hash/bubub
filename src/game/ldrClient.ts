import { soundFX } from './audio';
import { NetworkSyncSnapshot3D } from '../game3d/engine3d';
import { NetworkInput3D, OutfitConfig } from './types';

export interface LdrClientCallbacks {
  onRoomCreated: (data: { code: string; role: 'p1' | 'p2'; levelId: number }) => void;
  onRoomReady: (data: {
    code: string;
    isHost: boolean;
    role: 'p1' | 'p2';
    levelId: number;
    outfits: OutfitConfig;
  }) => void;
  onRolesUpdated: (role: 'p1' | 'p2') => void;
  onOutfitsUpdated: (outfits: OutfitConfig) => void;
  onLevelStart: (levelId: number) => void;
  onRemoteInput: (role: 'p1' | 'p2', input: NetworkInput3D) => void;
  onStateSync: (state: NetworkSyncSnapshot3D) => void;
  onGameEvent: (eventName: string, payload?: unknown) => void;
  onPartnerLeft: (message: string) => void;
  onError: (message: string) => void;
  onPartnerMicChange: (active: boolean) => void;
  onLocalMicChange: (active: boolean, error?: string) => void;
  onConnectionChange: (connected: boolean) => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class LdrNetworkClient {
  private ws: WebSocket | null = null;
  private cb: LdrClientCallbacks;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private micActive: boolean = false;
  private isHost: boolean = false;
  private partnerPresent: boolean = false;
  private pendingIce: RTCIceCandidateInit[] = [];

  constructor(callbacks: LdrClientCallbacks) {
    this.cb = callbacks;
  }

  private ensureSocket(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve(this.ws);
    }
    return new Promise((resolve, reject) => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${proto}//${window.location.host}/ws`;
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.cb.onConnectionChange(true);
        resolve(ws);
      };
      ws.onerror = () => {
        this.cb.onError('Gagal terhubung ke server LDR.');
        reject(new Error('WebSocket error'));
      };
      ws.onclose = () => {
        this.cb.onConnectionChange(false);
        this.partnerPresent = false;
      };
      ws.onmessage = (ev) => {
        this.handleMessage(ev.data);
      };
    });
  }

  private send(payload: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(payload));
  }

  public async createRoom(levelId: number, outfits: OutfitConfig) {
    const ws = await this.ensureSocket();
    this.isHost = true;
    ws.send(JSON.stringify({ type: 'create_room', levelId, outfits }));
  }

  public async joinRoom(code: string, outfits: OutfitConfig) {
    const ws = await this.ensureSocket();
    this.isHost = false;
    ws.send(JSON.stringify({ type: 'join_room', code: code.trim().toUpperCase(), outfits }));
  }

  public leaveRoom() {
    this.send({ type: 'leave_room' });
    this.partnerPresent = false;
    this.cleanupVoice();
  }

  public swapRoles() {
    this.send({ type: 'swap_roles' });
  }

  public sendOutfitUpdate(outfits: OutfitConfig) {
    this.send({ type: 'outfit_update', outfits });
  }

  public sendLevelStart(levelId: number) {
    this.send({ type: 'level_start', levelId });
  }

  public sendInput(role: 'p1' | 'p2', input: NetworkInput3D) {
    this.send({ type: 'input', role, input });
  }

  public sendStateSync(state: NetworkSyncSnapshot3D) {
    this.send({ type: 'state_sync', state });
  }

  public sendGameEvent(eventName: string, payload?: unknown) {
    this.send({ type: 'game_event', eventName, payload });
  }

  // --- WebRTC Voice Chat ---

  private createPeerConnection(): RTCPeerConnection {
    if (this.pc) return this.pc;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pc = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.send({ type: 'webrtc_ice', candidate: e.candidate.toJSON() });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (!stream) return;
      if (!this.remoteAudio) {
        this.remoteAudio = new Audio();
        this.remoteAudio.autoplay = true;
        this.remoteAudio.setAttribute('playsinline', 'true');
      }
      this.remoteAudio.srcObject = stream;
      this.remoteAudio.play().catch(() => {});
    };

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    return pc;
  }

  private async initiateOffer() {
    if (!this.partnerPresent) return;
    const pc = this.createPeerConnection();
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      this.send({ type: 'webrtc_offer', sdp: pc.localDescription });
    } catch {
      // Ignore transient negotiation race
    }
  }

  public async toggleMic(): Promise<boolean> {
    if (this.micActive) {
      this.micActive = false;
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
      }
      soundFX.setVoiceDucking(false);
      this.send({ type: 'mic_status', active: false });
      this.cb.onLocalMicChange(false);
      return false;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        this.cb.onLocalMicChange(false, 'Browser ini tidak mendukung mikrofon.');
        return false;
      }

      if (!this.localStream) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        if (this.pc) {
          for (const track of this.localStream.getTracks()) {
            this.pc.addTrack(track, this.localStream);
          }
          await this.initiateOffer();
        }
      } else {
        this.localStream.getAudioTracks().forEach((t) => {
          t.enabled = true;
        });
      }

      this.micActive = true;
      soundFX.setVoiceDucking(true);
      this.send({ type: 'mic_status', active: true });
      this.cb.onLocalMicChange(true);

      if (this.partnerPresent && !this.pc) {
        await this.initiateOffer();
      }
      return true;
    } catch {
      this.cb.onLocalMicChange(false, 'Izin mikrofon ditolak atau perangkat tidak tersedia.');
      return false;
    }
  }

  private cleanupVoice() {
    this.micActive = false;
    soundFX.setVoiceDucking(false);
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.remoteAudio) {
      this.remoteAudio.srcObject = null;
    }
    this.pendingIce = [];
    this.cb.onLocalMicChange(false);
    this.cb.onPartnerMicChange(false);
  }

  public destroy() {
    this.cleanupVoice();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private async handleMessage(raw: unknown) {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(String(raw)) as Record<string, unknown>;
    } catch {
      return;
    }

    const type = msg.type as string;
    if (type === 'room_created') {
      this.isHost = true;
      this.partnerPresent = false;
      this.cb.onRoomCreated({
        code: String(msg.code),
        role: (msg.role as 'p1' | 'p2') || 'p1',
        levelId: Number(msg.levelId) || 1,
      });
    } else if (type === 'room_ready') {
      this.isHost = Boolean(msg.isHost);
      this.partnerPresent = true;
      this.cb.onRoomReady({
        code: String(msg.code),
        isHost: this.isHost,
        role: (msg.role as 'p1' | 'p2') || 'p1',
        levelId: Number(msg.levelId) || 1,
        outfits: msg.outfits as OutfitConfig,
      });
      if (this.isHost && this.micActive) {
        await this.initiateOffer();
      }
    } else if (type === 'roles_updated') {
      this.cb.onRolesUpdated(msg.role as 'p1' | 'p2');
    } else if (type === 'outfits_updated') {
      this.cb.onOutfitsUpdated(msg.outfits as OutfitConfig);
    } else if (type === 'level_start') {
      this.cb.onLevelStart(Number(msg.levelId) || 1);
    } else if (type === 'input') {
      this.cb.onRemoteInput(
        msg.role as 'p1' | 'p2',
        msg.input as NetworkInput3D
      );
    } else if (type === 'state_sync') {
      this.cb.onStateSync(msg.state as NetworkSyncSnapshot3D);
    } else if (type === 'game_event') {
      this.cb.onGameEvent(String(msg.eventName), msg.payload);
    } else if (type === 'partner_left') {
      this.partnerPresent = false;
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }
      this.cb.onPartnerMicChange(false);
      this.cb.onPartnerLeft(String(msg.message || 'Pasangan keluar dari room.'));
    } else if (type === 'room_error') {
      this.cb.onError(String(msg.message || 'Terjadi kesalahan room.'));
    } else if (type === 'mic_status') {
      this.cb.onPartnerMicChange(Boolean(msg.active));
    } else if (type === 'webrtc_offer') {
      const pc = this.createPeerConnection();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp as RTCSessionDescriptionInit));
        for (const cand of this.pendingIce) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }
        this.pendingIce = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.send({ type: 'webrtc_answer', sdp: pc.localDescription });
      } catch {
        // Ignore transient offer collision
      }
    } else if (type === 'webrtc_answer') {
      if (this.pc) {
        try {
          await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp as RTCSessionDescriptionInit));
          for (const cand of this.pendingIce) {
            await this.pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          }
          this.pendingIce = [];
        } catch {
          // Ignore
        }
      }
    } else if (type === 'webrtc_ice') {
      const cand = msg.candidate as RTCIceCandidateInit;
      if (!cand) return;
      if (this.pc && this.pc.remoteDescription) {
        await this.pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
      } else {
        this.pendingIce.push(cand);
      }
    }
  }
}
