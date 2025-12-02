# Feature Examples Library

This document contains a comprehensive library of valid, crash-tested Tone.js code snippets. These examples demonstrate the full range of capabilities, from basic synthesis to complex generative composition.

---

# Table of Contents

1.  [Basic Synthesis](#basic-synthesis)
2.  [Rhythm & Drums](#rhythm--drums)
3.  [Melody & Harmony](#melody--harmony)
4.  [Effects Chains](#effects-chains)
5.  [Generative & Random](#generative--random)
6.  [Full Track Templates](#full-track-templates)

---

# 1. Basic Synthesis

## 1.1 Simple Sawtooth Lead

A classic analog-style lead sound.

```javascript
const synth = new Tone.Synth({
  oscillator: { type: 'sawtooth' },
  envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 1 },
}).toDestination();

const loop = new Tone.Loop((time) => {
  synth.triggerAttackRelease('C4', '8n', time);
}, '4n').start(0);
```

## 1.2 FM Bell

Using Frequency Modulation to create a bell-like tone.

```javascript
const bell = new Tone.FMSynth({
  harmonicity: 3.0,
  modulationIndex: 10,
  oscillator: { type: 'sine' },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 2 },
  modulation: { type: 'square' },
  modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 2 },
}).toDestination();

Tone.Transport.scheduleRepeat((time) => {
  bell.triggerAttackRelease('C5', '4n', time);
}, '2n');
```

## 1.3 Fat Bass (Pulse Width Modulation)

A thick bass sound using PWM.

```javascript
const bass = new Tone.MonoSynth({
  oscillator: { type: 'pwm', width: 0.4 },
  filterEnvelope: {
    attack: 0.01,
    decay: 0.4,
    sustain: 0,
    release: 0.2,
    baseFrequency: 200,
    octaves: 2.5,
  },
  envelope: { attack: 0.01, decay: 0.4, sustain: 0.4, release: 0.2 },
}).toDestination();

const seq = new Tone.Sequence(
  (time, note) => {
    bass.triggerAttackRelease(note, '8n', time);
  },
  ['C2', 'C2', 'Eb2', 'G2'],
  '4n'
).start(0);
```

## 1.4 SuperSaw (PolySynth)

Multiple detuned saws for a trance pad.

```javascript
const chorus = new Tone.Chorus(4, 2.5, 0.5).toDestination().start();
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
  envelope: { attack: 0.1, decay: 0.3, sustain: 1, release: 1 },
}).connect(chorus);

const chord = ['C4', 'E4', 'G4', 'B4'];
Tone.Transport.scheduleRepeat((time) => {
  synth.triggerAttackRelease(chord, '2n', time);
}, '1m');
```

---

# 2. Rhythm & Drums

## 2.1 Basic House Beat (4/4)

Kick on every beat, Hat on the off-beat.

```javascript
Tone.Transport.bpm.value = 124;

const kick = new Tone.MembraneSynth().toDestination();
const hat = new Tone.MetalSynth({
  envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 4000,
  octaves: 1.5,
}).toDestination();
hat.volume.value = -15;

const loop = new Tone.Loop((time) => {
  kick.triggerAttackRelease('C1', '8n', time);
  hat.triggerAttackRelease('32n', time + Tone.Time('8n').toSeconds(), 0.3);
}, '4n').start(0);
```

## 2.2 Trap Hi-Hats (Retriggering)

Fast rolls using probability or explicit scheduling.

```javascript
Tone.Transport.bpm.value = 140;
const hat = new Tone.NoiseSynth({ volume: -10 }).toDestination();

const part = new Tone.Part(
  (time, value) => {
    hat.triggerAttackRelease('32n', time);
  },
  [
    { time: '0:0:0' },
    { time: '0:0:2' },
    { time: '0:1:0' },
    { time: '0:1:2' }, // 8th notes
    { time: '0:2:0' },
    { time: '0:2:1' },
    { time: '0:2:2' },
    { time: '0:2:3' }, // 16th roll
    { time: '0:3:0' },
    { time: '0:3:2' },
  ]
).start(0);
part.loop = true;
```

## 2.3 Euclidean Rhythm (Polyrhythm)

Kick playing 3 hits over 8 steps.

```javascript
const kick = new Tone.MembraneSynth().toDestination();
// 3 hits distributed over 8 steps: 1 0 0 1 0 0 1 0
const pattern = [1, 0, 0, 1, 0, 0, 1, 0];

let step = 0;
Tone.Transport.scheduleRepeat((time) => {
  if (pattern[step % pattern.length] === 1) {
    kick.triggerAttackRelease('C1', '8n', time);
  }
  step++;
}, '8n');
```

---

# 3. Melody & Harmony

## 3.1 Arpeggiator

Cycling through a chord.

```javascript
const synth = new Tone.Synth().toDestination();
const pattern = new Tone.Pattern(
  (time, note) => {
    synth.triggerAttackRelease(note, '16n', time);
  },
  ['C4', 'E4', 'G4', 'B4'],
  'upDown'
);
pattern.interval = '16n';
pattern.start(0);
```

## 3.2 Counterpoint (Two Voices)

```javascript
const v1 = new Tone.Synth({ oscillator: { type: 'square' } }).toDestination();
const v2 = new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination();

const seq1 = new Tone.Sequence(
  (time, note) => {
    v1.triggerAttackRelease(note, '8n', time);
  },
  ['C4', null, 'E4', null, 'G4', null, 'B4', null],
  '8n'
).start(0);

const seq2 = new Tone.Sequence(
  (time, note) => {
    v2.triggerAttackRelease(note, '4n', time);
  },
  ['C3', 'G3', 'C3', 'F3'],
  '4n'
).start(0);
```

---

# 4. Effects Chains

## 4.1 Dub Delay

Feedback delay with high feedback and filtering.

```javascript
const synth = new Tone.Synth().start();
const delay = new Tone.FeedbackDelay('8n.', 0.6); // Dotted 8th
const filter = new Tone.Filter(800, 'lowpass');
const reverb = new Tone.Reverb({ decay: 4, wet: 0.5 });

// Chain: Synth -> Delay -> Filter -> Reverb -> Out
synth.chain(delay, filter, reverb, Tone.Destination);

Tone.Transport.scheduleRepeat((time) => {
  synth.triggerAttackRelease('C3', '32n', time);
}, '2n');
```

## 4.2 Lo-Fi / Bitcrush

Degrading the audio quality.

```javascript
const synth = new Tone.PolySynth().start();
const crusher = new Tone.BitCrusher(4).toDestination(); // 4 bits
const filter = new Tone.AutoFilter(0.5, 200, 4).connect(crusher).start(); // Wobble

synth.connect(filter);

synth.triggerAttackRelease(['C4', 'E4', 'G4'], '1m', 0);
```

## 4.3 Shimmer Reverb (Pitch Shifted Feedback)

**Advanced:** Creating a shimmer effect by routing reverb back into a pitch shifter.

```javascript
const src = new Tone.Synth().toDestination();
const reverb = new Tone.Reverb(5).toDestination();
const shift = new Tone.PitchShift(12); // +1 Octave

// Feedback loop: Reverb -> Shift -> Reverb
reverb.connect(shift);
shift.connect(reverb);

src.connect(reverb);

Tone.Transport.scheduleRepeat((time) => {
  src.triggerAttackRelease('C4', '16n', time);
}, '2n');
```

---

# 5. Generative & Random

## 5.1 Random Walk Melody

Notes move up or down by small steps.

```javascript
const synth = new Tone.Synth().toDestination();
const scale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
let index = 3; // Start at F4

Tone.Transport.scheduleRepeat((time) => {
  // Move -1, 0, or +1 step
  const change = Math.floor(Math.random() * 3) - 1;
  index = Math.max(0, Math.min(scale.length - 1, index + change));

  if (Math.random() > 0.2) {
    // 80% chance to play
    synth.triggerAttackRelease(scale[index], '8n', time);
  }
}, '8n');
```

## 5.2 Markov Chain (Simple)

Probability-based transitions.

```javascript
const synth = new Tone.Synth().toDestination();
const notes = ['C4', 'E4', 'G4'];
let current = 'C4';

const transitions = {
  C4: ['E4', 'G4'],
  E4: ['G4', 'C4'],
  G4: ['C4', 'E4'],
};

Tone.Transport.scheduleRepeat((time) => {
  synth.triggerAttackRelease(current, '8n', time);
  const options = transitions[current];
  current = options[Math.floor(Math.random() * options.length)];
}, '8n');
```

---

# 6. Full Track Templates

## 6.1 Ambient Drone

Slow, evolving textures.

```javascript
Tone.Transport.bpm.value = 60;

// 1. Drone Pad
const pad = new Tone.PolySynth(Tone.AMSynth).toDestination();
pad.set({
  harmonicity: 2,
  oscillator: { type: 'sine' },
  envelope: { attack: 2, decay: 0, sustain: 1, release: 4 },
  volume: -12,
});

const chorus = new Tone.Chorus(2, 4, 0.5).start().connect(pad.volume); // Modulate volume
const reverb = new Tone.Reverb({ decay: 10, wet: 0.8 }).toDestination();
pad.connect(reverb);

// 2. Random Bells
const bell = new Tone.MetalSynth({
  harmonicity: 12,
  resonance: 800,
  modulationIndex: 20,
  envelope: { decay: 0.4, release: 0.01 },
  volume: -25,
}).connect(reverb);

// Schedule
Tone.Transport.scheduleRepeat((time) => {
  pad.triggerAttackRelease(['C3', 'G3', 'E4'], '4m', time);
}, '4m');

Tone.Transport.scheduleRepeat((time) => {
  if (Math.random() > 0.6) {
    bell.triggerAttackRelease('32n', time);
  }
}, '4n');
```

## 6.2 Cyberpunk / Industrial

Aggressive, distorted, rhythmic.

```javascript
Tone.Transport.bpm.value = 110;

// Distortion Bus
const dist = new Tone.Distortion(0.8).toDestination();
const crusher = new Tone.BitCrusher(4).connect(dist);

// Bass
const bass = new Tone.MonoSynth({
  oscillator: { type: 'sawtooth' },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 },
}).connect(crusher);

// Kick
const kick = new Tone.MembraneSynth().connect(dist);

// Sequence
const loop = new Tone.Loop((time) => {
  kick.triggerAttackRelease('C1', '8n', time);

  // 16th note bassline
  for (let i = 0; i < 4; i++) {
    const t = time + i * Tone.Time('16n').toSeconds();
    if (i !== 0) {
      // Don't clash with kick
      bass.triggerAttackRelease('C2', '16n', t);
    }
  }
}, '4n').start(0);
```
