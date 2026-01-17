// Decodes audio data (MP3/WAV/etc) using the browser's native decoder
export const decodeAudioData = async (
  audioData: ArrayBuffer,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  try {
    // decodeAudioData consumes the buffer, so we might need to copy if reused, 
    // but here we just pass it through.
    return await audioContext.decodeAudioData(audioData);
  } catch (e) {
    throw e;
  }
};

export const playAudioBuffer = (
  buffer: AudioBuffer,
  context: AudioContext,
  onEnded?: () => void
) => {
  // Disconnect any previous nodes if needed in a real app to prevent memory leaks,
  // but for this MVP simplistic fire-and-forget is okay.
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  if (onEnded) {
    source.onended = onEnded;
  }
  source.start(0);
  return source;
};