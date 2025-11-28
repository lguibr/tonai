import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface VisualizerProps {
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Initialize Analyser
    // We connect to destination to visualize *output*
    const analyser = new Tone.Analyser('waveform', 512);
    Tone.Destination.connect(analyser);
    analyserRef.current = analyser;

    return () => {
      // Cleanup? Tone.Destination is global, but we can disconnect this specific node if needed.
      // However, multiple connects to Destination are allowed.
      // Ideally we disconnect to save processing, but Tone.js graph management is complex.
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!analyserRef.current) return;

      const values = analyserRef.current.getValue();
      // values is Float32Array

      const width = canvas.width;
      const height = canvas.height;

      // Clear with a trail effect
      ctx.fillStyle = 'rgba(9, 9, 11, 0.2)'; // Dark background with fade
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#a855f7'; // Purple-500
      ctx.beginPath();

      const sliceWidth = width / values.length;
      let x = 0;

      // Scale factor to make the wave visible
      // Tone.Analyser returns -1 to 1 usually
      const scale = isPlaying ? 1 : 0.1;

      for (let i = 0; i < values.length; i++) {
        // value is between -1 and 1
        const v = (values[i] as number) * scale;
        const y = height / 2 + (v * height) / 2; // Center it

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="w-full h-48 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-inner relative">
      <canvas ref={canvasRef} width={1000} height={300} className="w-full h-full object-cover" />
      <div className="absolute top-2 left-3 text-xs text-zinc-500 font-mono">MASTER OUT</div>
    </div>
  );
};

export default Visualizer;
