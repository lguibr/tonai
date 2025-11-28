export default `// Welcome to TonAI
import * as Tone from 'tone';

Tone.Transport.bpm.value = 112;

// 1. Ambience (Tape Hiss / Office Room Tone)
const noise = new Tone.Noise("pink");
const noiseFilter = new Tone.AutoFilter({
  frequency: 0.1,
  depth: 0.2,
  baseFrequency: 400,
  octaves: 2
}).start();
const noiseVol = new Tone.Volume(-28);
noise.chain(noiseFilter, noiseVol, Tone.Destination);

Tone.Transport.schedule(() => {
    noise.start();
}, 0);

// 2. Cozy Electric Piano (The main harmony)
const keys = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 3,
  modulationIndex: 2,
  oscillator: { type: "sine" },
  envelope: { attack: 0.05, decay: 0.3, sustain: 0.5, release: 1 }, // Shortened release for tighter feel
  modulation: { type: "sine" },
  modulationEnvelope: { attack: 0.05, decay: 0.5, sustain: 0.2, release: 1 }
});

const keysFilter = new Tone.Filter(800, "lowpass"); // Opened up filter slightly
const keysTremolo = new Tone.Tremolo(4, 0.2).start();
const keysReverb = new Tone.Reverb({ decay: 4, wet: 0.3 });
const keysComp = new Tone.Compressor(-20, 3);
const keysVol = new Tone.Volume(-9);

keys.chain(keysFilter, keysTremolo, keysReverb, keysComp, keysVol, Tone.Destination);

// 3. Warm Bass (Punchier for metal context)
const bass = new Tone.Synth({
  oscillator: { type: "triangle" }, // Triangle for more cut
  envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.5 }
});
const bassFilter = new Tone.Filter(300, "lowpass");
const bassVol = new Tone.Volume(-5);
bass.chain(bassFilter, bassVol, Tone.Destination);

// 4. Complex Drums
// Punchy Metal Kick
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.02,
  octaves: 5, // Higher octave punch
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.5 }
});
const kickVol = new Tone.Volume(-6);
kick.connect(kickVol).connect(Tone.Destination);

// Snappy Snare
const snare = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
});
const snareFilter = new Tone.Filter(4000, "highpass");
const snareVol = new Tone.Volume(-14);
snare.chain(snareFilter, snareVol, keysReverb, Tone.Destination);

// Jazz/Metal Ride Cymbal
const ride = new Tone.MetalSynth({
    frequency: 300,
    envelope: { attack: 0.001, decay: 0.5, release: 0.1 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 3000,
    octaves: 1.5
});
const rideVol = new Tone.Volume(-18);
ride.chain(rideVol, keysReverb, Tone.Destination);

// --- Composition ---

// Chord Progression: Jazzy/Soulful
const chordProgression = [
  { notes: ["Eb3", "G3", "Bb3", "D4"], bass: "Eb2" },
  { notes: ["C3", "Eb3", "G3", "Bb3"], bass: "C2" },
  { notes: ["F3", "Ab3", "C4", "Eb4"], bass: "F2" },
  { notes: ["Bb2", "D3", "F3", "Ab3"], bass: "Bb1" },
];

const loop = new Tone.Loop((time) => {
  // Determine current measure within a 4-bar cycle
  // Using Tone.Transport.position to parse bars safely
  const bars = Tone.Transport.position.toString().split(":")[0];
  const measure = parseInt(bars) % 4;
  const currentChord = chordProgression[measure];

  // Play Chords
  keys.triggerAttackRelease(currentChord.notes, "2n", time, 0.7);
  
  // Play Bass (Syncopated hits)
  bass.triggerAttackRelease(currentChord.bass, "8n", time, 0.9);
  bass.triggerAttackRelease(currentChord.bass, "8n", time + Tone.Time("4n").toSeconds() + Tone.Time("8n").toSeconds(), 0.7);

}, "1m").start(0);

// Complex Drum Sequence: Jazz Swing Ride + Metal Double Kick
const drumSeq = new Tone.Sequence((time, step) => {
    // Ride Cymbal: Fast Jazz Swing / Metal Ping pattern
    // Playing 8th notes with velocity accents on the beat
    if (step % 2 === 0) {
        ride.triggerAttackRelease("32n", time, 0.7); 
    } else {
        // Swing feel on the off-beats
        ride.triggerAttackRelease("32n", time + 0.01, 0.4); 
    }

    // Kick: "Bleed" style double bass bursts and syncopation
    // Steps: 0, 2, 3 (triplet feel), 6, 8, 10, 11, 14
    if (step === 0) kick.triggerAttackRelease("C1", "16n", time, 1);
    if (step === 2) kick.triggerAttackRelease("C1", "16n", time, 0.9);
    if (step === 3) kick.triggerAttackRelease("C1", "16n", time, 0.8); // Double kick roll
    
    if (step === 6) kick.triggerAttackRelease("C1", "16n", time, 0.8);
    
    if (step === 8) kick.triggerAttackRelease("C1", "16n", time, 1);
    if (step === 10) kick.triggerAttackRelease("C1", "16n", time, 0.9);
    if (step === 11) kick.triggerAttackRelease("C1", "16n", time, 0.8); // Double kick roll

    if (step === 14) kick.triggerAttackRelease("C1", "16n", time, 0.7);

    // Snare: Ghost notes and strong backbeats
    // Backbeat on 4 and 12 (standard 2 and 4)
    if (step === 4 || step === 12) {
        snare.triggerAttackRelease("16n", time, 1);
    } 
    // Ghost notes for complexity
    else if ([1, 7, 9, 13, 15].includes(step)) {
        // Random probability for ghost notes to feel "jammed"
        if (Math.random() > 0.4) {
            snare.triggerAttackRelease("32n", time, 0.15);
        }
    }

}, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], "16n").start(0);
`