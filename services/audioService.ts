
import { generateSpeech } from './geminiService';

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentBuffer: AudioBuffer | null = null;
let currentMessageId: string | null = null;

let startTime = 0; // When the source was started
let offset = 0;    // How much has already been played
let isPlaying = false;

const getAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playAssistantVoice = async (text: string, messageId: string): Promise<void> => {
  const ctx = getAudioCtx();

  // If we are playing/paused on a DIFFERENT message, stop everything first
  if (currentMessageId !== messageId) {
    stopAssistantVoice();
    currentMessageId = messageId;
    try {
      currentBuffer = await generateSpeech(text);
    } catch (err) {
      console.error("Failed to generate speech:", err);
      return;
    }
  }

  // If already playing this message, do nothing
  if (isPlaying) return;

  // Start/Resume playback
  currentSource = ctx.createBufferSource();
  currentSource.buffer = currentBuffer;
  currentSource.connect(ctx.destination);
  
  currentSource.onended = () => {
    // Only clean up if it ended naturally (not stopped by pause/stop)
    if (isPlaying && currentSource) {
      const elapsedSinceStart = ctx.currentTime - startTime;
      if (offset + elapsedSinceStart >= (currentBuffer?.duration || 0)) {
        stopAssistantVoice();
      }
    }
  };

  startTime = ctx.currentTime;
  currentSource.start(0, offset);
  isPlaying = true;
};

export const pauseAssistantVoice = () => {
  const ctx = getAudioCtx();
  if (!isPlaying || !currentSource) return;

  // Calculate where we are
  offset += (ctx.currentTime - startTime);
  
  // Stop the source (it's "start-once")
  try {
    currentSource.stop();
  } catch (e) {}
  
  currentSource = null;
  isPlaying = false;
};

export const stopAssistantVoice = () => {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {}
    currentSource = null;
  }
  currentBuffer = null;
  currentMessageId = null;
  offset = 0;
  startTime = 0;
  isPlaying = false;
};

export const getPlaybackStatus = (messageId: string) => {
  if (currentMessageId !== messageId) return 'idle';
  return isPlaying ? 'playing' : 'paused';
};

export const isSpeaking = () => isPlaying;
