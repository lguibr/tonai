import * as Tone from 'tone';

// Global reference to track active nodes for cleanup
let recorder: Tone.Recorder | null = null;
const activeNodes = new Set<any>(); // Track anything with .dispose()
let currentExecutionId = 0;

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

const cleanupResources = () => {
  // Dispose all tracked nodes from previous runs
  if (activeNodes.size > 0) {
    console.log(`Cleaning up ${activeNodes.size} active audio nodes...`);
    activeNodes.forEach((node) => {
      try {
        if (node.state !== 'stopped' && typeof node.stop === 'function') {
          try {
            node.stop();
          } catch (e) {
            // ignore
          }
        }
        node.dispose();
      } catch (e) {
        console.warn('Node disposal error:', e);
      }
    });
    activeNodes.clear();
  }
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

    // 7. Dispose all user-created nodes
    cleanupResources();
  } catch (e) {
    console.warn('Transport cancel warning:', e);
  }
};

const createTrackedTone = () => {
  // Create a proxy/clone of Tone to intercept constructors
  const tracked: any = { ...Tone };

  Object.keys(Tone).forEach((key) => {
    //ts-expect-error
    const Original = Tone[key];

    // We only wrap classes (constructors) that have a dispose method on prototype
    // This avoids wrapping singletons like Transport, Destination, etc.
    if (
      typeof Original === 'function' &&
      Original.prototype &&
      typeof Original.prototype.dispose === 'function'
    ) {
      // Use class extension to preserve static methods (like getDefaults)
      class Wrapped extends Original {
        constructor(...args: any[]) {
          super(...args);
          activeNodes.add(this);
        }
      }

      // Preserve the name for debugging
      Object.defineProperty(Wrapped, 'name', { value: Original.name });

      // Intercept and safeguard common methods that are prone to timing race conditions
      ['triggerAttack', 'triggerAttackRelease', 'start', 'stop'].forEach((method) => {
        // We check if the method exists on the prototype chain
        if (typeof (Original.prototype as any)[method] === 'function') {
          (Wrapped.prototype as any)[method] = function (...args: any[]) {
            try {
              // Call the original method
              return (Original.prototype as any)[method].apply(this, args);
            } catch (e: any) {
              // Suppress the specific "time" error which is often a harmless race condition in these dynamic contexts
              if (
                e.message &&
                (e.message.includes('greater than or equal to') ||
                  e.message.includes('must be a number'))
              ) {
                console.warn(
                  `Interception: Suppressed harmless Tone.js race condition in ${Original.name}.${method}`,
                  e
                );
                return this; // Maintain chaining compatibility
              }
              // Re-throw other genuine errors
              throw e;
            }
          };
        }
      });

      tracked[key] = Wrapped;
    }
  });

  return tracked;
};

// We wrap the evaluation to inject Tone safely
export const executeCode = async (code: string) => {
  // Increment ID primarily to invalidate previous runs
  const executionId = ++currentExecutionId;

  try {
    // 1. Reset previous state
    resetAudio();

    // 2. Prepare the function
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

    // Strip import statements
    const runnableCode = code.replace(/^\s*import\s+.*$/gm, '');

    // We create a scope where Tone is our tracked version
    const TrackedTone = createTrackedTone();
    const playFunction = new AsyncFunction('Tone', runnableCode);

    // 3. Execute
    await playFunction(TrackedTone);

    // CHECKPOINT: If execution ID changed (user pressed stop/play again), ABORT
    if (executionId !== currentExecutionId) {
      console.log('Execution aborted (stale ID)');
      // Run cleanup again just in case the stale function created nodes
      cleanupResources();
      return false;
    }

    // 4. Ensure we are unmuted before starting
    Tone.Destination.mute = false;

    // 5. Start Transport
    Tone.Transport.start();

    return true;
  } catch (error) {
    console.error('Execution Error:', error);
    // Hard reset on error
    forceStop();
    throw error;
  }
};

export const stopTransport = () => {
  Tone.Transport.stop();
  Tone.Transport.position = 0;
};

export const forceStop = () => {
  // Update ID to abort any pending executions
  currentExecutionId++;

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

    // 5. Ensure recorder is stopped
    if (recorder && recorder.state === 'started') {
      recorder.stop();
    }

    // 6. Deep Cleanup
    cleanupResources();

    // Note: We leave it muted. initializeAudio() called by Play will unmute it.
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
