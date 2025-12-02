import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface AudioVisualizerProps {
  className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    // Create analyser only once
    if (!analyserRef.current) {
      analyserRef.current = new Tone.Analyser('fft', 128);
      analyserRef.current.smoothing = 0.8;
      Tone.Destination.connect(analyserRef.current);
    }

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle high DPI displays
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const width = rect.width;
      const height = rect.height;

      const values = analyserRef.current.getValue();

      ctx.clearRect(0, 0, width, height);

      // Draw bars
      const barWidth = width / values.length;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, 'rgba(147, 51, 234, 0.2)'); // Purple
      gradient.addColorStop(1, 'rgba(192, 132, 252, 0.6)'); // Lighter Purple

      ctx.fillStyle = gradient;

      values.forEach((v, i) => {
        // Value is in dB, usually -100 to 0
        // Map to 0-1 range roughly
        const value = v as number;
        const normalized = Math.max(0, (value + 100) / 100);
        const barHeight = normalized * height;

        // Smooth curves
        const x = i * barWidth;
        const y = height - barHeight;

        ctx.fillRect(x, y, barWidth - 1, barHeight);
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Don't dispose analyser here as it might break audio chain if component remounts rapidly
      // Ideally we'd have a global audio manager
    };
  }, []);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} />;
};

export default AudioVisualizer;
