import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, Volume2, Mic, Disc, SkipBack } from 'lucide-react';
import { PlayState } from '../types';
import { getTransportPosition, restartTransport } from '../utils/audioEngine';
import Visualizer from './Visualizer';

interface ControlsProps {
  playState: PlayState;
  onPlay: () => void;
  onStop: () => void;
  onPause: () => void;
  onVolumeChange: (val: number) => void;
  onToggleRecord: () => void;
  isRecording: boolean;
  disabled: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  playState,
  onPlay,
  onStop,
  onPause,
  onVolumeChange,
  onToggleRecord,
  isRecording,
  disabled,
}) => {
  const [volume, setVolume] = useState(0); // 0db default
  const [position, setPosition] = useState('0:0:0');
  const requestRef = useRef<number>();

  // Handle Volume Change
  const handleVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    onVolumeChange(val);
  };

  const handleRestart = () => {
    restartTransport();
  };

  // Poll for Transport Position
  useEffect(() => {
    const animate = () => {
      setPosition(getTransportPosition());
      requestRef.current = requestAnimationFrame(animate);
    };

    if (playState === PlayState.PLAYING) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setPosition('0:0:0');
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [playState]);

  return (
    <div className="fixed bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 rounded-2xl shadow-2xl z-50 w-[95%] md:w-auto overflow-hidden group border border-zinc-700/50">
      {/* Visualizer Background */}
      <div className="absolute inset-0 z-0 opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none bg-black">
        <Visualizer isPlaying={playState === PlayState.PLAYING} />
      </div>

      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm z-10"></div>

      {/* Controls Content */}
      <div className="relative z-20 px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-6 justify-between md:justify-start overflow-x-auto md:overflow-visible no-scrollbar">
        {/* Playback Controls */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={onStop}
            disabled={disabled}
            className="p-2 md:p-3 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
            title="Stop & Reset"
          >
            <Square size={18} fill="currentColor" className="md:w-5 md:h-5" />
          </button>

          <button
            onClick={handleRestart}
            disabled={playState !== PlayState.PLAYING}
            className="p-2 md:p-3 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-purple-300 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            title="Restart Loop (Return to Start)"
          >
            <SkipBack size={18} fill="currentColor" className="md:w-5 md:h-5" />
          </button>

          {playState === PlayState.PLAYING ? (
            <button
              onClick={onPause}
              disabled={disabled}
              className="p-3 md:p-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all hover:scale-105 disabled:opacity-50"
              title="Pause"
            >
              <Pause size={20} fill="currentColor" className="md:w-6 md:h-6" />
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={disabled}
              className="p-3 md:p-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-105 disabled:opacity-50"
              title={playState === PlayState.PAUSED ? 'Resume' : 'Run Code'}
            >
              <Play size={20} fill="currentColor" className="ml-1 md:w-6 md:h-6" />
            </button>
          )}
        </div>

        <div className="h-6 md:h-8 w-px bg-zinc-700 shrink-0"></div>

        {/* Position Display */}
        <div className="flex flex-col items-start w-16 md:w-24 shrink-0">
          <span className="text-[8px] md:text-[10px] text-zinc-500 font-bold tracking-wider">
            POS
          </span>
          <span className="text-sm md:text-xl font-mono text-purple-200 tabular-nums leading-none mt-1">
            {position}
          </span>
        </div>

        <div className="h-6 md:h-8 w-px bg-zinc-700 shrink-0 hidden sm:block"></div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 md:gap-3 group shrink-0 hidden sm:flex">
          <Volume2
            size={16}
            className="text-zinc-400 group-hover:text-zinc-200 transition-colors md:w-[18px]"
          />
          <div className="flex flex-col">
            <input
              type="range"
              min="-60"
              max="0"
              step="1"
              value={volume}
              onChange={handleVolChange}
              className="w-16 md:w-24 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
              title={`Master Volume: ${volume} dB`}
            />
          </div>
        </div>

        <div className="h-6 md:h-8 w-px bg-zinc-700 shrink-0 hidden sm:block"></div>

        {/* Recording */}
        <button
          onClick={onToggleRecord}
          disabled={playState === PlayState.STOPPED && !isRecording}
          className={`
            flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-[10px] md:text-xs font-bold tracking-wide transition-all border shrink-0
            ${
              isRecording
                ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 animate-pulse'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            }
          `}
          title={isRecording ? 'Stop Recording & Download' : 'Record Output (.webm)'}
        >
          {isRecording ? (
            <Disc size={14} fill="currentColor" className="md:w-4 md:h-4" />
          ) : (
            <Mic size={14} className="md:w-4 md:h-4" />
          )}
          {isRecording ? 'REC' : 'REC'}
        </button>
      </div>
    </div>
  );
};

export default Controls;
