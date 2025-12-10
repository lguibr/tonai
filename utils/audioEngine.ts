import * as Tone from 'tone';

// Global reference to track active nodes for cleanup
let recorder: Tone.Recorder | null = null;

export const initializeAudio = async () => {
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }

  if (!recorder) {
    recorder = new Tone.Recorder();
    Tone.Destination.connect(recorder);
  }

  // Ensure we are not muted from a previous stop
  Tone.Destination.mute = false;

  console.log('Audio Context Started');
};

export const resetAudio = () => {
  try {
    // 1. Stop Transport first
    Tone.Transport.stop();

    // 2. Cancel all scheduled events (passing 0 clears everything from time 0)
    Tone.Transport.cancel(0);

    // 3. Reset position
    Tone.Transport.position = 0;

    // 4. Cancel BPM automation
    if (Tone.Transport.bpm) {
      Tone.Transport.bpm.cancelScheduledValues(0);
      Tone.Transport.bpm.value = 120;
    }

    // 5. Cancel Master Volume automation
    if (Tone.Destination.volume) {
      Tone.Destination.volume.cancelScheduledValues(0);
    }

    // 6. Clear Draw events if any (visuals)
    if (Tone.Draw) {
      Tone.Draw.cancel(0);
    }
  } catch (e) {
    console.warn('Transport cancel warning:', e);
  }
};

// We wrap the evaluation to inject Tone safely
export const executeCode = async (code: string) => {
  try {
    // 1. Reset previous state
    resetAudio();

    // 2. Prepare the function
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

    // Strip import statements to prevent "Cannot use import statement outside a module" error
    // The import is useful for the editor (types), but invalid for new Function()
    const runnableCode = code.replace(/^\s*import\s+.*$/gm, '');

    // We create a scope where Tone is available
    const playFunction = new AsyncFunction('Tone', runnableCode);

    // 3. Execute
    await playFunction(Tone);

    // 4. Start Transport
    Tone.Transport.start();

    return true;
  } catch (error) {
    console.error('Execution Error:', error);
    throw error;
  }
};

export const stopTransport = () => {
  Tone.Transport.stop();
  Tone.Transport.position = 0;
};

export const forceStop = () => {
  try {
    // 1. Instant Silence
    Tone.Destination.mute = true;

    // 2. Stop everything
    Tone.Transport.stop();
    Tone.Transport.cancel(0);
    Tone.Transport.position = 0;

    // 3. Clear all scheduled events on Master/Destination
    if (Tone.Destination.volume) {
      Tone.Destination.volume.cancelScheduledValues(0);
    }

    // 4. Kill visuals
    if (Tone.Draw) {
      Tone.Draw.cancel(0);
    }

    // Note: We leave it muted. initializeAudio() called by Play will unmute it.
    // This ensures tails don't come back if we just unmuted immediately.
  } catch (e) {
    console.warn('Force stop error:', e);
  }
};

export const startTransport = () => {
  Tone.Transport.start();
};

export const restartTransport = () => {
  Tone.Transport.position = 0;
};

export const setMasterVolume = (db: number) => {
  if (!Number.isFinite(db)) return;
  try {
    // rampTo also uses cancelScheduledValues internally
    Tone.Destination.volume.rampTo(db, 0.1);
  } catch (e) {
    console.warn('Volume ramp error, setting value directly:', e);
    Tone.Destination.volume.value = db;
  }
};

export const startRecording = async () => {
  if (!recorder) return;
  if (recorder.state === 'started') return;
  recorder.start();
};

export const stopRecording = async (): Promise<Blob | null> => {
  if (!recorder) return null;
  // Prevent error if stopping when not started
  if (recorder.state !== 'started') return null;

  const recording = await recorder.stop();
  return recording;
};

export const getTransportPosition = (): string => {
  if (Tone.Transport.state === 'started') {
    // Format: Bars:Beats:Sixteenths
    const position = Tone.Transport.position;

    // Handle both string "0:0:0" and number (seconds) cases
    if (typeof position === 'string') {
      return position.split('.')[0];
    } else if (typeof position === 'number') {
      // Fallback if it returns raw seconds
      return 'Playing...';
    }
  }
  return '0:0:0';
};

export const getAnalyser = () => {
  // Create a master analyser
  const analyser = new Tone.Analyser('waveform', 256);
  Tone.Destination.connect(analyser);
  return analyser;
};
