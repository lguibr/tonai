export enum PlayState {
  STOPPED = 'STOPPED',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
}

export interface GenerationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

export interface ToneContextType {
  runCode: (code: string) => Promise<void>;
  stopAudio: () => void;
  playAudio: () => void;
  pauseAudio: () => void;
  isPlaying: boolean;
  analyser: any | null;
  setVolume: (db: number) => void;
}
