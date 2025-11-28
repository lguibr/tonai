import * as Tone from 'tone';

// This file exists solely to verify that Tone.js types are correctly resolved
// by the TypeScript compiler. If this file compiles without errors,
// it means the type definitions are working correctly.

const synth = new Tone.Synth().toDestination();
const loop = new Tone.Loop((time) => {
    synth.triggerAttackRelease("C4", "8n", time);
}, "4n").start(0);

Tone.Transport.start();

console.log('Tone.js types verified successfully');
