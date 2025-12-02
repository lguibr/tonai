# TonAI Comprehensive Wiki & Developer Guide

**Version:** 2.0 (Expanded Universe)
**Target Audience:** AI Agents, Developers, Audio Engineers.

This document serves as the **ultimate source of truth** for the TonAI application. It is designed to be ingested by RAG systems to provide complete context on how to generate, debug, and understand music within this specific environment.

---

# Table of Contents

1.  [System Architecture & Data Flow](#1-system-architecture--data-flow)
2.  [The Physics of Sound in the Browser](#2-the-physics-of-sound-in-the-browser)
3.  [Tone.js Framework Deep Dive](#3-tonejs-framework-deep-dive)
    - [Context & Time](#context--time)
    - [Signals & Connections](#signals--connections)
    - [The Transport (Master Clock)](#the-transport-master-clock)
4.  [The Instrumentarium (Sound Sources)](#4-the-instrumentarium-sound-sources)
    - [Synths](#synths)
    - [Noise & Percussion](#noise--percussion)
    - [Samplers](#samplers)
5.  [The FX Rack (Audio Processing)](#5-the-fx-rack-audio-processing)
    - [Dynamics](#dynamics)
    - [Time-Based Effects](#time-based-effects)
    - [Spectral Effects](#spectral-effects)
    - [Distortion & Lo-Fi](#distortion--lo-fi)
6.  [Compositional Logic & Algorithms](#6-compositional-logic--algorithms)
    - [Sequencing Patterns](#sequencing-patterns)
    - [Generative Strategies](#generative-strategies)
    - [Music Theory for Code](#music-theory-for-code)
7.  [AI Generation Strategy](#7-ai-generation-strategy)
    - [Prompt Engineering](#prompt-engineering)
    - [Safety Protocols](#safety-protocols)
    - [Refinement Workflows](#refinement-workflows)
8.  [Troubleshooting & Error Reference](#8-troubleshooting--error-reference)

---

# 1. System Architecture & Data Flow

TonAI is a **Client-Side Generative Audio Workstation**. Unlike server-side generation (e.g., Suno, Udio) which returns an MP3, TonAI generates **Code** which renders audio in real-time on the user's device.

## The Pipeline

1.  **User Intent:** "Make a sad piano loop."
2.  **LLM Processing (Gemini):**
    - Receives System Prompt (Rules).
    - Receives Context (Wiki, Interfaces).
    - Generates JavaScript String.
3.  **Sanitization Layer:**
    - Strips Markdown.
    - Checks for malicious code (basic regex).
4.  **Execution Layer (The "Sandbox"):**
    - `new Function('Tone', code)` is called.
    - `Tone` is passed as a dependency.
    - Code executes, creating AudioNodes and scheduling events on the Transport.
5.  **Audio Rendering:**
    - Web Audio API processes the graph.
    - Audio flows to `Tone.Destination` (Speakers).

## State Management

- **`ToneContext`:** React Context holding the `isPlaying` boolean and the `analyser` node.
- **`Transport` State:** The source of truth for timing. If `Tone.Transport.state` is 'started', audio should be hearing.

---

# 2. The Physics of Sound in the Browser

To generate good code, one must understand the medium.

- **Web Audio API:** The underlying browser technology. It uses a **Node Graph** metaphor.
- **AudioContext:** The container for all nodes. It runs on a separate high-priority thread.
- **Latency:** JavaScript scheduling is not sample-accurate, but Web Audio scheduling _is_. This is why we use `Tone.Transport.schedule(time)` instead of `setTimeout`.
- **Lookahead:** Tone.js schedules events slightly in the future to ensure precise timing.

**Critical Constraint:** The AudioContext must be "Resumed" by a user gesture (click) before any sound can play. The App handles this, but the AI should be aware that `Tone.start()` is a prerequisite.

---

# 3. Tone.js Framework Deep Dive

## Context & Time

Tone.js abstracts the raw AudioContext time (seconds) into **Musical Time**.

- **Notation:**
  - `"4n"` = Quarter Note (1 beat)
  - `"8n"` = Eighth Note (1/2 beat)
  - `"16n"` = Sixteenth Note (1/4 beat)
  - `"1m"` = 1 Measure (4 beats in 4/4)
  - `"1:0:0"` = Bar 1, Beat 0, Sixteenth 0.
- **Conversion:** `Tone.Time("4n").toSeconds()` converts notation to seconds based on current BPM.

## Signals & Connections

Audio flows like water through pipes.

- **Source:** Produces sound (Oscillator, Player).
- **Processor:** Modifies sound (Filter, Gain).
- **Destination:** Output (Speakers).

**Methods:**

- `.connect(node)`: A -> B
- `.fan(b, c, d)`: A -> [B, C, D] (Split signal)
- `.chain(b, c, d)`: A -> B -> C -> D (Series)
- `.toDestination()`: A -> Speakers.

**AudioParams:**
Most properties (frequency, gain, detune) are **Signals**, not numbers. They can be automated.

- `filter.frequency.rampTo(1000, 1)`: Smoothly change to 1000Hz over 1 second.
- `lfo.connect(filter.frequency)`: Modulate frequency with an LFO.

## The Transport (Master Clock)

The heart of the sequencer.

- **BPM:** `Tone.Transport.bpm.value`.
- **Swing:** `Tone.Transport.swing` (0-1). Adds "groove" by delaying off-beats.
- **Position:** `Tone.Transport.position` (e.g., "0:1:2").
- **Looping:** `Tone.Transport.loop = true; Tone.Transport.loopEnd = "4m";`

---

# 4. The Instrumentarium (Sound Sources)

## Synths

### `Tone.Synth`

- **Character:** Clean, classic, video-gamey.
- **Best For:** Leads, simple basses, arpeggios.
- **Oscillators:** Sine, Square, Triangle, Sawtooth.

### `Tone.AMSynth` (Amplitude Modulation)

- **Character:** Metallic, bell-like, robotic.
- **Theory:** Carrier oscillator volume modulated by Modulator oscillator.
- **Best For:** Bells, gongs, sci-fi textures.

### `Tone.FMSynth` (Frequency Modulation)

- **Character:** Complex, evolving, glassy, aggressive.
- **Theory:** Carrier frequency modulated by Modulator.
- **Best For:** 80s bass, electric piano, aggressive leads.

### `Tone.DuoSynth`

- **Character:** Thick, fat.
- **Theory:** Two MonoSynths stacked and run through a shared filter.
- **Best For:** Heavy bass, leads.

## Noise & Percussion

### `Tone.MembraneSynth`

- **Character:** Thumpy, pitch-dropping.
- **Theory:** Oscillator with a rapid pitch envelope.
- **Best For:** Kick drums, Toms, 808s.

### `Tone.MetalSynth`

- **Character:** Harsh, inharmonic.
- **Theory:** 6 oscillators tuned inharmonically + bandpass filter.
- **Best For:** Hi-hats, Cymbals, Industrial FX.

### `Tone.NoiseSynth`

- **Character:** Hissy, windy.
- **Types:** White (harsh), Pink (balanced), Brown (rumble).
- **Best For:** Snares, Wind, Ocean, Sweeps.

## Samplers

### `Tone.Sampler`

- **Character:** Realistic.
- **Usage:** Requires URLs to audio files.
- **Constraint:** Since we don't have a guaranteed asset library, **AVOID** using Sampler unless you have reliable public URLs or the user provides them. Prefer Synthesis.

---

# 5. The FX Rack (Audio Processing)

## Dynamics

### `Tone.Compressor`

- **Function:** Reduces dynamic range (makes quiet things louder, loud things quieter).
- **Usage:** Put on Master bus to "glue" the mix.

### `Tone.Limiter`

- **Function:** Prevents clipping (volume > 0dB).
- **Usage:** Safety net at the end of a chain.

## Time-Based Effects

### `Tone.Reverb` / `Tone.JCReverb` / `Tone.Freeverb`

- **Function:** Simulates acoustic space.
- **Warning:** High `decay` (>10s) or `roomSize` (1.0) can cause CPU spikes or metallic artifacts.

### `Tone.FeedbackDelay` / `Tone.PingPongDelay`

- **Function:** Echoes.
- **Warning:** `feedback` >= 1 creates an infinite loop that gets louder until it distorts. Keep < 0.9.

## Spectral Effects

### `Tone.Filter`

- **Types:** Lowpass (muffles), Highpass (thins), Bandpass (focuses).
- **Resonance (Q):** Emphasizes the cutoff frequency. High Q (>10) whistles.

### `Tone.AutoWah` / `Tone.AutoFilter`

- **Function:** Moving filter. Funky.

## Distortion & Lo-Fi

### `Tone.Distortion`

- **Function:** Adds harmonics.
- **Usage:** subtle (0.1) for warmth, high (0.8) for guitar/industrial.

### `Tone.BitCrusher`

- **Function:** Reduces bit depth.
- **Usage:** 4-8 bits for "old sampler" sound.

---

# 6. Compositional Logic & Algorithms

## Sequencing Patterns

### `Tone.Loop`

Simple, repetitive.

```javascript
new Tone.Loop(time => { ... }, "4n").start(0);
```

### `Tone.Sequence`

Grid-based.

```javascript
new Tone.Sequence(callback, ['C4', null, 'G4'], '8n').start(0);
```

### `Tone.Part`

Precise, event-based.

```javascript
new Tone.Part(callback, [{time: "0:0", note: "C4"}, ...]).start(0);
```

## Generative Strategies

1.  **Random Selection:** `array[Math.floor(Math.random() * array.length)]`
2.  **Probability:** `if (Math.random() > 0.7) play()`
3.  **Euclidean Rhythms:** Distributing X hits over Y steps evenly.
4.  **Markov Chains:** State A has 50% chance to go to B, 50% to C.

## Music Theory for Code

- **Scales:** Define arrays of notes.
  - Major: `[C, D, E, F, G, A, B]`
  - Minor: `[C, D, Eb, F, G, Ab, Bb]`
  - Pentatonic: `[C, Eb, F, G, Bb]`
- **Chords:** Arrays of notes played simultaneously.
  - C Major: `["C4", "E4", "G4"]`
- **Octaves:** String manipulation. `"C" + (octave + 1)`.

---

# 7. AI Generation Strategy

## Prompt Engineering

The System Prompt is the most critical component. It enforces:

1.  **No Imports:** `Tone` is global.
2.  **Safety:** Parameter clamping.
3.  **Conciseness:** No markdown explanation in the code block.

## Safety Protocols

The AI must act as a **Safety Limiter**.

- **Volume:** Never generate `volume: 10` (linear). Use dB (`-10`).
- **Feedback:** Never `1.0`.
- **Loops:** Ensure `Tone.Transport.scheduleRepeat` has a valid interval (not 0).

## Refinement Workflows

When the user says "Make it faster":

1.  **Identify:** The parameter is `Tone.Transport.bpm.value`.
2.  **Action:** Update the line `Tone.Transport.bpm.value = X`.
3.  **Output:** Return the **entire** updated code block.

---

# 8. Troubleshooting & Error Reference

| Error                                   | Meaning                                                      | Fix                                                       |
| :-------------------------------------- | :----------------------------------------------------------- | :-------------------------------------------------------- |
| `Tone is not defined`                   | The code is trying to import Tone or runs outside the scope. | Ensure `Tone` is passed to the function constructor.      |
| `AudioContext was not allowed to start` | Browser autoplay policy.                                     | User must click "Play" in the UI.                         |
| `The value is not a finite number`      | `NaN` or `Infinity` passed to a param.                       | Check math logic, divide by zero, or log(0).              |
| `OverconstrainedError`                  | Trying to set a value outside valid range.                   | Check Safety Tables.                                      |
| `Memory Exceeded`                       | Too many nodes created.                                      | Ensure nodes are created _outside_ the loop, or disposed. |
| `Glitching Audio`                       | CPU overload.                                                | Reduce polyphony, remove ConvolutionReverb.               |

---

**End of Wiki**
