// Web Audio API context
let audioContext: AudioContext | null = null;

// Sound buffers
const soundBuffers: { [key: string]: AudioBuffer } = {};

// Initialize audio context
const initAudio = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Create simple beep sound
const createBeepBuffer = async () => {
  if (!audioContext) return null;

  const duration = 0.2;
  const sampleRate = audioContext.sampleRate;
  const numSamples = duration * sampleRate;
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Generate a simple sine wave
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    channelData[i] = Math.sin(2 * Math.PI * 440 * t) * // Frequency: 440Hz (A4 note)
      Math.exp(-4 * t); // Exponential decay
  }

  return buffer;
};

// Create notification sounds
export const createSounds = async () => {
  const context = initAudio();
  
  try {
    // Create different pitched beeps for different notifications
    const beep = await createBeepBuffer();
    if (beep) {
      soundBuffers.timerComplete = beep;
    }
  } catch (error) {
    console.error('Error creating sounds:', error);
  }
};

// Play a sound with specified options
export const playSound = (
  soundName: 'timerComplete' | 'tick' | 'break' | 'longBreak',
  options: { volume?: number; pitch?: number } = {}
) => {
  if (!audioContext || !soundBuffers[soundName]) return;

  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();

  source.buffer = soundBuffers[soundName];
  source.playbackRate.value = options.pitch || 1;

  gainNode.gain.value = options.volume || 0.5;

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start();
};

// Request audio permission and initialize
export const initializeSounds = async () => {
  try {
    const context = initAudio();
    if (context?.state === 'suspended') {
      await context.resume();
    }
    await createSounds();
    return true;
  } catch (error) {
    console.error('Error initializing sounds:', error);
    return false;
  }
};

// Check if audio is available and permitted
export const checkAudioPermission = () => {
  return audioContext?.state === 'running';
};

// Clean up audio context
export const cleanupAudio = () => {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
};
