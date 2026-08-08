/**
 * Gera um áudio WAV sintético em formato Data URI de 3 segundos (440Hz).
 * Usado para demonstração/preview visual e teste dos controles de áudio sem depender do backend.
 */
export function createDemoAudioDataUrl(): string {
  const sampleRate = 8000
  const numSamples = sampleRate * 3 // 3 segundos
  const headerLen = 44
  const buffer = new Uint8Array(headerLen + numSamples)
  const view = new DataView(buffer.buffer)

  // RIFF header
  view.setUint32(0, 0x52494646, false) // "RIFF"
  view.setUint32(4, 36 + numSamples, true)
  view.setUint32(8, 0x57415645, false) // "WAVE"
  view.setUint32(12, 0x666d7420, false) // "fmt "
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // Mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true)
  view.setUint16(32, 1, true)
  view.setUint16(34, 8, true)
  view.setUint32(36, 0x64617461, false) // "data"
  view.setUint32(40, numSamples, true)

  for (let i = 0; i < numSamples; i++) {
    const val = 128 + Math.floor(40 * Math.sin((i * 2 * Math.PI * 440) / sampleRate))
    buffer[headerLen + i] = val
  }

  let binary = ''
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return 'data:audio/wav;base64,' + btoa(binary)
}
