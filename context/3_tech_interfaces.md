# Tech Interfaces & Values

This document is the **Technical Reference Manual** for the TonAI system. It defines the application-level interfaces and, crucially, the **Tone.js API surface** that the AI must know to generate valid code.

---

# 1. Application Interfaces

These interfaces define how the React application interacts with the audio engine.

### `ToneContextType`

The primary bridge between React and the Audio Engine.

```typescript
export interface ToneContextType {
  /**
   * Compiles and executes the provided JavaScript code string within the audio context.
   * @param code - The raw JavaScript code to execute.
   */
  runCode: (code: string) => Promise<void>;

  /**
   * Stops the Transport, cancels all scheduled events, and disposes of active nodes.
   */
  stopAudio: () => void;

  /**
   * Starts the Tone.Transport.
   */
  playAudio: () => void;

  /**
   * Pauses the Tone.Transport.
   */
  pauseAudio: () => void;

  /**
   * Current state of the Transport.
   */
  isPlaying: boolean;

  /**
   * The Tone.Analyser node used for the visualizer.
   * Connect master output here to visualize it.
   */
  analyser: Tone.Analyser | null;

  /**
   * Sets the Master volume in Decibels.
   * @param db - Volume in dB (e.g., -12, 0, +6).
   */
  setVolume: (db: number) => void;
}
```

### `PlayState`

```typescript
export enum PlayState {
  STOPPED = 'STOPPED', // Transport is stopped, events cleared
  PLAYING = 'PLAYING', // Transport is running
  PAUSED = 'PAUSED', // Transport is paused (events remain)
}
```

### `GenerationState`

```typescript
export interface GenerationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}
```

---

# 2. Tone.js Core Interfaces

Since we cannot import types at runtime, the AI must internalize these interface definitions to know which options are valid for each class.

## Common Types

```typescript
type Time = string | number; // "4n", "8t", 0.5, 1
type Frequency = string | number; // "C4", 440, "4n" (for LFO)
type Decibels = number; // -Infinity to +Infinity
type NormalRange = number; // 0 to 1
type AudioRange = number; // -1 to 1
type Positive = number; // >= 0
```

## Instruments

### `Tone.Synth`

Basic monophonic synthesizer.

```typescript
interface SynthOptions {
  oscillator: {
    type: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'pwm' | 'pulse';
  };
  envelope: {
    attack: Time;
    decay: Time;
    sustain: NormalRange;
    release: Time;
  };
  volume: Decibels;
}
```

### `Tone.MembraneSynth`

Kick drum and tom synthesizer.

```typescript
interface MembraneSynthOptions {
  pitchDecay: Time; // Amount of time for pitch to decay
  octaves: number;  // Range of pitch drop (usually 5-10)
  oscillator: { type: "sine" | "square" | ... };
  envelope: { attack: Time; decay: Time; sustain: NormalRange; release: Time; };
  volume: Decibels;
}
```

### `Tone.MetalSynth`

Inharmonic metallic sounds (cymbals, bells).

```typescript
interface MetalSynthOptions {
  harmonicity: number; // 0.1 to 10
  resonance: number; // 0 to 7000
  modulationIndex: number; // 0 to 100
  envelope: { attack: Time; decay: Time; release: Time }; // No sustain
  volume: Decibels;
}
```

### `Tone.NoiseSynth`

Noise generator with envelope (Snares, Hats, FX).

```typescript
interface NoiseSynthOptions {
  noise: {
    type: 'white' | 'pink' | 'brown';
  };
  envelope: { attack: Time; decay: Time; sustain: NormalRange; release: Time };
  volume: Decibels;
}
```

### `Tone.PolySynth`

Polyphonic wrapper.

```typescript
// Usage: new Tone.PolySynth(Tone.Synth, options)
interface PolySynthOptions {
  maxPolyphony: number; // Default 32. KEEP THIS LOW (e.g., 8) to save CPU.
  voice: any; // The synth class to use
  options: any; // Options for the voice
}
```

### `Tone.Sampler`

Sample-based instrument.

```typescript
interface SamplerOptions {
  urls: Record<string, string>; // { "C4": "path/to/C4.mp3" }
  baseUrl?: string;
  onload?: () => void;
  volume: Decibels;
  attack: Time;
  release: Time;
  curve: 'linear' | 'exponential';
}
```

## Effects

### `Tone.Reverb`

Algorithmic Reverb.

```typescript
interface ReverbOptions {
  decay: Time; // 0.1 to 10+ seconds
  preDelay: Time;
  wet: NormalRange;
}
```

### `Tone.JCReverb`

Schroeder Reverb (lighter CPU).

```typescript
interface JCReverbOptions {
  roomSize: NormalRange; // 0 to 1
  wet: NormalRange;
}
```

### `Tone.FeedbackDelay`

Delay line with feedback.

```typescript
interface FeedbackDelayOptions {
  delayTime: Time; // "8n", 0.5
  feedback: NormalRange; // 0 to 1
  wet: NormalRange;
}
```

### `Tone.PingPongDelay`

Stereo delay.

```typescript
interface PingPongDelayOptions {
  delayTime: Time;
  feedback: NormalRange;
  wet: NormalRange;
}
```

### `Tone.AutoFilter`

LFO-controlled filter (Wah-wah).

```typescript
interface AutoFilterOptions {
  frequency: Frequency; // LFO speed (e.g., "4n" or 2Hz)
  baseFrequency: Frequency; // Filter cutoff center
  depth: NormalRange;
  octaves: number; // Range of sweep (1-6)
  filter: {
    type: 'lowpass' | 'highpass' | 'bandpass';
    Q: number;
  };
  wet: NormalRange;
}
```

### `Tone.BitCrusher`

Lo-fi digital distortion.

```typescript
interface BitCrusherOptions {
  bits: number; // 1 to 16 (usually 4-8)
  wet: NormalRange;
}
```

### `Tone.Distortion`

Waveshaping distortion.

```typescript
interface DistortionOptions {
  distortion: NormalRange; // 0 to 1
  oversample: 'none' | '2x' | '4x';
  wet: NormalRange;
}
```

### `Tone.Chebyshev`

Even-harmonic distortion.

```typescript
interface ChebyshevOptions {
  order: number; // 1 to 100 (Integer)
  wet: NormalRange;
}
```

## Sources & Signals

### `Tone.Oscillator`

Pure waveform generator.

```typescript
interface OscillatorOptions {
  type: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'pwm' | 'pulse';
  frequency: Frequency;
  volume: Decibels;
  detune: number; // Cents
  phase: number; // Degrees
}
```

### `Tone.LFO`

Low Frequency Oscillator for modulation.

```typescript
interface LFOOptions {
  frequency: Frequency;
  min: number; // Output min
  max: number; // Output max
  type: 'sine' | 'square' | 'sawtooth' | 'triangle';
  amplitude: NormalRange;
}
```

---

# 3. Critical Safety Values (Expanded)

The AI **MUST** cross-reference generated code against this table.

| Class                | Parameter      | Min   | Max      | Recommended | Danger Zone             |
| :------------------- | :------------- | :---- | :------- | :---------- | :---------------------- |
| `Tone.Filter`        | `Q`            | 0     | 10       | 1           | > 20 (Self-Oscillation) |
| `Tone.Filter`        | `frequency`    | 10    | 20000    | 300-10000   | 0 (Crash)               |
| `Tone.Delay`         | `feedback`     | 0     | 0.9      | 0.3-0.6     | >= 1.0 (Infinite Loop)  |
| `Tone.Reverb`        | `decay`        | 0.001 | 100      | 1.5-4       | > 100 (CPU Freeze)      |
| `Tone.PingPongDelay` | `delayTime`    | 0     | 1        | "8n"        | 0 (Crash)               |
| `Tone.MetalSynth`    | `harmonicity`  | 0.1   | 20       | 5.1         | > 50 (Harsh)            |
| `Tone.MetalSynth`    | `resonance`    | 0     | 7000     | 3000        | > 8000                  |
| `Tone.PolySynth`     | `maxPolyphony` | 1     | 64       | 8           | > 32 (Lag)              |
| `Tone.LFO`           | `frequency`    | 0     | 100      | "4n"        | > 1000 (Aliasing)       |
| `Tone.Gain`          | `gain`         | 0     | Infinity | 0.8         | > 1 (Clipping)          |

---

# 4. Signal Routing Patterns

## Serial Chain

```javascript
// Source -> Effect1 -> Effect2 -> Master
synth.chain(distortion, filter, Tone.Destination);
```

## Parallel Processing (Send/Return)

```javascript
// Source -> Dry
// Source -> Reverb -> Master
const reverb = new Tone.Reverb().toDestination();
const synth = new Tone.Synth().toDestination();
synth.connect(reverb); // Connects to Reverb AND Destination (because of .toDestination() above)
```

## Modulation

```javascript
// LFO -> Parameter
const lfo = new Tone.LFO('4n', 400, 1200).start();
const filter = new Tone.Filter(400, 'lowpass').toDestination();
lfo.connect(filter.frequency);
```
